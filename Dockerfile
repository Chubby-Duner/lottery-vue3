# 构建阶段
FROM node:20-alpine as build-stage

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 生产阶段
FROM nginx:stable-alpine as production-stage

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 添加自定义配置
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝打包后的静态资源
COPY --from=build-stage /app/dist /usr/share/nginx/html/lottery

# 拷贝 SSL 文件
COPY ssl /etc/nginx/ssl

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
