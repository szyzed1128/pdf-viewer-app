# PDF搜索功能开发历史

## 项目概述

本项目是一个基于Next.js的PDF文档搜索系统，支持对汽车技术手册进行OCR文本提取、智能分类和优先级搜索。

## 已完成的PDF文档

### 1. DFH系列汽车使用手册 (doc-001)

**文档信息:**
- 文档ID: `doc-001`
- 文档名称: DFH系列汽车使用手册
- 总页数: 14页
- 文件路径: `/pdfs/manual.pdf`

**开发流程:**

1. **OCR文本提取**
   - 使用 `pdf-to-png-converter` 将PDF转换为PNG图片
   - 使用 `tesseract.js` 进行OCR识别（中文+英文: 'chi_sim+eng'）
   - 脚本位置: `scripts/ocr-extract-all-pages.js`
   - 输出数据: `scripts/manual-all-text-data.json`

2. **文本分类策略**
   - **元件标题** (title) - 最高优先级
     - 提取方式: 每页第一行的粗体文本
     - 特征: 简短的标题文本，通常是元件名称
     - 示例: "油门踏板位置传感器"

   - **元件描述** (description) - 中等优先级
     - 提取方式: 标题下方的详细说明文本
     - 特征: 包含功能、参数、技术规格等详细信息
     - 示例: "油门踏板位置传感器用于检测油门踏板的位置..."

   - **普通文本** (text) - 最低优先级
     - 其他所有文本内容

3. **数据存储格式**
   ```json
   {
     "documentName": "DFH系列汽车使用手册",
     "documentId": "doc-001",
     "totalPages": 14,
     "componentTitles": [
       {
         "pageNumber": 1,
         "title": "元件名称",
         "confidence": 85.5
       }
     ],
     "componentDescriptions": [
       {
         "pageNumber": 1,
         "text": "详细描述内容",
         "confidence": 82.3
       }
     ]
   }
   ```

4. **数据库导入**
   - 表名: `document_pages`
   - 数据格式: `[TITLE]标题[/TITLE]\n[DESCRIPTION]描述[/DESCRIPTION]`
   - 脚本: `scripts/import-ocr-data.js`

5. **搜索优先级**
   - title (元件标题): 权重 1000
   - description (元件描述): 权重 100
   - text (普通文本): 权重 1

---

### 2. 一汽解放新款J6L整车线束图 (doc-004)

**文档信息:**
- 文档ID: `doc-004`
- 文档名称: 一汽解放新款J6L整车线束图
- 总页数: 13页
- 文件路径: `/pdfs/jiefang_wiring.pdf`

**开发流程:**

1. **页面预览与分析**
   - 首先将PDF所有页面转换为PNG预览图
   - 脚本: `scripts/convert-jiefang-pages.js`
   - 输出目录: `scripts/jiefang-preview/`
   - 分析了第1、2、5、10、13页，确定内容结构

2. **OCR文本提取**
   - 使用相同的OCR工具链
   - 脚本: `scripts/ocr-extract-jiefang.js`
   - 输出数据: `scripts/jiefang-all-text-data.json`
   - 识别语言: 'chi_sim+eng'

3. **文本分类策略** (与DFH手册不同)

   经过页面分析，确定解放PDF的内容主要由三部分组成:

   - **表格内的文本** → 映射为 **元件标题 (title)** - 最高优先级
     - 特征关键词: '管脚', '序号', '功能', '信号', '针脚', '连接器', '插接件', '熔断器', '继电器', '保险丝', '型号', '位置', '线束'
     - 编号模式: 'X1', 'X2', 'F1', 'J1', 'J2' 等
     - 包含表格数据、连接器定义、针脚信息

   - **独立说明的文本** → 映射为 **元件描述 (description)** - 中等优先级
     - 特征关键词: '符合', '应', '技术条件', '要求', '标准', '未注', '制造厂', '日期标记', '公司标志', '开始供应', '样品', '复验', '公差', '材料', '性能', '按', 'QB', 'JB'
     - 长句子(>20字符)且包含标点符号
     - 技术说明文字

   - **电路图中的文本** → 映射为 **普通文本 (text)** - 最低优先级
     - 其他所有文本（标注、元件符号等）

4. **文本分类实现**
   - 脚本: `scripts/classify-jiefang-text.js`
   - 输出数据: `scripts/jiefang-classified-data.json`
   - 分类结果:
     ```
     表格文本(title): 12个片段, 101行
     说明文本(description): 12个片段, 93行
     电路图文本(text): 13个片段, 3275行
     ```

5. **数据库导入**
   - 脚本: `scripts/import-jiefang-to-db.js`
   - 数据格式: `[TITLE]表格文本[/TITLE]\n[DESCRIPTION]说明文本[/DESCRIPTION]\n[TEXT]电路图文本[/TEXT]`
   - 成功导入13页数据

6. **搜索优先级** (与DFH一致)
   - title (表格文本): 权重 1000
   - description (说明文本): 权重 100
   - text (电路图文本): 权重 1

---

## 技术栈

