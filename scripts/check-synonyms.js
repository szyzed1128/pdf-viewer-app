const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 当前同义词库 ===\n');

db.all(`SELECT * FROM synonyms ORDER BY term`, [], (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }

  rows.forEach(row => {
    console.log(`术语: ${row.term}`);
    const synonyms = JSON.parse(row.synonyms);
    console.log(`  同义词: ${synonyms.join(', ')}`);
    console.log('');
  });

  console.log(`\n总计 ${rows.length} 个术语\n`);
  db.close();
});
