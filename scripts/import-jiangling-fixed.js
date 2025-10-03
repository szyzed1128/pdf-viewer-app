const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

async function importJianglingToDatabase() {
  try {
    console.log('开始导入江铃福顺PDF数据到数据库（包含所有页面）...\n');

    // 读取分类后的数据
    const classifiedPath = path.join(__dirname, 'jiangling-classified-data.json');
    const classifiedData = JSON.parse(fs.readFileSync(classifiedPath, 'utf-8'));

    // 读取原始OCR数据（用于填补缺失的页面）
    const rawPath = path.join(__dirname, 'jiangling-all-text-data.json');
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

    console.log(`文档: ${classifiedData.documentName}`);
    console.log(`文档ID: ${classifiedData.documentId}`);
    console.log(`总页数: ${classifiedData.totalPages}\n`);

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
      const document = await get('SELECT * FROM documents WHERE id = ?', [classifiedData.documentId]);

      if (!document) {
        console.error(`错误: 文档 ${classifiedData.documentId} 不存在于数据库中`);
        console.log('请先确保文档记录已在数据库中创建。');
        return;
      }

      console.log(`✓ 找到文档: ${document.original_name}\n`);

      // 2. 删除该文档的旧页面数据（如果存在）
      console.log('步骤2: 清理旧的页面数据...');
      await run('DELETE FROM document_pages WHERE document_id = ?', [classifiedData.documentId]);
      console.log(`✓ 已删除旧页面数据\n`);

      // 3. 准备页面数据
      console.log('步骤3: 组织页面数据...');

      const pageDataMap = new Map();

      // 初始化所有页面
      for (let i = 1; i <= classifiedData.totalPages; i++) {
        pageDataMap.set(i, {
          titleTexts: [],
          descriptionTexts: [],
          circuitTexts: [],
          hasClassified: false
        });
      }

      // 填充表格文本（元件标题）
      for (const item of classifiedData.tableTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.titleTexts.push(item.text);
          pageData.hasClassified = true;
        }
      }

      // 填充说明文本（元件描述）
      for (const item of classifiedData.descriptionTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.descriptionTexts.push(item.text);
          pageData.hasClassified = true;
        }
      }

      // 填充电路图文本（普通文本）
      for (const item of classifiedData.circuitTexts) {
        const pageData = pageDataMap.get(item.pageNumber);
        if (pageData) {
          pageData.circuitTexts.push(item.text);
          pageData.hasClassified = true;
        }
      }

      // 对于没有分类的页面，使用原始OCR文本作为circuitText
      let missingPagesFixed = 0;
      for (const rawPage of rawData.allPageTexts) {
        const pageData = pageDataMap.get(rawPage.pageNumber);
        if (pageData && !pageData.hasClassified && rawPage.text && rawPage.text.trim().length > 0) {
          // 使用原始OCR文本作为circuitText
          pageData.circuitTexts.push(rawPage.text);
          pageData.hasClassified = true;
          missingPagesFixed++;
        }
      }

      console.log(`✓ 已组织 ${pageDataMap.size} 页数据`);
      console.log(`✓ 修复了 ${missingPagesFixed} 个缺失页面（使用原始OCR数据）\n`);

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

        // 如果页面有内容则插入
        if (pageText.trim().length > 0) {
          await run(
            'INSERT OR REPLACE INTO document_pages (document_id, page_number, page_text, component_names) VALUES (?, ?, ?, ?)',
            [classifiedData.documentId, pageNumber, pageText, JSON.stringify([])]
          );
          insertedCount++;
        }

        if (pageNumber % 50 === 0 || pageNumber === classifiedData.totalPages) {
          console.log(`  已处理 ${pageNumber}/${classifiedData.totalPages} 页`);
        }
      }

      console.log(`\n✓ 成功插入 ${insertedCount} 页数据\n`);

      console.log('====== 导入完成 ======');
      console.log(`文档ID: ${classifiedData.documentId}`);
      console.log(`文档名称: ${classifiedData.documentName}`);
      console.log(`导入页数: ${insertedCount}/${classifiedData.totalPages}`);

      // 验证导入
      console.log('\n====== 验证导入 ======');
      const pages = await all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [classifiedData.documentId]);
      console.log(`数据库中现有 ${pages.length} 页数据`);

      // 测试搜索功能
      console.log('\n====== 测试搜索功能 ======');
      const testKeywords = ['连接器', '熔断器', '自动变速器'];

      for (const keyword of testKeywords) {
        const searchResults = await all(`
          SELECT page_number, substr(page_text, 1, 100) as preview
          FROM document_pages
          WHERE document_id = ? AND page_text LIKE ?
          ORDER BY page_number
          LIMIT 3
        `, [classifiedData.documentId, `%${keyword}%`]);

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

importJianglingToDatabase();
