const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get('SELECT * FROM documents WHERE id = ?', ['doc-002'], (err, doc) => {
  if (err) {
    console.error('查询文档失败:', err);
    return;
  }

  console.log('=== 江铃PDF文档信息 ===');
  console.log('文档名:', doc.original_name);
  console.log('声明总页数:', doc.page_count);
  console.log('');

  db.all('SELECT page_number FROM document_pages WHERE document_id = ? ORDER BY page_number',
    ['doc-002'],
    (err, rows) => {
      if (err) {
        console.error('查询页码失败:', err);
        db.close();
        return;
      }

      console.log('=== 数据库中的页码情况 ===');
      console.log('数据库中总页数:', rows.length);
      console.log('页码范围:', rows[0].page_number, '-', rows[rows.length - 1].page_number);
      console.log('');

      console.log('前30个页码:', rows.slice(0, 30).map(r => r.page_number).join(', '));
      console.log('');

      // 检查页码是否连续
      const gaps = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].page_number - rows[i-1].page_number > 1) {
          gaps.push({
            from: rows[i-1].page_number,
            to: rows[i].page_number,
            missing: rows[i].page_number - rows[i-1].page_number - 1
          });
        }
      }

      if (gaps.length > 0) {
        console.log('=== 发现页码跳跃（可能是空白页）===');
        gaps.forEach(gap => {
          console.log(`从第${gap.from}页跳到第${gap.to}页，缺失${gap.missing}页`);
        });
        console.log('');
        console.log('总共缺失页数:', gaps.reduce((sum, gap) => sum + gap.missing, 0));
      } else {
        console.log('页码连续，没有跳页');
      }

      db.close();
    }
  );
});
