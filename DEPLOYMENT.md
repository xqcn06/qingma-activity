# 青马工程活动系统 - 阿里云服务器部署指南

本文档详细记录了如何将本项目部署到阿里云轻量应用服务器（Ubuntu 22.04）上，并内置 PostgreSQL 数据库，彻底解除第三方数据库的并发限制。

---

## 📋 前置准备

1.  **服务器**：阿里云轻量应用服务器（推荐 2 核 2G 以上，Ubuntu 22.04 系统）。
2.  **域名/IP**：服务器的公网 IP 地址。
3.  **本地工具**：终端（PowerShell/CMD）或阿里云控制台的“远程连接”功能。

---

## 🚀 部署步骤

### 第一步：连接服务器

通过 SSH 连接到你的服务器：

```bash
ssh root@你的服务器公网 IP
# 输入密码（输入时屏幕不显示，输完回车即可）
```

### 第二步：安装 Docker

在服务器终端中依次运行以下命令：

```bash
# 1. 一键安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 启动 Docker
systemctl start docker

# 3. 设置开机自启
systemctl enable docker
```

### 第三步：增加虚拟内存 (Swap) —— ⚠️ 关键防崩步骤

Next.js 构建过程较吃内存，增加 3GB 虚拟内存可防止 200 人并发时服务器崩溃。

```bash
fallocate -l 3G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### 第四步：下载项目代码

```bash
# 1. 克隆代码
git clone https://github.com/xqcn06/qingma-activity.git

# 2. 进入项目目录
cd qingma-activity
```

### 第五步：配置环境变量

创建 `.env` 文件：

```bash
nano .env
```

**粘贴以下内容**（注意替换 `你的公网 IP`）：

```text
# 指向本地容器数据库
DATABASE_URL="postgresql://postgres:mysecretpassword@db:5432/qingma_db"

# NextAuth 密钥
NEXTAUTH_SECRET="25187bbc82db1302d78248870e17da623fa8d41b5f882dc923815ef01b7a0772"

# 你的服务器地址
NEXTAUTH_URL="http://47.104.216.25 IP:3000"
NEXT_PUBLIC_APP_URL="http://47.104.216.25 IP:3000"
```

> **保存退出方法**：按 `Ctrl+O` -> `Enter` -> `Ctrl+X`

### 第六步：创建 Docker 配置文件

创建 `docker-compose.yml` 文件：

```bash
nano docker-compose.yml
```

**粘贴以下内容**：

```yaml
version: '3.8'
services:
  # 数据库服务
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: qingma_db
    volumes:
      - pgdata:/var/lib/postgresql/data # 数据持久化

  # 网站服务
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

> **保存退出方法**：按 `Ctrl+O` -> `Enter` -> `Ctrl+X`

### 第七步：一键启动服务

```bash
docker compose up -d --build
```

*此过程需 3-5 分钟，请耐心等待直到提示符返回。*

### 第八步：初始化数据库（建表）

服务启动后，数据库表尚未创建。运行以下命令自动建表：

```bash
docker compose exec web npx prisma db push
```

看到 `Your database is now in sync with your schema.` 即成功。

### 第九步：放行阿里云防火墙

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)。
2. 进入 **轻量应用服务器** -> 点击你的实例 -> **防火墙**。
3. 点击 **添加规则**：
   - **端口**：`3000`
   - **协议**：`TCP`
   - **授权对象**：`0.0.0.0/0`
4. 保存。

---

## ✅ 验证访问

打开浏览器访问：`http://你的公网 IP:3000`

如果能正常打开首页并登录，说明部署成功！

---

## 🔄 后续如何更新代码？

当你在本地修改代码并 `git push` 到 GitHub 后，只需在服务器运行以下 2 条命令即可更新：

```bash
cd qingma-activity
git pull && docker compose up -d --build
```

*系统会自动拉取最新代码、重新构建并重启，数据库数据不会丢失。*

---

## 🆘 常见问题

**Q: 访问网站显示“无法连接”？**
A: 检查阿里云防火墙是否已放行 3000 端口；检查服务器是否开启了防火墙（`ufw`）。

**Q: 构建时提示 `Out of memory`？**
A: 说明内存不足，请确保已执行“第三步：增加虚拟内存”。

**Q: 数据库连接报错？**
A: 检查 `.env` 中的 `DATABASE_URL` 是否正确，确保格式为 `postgresql://postgres:mysecretpassword@db:5432/qingma_db`。
