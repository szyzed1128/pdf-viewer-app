const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function checkPageOffset() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));
  const get = promisify(db.get.bind(db));

  console.log('检查江铃PDF的页码偏移问题...\n');

  // 获取文档信息
  const doc = await get('SELECT * FROM documents WHERE id = ?', ['doc-002']);
  console.log(`文档: ${doc.original_name}`);
  console.log(`文件路径: ${doc.file_path}`);
  console.log(`总页数: ${doc.page_count}\n`);

  // 检查数据库中有哪些页码
  const pages = await all(
    'SELECT page_number FROM document_pages WHERE document_id = ? ORDER BY page_number',
    ['doc-002']
  );

  console.log(`数据库中的页码范围: ${pages[0].page_number} - ${pages[pages.length - 1].page_number}`);
  console.log(`数据库中总页数: ${pages.length}\n`);

  // 检查前20页的页码
  console.log('前20页的页码:');
  const first20 = pages.slice(0, 20).map(p => p.page_number);
  console.log(first20.join(', '));

  // 检查是否有跳跃
  console.log('\n检查页码连续性:');
  let hasGaps = false;
  for (let i = 1; i < Math.min(20, pages.length); i++) {
    const prev = pages[i-1].page_number;
    const curr = pages[i].page_number;
    if (curr - prev > 1) {
      console.log(`⚠ 页码跳跃: ${prev} -> ${curr} (缺少 ${curr - prev - 1} 页)`);
      hasGaps = true;
    }
  }

  if (!hasGaps) {
    console.log('✓ 前20页页码连续');
  }

  // 检查OCR时的页码是从0还是从1开始
  const firstPage = await get(
    'SELECT page_number, substr(page_text, 1, 100) as preview FROM document_pages WHERE document_id = ? ORDER BY page_number LIMIT 1',
    ['doc-002']
  );

  console.log(`\n第一页的页码: ${firstPage.page_number}`);
  console.log(`第一页内容预览: ${firstPage.preview.substring(0, 50)}...`);

  db.close();
}

checkPageOffset();
