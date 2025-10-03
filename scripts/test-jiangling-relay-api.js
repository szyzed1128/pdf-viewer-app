const fetch = require('node-fetch');

async function testJianglingRelay() {
  console.log('=== 测试江铃PDF搜索"继电器" API返回结果 ===\n');

  try {
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '继电器',
        documentId: 'doc-002',
        includeSynonyms: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`总共找到 ${data.results.length} 个结果\n`);

      // 显示前10个结果
      for (let i = 0; i < Math.min(10, data.results.length); i++) {
        const result = data.results[i];
        console.log(`结果 ${i}:`);
        console.log(`  页码: ${result.pageNumber}`);
        console.log(`  类型: ${result.type}`);
        console.log(`  相关度: ${result.relevanceScore}`);
        console.log(`  文本片段: "${result.text.substring(0, 50)}..."`);
        console.log('');
      }

      // 分析第一个结果
      console.log('=== 第一个结果详情 ===');
      console.log(`索引: 0`);
      console.log(`页码: ${data.results[0].pageNumber}`);
      console.log(`类型: ${data.results[0].type}`);
      console.log(`期望跳转到第 ${data.results[0].pageNumber} 页`);

    } else {
      console.error('搜索失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('请求错误:', error.message);
  }
}

testJianglingRelay();
