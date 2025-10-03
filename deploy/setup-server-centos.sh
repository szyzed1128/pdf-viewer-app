#!/bin/bash

# 腾讯云服务器环境配置脚本 (CentOS/OpenCloudOS版本)
# 用途: 在CentOS/OpenCloudOS服务器上安装所需依赖

set -e

echo "========================================="
echo "开始配置服务器环境 (CentOS/OpenCloudOS)..."
echo "========================================="

# 1. 更新系统
echo ">>> 更新系统包..."
sudo yum update -y

# 2. 安装基础工具
echo ">>> 安装基础工具..."
sudo yum install -y curl wget git gcc-c++ make

# 3. 安装Node.js 18.x
echo ">>> 安装Node.js 18..."
# 方法1: 使用nodesource仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - 2>/dev/null || {
    # 方法2: 如果失败,使用dnf module (OpenCloudOS/RHEL 9)
    echo "尝试使用dnf module安装..."
    sudo dnf module reset nodejs -y 2>/dev/null || true
    sudo dnf module enable nodejs:18 -y 2>/dev/null || {
        # 方法3: 使用EPEL仓库
        echo "尝试从EPEL安装..."
        sudo dnf install -y epel-release
        sudo dnf install -y nodejs npm
    }
}

# 如果还没有nodejs,尝试直接安装
if ! command -v node &> /dev/null; then
    sudo yum install -y nodejs || sudo dnf install -y nodejs
fi

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
sudo yum install -y nginx

# 启动nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. 安装poppler-utils (PDF处理依赖)
echo ">>> 安装poppler-utils..."
sudo yum install -y poppler-utils

# 7. 安装SQLite3
echo ">>> 安装SQLite3..."
sudo yum install -y sqlite

# 8. 配置防火墙
echo ">>> 配置防火墙..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 9. 创建应用目录
echo ">>> 创建应用目录..."
mkdir -p ~/apps
cd ~/apps

# 10. 关闭SELinux (可选,避免权限问题)
echo ">>> 配置SELinux..."
sudo setenforce 0
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

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
