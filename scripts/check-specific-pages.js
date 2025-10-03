const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function checkPages() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));

  console.log('检查江铃PDF的第10-15页数据...\n');

  const pages = await all(
    'SELECT page_number, page_text FROM document_pages WHERE document_id = ? AND page_number BETWEEN 10 AND 15 ORDER BY page_number',
    ['doc-002']
  );

  for (const page of pages) {
    console.log(`\n========== 第${page.page_number}页 ==========`);
    console.log(page.page_text.substring(0, 500));
    console.log('\n包含标记:');
    console.log(`  [TITLE]: ${page.page_text.includes('[TITLE]')}`);
    console.log(`  [DESCRIPTION]: ${page.page_text.includes('[DESCRIPTION]')}`);
    console.log(`  [TEXT]: ${page.page_text.includes('[TEXT]')}`);
  }

  db.close();
}

checkPages();
