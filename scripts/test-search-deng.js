const fetch = require('node-fetch');

async function testSearchDeng() {
  console.log('测试搜索API - 江铃PDF搜索"灯"...\n');

  try {
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '灯',
        documentId: 'doc-002',
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
        console.log(`  页码: ${result.pageNumber}`);
        console.log(`  类型: ${result.type}`);
        console.log(`  相关度: ${result.relevanceScore}`);
        console.log(`  文本: ${result.text}`);
        console.log(`  上下文: ${result.context.substring(0, 100)}...`);
        console.log('');
      }
    } else {
      console.error('搜索失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('请求错误:', error.message);
  }
}

testSearchDeng();
