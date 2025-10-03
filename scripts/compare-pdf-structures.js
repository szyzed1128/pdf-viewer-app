const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function comparePDFStructures() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));
  const get = promisify(db.get.bind(db));

  console.log('对比各个PDF的结构...\n');

  const docs = await all('SELECT * FROM documents ORDER BY id');

  for (const doc of docs) {
    console.log(`\n========== ${doc.id}: ${doc.original_name} ==========`);
    console.log(`文件路径: ${doc.file_path}`);
    console.log(`声明总页数: ${doc.page_count}`);

    // 检查数据库中的页码
    const pages = await all(
      'SELECT page_number FROM document_pages WHERE document_id = ? ORDER BY page_number',
      [doc.id]
    );

    if (pages.length > 0) {
      console.log(`数据库中页码范围: ${pages[0].page_number} - ${pages[pages.length - 1].page_number}`);
      console.log(`数据库中实际页数: ${pages.length}`);

      // 检查前10页
      const first10 = pages.slice(0, 10).map(p => p.page_number);
      console.log(`前10页页码: ${first10.join(', ')}`);

      // 检查是否连续
      let isConsecutive = true;
      for (let i = 1; i < Math.min(10, pages.length); i++) {
        if (pages[i].page_number - pages[i-1].page_number !== 1) {
          isConsecutive = false;
          break;
        }
      }
      console.log(`前10页是否连续: ${isConsecutive ? '是' : '否'}`);

      // 如果不连续，列出缺失的页码
      if (!isConsecutive) {
        const missing = [];
        for (let i = pages[0].page_number; i < Math.min(pages[0].page_number + 10, pages[pages.length - 1].page_number); i++) {
          if (!pages.find(p => p.page_number === i)) {
            missing.push(i);
          }
        }
        if (missing.length > 0) {
          console.log(`前10页范围内缺失页码: ${missing.join(', ')}`);
        }
      }
    } else {
      console.log('数据库中无页面数据');
    }
  }

  db.close();
  console.log('\n\n对比完成！');
}

comparePDFStructures();
