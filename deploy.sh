#!/bin/bash


# 自动获取脚本所在目录作为项目目录
PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)

echo "项目目录: $PROJECT_DIR"
# 进入项目目录
cd "$PROJECT_DIR"

echo "拉取最新代码..."

# 拉取最新代码
git pull origin main

# 安装依赖（如果你用 pnpm）
echo "安装依赖..."
pnpm install

# 重新构建项目
echo "构建项目..."
pnpm build

# 启动或重启 Docker 服务
echo "启动 Docker 容器，开始部署..."
docker-compose up --build -d

# 或者用docker命令启动镜像
# docker build -t your-app .
# docker run -d -p 80:80 your-app

echo "部署完成！"