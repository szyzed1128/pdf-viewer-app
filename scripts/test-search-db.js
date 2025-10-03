const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function testSearch() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));

  console.log('测试数据库中的陕汽PDF内容...\n');

  // 查看第11页的内容
  const page11 = await all(
    'SELECT page_number, page_text FROM document_pages WHERE document_id = ? AND page_number = ?',
    ['doc-003', 11]
  );

  if (page11.length > 0) {
    console.log('第11页内容:');
    console.log(page11[0].page_text);
    console.log('\n包含ADAS:', page11[0].page_text.includes('ADAS'));
  }

  // 搜索ADAS
  const adasResults = await all(
    "SELECT page_number FROM document_pages WHERE document_id = ? AND page_text LIKE ?",
    ['doc-003', '%ADAS%']
  );

  console.log('\n\nADAS搜索结果:', adasResults);

  db.close();
}

testSearch();
