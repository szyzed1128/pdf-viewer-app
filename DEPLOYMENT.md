# 汽车电路图文档库 - 部署指南

## 项目简介

这是一个基于Next.js的汽车电路图PDF文档智能搜索系统，支持：
- 4个汽车技术手册的在线浏览
- 智能全文搜索（支持中英文、同义词）
- PDF页面精确跳转
- 搜索结果高亮显示

## 部署方案选择

### 方案1: Vercel部署（推荐，免费）

**优点：**
- 完全免费（个人项目）
- 自动HTTPS
- 全球CDN加速
- 自动部署（Git推送即部署）
- 零配置

**限制：**
- 单个文件最大50MB
- 无服务器函数执行时间限制（Hobby: 10秒）
- 数据库需使用外部服务

**部署步骤：**

1. **准备代码**
   ```bash
   # 安装Vercel CLI
   npm install -g vercel

   # 登录Vercel
   vercel login
   ```

2. **配置数据库（使用Turso - 免费SQLite云数据库）**
   ```bash
   # 安装Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # 创建数据库
   turso db create automotive-docs

   # 获取数据库URL
   turso db show automotive-docs
   ```

3. **迁移本地数据到云数据库**
   ```bash
   # 导出本地数据
   sqlite3 database.sqlite .dump > database.sql

   # 导入到Turso
   turso db shell automotive-docs < database.sql
   ```

4. **部署到Vercel**
   ```bash
   # 在项目根目录执行
   vercel

   # 按提示配置项目
   # 设置环境变量：DATABASE_URL（从Turso获取）
   ```

5. **上传PDF文件**
   - 由于Vercel限制，大型PDF需要上传到对象存储（如Cloudflare R2、AWS S3）
   - 或使用Vercel Blob存储

---

### 方案2: 云服务器部署（阿里云/腾讯云）

**优点：**
- 完全控制
- 无文件大小限制
- SQLite直接运行
- 适合大型PDF

**成本：**
- 约￥300-500/年（1核2G服务器）

**部署步骤：**

1. **服务器准备**
   ```bash
   # 连接服务器
   ssh root@your-server-ip

   # 安装Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # 安装PM2（进程管理器）
   npm install -g pm2

   # 安装Nginx
   sudo apt install nginx
   ```

2. **上传项目**
   ```bash
   # 在本地打包
   npm run build

   # 压缩项目（排除node_modules）
   tar -czf project.tar.gz .next public src database.sqlite package.json package-lock.json

   # 上传到服务器
   scp project.tar.gz root@your-server-ip:/var/www/

   # 在服务器解压
   ssh root@your-server-ip
   cd /var/www
   tar -xzf project.tar.gz
   npm install --production
   ```

3. **配置PM2**
   ```bash
   # 创建ecosystem.config.js
   pm2 init
   ```

   编辑ecosystem.config.js：
   ```javascript
   module.exports = {
     apps: [{
       name: 'automotive-docs',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

   ```bash
   # 启动应用
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **配置Nginx反向代理**

   创建 `/etc/nginx/sites-available/automotive-docs`：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       client_max_body_size 200M;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

   ```bash
   # 启用站点
   sudo ln -s /etc/nginx/sites-available/automotive-docs /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **配置HTTPS（使用Let's Encrypt）**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

### 方案3: Railway部署（简单快速）

**优点：**
- 支持SQLite
- 每月$5免费额度
- 简单易用
- 自动HTTPS

**部署步骤：**

1. 访问 https://railway.app
2. 连接GitHub仓库
3. 选择项目
4. Railway自动检测Next.js并部署
5. 配置环境变量（如需要）

---

## 数据库处理方案

### 选项A: 继续使用SQLite（推荐用于云服务器）

**优点：**
- 无需额外配置
- 数据随应用部署
- 简单快速

**注意事项：**
- Vercel等Serverless平台不支持
- 需要定期备份

### 选项B: 迁移到PostgreSQL（推荐用于Vercel）

使用免费PostgreSQL服务（如Supabase、Neon）：

1. **创建迁移脚本**
   ```bash
   node scripts/migrate-to-postgres.js
   ```

2. **更新数据库连接代码**
   ```typescript
   // src/lib/database.ts
   import { Pool } from 'pg'

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   })
   ```

### 选项C: 使用Turso（SQLite云服务）

- 完全兼容SQLite
- 免费套餐：500 DBs，9GB存储
- 支持边缘部署

---

## PDF文件处理

### 问题：大型PDF文件（>50MB）

**解决方案：**

1. **使用对象存储**
   - Cloudflare R2（免费10GB）
   - AWS S3
   - 阿里云OSS
   - 腾讯云COS

2. **修改文件路径配置**
   ```typescript
   // 修改 src/lib/config.ts
   export const PDF_BASE_URL = process.env.NEXT_PUBLIC_PDF_URL || '/pdfs'
   ```

3. **上传PDF到对象存储**
   ```bash
   # 示例：上传到阿里云OSS
   ossutil cp -r public/pdfs/ oss://your-bucket/pdfs/
   ```

---

## 部署前检查清单

- [ ] 运行生产构建测试：`npm run build`
- [ ] 检查所有PDF文件可访问
- [ ] 测试数据库连接
- [ ] 配置环境变量
- [ ] 测试搜索功能
- [ ] 准备域名（可选）
- [ ] 配置HTTPS证书

---

## 推荐配置（基于你的需求）

**如果PDF总大小 < 200MB：**
→ 使用 **Railway** 或 **云服务器**（阿里云轻量应用服务器）

**如果需要完全免费：**
→ 使用 **Vercel + Turso + Cloudflare R2**

**如果需要最佳性能和稳定性：**
→ 使用 **阿里云/腾讯云 ECS + Nginx + PM2**

---

## 部署后访问

部署完成后，用户可通过以下方式访问：

- **Vercel**: `https://your-project.vercel.app`
- **Railway**: `https://your-project.railway.app`
- **自定义域名**: `https://your-domain.com`

---

## 维护建议

1. **定期备份数据库**
   ```bash
   # 每周备份
   0 0 * * 0 sqlite3 database.sqlite .dump > backup-$(date +\%Y\%m\%d).sql
   ```

2. **监控应用状态**
   - 使用PM2监控（云服务器）
   - Vercel自动监控
   - 配置日志收集

3. **更新同义词库**
   ```bash
   node scripts/add-more-synonyms.js
   ```

---

## 需要帮助？

如有部署问题，请检查：
1. Node.js版本 >= 18
2. 数据库文件权限
3. 端口占用情况
4. 防火墙配置
5. Nginx配置语法

---

**预计部署时间：**
- Vercel/Railway: 10-20分钟
- 云服务器: 30-60分钟

**预计月度成本：**
- Vercel免费方案: ￥0
- Railway: $5起
- 阿里云轻量服务器: ￥25-40/月
