#!/bin/bash

# 腾讯云服务器环境配置脚本 (CentOS/OpenCloudOS版本)
# 用途: 在CentOS/OpenCloudOS服务器上安装所需依赖

set -e

# 检测是否为root用户,决定是否使用sudo
SUDO=""
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
fi

echo "========================================="
echo "开始配置服务器环境 (CentOS/OpenCloudOS)..."
echo "========================================="

# 1. 更新系统
echo ">>> 更新系统包..."
$SUDO yum update -y

# 2. 安装基础工具
echo ">>> 安装基础工具..."
$SUDO yum install -y curl wget git gcc-c++ make

# 3. 安装Node.js 18.x
echo ">>> 检查Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js已安装: $NODE_VERSION"
    npm --version
else
    echo ">>> 安装Node.js 18..."
    # 方法1: 使用nodesource仓库
    curl -fsSL https://rpm.nodesource.com/setup_18.x | $SUDO bash - 2>/dev/null || {
        # 方法2: 如果失败,使用dnf module (OpenCloudOS/RHEL 9)
        echo "尝试使用dnf module安装..."
        $SUDO dnf module reset nodejs -y 2>/dev/null || true
        $SUDO dnf module enable nodejs:18 -y 2>/dev/null || {
            # 方法3: 使用EPEL仓库
            echo "尝试从EPEL安装..."
            $SUDO dnf install -y epel-release
            $SUDO dnf install -y nodejs npm
        }
    }

    # 如果还没有nodejs,尝试直接安装
    if ! command -v node &> /dev/null; then
        $SUDO yum install -y nodejs || $SUDO dnf install -y nodejs
    fi

    # 验证安装
    node --version
    npm --version
fi

# 4. 安装PM2 (进程管理器)
echo ">>> 检查PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "✓ PM2已安装: $PM2_VERSION"
else
    echo ">>> 安装PM2..."
    $SUDO npm install -g pm2
    # 配置PM2开机自启
    $SUDO pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
fi

# 5. 安装nginx (Web服务器)
echo ">>> 检查nginx..."
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    echo "✓ nginx已安装: $NGINX_VERSION"
else
    echo ">>> 安装nginx..."
    $SUDO yum install -y nginx
    # 启动nginx
    $SUDO systemctl start nginx
    $SUDO systemctl enable nginx
fi

# 6. 安装poppler-utils (PDF处理依赖)
echo ">>> 检查poppler-utils..."
if command -v pdftoppm &> /dev/null; then
    echo "✓ poppler-utils已安装"
else
    echo ">>> 安装poppler-utils..."
    $SUDO yum install -y poppler-utils
fi

# 7. 安装SQLite3
echo ">>> 检查SQLite3..."
if command -v sqlite3 &> /dev/null; then
    SQLITE_VERSION=$(sqlite3 --version | awk '{print $1}')
    echo "✓ SQLite3已安装: $SQLITE_VERSION"
else
    echo ">>> 安装SQLite3..."
    $SUDO yum install -y sqlite
fi

# 8. 配置防火墙
echo ">>> 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    echo "使用firewalld配置防火墙..."
    $SUDO firewall-cmd --permanent --add-service=http
    $SUDO firewall-cmd --permanent --add-service=https
    $SUDO firewall-cmd --permanent --add-port=3000/tcp
    $SUDO firewall-cmd --reload
elif command -v ufw &> /dev/null; then
    echo "使用ufw配置防火墙..."
    $SUDO ufw allow 22/tcp
    $SUDO ufw allow 80/tcp
    $SUDO ufw allow 443/tcp
    $SUDO ufw allow 3000/tcp
else
    echo "⚠ 未检测到防火墙工具(firewalld/ufw),请手动开放端口: 80, 443, 3000"
    echo "   或在腾讯云控制台的安全组中配置"
fi

# 9. 创建应用目录
echo ">>> 创建应用目录..."
mkdir -p ~/apps
cd ~/apps

# 10. 关闭SELinux (可选,避免权限问题)
echo ">>> 配置SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null || echo "Disabled")
    if [ "$SELINUX_STATUS" != "Disabled" ]; then
        echo "关闭SELinux..."
        $SUDO setenforce 0 2>/dev/null || true
        $SUDO sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config 2>/dev/null || true
    else
        echo "✓ SELinux已禁用"
    fi
else
    echo "✓ 系统未启用SELinux"
fi

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
