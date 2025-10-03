const fetch = require('node-fetch');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

async function testDFHSearch() {
  console.log('=== 测试DFH PDF搜索"继电器" ===\n');

  // 1. 先从数据库查看第1页的内容
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const get = promisify(db.get.bind(db));

  const page1 = await get(
    'SELECT page_number, page_text FROM document_pages WHERE document_id = ? AND page_number = ?',
    ['doc-001', 1]
  );

  console.log('数据库中第1页内容:');
  console.log(page1.page_text);
  console.log('\n包含"继电器":', page1.page_text.includes('继电器'));

  db.close();

  // 2. 测试搜索API
  console.log('\n\n=== 搜索API结果 ===\n');

  try {
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '继电器',
        documentId: 'doc-001',
        includeSynonyms: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`找到 ${data.results.length} 个结果\n`);

      // 显示所有结果
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        console.log(`结果 ${i + 1}:`);
        console.log(`  索引: ${i}`);
        console.log(`  页码: ${result.pageNumber}`);
        console.log(`  类型: ${result.type}`);
        console.log(`  相关度: ${result.relevanceScore}`);
        console.log(`  文本: "${result.text}"`);
        console.log('');
      }

      // 分析第1页有几个结果
      const page1Results = data.results.filter(r => r.pageNumber === 1);
      console.log(`\n第1页的搜索结果数量: ${page1Results.length}`);
      if (page1Results.length > 0) {
        console.log('第1页的结果类型:');
        page1Results.forEach((r, idx) => {
          console.log(`  ${idx + 1}. 类型: ${r.type}, 相关度: ${r.relevanceScore}`);
        });
      }

      // 检查第一个结果
      console.log(`\n第一个结果（索引0）的页码: ${data.results[0].pageNumber}`);

    } else {
      console.error('搜索失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('请求错误:', error.message);
  }
}

testDFHSearch();
