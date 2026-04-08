import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '..', '.env.local') })

import { PrismaClient, Role, Session, StudentPosition, GameStation, AnnouncementType, MaterialStatus, ClueCardTier } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ========================================
  // 1. 初始管理员/老师账号
  // ========================================
  const hashedPassword = await bcrypt.hash('123456', 10)

  // 超级管理员（拥有所有权限，含 MANAGE_ADMINS，不可被修改）
  const superAdmin = await prisma.user.upsert({
    where: { studentId: 'admin' },
    update: {},
    create: {
      name: '超级管理员',
      studentId: 'admin',
      grade: null,
      className: null,
      role: 'ADMIN' as Role,
      phone: '13800000000',
      email: 'admin@djtu.edu.cn',
      password: hashedPassword,
      isFirstLogin: true,
    },
  })
  console.log('✅ 超级管理员创建: admin / 123456')

  // 普通管理员（除 MANAGE_ADMINS 外的所有权限）
  const admin2 = await prisma.user.upsert({
    where: { studentId: 'admin2' },
    update: {},
    create: {
      name: '活动管理员',
      studentId: 'admin2',
      grade: null,
      className: null,
      role: 'ADMIN' as Role,
      phone: '13800000001',
      email: 'admin2@djtu.edu.cn',
      password: hashedPassword,
      isFirstLogin: true,
    },
  })
  console.log('✅ 普通管理员创建: admin2 / 123456')

  // 老师账号（全部权限，不可被修改）
  const teacher = await prisma.user.upsert({
    where: { studentId: 'teacher' },
    update: {},
    create: {
      name: '团委老师',
      studentId: 'teacher',
      grade: null,
      className: null,
      role: 'TEACHER' as Role,
      phone: '13800000002',
      email: 'teacher@djtu.edu.cn',
      password: hashedPassword,
      isFirstLogin: true,
    },
  })
  console.log('✅ 老师账号创建: teacher / 123456')

  // ========================================
  // 2. 管理员权限分配
  // ========================================
  const allPermissions = [
    'MANAGE_REGISTRATIONS',
    'MANAGE_TEAMS',
    'MANAGE_STAFF',
    'MANAGE_SCHEDULE',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_SCORES',
    'MANAGE_MATERIALS',
    'MANAGE_ROTATION',
    'MANAGE_TREASURE',
    'VIEW_FEEDBACKS',
    'MANAGE_SETTINGS',
    'VIEW_LOGS',
    'EXPORT_DATA',
    'MANAGE_ADMINS',
  ]

  const admin2Permissions = allPermissions.filter(p => p !== 'MANAGE_ADMINS')

  // 超级管理员：全部权限
  for (const perm of allPermissions) {
    await prisma.adminPermission.upsert({
      where: { userId_permission: { userId: superAdmin.id, permission: perm as any } },
      update: {},
      create: { userId: superAdmin.id, permission: perm as any },
    })
  }
  console.log('✅ 超级管理员权限分配（全部权限）')

  // 普通管理员：除 MANAGE_ADMINS 外的所有权限
  for (const perm of admin2Permissions) {
    await prisma.adminPermission.upsert({
      where: { userId_permission: { userId: admin2.id, permission: perm as any } },
      update: {},
      create: { userId: admin2.id, permission: perm as any },
    })
  }
  console.log('✅ 普通管理员权限分配（除 MANAGE_ADMINS 外）')

  // ========================================
  // 3. 游戏站配置
  // ========================================
  const gameStations = [
    {
      station: 'LISTEN_COMMAND' as GameStation,
      name: '听我口令',
      description: '考验反应力和注意力的指令游戏',
      rules: '1. 主持人为发令者，其余参赛人员为动作执行者\n2. 有效指令：发令者说出带赛前约定的任意主语（如"XX说"）的动作指令，执行者需立即完成对应动作\n3. 无效指令：发令者说出无指定主语的动作指令，执行者需保持原地不动\n4. 淘汰：执行者出现执行无效指令、未执行有效指令、动作完成错误三种情况，均视为本轮淘汰',
      scoringRules: '1. 单局游戏时长6分钟，每局结束后，组内剩余存活人数多的队伍获胜\n2. 若双方最终人数一致，可加时3min以内决胜负\n3. 胜方队伍累计得3分，负方队伍累计得0分，若双方加时后剩余人数一致，各得1分',
      maxScore: 3,
      duration: 19,
      sortOrder: 1,
      materials: '主持词',
      staffCount: 5,
    },
    {
      station: 'DODGEBALL' as GameStation,
      name: '躲避球',
      description: '团队协作的投掷躲避游戏',
      rules: '1. 场地设有边界线、击打线与中线。队员超出边界线即判出局\n2. 每队分为两组，每局比赛派一组上场\n3. 每局以哨声限制击打次数，裁判共鸣哨16次\n4. 上场队员在击打线以外击打，全程不得超出边界线\n5. 上场队员若被沙包击中即被淘汰；若用手接住沙包则不淘汰，且获得加分',
      scoringRules: '1. 基础计分：圆内按剩余人数加分（+2分/人），接住沙包一次+1分\n2. 若最终小分相同，平局加赛1轮\n3. 各个小局积分总和多者获胜，胜者总积分加1分，败者不加分',
      maxScore: 1,
      duration: 15,
      sortOrder: 2,
      materials: '沙包40个，胶带8卷，纸箱子6个，哨子2个，计分表+笔',
      staffCount: 4,
    },
    {
      station: 'CODE_BREAK' as GameStation,
      name: '密码破译',
      description: '推理与协作的密码破解挑战',
      rules: '1. 每队需破解一个9位数字密码，由三个三位数段按一定顺序排列组成\n2. 三个小组独立领取各自的线索卡，推理出本组的三位数\n3. 各小组完成后示意队长，队长告知裁判，裁判发放顺序线索卡\n4. 队伍根据顺序线索卡确定三个段的正确排列顺序\n5. 将三个三位数按正确顺序拼接成9位密码，向裁判提交',
      scoringRules: '1. 在限定时间内成功完成三段推理的队伍，获得+2分\n2. 在限定时间内全部完成所有任务的队伍，获得+1分\n3. 若其中一队率先全部完成，该队获得+3分（率先完成奖）',
      maxScore: 3,
      duration: 20,
      sortOrder: 3,
      materials: '推理线索卡、顺序线索卡、密码答案卡、信封、笔30支、桌椅4套',
      staffCount: 5,
    },
    {
      station: 'NO_TOUCH_GROUND' as GameStation,
      name: '别碰地面',
      description: '团队协作翻转地垫的挑战',
      rules: '1. 每队获得一块帆布地垫（2m×2m），全队成员站立在地垫上\n2. 裁判宣布开始后，全队需在不踩到地面的前提下，将地垫完全翻面\n3. 过程中任何人身体任何部位触地，则全队需回到初始状态重新开始\n4. 地垫完全翻面且全员站立其上即为完成',
      scoringRules: '1. 两队同时进行，先完成者积2分，负方积0分\n2. 若5分钟内均未完成，则按翻面比例定胜负\n3. 若进度相同，加赛一轮（加赛限时3分钟且限制一次）',
      maxScore: 2,
      duration: 16,
      sortOrder: 4,
      materials: '帆布地垫2块（2m×2m）',
      staffCount: 3,
    },
  ]

  for (const station of gameStations) {
    await prisma.gameStationConfig.upsert({
      where: { station: station.station },
      update: {},
      create: station,
    })
  }
  console.log('✅ 游戏站配置创建（4个）')

  // ========================================
  // 4. 日程数据（按策划案流程总表）
  // ========================================
  // 使用 2026-05-15 作为活动日期
  const activityDate = '2026-05-15'

  const schedules = [
    { title: '场地搭建与物料准备', session: 'FIRST' as Session, startTime: new Date('2026-05-15T09:30:00+08:00'), endTime: new Date('2026-05-15T11:30:00+08:00'), location: '操场', sortOrder: 1, phase: '赛前准备' },
    { title: '工作人员到位与岗前确认', session: 'FIRST' as Session, startTime: new Date('2026-05-15T11:30:00+08:00'), endTime: new Date('2026-05-15T12:00:00+08:00'), location: '各岗位', sortOrder: 2, phase: '赛前准备' },
    { title: '参赛队伍签到与候场', session: 'FIRST' as Session, startTime: new Date('2026-05-15T12:00:00+08:00'), endTime: new Date('2026-05-15T12:25:00+08:00'), location: '操场主席台前', sortOrder: 3, phase: '赛前准备' },
    { title: '全员候场与最终设备检查', session: 'FIRST' as Session, startTime: new Date('2026-05-15T12:25:00+08:00'), endTime: new Date('2026-05-15T12:30:00+08:00'), location: '开幕区', sortOrder: 4, phase: '赛前准备' },
    { title: '开幕讲话与活动启动', session: 'FIRST' as Session, startTime: new Date('2026-05-15T12:30:00+08:00'), endTime: new Date('2026-05-15T12:45:00+08:00'), location: '操场主席台', sortOrder: 5, phase: '开幕' },
    { title: '第一轮轮转 - 第1轮', session: 'FIRST' as Session, startTime: new Date('2026-05-15T12:45:00+08:00'), endTime: new Date('2026-05-15T13:05:00+08:00'), location: '4个游戏站', sortOrder: 6, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第2轮', session: 'FIRST' as Session, startTime: new Date('2026-05-15T13:05:00+08:00'), endTime: new Date('2026-05-15T13:25:00+08:00'), location: '4个游戏站', sortOrder: 7, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第3轮', session: 'FIRST' as Session, startTime: new Date('2026-05-15T13:25:00+08:00'), endTime: new Date('2026-05-15T13:45:00+08:00'), location: '4个游戏站', sortOrder: 8, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第4轮', session: 'FIRST' as Session, startTime: new Date('2026-05-15T13:45:00+08:00'), endTime: new Date('2026-05-15T14:05:00+08:00'), location: '4个游戏站', sortOrder: 9, phase: '轮转积分赛' },
    { title: '中场休整与寻宝规则宣讲', session: 'FIRST' as Session, startTime: new Date('2026-05-15T14:05:00+08:00'), endTime: new Date('2026-05-15T14:10:00+08:00'), location: '操场', sortOrder: 10, phase: '中场休整' },
    { title: '校园寻宝积分环节', session: 'FIRST' as Session, startTime: new Date('2026-05-15T14:10:00+08:00'), endTime: new Date('2026-05-15T14:50:00+08:00'), location: '二期校园', sortOrder: 11, phase: '寻宝赛' },
    { title: '寻宝结束与最终积分核算', session: 'FIRST' as Session, startTime: new Date('2026-05-15T14:50:00+08:00'), endTime: new Date('2026-05-15T15:05:00+08:00'), location: '积分登记点', sortOrder: 12, phase: '寻宝赛' },
    { title: '第一场结束，准备第二场', session: 'FIRST' as Session, startTime: new Date('2026-05-15T15:05:00+08:00'), endTime: new Date('2026-05-15T15:20:00+08:00'), location: '操场', sortOrder: 13, phase: '闭幕' },
    { title: '场地复位与第二场前置准备', session: 'SECOND' as Session, startTime: new Date('2026-05-15T15:20:00+08:00'), endTime: new Date('2026-05-15T15:35:00+08:00'), location: '各游戏站', sortOrder: 14, phase: '场间转场' },
    { title: '第二场开幕与规则宣讲', session: 'SECOND' as Session, startTime: new Date('2026-05-15T15:35:00+08:00'), endTime: new Date('2026-05-15T15:50:00+08:00'), location: '操场主席台', sortOrder: 15, phase: '开幕' },
    { title: '第一轮轮转 - 第1轮', session: 'SECOND' as Session, startTime: new Date('2026-05-15T15:50:00+08:00'), endTime: new Date('2026-05-15T16:10:00+08:00'), location: '4个游戏站', sortOrder: 16, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第2轮', session: 'SECOND' as Session, startTime: new Date('2026-05-15T16:10:00+08:00'), endTime: new Date('2026-05-15T16:30:00+08:00'), location: '4个游戏站', sortOrder: 17, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第3轮', session: 'SECOND' as Session, startTime: new Date('2026-05-15T16:30:00+08:00'), endTime: new Date('2026-05-15T16:50:00+08:00'), location: '4个游戏站', sortOrder: 18, phase: '轮转积分赛' },
    { title: '第一轮轮转 - 第4轮', session: 'SECOND' as Session, startTime: new Date('2026-05-15T16:50:00+08:00'), endTime: new Date('2026-05-15T17:10:00+08:00'), location: '4个游戏站', sortOrder: 19, phase: '轮转积分赛' },
    { title: '中场休整与寻宝规则宣讲', session: 'SECOND' as Session, startTime: new Date('2026-05-15T17:10:00+08:00'), endTime: new Date('2026-05-15T17:15:00+08:00'), location: '操场', sortOrder: 20, phase: '中场休整' },
    { title: '校园寻宝积分环节', session: 'SECOND' as Session, startTime: new Date('2026-05-15T17:15:00+08:00'), endTime: new Date('2026-05-15T17:55:00+08:00'), location: '二期校园', sortOrder: 21, phase: '寻宝赛' },
    { title: '第二场成绩整理与退场', session: 'SECOND' as Session, startTime: new Date('2026-05-15T17:55:00+08:00'), endTime: new Date('2026-05-15T18:00:00+08:00'), location: '操场', sortOrder: 22, phase: '闭幕' },
  ]

  for (const schedule of schedules) {
    await prisma.scheduleItem.create({
      data: schedule,
    })
  }
  console.log(`✅ 日程数据创建（${schedules.length}条）`)

  // ========================================
  // 5. 物资数据（按策划案物料预算表）
  // ========================================
  const materials = [
    // 游戏专属物料
    { name: '帆布沙包', category: '游戏专属', gameStation: 'DODGEBALL' as GameStation, quantity: 40, unit: '个', unitPrice: 1.84, totalPrice: 73.6, allocatedTo: '躲避球游戏站', session: null, status: 'PENDING' as MaterialStatus, description: '10cm直径加厚帆布沙包，不掉色不漏沙' },
    { name: '加厚瓦楞纸箱', category: '游戏专属', gameStation: 'DODGEBALL' as GameStation, quantity: 6, unit: '个', unitPrice: 5, totalPrice: 30, allocatedTo: '躲避球游戏站', session: null, status: 'PENDING' as MaterialStatus, description: '30×20×20cm硬挺瓦楞纸箱，存放沙包' },
    { name: '彩色胶带', category: '游戏专属', gameStation: 'DODGEBALL' as GameStation, quantity: 8, unit: '卷', unitPrice: 3.4, totalPrice: 27.2, allocatedTo: '躲避球游戏站', session: null, status: 'PENDING' as MaterialStatus, description: '5cm宽×33米长，划定场地边界线' },
    { name: '密码破译线索卡', category: '游戏专属', gameStation: 'CODE_BREAK' as GameStation, quantity: 200, unit: '张', unitPrice: 0, totalPrice: 0, allocatedTo: '密码破译游戏站', session: null, status: 'PENDING' as MaterialStatus, description: 'A4黑白打印，含规则卡/推理卡/核对卡' },
    { name: '7号标准信封', category: '游戏专属', gameStation: 'CODE_BREAK' as GameStation, quantity: 50, unit: '个', unitPrice: 0.12, totalPrice: 6, allocatedTo: '密码破译/寻宝', session: null, status: 'PENDING' as MaterialStatus, description: '白色加厚标准信封，分装线索卡' },
    { name: '防滑帆布地垫', category: '游戏专属', gameStation: 'NO_TOUCH_GROUND' as GameStation, quantity: 2, unit: '块', unitPrice: 37, totalPrice: 74, allocatedTo: '别碰地面游戏站', session: null, status: 'PENDING' as MaterialStatus, description: '2m×2m加厚防滑耐磨帆布地垫' },
    { name: '寻宝积分卡', category: '游戏专属', gameStation: 'TREASURE_HUNT' as GameStation, quantity: 200, unit: '张', unitPrice: 0, totalPrice: 0, allocatedTo: '寻宝赛', session: null, status: 'PENDING' as MaterialStatus, description: 'A4彩印，含打卡点标识、积分统计栏' },
    // 全场通用物料
    { name: '0.5mm黑色中性笔', category: '全场通用', gameStation: null, quantity: 30, unit: '支', unitPrice: 0.66, totalPrice: 20, allocatedTo: '全环节', session: null, status: 'PENDING' as MaterialStatus, description: '顺滑速干办公中性笔' },
    { name: '高频裁判专用哨', category: '全场通用', gameStation: null, quantity: 6, unit: '个', unitPrice: 4, totalPrice: 24, allocatedTo: '全环节', session: null, status: 'PENDING' as MaterialStatus, description: '无核高频裁判哨，声音洪亮' },
    { name: '550ml瓶装矿泉水', category: '全场通用', gameStation: null, quantity: 48, unit: '瓶', unitPrice: 1.04, totalPrice: 50, allocatedTo: '全体', session: null, status: 'PENDING' as MaterialStatus, description: '品牌瓶装矿泉水，2箱（48瓶）' },
    // 可借用物料
    { name: '学生课桌+靠背椅', category: '可借用', gameStation: null, quantity: 24, unit: '套', unitPrice: 0, totalPrice: 0, allocatedTo: '密码破译/裁判岗', session: null, status: 'PENDING' as MaterialStatus, description: '桌子8张、椅子16把' },
    { name: '扩音器+音响', category: '可借用', gameStation: null, quantity: 5, unit: '个', unitPrice: 0, totalPrice: 0, allocatedTo: '全环节', session: null, status: 'PENDING' as MaterialStatus, description: '学院提供，主持人宣读规则、裁判判罚' },
    // 可选物料
    { name: '队伍臂贴', category: '可选', gameStation: null, quantity: 320, unit: '个', unitPrice: 0.16, totalPrice: 51.2, allocatedTo: '参赛队伍', session: null, status: 'PENDING' as MaterialStatus, description: '不粘胶臂贴（直径7cm），区分参赛队伍' },
  ]

  for (const material of materials) {
    await prisma.material.create({
      data: material,
    })
  }
  console.log(`✅ 物资数据创建（${materials.length}条）`)

  // ========================================
  // 6. 公告数据
  // ========================================
  await prisma.announcement.create({
    data: {
      title: '2026年青马工程学生干部素质拓展活动报名开启',
      content: '各位同学：\n\n2026年青马工程学生干部素质拓展活动将于5月15日举行，现面向大一、大二全体班委开放报名。\n\n活动形式：\n- 第一轮：同步轮转积分赛（4个游戏站）\n- 第二轮："械"逅寻宝赛\n\n请各位班委及时登录网站确认报名信息。\n\n机械工程学院团委\n2026年4月',
      type: 'NORMAL' as AnnouncementType,
      isPinned: true,
      publishedAt: new Date(),
    },
  })
  console.log('✅ 公告数据创建')

  // ========================================
  // 7. 工作人员岗位
  // ========================================
  const staffRoles = [
    { name: '主裁判', description: '负责组织轮转、主持游戏、辅助裁判判定淘汰人员', requiredCount: 8, session: null },
    { name: '积分裁判', description: '负责记录两队积分、统计完成情况、并登记总表', requiredCount: 5, session: null },
    { name: '辅助裁判', description: '负责判定淘汰并对比赛全程进行录像（处理申诉）', requiredCount: 4, session: null },
    { name: '道具裁判', description: '负责整理道具，确保题目对应线索正确，发放线索卡', requiredCount: 4, session: null },
    { name: '现场巡查', description: '在指定区域巡逻，制止违规行为，提供指引', requiredCount: 6, session: null },
    { name: '总控负责人', description: '统筹整场寻宝活动的节奏与现场秩序，协调各小组工作', requiredCount: 1, session: null },
    { name: '签到人员', description: '负责参赛队伍签到与队伍臂贴发放', requiredCount: 4, session: null },
    { name: '后勤保障', description: '负责物资准备、场地布置、饮水供应等后勤保障工作', requiredCount: 6, session: null },
  ]

  for (const role of staffRoles) {
    await prisma.staffRole.upsert({
      where: { id: role.name },
      update: {},
      create: { ...role, id: undefined },
    })
  }
  console.log(`✅ 工作人员岗位创建（${staffRoles.length}个）`)

  // ========================================
  // 8. 内容管理系统 - 页面和内容块
  // ========================================

  // 首页
  const homePage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      slug: 'home',
      title: '首页',
      description: '网站主页',
      type: 'home',
      status: 'published',
      publishedAt: new Date(),
      isEnabled: true,
      sortOrder: 1,
    },
  })

  const homeBlocks = [
    { type: 'hero', key: 'hero.banner', title: 'Banner 区域', sortOrder: 1, config: JSON.stringify({ showCountdown: true, countdownDate: '2026-05-15T12:30:00', buttons: [{ text: '确认报名', link: '/register', variant: 'primary' }, { text: '查看日程', link: '/schedule', variant: 'secondary' }] }), content: JSON.stringify({ title: '青马工程', subtitle: '学生干部素质拓展活动', badge: '2026年机械工程学院', org: '大连交通大学 · 机械工程学院团委' }) },
    { type: 'text', key: 'hero.announcement', title: '首页公告', sortOrder: 2, config: JSON.stringify({ link: '/announcements', linkText: '更多' }), content: '2026年青马工程学生干部素质拓展活动报名已开启，请各班班委登录网站确认报名信息！' },
    { type: 'grid', key: 'home.features', title: '快捷功能', sortOrder: 3, config: JSON.stringify({ columns: 5, gap: 'sm' }), content: JSON.stringify([{ label: '活动信息', icon: 'Sparkles', link: '/info', color: 'from-blue-500 to-blue-600' }, { label: '日程安排', icon: 'Calendar', link: '/schedule', color: 'from-green-500 to-emerald-600' }, { label: '活动环节', icon: 'Target', link: '/activities', color: 'from-purple-500 to-purple-600' }, { label: '分组查询', icon: 'Users', link: '/groups', color: 'from-orange-500 to-orange-600' }, { label: '积分排行', icon: 'Trophy', link: '/ranking', color: 'from-yellow-500 to-amber-600' }, { label: '通知公告', icon: 'Megaphone', link: '/announcements', color: 'from-red-500 to-red-600' }, { label: '活动相册', icon: 'ImageIcon', link: '/gallery', color: 'from-pink-500 to-pink-600' }, { label: '活动报名', icon: 'Footprints', link: '/register', color: 'from-indigo-500 to-indigo-600' }, { label: '工作人员', icon: 'UserPlus', link: '/staff', color: 'from-cyan-500 to-cyan-600' }, { label: '意见反馈', icon: 'MessageSquare', link: '/feedback', color: 'from-teal-500 to-teal-600' }]) },
    { type: 'grid', key: 'home.overview', title: '活动概览', sortOrder: 4, config: JSON.stringify({ columns: 2, gap: 'md' }), content: JSON.stringify([{ title: '活动时间', value: '5月15日', sub: '第一场 12:30-15:20', icon: 'Calendar' }, { title: '活动地点', value: '大连交通大学', sub: '二期校园', icon: 'MapPin' }, { title: '参与对象', value: '280人', sub: '大一144人 / 大二136人', icon: 'Users' }, { title: '活动形式', value: '两轮制', sub: '轮转积分赛 + 寻宝赛', icon: 'Clock' }]) },
    { type: 'cta', key: 'home.cta', title: 'CTA 行动号召', sortOrder: 5, config: JSON.stringify({ buttons: [{ text: '立即登录', link: '/login', variant: 'primary' }] }), content: JSON.stringify({ title: '准备好挑战自我了吗？', desc: '登录网站确认报名信息，与优秀的同学们一起成长！' }) },
  ]

  for (const block of homeBlocks) {
    const existing = await prisma.pageBlock.findFirst({ where: { key: block.key } })
    if (existing) {
      await prisma.pageBlock.update({ where: { id: existing.id }, data: block })
    } else {
      await prisma.pageBlock.create({ data: { pageId: homePage.id, ...block } })
    }
  }
  console.log(`✅ 首页内容块创建（${homeBlocks.length}个）`)

  // 活动信息页
  const infoPage = await prisma.page.upsert({
    where: { slug: 'info' },
    update: {},
    create: {
      slug: 'info',
      title: '活动信息',
      description: '活动详细信息',
      type: 'info',
      status: 'published',
      publishedAt: new Date(),
      isEnabled: true,
      sortOrder: 2,
    },
  })

  const infoBlocks = [
    { type: 'text', key: 'info.background', title: '活动背景与目的', sortOrder: 1, config: JSON.stringify({}), content: '为深入学习贯彻习近平新时代中国特色社会主义思想，落实立德树人根本任务，培养造就一批政治坚定、能力突出、素质优良的学生骨干队伍，机械工程学院团委特举办"青马工程"学生干部素质拓展活动。\n\n本次活动面向大一、大二两个学年所有班级班委，通过一系列精心设计的素质拓展环节，全面提升学生干部的政治素养、团队协作能力、组织领导能力和服务意识。' },
    { type: 'grid', key: 'info.timeLocation', title: '时间与地点', sortOrder: 2, config: JSON.stringify({ columns: 2 }), content: JSON.stringify([{ title: '活动时间', items: ['日期：5月15日', '第一场：12:30-15:20', '第二场：15:35-18:00'], icon: 'Calendar' }, { title: '活动地点', items: ['游戏区：操场', '寻宝区：楼宇周边+绿化区', '集合地：操场主席台'], icon: 'MapPin' }]) },
    { type: 'grid', key: 'info.participants', title: '参与对象', sortOrder: 3, config: JSON.stringify({ columns: 2 }), content: JSON.stringify([{ title: '第一场', subtitle: '大一学生干部', desc: '144人 · 16支队伍 · 每队9人' }, { title: '第二场', subtitle: '大二学生干部', desc: '136人 · 16支队伍 · 每队8-9人' }]) },
    { type: 'list', key: 'info.organization', title: '组织架构', sortOrder: 4, config: JSON.stringify({ style: 'check' }), content: JSON.stringify([{ text: '主办单位：机械工程学院团委' }, { text: '承办单位：学生会组织部' }, { text: '协办单位：青年志愿者协会' }]) },
    { type: 'grid', key: 'info.highlights', title: '活动亮点', sortOrder: 5, config: JSON.stringify({ columns: 3 }), content: JSON.stringify([{ title: '政治素养提升', desc: '通过理论学习与实践相结合，提升学生干部的政治觉悟和理论素养', icon: 'Shield', color: 'from-red-500 to-red-600' }, { title: '团队协作能力', desc: '通过团队挑战项目，培养团队协作精神和组织协调能力', icon: 'Users', color: 'from-blue-500 to-blue-600' }, { title: '领导力培养', desc: '在情景模拟和任务挑战中锻炼决策能力和领导才能', icon: 'Target', color: 'from-purple-500 to-purple-600' }, { title: '服务意识增强', desc: '强化学生干部的服务意识，提升为同学服务的能力和水平', icon: 'Heart', color: 'from-pink-500 to-pink-600' }, { title: '知识储备拓展', desc: '通过知识竞赛环节，检验和拓展学生干部的知识面', icon: 'BookOpen', color: 'from-amber-500 to-amber-600' }, { title: '综合素质评价', desc: '全方位评价体系，记录每位参与者的成长与进步', icon: 'Award', color: 'from-emerald-500 to-emerald-600' }]) },
    { type: 'list', key: 'info.notices', title: '注意事项', sortOrder: 6, config: JSON.stringify({ style: 'check' }), content: JSON.stringify([{ text: '请穿着运动服装和运动鞋参加活动' }, { text: '活动当天请携带学生证' }, { text: '如有身体不适请提前告知负责人' }, { text: '活动期间请服从工作人员安排' }, { text: '注意个人财物安全' }, { text: '活动期间保持手机畅通' }]) },
  ]

  for (const block of infoBlocks) {
    const existing = await prisma.pageBlock.findFirst({ where: { key: block.key } })
    if (existing) {
      await prisma.pageBlock.update({ where: { id: existing.id }, data: block })
    } else {
      await prisma.pageBlock.create({ data: { pageId: infoPage.id, ...block } })
    }
  }
  console.log(`✅ 活动信息页内容块创建（${infoBlocks.length}个）`)

  // 日程安排页
  const schedulePage = await prisma.page.upsert({
    where: { slug: 'schedule' },
    update: {},
    create: {
      slug: 'schedule',
      title: '日程安排',
      description: '活动详细流程',
      type: 'schedule',
      status: 'published',
      publishedAt: new Date(),
      isEnabled: true,
      sortOrder: 3,
    },
  })

  const schedulePhases = [
    {
      type: 'schedule-phase',
      key: 'schedule.phase.1',
      title: '赛前准备',
      sortOrder: 1,
      config: JSON.stringify({ color: 'bg-blue-600' }),
      content: JSON.stringify([
        { time: '09:30-11:30', title: '场地搭建与物料准备', location: '操场', desc: '确认4个游戏站位置、划定躲避球场地边界线、放置寻宝积分卡' },
        { time: '11:30-12:00', title: '工作人员到位与岗前确认', location: '各岗位', desc: '工作人员签到，领取工作证，确认对讲群组正常' },
        { time: '12:00-12:25', title: '参赛队伍签到与候场', location: '操场主席台前', desc: '16支参赛队伍到场签到，领取队伍臂贴' },
        { time: '12:25-12:30', title: '全员候场与最终设备检查', location: '开幕区', desc: '所有参赛队伍按指定站位集合，设备最终核对' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.2',
      title: '开幕仪式',
      sortOrder: 2,
      config: JSON.stringify({ color: 'bg-yellow-500' }),
      content: JSON.stringify([
        { time: '12:30-12:45', title: '开幕讲话与活动启动', location: '操场主席台', desc: '主持人开场、代表致辞、宣读活动规则、宣布启动' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.3',
      title: '第一轮：同步轮转积分赛',
      sortOrder: 3,
      config: JSON.stringify({ color: 'bg-purple-600' }),
      content: JSON.stringify([
        { time: '12:45-13:05', title: '第一轮轮转', location: '4个游戏站', desc: '8组队伍进4个游戏站，每4组对决' },
        { time: '13:05-13:25', title: '第二轮轮转', location: '4个游戏站', desc: '所有队伍按固定轮转顺序进入下一个游戏站' },
        { time: '13:25-13:45', title: '第三轮轮转', location: '4个游戏站', desc: '完成第三轮游戏站轮转' },
        { time: '13:45-14:05', title: '第四轮轮转', location: '4个游戏站', desc: '完成最后一轮，所有队伍完成4个游戏项目' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.4',
      title: '中场休整',
      sortOrder: 4,
      config: JSON.stringify({ color: 'bg-gray-500' }),
      content: JSON.stringify([
        { time: '14:05-14:10', title: '中场休整与寻宝规则宣讲', location: '操场', desc: '参赛队伍休息，主持人宣讲第二轮寻宝赛规则' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.5',
      title: '第二轮："械"逅寻宝赛',
      sortOrder: 5,
      config: JSON.stringify({ color: 'bg-red-600' }),
      content: JSON.stringify([
        { time: '14:10-14:50', title: '校园寻宝积分环节', location: '二期校园', desc: '16支队伍同时出发，凭线索卡在指定区域寻找积分卡' },
        { time: '14:50-15:05', title: '寻宝结束与最终积分核对', location: '积分登记处', desc: '计时结束，完成所有队伍积分统计和总排名核对' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.6',
      title: '闭幕与转场',
      sortOrder: 6,
      config: JSON.stringify({ color: 'bg-orange-500' }),
      content: JSON.stringify([
        { time: '15:05-15:20', title: '第一场结束，准备第二场', location: '操场', desc: '总结问题，组织第一场队伍有序离场' },
        { time: '15:20-15:35', title: '场地复位与第二场前置准备', location: '各游戏站', desc: '道具复位、重置积分卡位置、第二场队伍签到' },
      ]),
    },
    {
      type: 'schedule-phase',
      key: 'schedule.phase.7',
      title: '第二场',
      sortOrder: 7,
      config: JSON.stringify({ color: 'bg-green-600' }),
      content: JSON.stringify([
        { time: '15:35-15:50', title: '第二场开幕与规则宣讲', location: '操场主席台', desc: '主持人开场，重申活动核心规则' },
        { time: '15:50-17:10', title: '第一轮轮转积分赛（4轮）', location: '4个游戏站', desc: '流程同第一场，完成4轮游戏站轮转' },
        { time: '17:10-17:15', title: '中场休整与寻宝规则宣讲', location: '操场', desc: '中场休息，寻宝规则重申' },
        { time: '17:15-17:55', title: '校园寻宝积分环节', location: '二期校园', desc: '第二场寻宝赛' },
        { time: '17:55-18:00', title: '第二场成绩整理与退场', location: '操场', desc: '感谢全体参赛队伍与工作人员，组织退场' },
      ]),
    },
  ]

  for (const block of schedulePhases) {
    const existing = await prisma.pageBlock.findFirst({ where: { key: block.key } })
    if (existing) {
      await prisma.pageBlock.update({ where: { id: existing.id }, data: block })
    } else {
      await prisma.pageBlock.create({ data: { pageId: schedulePage.id, ...block } })
    }
  }
  console.log(`✅ 日程安排页内容块创建（${schedulePhases.length}个）`)

  // 全局设置页
  const settingsPage = await prisma.page.upsert({
    where: { slug: 'settings' },
    update: {},
    create: {
      slug: 'settings',
      title: '全局设置',
      description: '网站全局配置',
      type: 'settings',
      status: 'published',
      publishedAt: new Date(),
      isEnabled: true,
      sortOrder: 99,
    },
  })

  const settingsBlocks = [
    { type: 'text', key: 'settings.siteName', title: '网站名称', sortOrder: 1, config: JSON.stringify({}), content: '青马工程' },
    { type: 'text', key: 'settings.siteSubtitle', title: '网站副标题', sortOrder: 2, config: JSON.stringify({}), content: '机械工程学院' },
    { type: 'text', key: 'settings.contactPhone', title: '联系电话', sortOrder: 3, config: JSON.stringify({}), content: '13800000000' },
    { type: 'text', key: 'settings.contactEmail', title: '联系邮箱', sortOrder: 4, config: JSON.stringify({}), content: 'admin@djtu.edu.cn' },
  ]

  for (const block of settingsBlocks) {
    const existing = await prisma.pageBlock.findFirst({ where: { key: block.key } })
    if (existing) {
      await prisma.pageBlock.update({ where: { id: existing.id }, data: block })
    } else {
      await prisma.pageBlock.create({ data: { pageId: settingsPage.id, ...block } })
    }
  }
  console.log(`✅ 全局设置内容块创建（${settingsBlocks.length}个）`)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
