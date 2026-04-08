# 青马工程活动管理系统 - 修复与升级方案

> 创建时间：2026-04-07
> 最后更新：2026-04-07
> 状态：实施中 - 阶段一、二已完成

---

## 已完成功能清单

以下功能已在前期开发中完成：

- ✅ 管理员页面无法访问修复（navGroups 声明位置）
- ✅ 工作人员多岗位分配（一人多岗 + 取消工作人员按钮）
- ✅ 内容管理系统重构（草稿/发布/历史版本）
- ✅ 日程页面表单编辑器
- ✅ 活动信息页表单编辑器
- ✅ 前台读取已发布 CMS 数据
- ✅ 数据概览 API 创建
- ✅ 签到管理界面重构（多次签到 + 分类配置）
- ✅ 签到/物资/学生/报名导出 API 升级
- ✅ 签到活动 API 创建

---

## 待实施任务（按阶段划分）

### 阶段一：签到系统全面修复（P0 紧急）

> 目标：修复签到核心 Bug，确保签到功能完全正常

#### 1.1 验证码输入框焦点丢失
**问题描述：** 前台签到页面，验证码输入框输入一个字符就失去焦点，需要重新点击输入框才能继续输入

**原因分析：** `CodeCheckinCard`、`GpsCheckinCard`、`QrCheckinCard` 三个组件定义在 `CheckinPage` 组件的渲染函数内部，每次父组件重新渲染时，这三个组件都会被重新创建，导致内部状态（包括 input 的焦点）丢失

**修复方案：**
1. 将三个组件移到文件顶层，作为独立的 React 组件
2. 通过 props 传递所有状态和回调函数
3. 确保 Input 组件的 ref 正确传递

**涉及文件：**
- `src/app/(site)/checkin/page.tsx`

#### 1.2 签到系统统一（CheckinConfig → CheckinSession）
**问题描述：** 管理端创建签到活动时，配置存储在 `CheckinSession` 表中，但学生端 `/api/checkin` 接口读取的是 `CheckinConfig` 表，导致验证码签到无法验证成功

**原因分析：** 系统存在两套签到配置机制：
- 管理端使用 `CheckinSession`（支持多次签到活动）
- 学生端 API 使用 `CheckinConfig`（每场次只有一条配置）
两者不一致导致签到失败

**修复方案：**
1. 修改 `/api/checkin` GET 接口：从 `CheckinSession` 读取当前活跃签到的配置
2. 修改 `/api/checkin` POST 接口：从 `CheckinSession` 验证验证码、GPS 围栏等
3. 学生端签到时，匹配当前状态为 `ACTIVE` 的 `CheckinSession`
4. 保留 `CheckinConfig` 表但标记为 deprecated

**涉及文件：**
- `src/app/api/checkin/route.ts`
- `src/app/api/checkin/status/route.ts`
- `src/app/(site)/checkin/page.tsx`

#### 1.3 GPS 围栏前端验证错误
**问题描述：** 前端检测用户是否在签到范围内时，使用的是用户自己的签到记录坐标，而非配置的围栏中心坐标

**原因分析：** `checkin/page.tsx` 第 143-157 行，`detectLocation` 回调中使用 `data.record.lat/lng` 计算距离，这是错误的

**修复方案：**
1. 修改 `/api/checkin` GET 接口，返回 `fenceCenterLat`、`fenceCenterLng`、`fenceRadius`
2. 前端使用配置中的围栏中心坐标计算距离
3. 使用配置中的围栏半径判断是否在范围内

**涉及文件：**
- `src/app/api/checkin/route.ts`
- `src/app/(site)/checkin/page.tsx`

**阶段一验收标准：**
- [ ] 验证码输入框可以连续输入，不丢失焦点
- [ ] 验证码签到可以正常验证并提交
- [ ] GPS 签到位置验证正确显示距离
- [ ] 签到系统管理端和学生端配置一致

---

### 阶段二：前台页面修复（P1 重要）

> 目标：修复前台页面的功能错误和体验问题

#### 2.1 活动相册不显示图片
**问题描述：** 相册页面只显示渐变背景 + 标题，没有实际展示图片内容

**修复方案：**
1. 检查 Album 模型的 `imageUrl` 字段是否有数据
2. 使用 `<img>` 标签或 Next.js `<Image>` 组件展示实际图片
3. 添加图片加载失败的回退显示

**涉及文件：**
- `src/app/(site)/gallery/page.tsx`

