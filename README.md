# 汽车电路图文档库

一个基于Next.js的智能汽车技术文档检索系统，支持PDF在线浏览、全文搜索、同义词匹配等功能。

## 项目统计

- **PDF文档数量**: 4个
- **总页数**: 318页
- **PDF总大小**: 249.64 MB
- **同义词数量**: 46个术语
- **推荐部署方案**: 云服务器（阿里云/腾讯云）
- **预计月度成本**: ￥25-40/月

## 功能特性

### 核心功能
- **PDF文件展示**：支持PDF文件的在线预览、缩放、旋转、翻页等基础功能
- **文档管理**：文件上传、列表展示、详情查看
- **关键词搜索**：在PDF文档中搜索指定关键词
- **智能定位**：根据相关度对搜索结果进行排序，支持跳转到最相关的位置
- **搜索结果导航**：提供"上一处"/"下一处"按钮，按相关度依次跳转

### 相关度排序规则
- 元件标题 > 元件描述/表格 > 普通文本
- 完全匹配 > 部分匹配 > 包含关键词

### 可选功能
- **同义词搜索**：支持术语的同义词搜索，例如：
  - 油门踏板 = 踏板位置传感器 = Accelerator Pedal Sensor = APS
  - 挂车控制模块 = Trailer Control Module = TCM = 拖车控制器
- **上下文显示**：搜索结果显示相关上下文内容

## 技术栈

### 前端技术
- **框架**：Next.js 14 (App Router)
- **UI库**：React 18 + TypeScript
- **样式方案**：Tailwind CSS + class-variance-authority
- **PDF渲染**：react-pdf + pdfjs-dist
- **图标库**：Lucide React

### 后端技术
- **运行环境**：Node.js 18+
- **API框架**：Next.js API Routes
- **数据库**：SQLite (better-sqlite3)
- **文件上传**：Multer
- **OCR处理**：Tesseract.js (支持中英文识别)

### PDF处理工具链
- **文本提取**：pdf-parse
- **图像转换**：pdf2pic + pdf-poppler
- **PDF操作**：pdf-lib
- **OCR引擎**：Tesseract.js (chi_sim + eng 训练数据)

## 项目架构

### 系统架构
```
┌─────────────┐
│  用户浏览器  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│      Next.js 应用服务器         │
│  ┌───────────────────────────┐  │
│  │  前端页面 (React)          │  │
│  │  - 文档列表               │  │
│  │  - PDF查看器              │  │
│  │  - 搜索界面               │  │
│  │  - 上传界面               │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  API Routes               │  │
│  │  - /api/documents         │  │
│  │  - /api/upload            │  │
│  │  - /api/search            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  业务逻辑层                │  │
│  │  - 文档管理               │  │
│  │  - 搜索引擎               │  │
│  │  - OCR处理                │  │
│  │  - 同义词匹配             │  │
│  └───────────────────────────┘  │
└───────────┬─────────────────────┘
            │
    ┌───────┴────────┐
    ↓                ↓
┌──────────┐   ┌────────────┐
│  SQLite  │   │  文件系统   │
│  数据库   │   │  (uploads) │
└──────────┘   └────────────┘
```

### 核心模块说明

#### 1. 文档管理模块
- **功能**：PDF上传、存储、元数据管理
- **位置**：`src/lib/database.ts`, `src/app/api/upload/`
- **技术**：Multer文件上传 + SQLite存储

#### 2. PDF处理模块
- **功能**：文本提取、图像转换、OCR识别
- **位置**：`src/app/api/upload/route.ts`
- **流程**：
  1. 使用pdf-parse提取文本内容
  2. 使用pdf2pic转换为图像
  3. 使用Tesseract.js进行OCR识别
  4. 合并结果存入数据库

#### 3. 智能搜索引擎
- **功能**：关键词搜索、同义词匹配、相关度排序
- **位置**：`src/utils/search.ts`, `src/app/api/search/`
- **算法**：
  - 文本类型识别（标题/描述/表格/普通文本）
  - 相关度评分（类型权重 + 匹配程度）
  - 同义词扩展搜索

#### 4. PDF查看器
- **功能**：在线预览、缩放、旋转、翻页、搜索高亮
- **位置**：`src/components/PDFViewer.tsx`
- **技术**：react-pdf + Canvas渲染

## 技术决策

