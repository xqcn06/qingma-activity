FROM node:20-alpine AS base

# 安装 Prisma 所需的 openssl 和 libssl3（Alpine 包名不同）
RUN apk add --no-cache openssl

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Prisma Generate ---
FROM base AS prisma-generator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN npx prisma generate

# --- Builder ---
FROM base AS builder
WORKDIR /app

# 设置内存限制以避免 OOM (2G 内存服务器)
ENV NODE_OPTIONS="--max-old-space-size=1536"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma-generator /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN npx next build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