#### 2.2 个人中心 API 路径错误
**问题描述：** 个人中心页面调用 `/api/my-team`，但实际 API 路径是 `/api/teams/my`

**修复方案：**
1. 修正 API 调用路径
2. 确保返回的数据格式与页面期望一致

**涉及文件：**
- `src/app/(site)/profile/page.tsx`

#### 2.3 联系页面硬编码占位数据
**问题描述：** 联系人电话和邮箱全部是占位数据（`138-0000-0001` 等），没有从数据库读取

**修复方案：**
1. 从 Settings 表读取联系方式配置
2. 添加管理端配置联系方式的界面（或复用内容管理）

**涉及文件：**
- `src/app/(site)/contact/page.tsx`
- `src/app/api/settings/route.ts`（可能需要创建）

#### 2.4 活动环节页面完全硬编码
**问题描述：** 所有游戏站规则、积分规则、物料信息全部硬编码在前端，不从数据库 `GameStationConfig` 读取

**修复方案：**
1. 创建 `/api/game-stations` API 读取配置
2. 前台页面从 API 获取数据
3. 管理端可以编辑游戏站配置（复用或扩展现有管理界面）

**涉及文件：**
- `src/app/(site)/activities/page.tsx`
- `src/app/api/game-stations/route.ts`（新）

#### 2.5 反馈页面 SSR 中调用 router.push
**问题描述：** 在组件渲染阶段调用 `router.push("/login?callbackUrl=/feedback")` 并返回 `null`，在 React 18+ 严格模式下可能导致无限重定向循环

**修复方案：**
1. 使用 `useEffect` 处理重定向
2. 在 loading 状态下显示加载指示器

**涉及文件：**
- `src/app/(site)/feedback/page.tsx`

#### 2.6 统一使用 Toast 替代 alert()
**问题描述：** `checkin/page.tsx`、`register/page.tsx`、`feedback/page.tsx` 等多处使用原生 `alert()`，体验差

**修复方案：**
1. 所有 `alert()` 替换为 `useToast` 调用
2. 确保 ToastProvider 已正确包裹应用

**涉及文件：**
- `src/app/(site)/checkin/page.tsx`
- `src/app/(site)/register/page.tsx`
- `src/app/(site)/feedback/page.tsx`
- 其他使用 alert() 的页面

**阶段二验收标准：**
- [ ] 活动相册正常显示图片
- [ ] 个人中心正常加载数据
- [ ] 联系页面显示真实联系方式
- [ ] 活动环节从数据库读取
- [ ] 反馈页面无重定向循环
- [ ] 所有页面使用 Toast 提示

---

### 阶段三：导出功能修复与完善（P1）

> 目标：修复所有导出功能，确保表格精美、文件名正确、有错误提示

#### 3.1 签到导出修复
**问题描述：** 前端文件名覆盖服务端返回的文件名，使用 `toLocaleDateString()` 可能产生斜杠字符

**修复方案：**
1. 从 `Content-Disposition` 响应头读取文件名
2. 使用 `toISOString().slice(0, 10)` 格式日期
3. 添加错误提示

**涉及文件：**
- `src/app/admin/checkin/page.tsx`

#### 3.2 物资导出修复
**问题描述：** 文件名未 URL 编码，无标题行，无成功/失败提示

**修复方案：**
1. API 端使用 `encodeURIComponent` 编码文件名
2. 添加封面页（标题 + 日期 + 记录数）
3. 表头红色加粗样式
4. 前端添加成功/失败 Toast 提示

**涉及文件：**
- `src/app/api/admin/materials/export/route.ts`
- `src/app/admin/materials/page.tsx`

#### 3.3 学生导出修复
**问题描述：** 前端文件名覆盖服务端，无成功/失败提示

**修复方案：**
1. 从响应头读取文件名
2. 添加成功/失败 Toast 提示

**涉及文件：**
- `src/app/admin/students/page.tsx`

#### 3.4 报名导出修复
**问题描述：** 前端文件名覆盖服务端，无成功/失败提示

**修复方案：**
1. 从响应头读取文件名
2. 添加成功/失败 Toast 提示

**涉及文件：**
- `src/app/admin/registrations/page.tsx`

#### 3.5 备份页面处理
**问题描述：** 备份页面所有导出按钮都是 Mock 实现（setTimeout 模拟）

**修复方案（二选一）：**
1. 实现真实的导出功能（复用已有 API）
2. 移除备份页面

