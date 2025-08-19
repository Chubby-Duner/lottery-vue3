FROM node:20 AS builder

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN npm config set registry https://registry.npmmirror.com

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# 用 nginx 服务静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/lottery
