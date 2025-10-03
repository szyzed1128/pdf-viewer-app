#!/bin/bash

# 应用部署脚本
# 用途: 从GitHub拉取代码并部署应用

set -e

# 配置变量
REPO_URL="https://github.com/szyzed1128/pdf-viewer-app.git"
APP_NAME="pdf-viewer-app"
APP_DIR="$HOME/apps/$APP_NAME"
PORT=3000

echo "========================================="
echo "开始部署应用: $APP_NAME"
echo "========================================="

# 1. 克隆或更新代码
if [ -d "$APP_DIR" ]; then
    echo ">>> 应用目录已存在,更新代码..."
    cd "$APP_DIR"
    git pull origin master
else
    echo ">>> 克隆代码仓库..."
    cd ~/apps
    git clone "$REPO_URL" "$APP_NAME"
    cd "$APP_DIR"
fi

# 2. 安装依赖
echo ">>> 安装npm依赖..."
npm install --production

# 3. 创建必要的目录
echo ">>> 创建必要的目录..."
mkdir -p public/uploads
mkdir -p public/pdfs

# 4. 复制OCR训练数据文件(如果不存在)
if [ ! -f "public/chi_sim.traineddata" ]; then
    echo ">>> 复制OCR训练数据文件..."
    cp chi_sim.traineddata public/ 2>/dev/null || echo "Warning: chi_sim.traineddata not found"
    cp eng.traineddata public/ 2>/dev/null || echo "Warning: eng.traineddata not found"
fi

# 5. 创建环境变量文件(如果不存在)
if [ ! -f ".env.local" ]; then
    echo ">>> 创建环境变量文件..."
    cat > .env.local << EOF
# 数据库配置
DATABASE_PATH=./database.sqlite

# 文件上传配置
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=52428800

# OCR配置
OCR_LANGUAGES=chi_sim+eng

# 应用配置
NEXT_PUBLIC_APP_NAME=汽车电路图文档库
PORT=$PORT
NODE_ENV=production
EOF
fi

# 6. 构建生产版本
echo ">>> 构建生产版本..."
npm run build

# 7. 停止旧的PM2进程(如果存在)
echo ">>> 停止旧进程..."
pm2 delete "$APP_NAME" 2>/dev/null || echo "No existing process to stop"

# 8. 启动应用
echo ">>> 启动应用..."
pm2 start npm --name "$APP_NAME" -- start

# 9. 保存PM2配置
pm2 save

# 10. 显示应用状态
pm2 status

echo "========================================="
echo "✅ 应用部署完成!"
echo "========================================="
echo "应用名称: $APP_NAME"
echo "访问地址: http://服务器IP:$PORT"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs $APP_NAME"
echo "  重启应用: pm2 restart $APP_NAME"
echo "  停止应用: pm2 stop $APP_NAME"
echo "  查看状态: pm2 status"
echo ""
echo "下一步: 配置nginx反向代理(可选)"
