const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

async function importOCRData() {
  console.log('开始导入OCR数据到数据库...\n');

  // 读取OCR提取的数据
  const dataPath = path.join(__dirname, 'manual-all-text-data.json');
  const ocrData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`文档名称: ${ocrData.documentName}`);
  console.log(`总页数: ${ocrData.totalPages}`);
  console.log(`元件标题数量: ${ocrData.componentTitles.length}`);
  console.log(`元件描述数量: ${ocrData.componentDescriptions.length}\n`);

  // 连接数据库
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const run = promisify(db.run.bind(db));
  const get = promisify(db.get.bind(db));

  try {
    // 确认文档存在
    const documentId = 'doc-001';
    const document = await get('SELECT * FROM documents WHERE id = ?', [documentId]);

    if (!document) {
      console.error('错误: 文档 doc-001 不存在于数据库中');
      return;
    }

    console.log(`找到文档: ${document.original_name}\n`);

    // 删除旧的页面数据
    await run('DELETE FROM document_pages WHERE document_id = ?', [documentId]);
    console.log('已清除旧的页面数据\n');

    // 导入新的页面数据
    console.log('开始导入页面数据...\n');

    for (let i = 1; i <= ocrData.totalPages; i++) {
      // 查找对应页的标题和描述
      const titleData = ocrData.componentTitles.find(t => t.pageNumber === i);
      const descData = ocrData.componentDescriptions.find(d => d.pageNumber === i);

      if (!titleData || !descData) {
        console.warn(`⚠ 警告: 第${i}页缺少数据`);
        continue;
      }

      // 构建页面文本：标题作为高优先级，描述作为内容
      // 格式：[TITLE]标题文本[/TITLE]\n[DESCRIPTION]描述文本[/DESCRIPTION]
      const pageText = `[TITLE]${titleData.title}[/TITLE]\n[DESCRIPTION]${descData.text}[/DESCRIPTION]`;

      // 将标题作为元件名称
      const componentNames = [titleData.title];

      await run(
        'INSERT INTO document_pages (document_id, page_number, page_text, component_names) VALUES (?, ?, ?, ?)',
        [documentId, i, pageText, JSON.stringify(componentNames)]
      );

      console.log(`✓ 第${i}页已导入 - 标题: ${titleData.title} (${descData.text.length}字符, 置信度: ${descData.confidence}%)`);
    }

    console.log('\n====== 导入完成 ======');
    console.log(`成功导入 ${ocrData.totalPages} 页数据到数据库`);

    // 验证导入结果
    const all = promisify(db.all.bind(db));
    const pages = await all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [documentId]);
    console.log(`\n数据库中现有 ${pages.length} 页数据`);

  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    db.close();
  }
}

importOCRData();
