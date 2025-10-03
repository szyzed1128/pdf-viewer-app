# 腾讯云服务器部署指南

完整的服务器部署步骤,从购买服务器到应用上线。

## 前置准备

### 1. 购买腾讯云轻量应用服务器

1. 访问 https://console.cloud.tencent.com/lighthouse
2. 选择配置:
   - **地域**: 选择离用户近的(如北京/上海/广州)
   - **镜像**: Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS
   - **套餐**: 最低2核2G内存(推荐2核4G)
   - **流量**: 500GB/月起步
3. 购买并等待实例创建完成

### 2. 连接服务器

**方法1: 网页终端**
- 在腾讯云控制台点击"登录"按钮

**方法2: SSH (Windows)**
```bash
ssh lighthouse@服务器IP
```

首次登录需要设置密码或使用密钥。

---

## 快速部署 (3步完成)

### 步骤1: 下载部署脚本

连接到服务器后,执行:

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/szyzed1128/pdf-viewer-app/master/deploy/setup-server.sh
wget https://raw.githubusercontent.com/szyzed1128/pdf-viewer-app/master/deploy/deploy-app.sh

# 添加执行权限
chmod +x setup-server.sh deploy-app.sh
```

### 步骤2: 配置服务器环境

```bash
./setup-server.sh
```

这个脚本会自动安装:
- Node.js 18
- PM2 (进程管理器)
- nginx (Web服务器)
- poppler-utils (PDF处理)
- SQLite3

大约需要5-10分钟。

### 步骤3: 部署应用

```bash
./deploy-app.sh
```

这个脚本会:
1. 从GitHub克隆代码
2. 安装依赖
3. 构建生产版本
4. 启动应用

完成后,访问 `http://服务器IP:3000` 即可看到网站!

---

## 配置域名和HTTPS (可选)

### 1. 配置nginx反向代理

```bash
# 复制nginx配置
cd ~/apps/pdf-viewer-app
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pdf-viewer-app

# 编辑配置文件,修改域名
sudo nano /etc/nginx/sites-available/pdf-viewer-app
# 修改: server_name your-domain.com; 为你的域名

# 创建软链接
sudo ln -s /etc/nginx/sites-available/pdf-viewer-app /etc/nginx/sites-enabled/

# 删除默认配置(可选)
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
```

### 2. 域名解析

在域名服务商(阿里云/腾讯云)添加DNS记录:
- 类型: A记录
- 主机记录: @ 或 www
- 记录值: 服务器IP地址
- TTL: 600

### 3. 配置HTTPS (推荐)

```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

完成后访问 `https://your-domain.com` 即可!

---

## 常用运维命令

### PM2进程管理

```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs pdf-viewer-app

# 重启应用
pm2 restart pdf-viewer-app

# 停止应用
pm2 stop pdf-viewer-app

# 删除应用
pm2 delete pdf-viewer-app

# 查看资源使用
pm2 monit
```

### 更新应用

```bash
cd ~/apps/pdf-viewer-app
git pull origin master
npm install --production
npm run build
pm2 restart pdf-viewer-app
```

### nginx管理

```bash
# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx

# 查看nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/pdf-viewer-app-error.log
```

### 系统监控

```bash
# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看CPU和内存
top

# 查看端口占用
sudo netstat -tlnp
```

---

## 数据备份

### 备份数据库和上传文件

```bash
cd ~/apps/pdf-viewer-app

# 创建备份目录
mkdir -p ~/backups

# 备份数据库
cp database.sqlite ~/backups/database-$(date +%Y%m%d).sqlite

# 备份上传的文件
tar -czf ~/backups/uploads-$(date +%Y%m%d).tar.gz public/uploads/

# 查看备份
ls -lh ~/backups/
```

### 自动定时备份 (可选)

```bash
# 创建备份脚本
cat > ~/backup.sh << 'EOF'
#!/bin/bash
cd ~/apps/pdf-viewer-app
mkdir -p ~/backups
cp database.sqlite ~/backups/database-$(date +%Y%m%d).sqlite
tar -czf ~/backups/uploads-$(date +%Y%m%d).tar.gz public/uploads/
# 删除30天前的备份
find ~/backups/ -name "*.sqlite" -mtime +30 -delete
find ~/backups/ -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x ~/backup.sh

# 添加定时任务 (每天凌晨2点执行)
crontab -e
# 添加: 0 2 * * * /home/lighthouse/backup.sh
```

---

## 故障排查

### 应用无法启动

1. 查看PM2日志:
   ```bash
   pm2 logs pdf-viewer-app --lines 100
   ```

2. 检查端口是否被占用:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

3. 手动运行看错误:
   ```bash
   cd ~/apps/pdf-viewer-app
   npm run build
   npm start
   ```

### 网站无法访问

1. 检查防火墙:
   ```bash
   sudo ufw status
   ```

2. 检查nginx状态:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. 检查nginx日志:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### 上传文件失败

1. 检查目录权限:
   ```bash
   ls -la ~/apps/pdf-viewer-app/public/uploads
   chmod 755 ~/apps/pdf-viewer-app/public/uploads
   ```

2. 检查磁盘空间:
   ```bash
   df -h
   ```

### OCR处理失败

1. 确认poppler已安装:
   ```bash
   pdftoppm -v
   ```

2. 检查OCR训练数据:
   ```bash
   ls -lh ~/apps/pdf-viewer-app/public/*.traineddata
   ```

---

## 性能优化

### 1. 启用gzip压缩

编辑nginx配置:
```bash
sudo nano /etc/nginx/nginx.conf
```

确保有以下配置:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. 增加PM2实例 (如果CPU多核)

```bash
pm2 delete pdf-viewer-app
pm2 start ecosystem.config.js
pm2 scale pdf-viewer-app 2  # 启动2个实例
```

### 3. 配置CDN (可选)

使用腾讯云CDN加速静态资源访问。

---

## 安全建议

1. **定期更新系统**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **修改SSH端口** (可选):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 修改 Port 22 为其他端口
   sudo systemctl restart sshd
   ```

4. **禁用root登录**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 设置 PermitRootLogin no
   sudo systemctl restart sshd
   ```

---

## 成本估算

- **轻量服务器** (2核4G): ￥50-80/月
- **域名**: ￥50-100/年
- **备案**: 免费(15-20天)
- **SSL证书**: 免费(Let's Encrypt)

**总计**: 约 ￥60-90/月

---

## 技术支持

如有问题,请提交Issue: https://github.com/szyzed1128/pdf-viewer-app/issues