### 核心依赖
- **Next.js 14** - 前端框架
- **sqlite3** - 数据库
- **pdf-to-png-converter** - PDF转图片
- **tesseract.js** - OCR文字识别
- **better-sqlite3** - SQLite Node.js绑定

### 数据库结构

```sql
-- 文档表
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_size INTEGER,
  page_count INTEGER,
  extracted_text TEXT
);

-- 文档页面表
CREATE TABLE document_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  page_text TEXT NOT NULL,
  component_names TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE(document_id, page_number)
);

-- 同义词表
CREATE TABLE synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL,
  synonyms TEXT NOT NULL
);
```

---

## 搜索引擎实现

**文件位置:** `src/utils/search.ts`

### 核心功能

1. **同义词扩展**
   - 支持为搜索词扩展同义词
   - 示例: "针脚" → ["针脚", "引脚", "Pin", "Terminal", "端子", "接线端"]

2. **三层文本类型搜索**
   ```typescript
   // 提取三种类型的文本
   const titleText = pageText.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
   const descText = pageText.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
   const circuitText = pageText.match(/\[TEXT\](.*?)\[\/TEXT\]/s);
   ```

3. **相关性评分算法**
   - 类型权重: title(1000) > description(100) > text(1)
   - 精确匹配加分: +50
   - 包含匹配加分: +30
   - 单词匹配加分: +10/词
   - 上下文匹配加分: +5

4. **结果高亮**
   - 使用 `<mark>` 标签高亮匹配词
   - 提供上下文预览（前后2-3行）

---

## 开发经验总结

### 1. DFH手册的特点
- 结构清晰，每页有明确的标题和描述
- OCR识别质量较高（平均置信度 >80%）
- 分类相对简单：标题 vs 描述

### 2. 解放线束图的特点
- 包含大量表格和电路图
- OCR识别质量较低（平均置信度 23%-44%）
- 需要基于关键词和模式识别进行分类
- 文本分类更复杂：表格 vs 说明 vs 电路图

### 3. 通用处理流程
```
PDF → PNG图片 → OCR识别 → 文本分类 → 数据库导入 → 搜索功能
```

### 4. 分类策略的关键
- **分析页面结构**: 先预览几个代表性页面
- **识别文本特征**: 找出每种文本类型的关键词和模式
- **确定优先级映射**: 根据业务需求确定哪种文本最重要
- **测试验证**: 导入后测试搜索结果的准确性

### 5. OCR质量处理
- 低质量OCR文本仍然可用（解放PDF平均23%置信度）
- 关键是建立容错的关键词匹配机制
- 考虑使用正则表达式和模式识别而非完全依赖精确匹配

---

### 3. 江铃福顺整车电路图册 (doc-002)

**文档信息:**
- 文档ID: `doc-002`
- 文档名称: 江铃福顺整车电路图册
- 总页数: 268页
- 文件路径: `/pdfs/jiangling_circuit.pdf`

**开发流程:**

1. **页面预览与分析**
   - 预览第1, 10, 50, 100, 150, 200, 250, 268页
   - 确定内容包含: 目录、说明文字、电路图、连接器图示和针脚表格

2. **OCR文本提取**
   - 脚本: `scripts/ocr-extract-jiangling.js`
   - 输出数据: `scripts/jiangling-all-text-data.json`
   - 识别结果: 216/268页成功提取 (80.6%成功率)
   - 平均置信度: 30.95%

3. **文本分类策略**
   - **表格文本** (title) - 最高优先级
     - 关键词: 管脚、连接器、功能、信号、针脚、插接件、熔断器等
     - 56个片段, 139行

   - **说明文本** (description) - 中等优先级
     - 关键词: 符合、技术条件、要求、标准、规定、说明
     - 22个片段, 85行

   - **电路图文本** (text) - 最低优先级
     - 其他所有文本（标注、元件符号）
     - 216个片段, 2401行

4. **文本分类实现**
   - 脚本: `scripts/classify-jiangling-text.js`
   - 输出: `scripts/jiangling-classified-data.json`

5. **数据库导入**
   - 脚本: `scripts/import-jiangling-to-db.js`
   - 成功导入216页数据
   - 数据格式: `[TITLE]...[/TITLE]\n[DESCRIPTION]...[/DESCRIPTION]\n[TEXT]...[/TEXT]`

---

### 4. 陕汽轩德翼3整车电路图 (doc-003)

**文档信息:**
- 文档ID: `doc-003`
- 文档名称: 陕汽轩德翼3整车电路图
- 总页数: 23页
- 文件路径: `/pdfs/shanqi_circuit.pdf`
- 文件大小: 55MB (高分辨率PDF)

**开发流程:**

1. **页面预览与分析**
   - 预览第1, 5, 10, 15页
   - 电路图为主,右下角有表格和标注信息

2. **PDF转图片**
   - **问题**: 55MB大文件,一次性转换极慢/超时
   - **解决方案**: 分批转换策略
   - 脚本: `scripts/convert-shanqi-batch.js`
   - 分5批处理,每批5页,成功转换所有23页

