const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function checkAllDocs() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));
  const get = promisify(db.get.bind(db));

  console.log('检查所有文档的数据格式...\n');

  const docs = await all('SELECT * FROM documents ORDER BY id');

  for (const doc of docs) {
    console.log(`\n========== ${doc.id}: ${doc.original_name} ==========`);

    // 统计页面数
    const pageCount = await get(
      'SELECT COUNT(*) as count FROM document_pages WHERE document_id = ?',
      [doc.id]
    );
    console.log(`数据库中页面数: ${pageCount.count}`);

    // 查看前3页的数据格式
    const pages = await all(
      'SELECT page_number, substr(page_text, 1, 300) as preview FROM document_pages WHERE document_id = ? ORDER BY page_number LIMIT 3',
      [doc.id]
    );

    console.log('\n前3页数据格式:');
    for (const page of pages) {
      console.log(`\n--- 第${page.page_number}页 ---`);
      console.log(page.preview);

      // 检查是否包含标记
      const hasTitle = page.preview.includes('[TITLE]');
      const hasDesc = page.preview.includes('[DESCRIPTION]');
      const hasText = page.preview.includes('[TEXT]');
      console.log(`包含标记: TITLE=${hasTitle}, DESCRIPTION=${hasDesc}, TEXT=${hasText}`);
    }

    // 测试搜索一个关键词
    const searchResults = await all(
      "SELECT page_number FROM document_pages WHERE document_id = ? AND page_text LIKE ? LIMIT 3",
      [doc.id, '%电%']
    );
    console.log(`\n测试搜索"电": 找到 ${searchResults.length} 个结果`);
    if (searchResults.length > 0) {
      console.log(`页码: ${searchResults.map(r => r.page_number).join(', ')}`);
    }
  }

  db.close();
}

checkAllDocs();
