const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查数据库中的文档页数据 ===\n');

db.all(`
  SELECT document_id, COUNT(*) as page_count
  FROM document_pages
  GROUP BY document_id
`, [], (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }

  console.log('各文档的页数统计:');
  rows.forEach(row => {
    console.log(`  ${row.document_id}: ${row.page_count} 页`);
  });

  console.log('\n=== 检查各文档的详细信息 ===\n');

  db.all(`SELECT id, original_name, page_count FROM documents ORDER BY id`, [], (err, docs) => {
    if (err) {
      console.error('查询错误:', err);
      db.close();
      return;
    }

    docs.forEach(doc => {
      console.log(`文档ID: ${doc.id}`);
      console.log(`  名称: ${doc.original_name}`);
      console.log(`  预期页数: ${doc.page_count}`);

      const actualPages = rows.find(r => r.document_id === doc.id);
      console.log(`  实际导入页数: ${actualPages ? actualPages.page_count : 0}`);
      console.log('');
    });

    // 检查示例页面文本
    console.log('\n=== 检查示例页面文本格式 ===\n');

    db.get(`SELECT * FROM document_pages WHERE document_id = 'doc-002' LIMIT 1`, [], (err, page) => {
      if (err) {
        console.error('查询错误:', err);
      } else if (page) {
        console.log('江铃福顺 (doc-002) 第一页文本格式:');
        console.log(page.page_text.substring(0, 300) + '...\n');
      } else {
        console.log('doc-002 没有找到页面数据\n');
      }

      db.get(`SELECT * FROM document_pages WHERE document_id = 'doc-003' LIMIT 1`, [], (err, page) => {
        if (err) {
          console.error('查询错误:', err);
        } else if (page) {
          console.log('陕汽轩德翼3 (doc-003) 第一页文本格式:');
          console.log(page.page_text.substring(0, 300) + '...\n');
        } else {
          console.log('doc-003 没有找到页面数据\n');
        }

        db.close();
      });
    });
  });
});