**涉及文件：**
- `src/app/admin/backup/page.tsx`

**阶段三验收标准：**
- [ ] 所有导出功能正常下载文件
- [ ] 文件名正确（无乱码、无斜杠）
- [ ] Excel 表格有标题行、表头样式
- [ ] 导出成功/失败有 Toast 提示

---

### 阶段四：寻宝功能完整实现（新功能）

> 目标：实现完整的寻宝功能，包括管理端地图标记和学生端寻宝页面

#### 4.1 地图标记功能修复
**问题描述：** 管理端寻宝页面地图图片上传功能不可用

**可能原因：**
- 图片上传组件事件绑定问题
- base64 数据过大超出数据库字段限制
- FileReader 读取失败

**修复方案：**
1. 检查并修复图片上传组件事件绑定
2. 图片压缩后存储（限制最大宽度 1920px）
3. 确保图片数据正确保存到 Setting 表（key: `treasure_map_image`）
4. 确保标记渲染逻辑正确读取图片并显示

**涉及文件：**
- `src/app/admin/treasure/page.tsx`
- `src/app/api/admin/settings/route.ts`

#### 4.2 学生端寻宝地图页面
**功能规格：**
1. 显示校园地图（从 Setting 表读取 `treasure_map_image`）
2. 显示积分卡标记（从 TreasureCard 表读取，仅显示未找到的）
3. 标记颜色：1分蓝色、2分琥珀色、3分红色
4. 点击标记显示位置信息
5. 找到积分卡后提交（输入位置确认）

**新文件：**
- `src/app/(site)/treasure-map/page.tsx`
- `src/app/(site)/treasure-map/TreasureMapClient.tsx`
- `src/app/api/treasure/cards/route.ts`
- `src/app/api/treasure/submit/route.ts`

#### 4.3 我的小队页面增强
**功能规格：**
1. 显示队伍获得的线索卡（A/B/C 级）
2. 线索卡内容展示
3. 已找到积分卡数量
4. 寻宝得分详情

**涉及文件：**
- `src/app/(site)/my-team/page.tsx`
- `src/app/api/teams/my/route.ts`

#### 4.4 线索卡发放功能细化
**功能规格：**
1. 完善线索卡创建 UI
2. 按排名自动分发（已有基础）
3. 添加发放记录查看
4. 支持手动调整分发

**涉及文件：**
- `src/app/admin/treasure/page.tsx`
- `src/app/api/admin/clue-cards/route.ts`
- `src/app/api/admin/clue-cards/distribute/route.ts`

**阶段四验收标准：**
- [ ] 管理端可以上传地图图片并标记积分卡
- [ ] 学生端寻宝地图页面正常显示
- [ ] 我的小队页面显示线索卡
- [ ] 提交找到的积分卡功能正常
- [ ] 线索卡发放功能完善

---

### 阶段五：系统优化与安全加固（P1/P2）

> 目标：优化性能，加固安全，提升代码质量

#### 5.1 数据库优化
**修复内容：**
1. 添加 Team @@unique([session, name]) 防止同名队伍
2. ActivityLog 添加 operatorId 外键关联 User
3. 移除 Material.totalPrice 冗余字段，改为计算属性
4. 修复 CheckinRecord 唯一约束（checkinSessionId 为 null 时的问题）
5. 移除或实现 Image 模型

**涉及文件：**
- `prisma/schema.prisma`

#### 5.2 安全加固
**修复内容：**
1. 增强密码策略（8 位+大小写+数字）
2. 修改密码时验证旧密码
3. 添加登录失败速率限制
4. 所有 admin API 添加权限检查
5. JWT token 减少敏感信息

**涉及文件：**
- `src/lib/auth.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/change-password/page.tsx`
- 所有 `src/app/api/admin/*/route.ts`

#### 5.3 性能优化
**修复内容：**
1. 日程管理批量更新 API（一次请求更新所有 sortOrder）
2. 图片改用文件存储（避免 base64 存数据库）
3. 优化组件渲染逻辑（避免不必要的重新渲染）
4. 数据库查询优化（避免 N+1 查询）

**涉及文件：**
- `src/app/admin/schedule/page.tsx`
- `src/app/api/admin/schedule/route.ts`
- 多个组件文件

#### 5.4 代码质量提升
**修复内容：**
1. 所有 catch 块添加错误处理（至少 console.error）
2. 提取可复用组件（StatsGrid、FormCard 等）
3. Modal 添加 ARIA 属性
4. 统一 API 响应格式