### 1. 为什么选择 Next.js?
- **SSR支持**：提升首屏加载速度和SEO
- **API Routes**：前后端一体化，简化部署
- **App Router**：更好的路由性能和开发体验
- **生态完善**：丰富的插件和社区支持

### 2. 为什么使用 SQLite?
- **零配置**：无需独立数据库服务器
- **轻量高效**：适合中小规模文档库（<10000文档）
- **易于部署**：单文件数据库，方便备份和迁移
- **性能足够**：读取速度快，满足搜索需求
- **未来可扩展**：可平滑迁移到PostgreSQL/MySQL

### 3. 为什么集成 OCR?
- **兼容性**：支持扫描版PDF和图片格式文档
- **完整性**：确保所有文档都可被搜索
- **智能回退**：先尝试文本提取，失败则使用OCR
- **多语言**：支持中英文混合文档

### 4. 同义词系统设计
- **领域专用**：针对汽车技术文档优化
- **灵活扩展**：支持动态添加新术语
- **双语支持**：中英文术语映射
- **缩写匹配**：自动识别常用缩写（如ABS、ECU）

### 5. 搜索相关度算法
- **多维度评分**：
  - 文本类型权重（标题>描述>表格>正文）
  - 匹配程度（完全匹配>部分匹配>包含）
  - 位置因素（考虑上下文）
- **用户体验优先**：最相关结果优先展示
- **性能平衡**：避免复杂算法影响响应速度

### 6. 部署架构选择
- **推荐云服务器**：
  - SQLite需要持久化存储
  - 文件上传需要稳定文件系统
  - OCR处理需要计算资源
- **不推荐Serverless**：
  - 冷启动影响OCR处理
  - 文件系统限制
  - 成本可能更高

## 安装和运行

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目并进入目录：
```bash
git clone <repository-url>
cd pdf-viewer-app
```

2. 安装依赖：
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器：
```bash
npm run dev
# 或
yarn dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   ├── search/            # 搜索页面
│   │   ├── upload/            # 上传页面
│   │   ├── viewer/            # PDF 查看器页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   └── PDFViewer.tsx      # PDF 查看器组件
│   ├── lib/                   # 库文件
│   │   └── database.ts        # 数据库操作
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/                 # 工具函数
│       └── search.ts          # 搜索引擎
├── public/
│   └── uploads/               # 上传文件存储目录
├── database.sqlite            # SQLite 数据库文件
└── ...配置文件
```

## API 接口

### 文档管理
- `GET /api/documents` - 获取文档列表
- `GET /api/documents/[id]` - 获取单个文档信息
- `POST /api/upload` - 上传PDF文件

### 搜索功能
- `POST /api/search` - 在文档中搜索关键词

## 使用说明

### 上传PDF文件
1. 点击"上传文档"按钮
2. 选择或拖拽PDF文件到上传区域
3. 系统会自动解析PDF内容并提取文本

### 查看PDF文档
1. 在首页点击文档的"查看"按钮
2. 使用工具栏进行缩放、旋转、翻页等操作
3. 可以直接下载PDF文件

### 搜索功能
1. 在首页点击文档的"搜索"按钮，或在查看器中点击"搜索文档"
2. 输入关键词（支持中英文）
3. 可选择是否开启同义词搜索
4. 搜索结果按相关度排序，点击结果可跳转到对应位置
5. 使用"上一处"/"下一处"按钮在结果间导航

### 搜索提示
- 支持中英文混合搜索
- 开启同义词可搜索相关术语
- 结果按相关度排序：标题 > 描述 > 表格 > 文本
- 搜索结果会在PDF中高亮显示

## 部署选项

### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量（如需要）
3. 自动部署

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 云服务器部署 (推荐)

**完整部署指南**: 查看 [`deploy/README.md`](deploy/README.md)

**快速部署 (3步完成)**:

```bash
# 1. 下载部署脚本
wget https://raw.githubusercontent.com/szyzed1128/pdf-viewer-app/master/deploy/setup-server-centos.sh
wget https://raw.githubusercontent.com/szyzed1128/pdf-viewer-app/master/deploy/deploy-app.sh
chmod +x setup-server-centos.sh deploy-app.sh

# 2. 配置服务器环境 (CentOS/OpenCloudOS)
./setup-server-centos.sh

# 如果是Ubuntu/Debian系统,使用:
# wget https://raw.githubusercontent.com/szyzed1128/pdf-viewer-app/master/deploy/setup-server.sh
# chmod +x setup-server.sh && ./setup-server.sh

# 3. 部署应用
./deploy-app.sh
```

