# 青马工程活动系统 - 服务器部署指南（2026-04-08 更新版）

## 服务器信息
- **公网IP**: 47.104.216.25
- **系统**: Ubuntu 22.04
- **配置**: 2核 2G内存 40G硬盘
- **Docker**: 29.3.1
- **部署方式**: Docker Compose（web + PostgreSQL 15）
- **访问地址**: http://47.104.216.25:3000

## 当前问题与已修复
- Dockerfile 中需要 COPY prisma 目录（已修复）
- next.config.ts 需要 `output: "standalone"`（已修复）
- docker-compose.yml 中的 `version: '3.8'` 警告可忽略
- 容器内 prisma 版本与项目不一致时，用 `--schema` 指定路径

## 关键文件

### 1. Dockerfile（最终版）
```dockerfile
FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. docker-compose.yml
```yaml
services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: qingma_db
    volumes:
      - pgdata:/var/lib/postgresql/data

  web:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db
    restart: always

volumes:
  pgdata:
```

### 3. next.config.ts（关键：必须有 output: "standalone"）
```typescript
const nextConfig: NextConfig = {
  output: "standalone",  // ← 必须有这行，否则 Docker 构建失败
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  turbopack: {},
};
```

### 4. .env（服务器端）
```
DATABASE_URL="postgresql://postgres:mysecretpassword@db:5432/qingma_db"
NEXTAUTH_SECRET="25187bbc82db1302d78248870e17da623fa8d41b5f882dc923815ef01b7a0772"
NEXTAUTH_URL="http://47.104.216.25:3000"
NEXT_PUBLIC_APP_NAME="青马工程学生干部素质拓展活动"
NEXT_PUBLIC_APP_URL="http://47.104.216.25:3000"
ACTIVITY_DATE="2026-05-15"
FIRST_SESSION_START="12:30"
FIRST_SESSION_END="15:20"
SECOND_SESSION_START="15:35"
SECOND_SESSION_END="18:00"
```

## 数据库迁移步骤

### 本地导出（Windows PowerShell）
```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h 127.0.0.1 -p 5432 qingma_activity > C:\Users\qian\qingma_backup.sql
```

### 上传到服务器
```powershell
scp C:\Users\qian\qingma_backup.sql root@47.104.216.25:/root/
```

### 服务器导入
```bash
# 启动数据库容器
docker compose up -d db
sleep 5

# 导入数据
docker compose exec -T db psql -U postgres -d qingma_db < /root/qingma_backup.sql

# 更新表结构
docker compose exec web npx prisma db push --schema=/app/prisma/schema.prisma
```

## 部署步骤（从零开始）

```bash
# 1. 进入项目目录
cd /root/qingma-activity

# 2. 停止旧服务
docker compose down

# 3. 拉取最新代码
git stash
git pull origin main

# 4. 确保 next.config.ts 有 output: "standalone"
grep standalone next.config.ts || sed -i 's/const nextConfig: NextConfig = {/const nextConfig: NextConfig = {\n  output: "standalone",/' next.config.ts

# 5. 写入 .env
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres:mysecretpassword@db:5432/qingma_db"
NEXTAUTH_SECRET="25187bbc82db1302d78248870e17da623fa8d41b5f882dc923815ef01b7a0772"
NEXTAUTH_URL="http://47.104.216.25:3000"
NEXT_PUBLIC_APP_NAME="青马工程学生干部素质拓展活动"
NEXT_PUBLIC_APP_URL="http://47.104.216.25:3000"
ACTIVITY_DATE="2026-05-15"
FIRST_SESSION_START="12:30"
FIRST_SESSION_END="15:20"
SECOND_SESSION_START="15:35"
SECOND_SESSION_END="18:00"
ENVEOF

# 6. 构建启动
docker compose up -d --build

# 7. 更新数据库
docker compose exec web npx prisma db push --schema=/app/prisma/schema.prisma
```

## 日常更新代码
```bash
cd /root/qingma-activity
git pull origin main
docker compose up -d --build
docker compose exec web npx prisma db push --schema=/app/prisma/schema.prisma
```

## 常用命令
```bash
docker compose ps                          # 查看容器状态
docker compose logs web --tail=50          # 查看 web 日志
docker compose logs db --tail=50           # 查看数据库日志
docker compose restart web                 # 重启 web
docker compose down && docker compose up -d --build  # 完全重建
docker volume ls                           # 查看数据卷
```

## 默认账号（seed 创建）
| 账号 | 学号 | 密码 | 角色 |
|------|------|------|------|
| 超级管理员 | admin | 123456 | ADMIN（全部14权限）|
| 普通管理员 | admin2 | 123456 | ADMIN（13权限，缺MANAGE_ADMINS）|
| 老师 | teacher | 123456 | TEACHER（代码级别全权限）|

首次登录会要求修改密码（8位+大小写字母+数字）。

## 注意事项
1. `next.config.ts` 必须有 `output: "standalone"`，否则 Docker 构建报错
2. Dockerfile 必须 COPY prisma 目录，否则 prisma push 找不到 schema
3. 数据库密码在 docker-compose.yml 和 .env 中要一致
4. NEXTAUTH_URL 必须是实际访问地址（含端口）
5. 防火墙需放行 3000 端口
