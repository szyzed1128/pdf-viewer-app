const fetch = require('node-fetch');

async function comparePDFSearch() {
  console.log('=== 对比DFH和江铃PDF的搜索 ===\n');

  // 测试1: DFH PDF搜索"继电器"
  console.log('【测试1】DFH PDF (doc-001) 搜索"继电器"');
  try {
    const res1 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '继电器',
        documentId: 'doc-001',
        includeSynonyms: false,
      }),
    });

    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`  找到 ${data1.results.length} 个结果`);
      if (data1.results.length > 0) {
        console.log(`  第一个结果: 第${data1.results[0].pageNumber}页, 类型: ${data1.results[0].type}`);
        console.log(`  文本片段: "${data1.results[0].text.substring(0, 50)}..."`);
      }
    }
  } catch (err) {
    console.error('  DFH搜索失败:', err.message);
  }

  console.log('');

  // 测试2: 江铃PDF搜索"继电器"
  console.log('【测试2】江铃PDF (doc-002) 搜索"继电器"');
  try {
    const res2 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '继电器',
        documentId: 'doc-002',
        includeSynonyms: false,
      }),
    });

    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`  找到 ${data2.results.length} 个结果`);
      if (data2.results.length > 0) {
        console.log(`  第一个结果: 第${data2.results[0].pageNumber}页, 类型: ${data2.results[0].type}`);
        console.log(`  文本片段: "${data2.results[0].text.substring(0, 50)}..."`);
      }
    }
  } catch (err) {
    console.error('  江铃搜索失败:', err.message);
  }

  console.log('');

  // 测试3: 江铃PDF搜索"灯"（第一个结果在第1页的关键词）
  console.log('【测试3】江铃PDF (doc-002) 搜索"灯"');
  try {
    const res3 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '灯',
        documentId: 'doc-002',
        includeSynonyms: false,
      }),
    });

    if (res3.ok) {
      const data3 = await res3.json();
      console.log(`  找到 ${data3.results.length} 个结果`);
      if (data3.results.length > 0) {
        console.log(`  第一个结果: 第${data3.results[0].pageNumber}页, 类型: ${data3.results[0].type}`);
        console.log(`  文本片段: "${data3.results[0].text.substring(0, 50)}..."`);
      }
    }
  } catch (err) {
    console.error('  江铃搜索失败:', err.message);
  }
}

comparePDFSearch();
