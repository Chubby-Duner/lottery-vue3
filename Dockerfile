FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install
RUN pnpm run build

# 用 nginx 服务静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/lottery