访问 `http://服务器IP:3000` 即可使用!

## 环境配置

### 环境变量设置（可选）

创建 `.env.local` 文件：

```bash
# 数据库配置
DATABASE_PATH=./database.sqlite

# 文件上传配置
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=52428800  # 50MB

# OCR配置
OCR_LANGUAGES=chi_sim+eng
OCR_WORKER_THREADS=4

# 应用配置
NEXT_PUBLIC_APP_NAME=汽车电路图文档库
PORT=3000
```

### 系统依赖

**Windows:**
```bash
# 安装 Poppler (PDF转图像依赖)
# 下载: https://github.com/oschwartz10612/poppler-windows/releases/
# 解压后添加 bin 目录到系统 PATH
```

**macOS:**
```bash
brew install poppler
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install poppler-utils
```

## 注意事项

### 文件限制
- PDF文件大小建议不超过50MB
- 单次最多上传10个文件
- 支持格式：.pdf

### 数据持久化
- 系统会自动创建 SQLite 数据库和上传目录
- 上传的文件存储在 `public/uploads` 目录
- 数据库文件：`database.sqlite`
- 定期备份数据库和上传文件

### 性能建议
- 首次上传PDF会进行OCR处理，较慢属正常现象
- 大文件（>20MB）建议分批上传
- 生产环境建议配置nginx缓存静态资源
- 可考虑使用CDN加速PDF文件访问

### 安全考虑
- 生产环境应配置文件类型验证
- 建议启用HTTPS
- 定期清理临时文件
- 限制上传文件大小和频率

## 常见问题

### Q1: 上传PDF后无法搜索到内容？
**A:** 可能是扫描版PDF，系统会自动使用OCR识别。请等待处理完成（首次较慢）。

### Q2: OCR识别准确率低？
**A:**
- 确保PDF图像清晰度足够（推荐300dpi以上）
- 检查是否安装了正确的训练数据文件
- 中英文混合文档建议使用 `chi_sim+eng` 语言包

### Q3: 部署到服务器后访问不了？
**A:**
- 检查防火墙是否开放3000端口
- 确认nginx反向代理配置正确
- 查看PM2日志：`pm2 logs`

### Q4: 如何迁移到PostgreSQL？
**A:** 修改 `src/lib/database.ts`，将SQLite驱动替换为PostgreSQL驱动（如`pg`），调整SQL语法。

### Q5: 如何添加用户认证？
**A:** 可集成 NextAuth.js，在 `src/app/api/auth/` 添加认证路由，保护上传和管理接口。

### Q6: 支持其他文档格式吗？
**A:** 目前仅支持PDF。如需支持Word/Excel，需要额外集成转换工具（如LibreOffice）。

### Q7: 如何优化大量文档的搜索速度？
**A:**
- 考虑添加全文搜索引擎（如Elasticsearch）
- 为SQLite添加索引
- 启用搜索结果缓存
- 使用分页加载

## 开发说明

### 添加新的同义词
在 `src/lib/database.ts` 的 `insertDefaultSynonyms` 方法中添加新的同义词组。

### 自定义搜索算法
在 `src/utils/search.ts` 中可以调整相关度计算逻辑和文本类型检测规则。

### 样式定制
项目使用 Tailwind CSS，可以在 `tailwind.config.js` 中自定义主题。

## 性能指标

### 测试环境
- 服务器：2核4G内存
- 网络：100Mbps
- 文档数量：318页（4个PDF）

### 关键指标
- **首页加载**：< 1s
- **PDF渲染**：2-3s (首次)
- **搜索响应**：< 500ms
- **OCR处理**：约1min/100页
- **并发支持**：50+ 用户

## 更新日志

### v1.0.0 (2025-10-03)
- ✅ 核心功能完成
- ✅ PDF上传、预览、搜索
- ✅ OCR文字识别
- ✅ 同义词搜索
- ✅ 智能相关度排序
- ✅ 响应式设计

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 规则
- 提交前运行 `npm run lint` 和 `npm run type-check`
- 编写清晰的提交信息

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

## 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR引擎
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF渲染
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

**⭐ 如果这个项目对你有帮助，请给一个星标！**