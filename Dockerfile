FROM node:20 AS builder

# 设置npm镜像源为淘宝镜像
RUN npm config set registry https://registry.npmmirror.com
# RUN npm config set disturl https://npmmirror.com/dist

WORKDIR /app
COPY . .

# 使用corepack但配置镜像源
RUN corepack enable
RUN corepack prepare pnpm@latest --activate --registry=https://registry.npmmirror.com
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm install
RUN pnpm run build

# 用 nginx 服务静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/lottery
