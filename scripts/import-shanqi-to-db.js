const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

async function importShanqiToDatabase() {
  try {
    console.log('开始导入陕汽轩德翼3PDF数据到数据库...\n');

    const dataPath = path.join(__dirname, 'shanqi-classified-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`文档: ${data.documentName}`);
    console.log(`文档ID: ${data.documentId}`);
    console.log(`总页数: ${data.totalPages}\n`);

    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const db = new sqlite3.Database(dbPath);

    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));

    console.log(`数据库路径: ${dbPath}\n`);

    try {
      console.log('步骤1: 验证文档记录...');
      const document = await get('SELECT * FROM documents WHERE id = ?', [data.documentId]);

      if (!document) {
        console.error(`错误: 文档 ${data.documentId} 不存在于数据库中`);
        return;
      }

      console.log(`✓ 找到文档: ${document.original_name}\n`);

      console.log('步骤2: 清理旧的页面数据...');
      await run('DELETE FROM document_pages WHERE document_id = ?', [data.documentId]);
      console.log(`✓ 已删除旧页面数据\n`);

      console.log('步骤3: 组织页面数据...');

      const pageDataMap = new Map();

      for (let i = 1; i <= data.totalPages; i++) {
        pageDataMap.set(i, {
          titleTexts: [],
          descriptionTexts: [],
          circuitTexts: []
        });
      }

      for (const item of data.tableTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) pageData.titleTexts.push(item.text);
      }

      for (const item of data.descriptionTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) pageData.descriptionTexts.push(item.text);
      }

      for (const item of data.circuitTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) pageData.circuitTexts.push(item.text);
      }

      console.log(`✓ 已组织 ${pageDataMap.size} 页数据\n`);

      console.log('步骤4: 插入页面数据到数据库...');
      let insertedCount = 0;

      for (const [pageNumber, pageData] of pageDataMap.entries()) {
        const parts = [];

        if (pageData.titleTexts.length > 0) {
          parts.push(`[TITLE]${pageData.titleTexts.join('\n')}[/TITLE]`);
        }

        if (pageData.descriptionTexts.length > 0) {
          parts.push(`[DESCRIPTION]${pageData.descriptionTexts.join('\n')}[/DESCRIPTION]`);
        }

        if (pageData.circuitTexts.length > 0) {
          parts.push(`[TEXT]${pageData.circuitTexts.join('\n')}[/TEXT]`);
        }

        const pageText = parts.join('\n');
        const componentNames = [];

        if (pageText.trim().length > 0) {
          await run(
            'INSERT OR REPLACE INTO document_pages (document_id, page_number, page_text, component_names) VALUES (?, ?, ?, ?)',
            [data.documentId, pageNumber, pageText, JSON.stringify(componentNames)]
          );
          insertedCount++;
        }
      }

      console.log(`\n✓ 成功插入 ${insertedCount} 页数据\n`);

      console.log('====== 导入完成 ======');
      console.log(`文档ID: ${data.documentId}`);
      console.log(`文档名称: ${data.documentName}`);
      console.log(`总页数: ${insertedCount}`);

      console.log('\n====== 验证导入 ======');
      const pages = await all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [data.documentId]);
      console.log(`数据库中现有 ${pages.length} 页数据`);

      console.log('\n====== 测试搜索功能 ======');
      const testKeywords = ['连接器', '电路', '信号'];

      for (const keyword of testKeywords) {
        const searchResults = await all(`
          SELECT page_number, substr(page_text, 1, 100) as preview
          FROM document_pages
          WHERE document_id = ? AND page_text LIKE ?
          ORDER BY page_number
          LIMIT 3
        `, [data.documentId, `%${keyword}%`]);

        console.log(`\n关键词 "${keyword}" 的搜索结果 (前3条):`);

        if (searchResults.length === 0) {
          console.log('  未找到匹配结果');
        } else {
          for (const result of searchResults) {
            console.log(`  第${result.page_number}页: ${result.preview.replace(/\n/g, ' ')}...`);
          }
        }
      }

    } catch (error) {
      console.error('导入过程出错:', error);
      throw error;
    } finally {
      db.close();
    }

    console.log('\n\n数据库导入成功！');

  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

importShanqiToDatabase();