**涉及文件：**
- 多个页面和组件文件

**阶段五验收标准：**
- [ ] 数据库约束完整
- [ ] 密码策略增强
- [ ] 所有 admin API 有权限检查
- [ ] 性能优化完成
- [ ] 代码质量提升

---

### 阶段六：部署准备与最终测试

> 目标：确保系统可以安全部署到生产环境

#### 6.1 环境配置
- [ ] 生产数据库连接配置
- [ ] NextAuth 密钥生成
- [ ] 生产环境 URL 配置
- [ ] 环境变量验证

#### 6.2 数据库迁移
- [ ] 生成 Prisma Client
- [ ] 推送数据库 schema 变更
- [ ] 执行数据迁移（如有）
- [ ] 执行种子数据

#### 6.3 全面测试
- [ ] 签到完整流程测试（GPS/QR/CODE）
- [ ] 寻宝完整流程测试
- [ ] 内容管理完整流程测试
- [ ] 导出功能测试
- [ ] 权限系统测试
- [ ] 移动端响应式测试
- [ ] 性能测试（页面加载时间）

#### 6.4 部署检查
- [ ] 构建无错误
- [ ] 所有页面正常加载
- [ ] 所有 API 正常响应
- [ ] 错误处理完善
- [ ] 日志记录完善

**阶段六验收标准：**
- [ ] 生产环境配置完成
- [ ] 数据库迁移完成
- [ ] 所有测试通过
- [ ] 可以安全部署

---

## 实施顺序与时间估算

| 阶段 | 内容 | 预估时间 | 依赖 |
|------|------|---------|------|
| **阶段一** | 签到系统全面修复 | 3-4 小时 | 无 |
| **阶段二** | 前台页面修复 | 4-5 小时 | 阶段一 |
| **阶段三** | 导出功能修复与完善 | 2-3 小时 | 阶段一 |
| **阶段四** | 寻宝功能完整实现 | 8-10 小时 | 阶段一、二 |
| **阶段五** | 系统优化与安全加固 | 5-6 小时 | 阶段一、二、三、四 |
| **阶段六** | 部署准备与最终测试 | 3-4 小时 | 所有阶段 |
| **总计** | | **25-32 小时** | |

---

## 风险与缓解

### 高风险
1. **签到系统统一** - 可能影响现有签到数据
   - 缓解：保留 CheckinConfig 表数据，仅修改读取逻辑

2. **数据库 schema 变更** - 可能导致数据丢失
   - 缓解：变更前备份数据库

### 中风险
1. **寻宝功能新增** - 新增页面和 API 可能引入 bug
   - 缓解：充分测试，逐步上线

2. **图片存储方式变更** - 可能影响现有地图标记
   - 缓解：提供数据迁移脚本

### 低风险
1. **UI 优化** - 纯前端修改，影响范围小
2. **代码质量提升** - 不改变功能，仅优化代码

---

## 验收标准总览

### 阶段一
- [ ] 验证码输入框可以连续输入，不丢失焦点
- [ ] 验证码签到可以正常验证并提交
- [ ] GPS 签到位置验证正确显示距离
- [ ] 签到系统管理端和学生端配置一致

### 阶段二
- [ ] 活动相册正常显示图片
- [ ] 个人中心正常加载数据
- [ ] 联系页面显示真实联系方式
- [ ] 活动环节从数据库读取
- [ ] 反馈页面无重定向循环
- [ ] 所有页面使用 Toast 提示

### 阶段三
- [ ] 所有导出功能正常下载文件
- [ ] 文件名正确（无乱码、无斜杠）
- [ ] Excel 表格有标题行、表头样式
- [ ] 导出成功/失败有 Toast 提示

### 阶段四
- [ ] 管理端可以上传地图图片并标记积分卡
- [ ] 学生端寻宝地图页面正常显示
- [ ] 我的小队页面显示线索卡
- [ ] 提交找到的积分卡功能正常
- [ ] 线索卡发放功能完善

### 阶段五
- [ ] 数据库约束完整
- [ ] 密码策略增强
- [ ] 所有 admin API 有权限检查
- [ ] 性能优化完成
- [ ] 代码质量提升

### 阶段六
- [ ] 生产环境配置完成
- [ ] 数据库迁移完成
- [ ] 所有测试通过
- [ ] 可以安全部署
