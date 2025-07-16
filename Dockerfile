FROM node:20-alpine as build-stage

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:stable-alpine as production-stage

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 添加自定义配置
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]