3. **OCR文本提取**
   - **问题**: 内存不足导致OCR进程中断
   - **解决方案**: 从已转换的PNG直接OCR
   - 脚本: `scripts/ocr-shanqi-from-png.js`
   - 识别结果: 23/23页全部成功
   - 平均置信度: 25.74%
   - 每5页保存一次中间结果,防止数据丢失

4. **文本分类**
   - 脚本: `scripts/classify-shanqi-text.js`
   - 表格文本: 14个片段, 21行
   - 说明文本: 3个片段, 4行
   - 电路图文本: 23个片段, 471行

5. **数据库导入**
   - 脚本: `scripts/import-shanqi-to-db.js`
   - 成功导入23页数据

**技术挑战与解决方案:**
1. **大文件PDF转换**: 使用分批转换策略,每次只处理几页
2. **内存溢出**: OCR过程每5页保存一次中间结果
3. **低OCR质量**: 虽然置信度低(25%),但仍可用于搜索

---

## 关键文件索引

### 脚本文件
- `scripts/ocr-extract-all-pages.js` - DFH手册OCR提取
- `scripts/import-ocr-data.js` - DFH手册数据导入
- `scripts/convert-jiefang-pages.js` - 解放PDF页面预览
- `scripts/ocr-extract-jiefang.js` - 解放PDF OCR提取
- `scripts/classify-jiefang-text.js` - 解放PDF文本分类
- `scripts/import-jiefang-to-db.js` - 解放PDF数据导入
- `scripts/convert-jiangling-pages.js` - 江铃PDF页面预览
- `scripts/ocr-extract-jiangling.js` - 江铃PDF OCR提取
- `scripts/classify-jiangling-text.js` - 江铃PDF文本分类
- `scripts/import-jiangling-to-db.js` - 江铃PDF数据导入
- `scripts/convert-shanqi-batch.js` - 陕汽PDF分批转换
- `scripts/ocr-shanqi-from-png.js` - 陕汽PDF OCR提取(从PNG)
- `scripts/classify-shanqi-text.js` - 陕汽PDF文本分类
- `scripts/import-shanqi-to-db.js` - 陕汽PDF数据导入

### 数据文件
- `scripts/manual-all-text-data.json` - DFH手册OCR数据
- `scripts/jiefang-all-text-data.json` - 解放PDF原始OCR数据
- `scripts/jiefang-classified-data.json` - 解放PDF分类后数据
- `scripts/jiangling-all-text-data.json` - 江铃PDF原始OCR数据
- `scripts/jiangling-classified-data.json` - 江铃PDF分类后数据
- `scripts/shanqi-all-text-data.json` - 陕汽PDF原始OCR数据
- `scripts/shanqi-classified-data.json` - 陕汽PDF分类后数据

### 核心代码
- `src/lib/database.ts` - 数据库操作层
- `src/utils/search.ts` - 搜索引擎实现
- `src/app/api/search/route.ts` - 搜索API路由

### 数据库
- `database.sqlite` - SQLite数据库文件

---

## 已完成文档总结

所有4个PDF文档已全部完成处理:

| 文档ID | 文档名称 | 页数 | OCR成功率 | 平均置信度 | 数据库页数 |
|--------|---------|------|-----------|-----------|-----------|
| doc-001 | DFH系列汽车使用手册 | 14 | 100% | >80% | 14 |
| doc-004 | 一汽解放新款J6L整车线束图 | 13 | 100% | 23-44% | 13 |
| doc-002 | 江铃福顺整车电路图册 | 268 | 80.6% | 30.95% | 216 |
| doc-003 | 陕汽轩德翼3整车电路图 | 23 | 100% | 25.74% | 23 |

**总计**: 4个文档, 318页, 266页数据已导入数据库

---

## 下次开发建议

1. **优化OCR识别质量**
   - 尝试调整OCR参数
   - 考虑预处理图片（去噪、增强对比度）
   - 对低置信度页面进行二次识别

2. **改进分类算法**
   - 可以考虑使用机器学习进行文本分类
   - 建立更完善的关键词库
   - 针对不同PDF类型定制分类规则

3. **增强搜索功能**
   - 支持模糊搜索
   - 支持拼音搜索
   - 支持正则表达式搜索
   - 优化搜索结果排序算法

4. **性能优化**
   - 为大文件PDF优化处理流程
   - 实现增量OCR(只处理新页面)
   - 优化数据库查询性能

---

## 开发者笔记

**重要提醒:**
- 每个PDF的文本结构可能完全不同，需要先分析再决定分类策略
- 不要假设所有PDF都有相同的结构（DFH vs 解放的差异很大）
- OCR识别质量差异很大，需要建立容错机制
- 优先级映射是核心：确定哪种文本对用户最重要
- 测试是关键：导入后一定要测试搜索结果

**成功经验:**
1. 先预览PDF页面，理解内容结构
2. 基于内容特征而非固定规则进行分类
3. 使用关键词+模式识别的混合策略
4. 保持三层优先级架构的一致性（title > description > text）
5. 对大文件PDF使用分批转换策略避免超时
6. OCR过程定期保存中间结果防止数据丢失
7. 低置信度OCR文本仍可用,关键在容错匹配

---

*最后更新: 2025-10-02*
*开发者: Claude Code*
