const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

async function importShanqiHQToDatabase() {
  try {
    console.log('开始导入高质量陕汽PDF数据到数据库...\n');

    // 读取分类后的数据
    const dataPath = path.join(__dirname, 'shanqi-hq-classified-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`文档: ${data.documentName}`);
    console.log(`文档ID: ${data.documentId}`);
    console.log(`总页数: ${data.totalPages}\n`);

    // 连接数据库
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const db = new sqlite3.Database(dbPath);

    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));

    console.log(`数据库路径: ${dbPath}\n`);

    try {
      // 1. 验证文档是否存在
      console.log('步骤1: 验证文档记录...');
      const document = await get('SELECT * FROM documents WHERE id = ?', [data.documentId]);

      if (!document) {
        console.error(`错误: 文档 ${data.documentId} 不存在于数据库中`);
        console.log('请先确保文档记录已在数据库中创建。');
        return;
      }

      console.log(`✓ 找到文档: ${document.original_name}\n`);

      // 2. 删除该文档的旧页面数据（如果存在）
      console.log('步骤2: 清理旧的页面数据...');
      await run('DELETE FROM document_pages WHERE document_id = ?', [data.documentId]);
      console.log(`✓ 已删除旧页面数据\n`);

      // 3. 准备页面数据
      console.log('步骤3: 组织页面数据...');

      const pageDataMap = new Map();

      // 初始化所有页面
      for (let i = 1; i <= data.totalPages; i++) {
        pageDataMap.set(i, {
          titleTexts: [],
          descriptionTexts: [],
          circuitTexts: []
        });
      }

      // 填充表格文本（元件标题）
      for (const item of data.tableTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.titleTexts.push(item.text);
        }
      }

      // 填充说明文本（元件描述）
      for (const item of data.descriptionTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.descriptionTexts.push(item.text);
        }
      }

      // 填充电路图文本（普通文本）
      for (const item of data.circuitTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.circuitTexts.push(item.text);
        }
      }

      console.log(`✓ 已组织 ${pageDataMap.size} 页数据\n`);

      // 4. 插入页面数据
      console.log('步骤4: 插入页面数据到数据库...');
      let insertedCount = 0;

      for (const [pageNumber, pageData] of pageDataMap.entries()) {
        // 构建页面文本：按优先级排列
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

        if (pageText.trim().length > 0) {
          await run(
            'INSERT OR REPLACE INTO document_pages (document_id, page_number, page_text, component_names) VALUES (?, ?, ?, ?)',
            [data.documentId, pageNumber, pageText, JSON.stringify([])]
          );
          insertedCount++;
        }

        if (pageNumber % 10 === 0 || pageNumber === data.totalPages) {
          console.log(`  已处理 ${pageNumber}/${data.totalPages} 页`);
        }
      }

      console.log(`\n✓ 成功插入 ${insertedCount} 页数据\n`);

      console.log('====== 导入完成 ======');
      console.log(`文档ID: ${data.documentId}`);
      console.log(`文档名称: ${data.documentName}`);
      console.log(`总页数: ${insertedCount}`);

      // 验证导入
      console.log('\n====== 验证导入 ======');
      const pages = await all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [data.documentId]);
      console.log(`数据库中现有 ${pages.length} 页数据`);

      // 测试搜索功能
      console.log('\n====== 测试搜索功能 ======');
      const testKeywords = ['玉柴', '天然气', '国六', 'ECU', 'Econtrol'];

      for (const keyword of testKeywords) {
        const searchResults = await all(`
          SELECT page_number, substr(page_text, 1, 150) as preview
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

importShanqiHQToDatabase();
