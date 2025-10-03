#!/bin/bash

# 腾讯云服务器环境配置脚本
# 用途: 在全新的Ubuntu/Debian服务器上安装所需依赖

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始配置服务器环境..."
echo "========================================="

# 1. 更新系统
echo ">>> 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 2. 安装基础工具
echo ">>> 安装基础工具..."
sudo apt install -y curl wget git build-essential

# 3. 安装Node.js 18.x
echo ">>> 安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 4. 安装PM2 (进程管理器)
echo ">>> 安装PM2..."
sudo npm install -g pm2

# 配置PM2开机自启
sudo pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))

# 5. 安装nginx (Web服务器)
echo ">>> 安装nginx..."
sudo apt install -y nginx

# 6. 安装poppler-utils (PDF处理依赖)
echo ">>> 安装poppler-utils..."
sudo apt install -y poppler-utils

# 7. 安装SQLite3
echo ">>> 安装SQLite3..."
sudo apt install -y sqlite3

# 8. 配置防火墙
echo ">>> 配置防火墙..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Next.js (可选,调试用)
# 注意: 不要立即启用UFW,避免SSH断开
# sudo ufw enable

# 9. 创建应用目录
echo ">>> 创建应用目录..."
mkdir -p ~/apps
cd ~/apps

echo "========================================="
echo "✅ 服务器环境配置完成!"
echo "========================================="
echo "已安装:"
echo "  - Node.js $(node --version)"
echo "  - npm $(npm --version)"
echo "  - PM2 $(pm2 --version)"
echo "  - nginx $(nginx -v 2>&1)"
echo ""
echo "下一步: 运行 deploy-app.sh 部署应用"
