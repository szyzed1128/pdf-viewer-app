const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function testJianglingSearch() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const all = promisify(db.all.bind(db));

  console.log('测试江铃PDF搜索"继电器"的详细结果...\n');

  const results = await all(
    `SELECT page_number, page_text
     FROM document_pages
     WHERE document_id = ? AND page_text LIKE ?
     ORDER BY page_number`,
    ['doc-002', '%继电器%']
  );

  console.log(`找到 ${results.length} 个匹配页面\n`);

  for (let i = 0; i < Math.min(10, results.length); i++) {
    const result = results[i];
    console.log(`========== 第${result.page_number}页 ==========`);

    // 检查文本中"继电器"的出现位置
    const text = result.page_text;
    const titleMatch = text.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
    const descMatch = text.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
    const textMatch = text.match(/\[TEXT\](.*?)\[\/TEXT\]/s);

    console.log(`标记情况:`);
    console.log(`  TITLE: ${titleMatch ? '是' : '否'}`);
    console.log(`  DESCRIPTION: ${descMatch ? '是' : '否'}`);
    console.log(`  TEXT: ${textMatch ? '是' : '否'}`);

    if (titleMatch && titleMatch[1].includes('继电器')) {
      console.log(`  ✓ "继电器"在TITLE中: ${titleMatch[1].substring(0, 100)}`);
    }
    if (descMatch && descMatch[1].includes('继电器')) {
      console.log(`  ✓ "继电器"在DESCRIPTION中: ${descMatch[1].substring(0, 100)}`);
    }
    if (textMatch && textMatch[1].includes('继电器')) {
      console.log(`  ✓ "继电器"在TEXT中: ${textMatch[1].substring(0, 100)}`);
    }
    console.log('');
  }

  // 测试"灯"
  console.log('\n\n测试江铃PDF搜索"灯"的详细结果...\n');

  const dengResults = await all(
    `SELECT page_number, page_text
     FROM document_pages
     WHERE document_id = ? AND page_text LIKE ?
     ORDER BY page_number
     LIMIT 5`,
    ['doc-002', '%灯%']
  );

  console.log(`找到 ${dengResults.length} 个匹配页面\n`);

  for (const result of dengResults) {
    console.log(`========== 第${result.page_number}页 ==========`);

    const text = result.page_text;
    const titleMatch = text.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
    const descMatch = text.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
    const textMatch = text.match(/\[TEXT\](.*?)\[\/TEXT\]/s);

    console.log(`标记情况:`);
    console.log(`  TITLE: ${titleMatch ? '是' : '否'}`);
    console.log(`  DESCRIPTION: ${descMatch ? '是' : '否'}`);
    console.log(`  TEXT: ${textMatch ? '是' : '否'}`);

    if (titleMatch && titleMatch[1].includes('灯')) {
      console.log(`  ✓ "灯"在TITLE中`);
    }
    if (descMatch && descMatch[1].includes('灯')) {
      console.log(`  ✓ "灯"在DESCRIPTION中`);
    }
    if (textMatch && textMatch[1].includes('灯')) {
      console.log(`  ✓ "灯"在TEXT中`);
    }
    console.log('');
  }

  db.close();
}

testJianglingSearch();
