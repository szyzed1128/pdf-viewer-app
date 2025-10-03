const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function testAllDocSearch() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));

  console.log('测试所有PDF的搜索功能...\n');

  const docs = [
    { id: 'doc-001', name: 'DFH系列汽车使用手册', keyword: '继电器' },
    { id: 'doc-002', name: '江铃福顺整车电路图册', keyword: '继电器' },
    { id: 'doc-003', name: '陕汽轩德翼3整车电路图', keyword: '电' },
    { id: 'doc-004', name: '一汽解放新款J6L整车线束图', keyword: '管脚' }
  ];

  for (const doc of docs) {
    console.log(`\n========== ${doc.name} (${doc.id}) ==========`);

    const results = await all(
      `SELECT page_number, substr(page_text, 1, 200) as preview
       FROM document_pages
       WHERE document_id = ? AND page_text LIKE ?
       ORDER BY page_number
       LIMIT 5`,
      [doc.id, `%${doc.keyword}%`]
    );

    console.log(`搜索关键词: "${doc.keyword}"`);
    console.log(`找到 ${results.length} 个结果 (显示前5个)\n`);

    for (const result of results) {
      const preview = result.preview.replace(/\n/g, ' ').substring(0, 100);
      console.log(`  第${result.page_number}页: ${preview}...`);

      // 检查标记
      const hasTitle = result.preview.includes('[TITLE]');
      const hasDesc = result.preview.includes('[DESCRIPTION]');
      const hasText = result.preview.includes('[TEXT]');
      console.log(`    标记: TITLE=${hasTitle}, DESC=${hasDesc}, TEXT=${hasText}`);
    }
  }

  db.close();
  console.log('\n测试完成！');
}

testAllDocSearch();
