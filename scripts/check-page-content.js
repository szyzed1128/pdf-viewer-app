const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查江铃第10、11页内容 ===\n');

db.all(
  'SELECT * FROM document_pages WHERE document_id = ? AND page_number IN (10, 11, 21, 137) ORDER BY page_number',
  ['doc-002'],
  (err, pages) => {
    if (err) {
      console.error('查询错误:', err);
      db.close();
      return;
    }

    pages.forEach(page => {
      console.log(`第${page.page_number}页:`);
      console.log('文本长度:', page.page_text.length);
      console.log('前500字符:');
      console.log(page.page_text.substring(0, 500));
      console.log('');
      console.log('包含"连接器":', page.page_text.includes('连接器') ? '是' : '否');
      console.log('包含"熔断器":', page.page_text.includes('熔断器') ? '是' : '否');
      console.log('包含"保险":', page.page_text.includes('保险') ? '是' : '否');
      console.log('包含"继电器":', page.page_text.includes('继电器') ? '是' : '否');
      console.log('');
      console.log('================\n');
    });

    db.close();
  }
);
