const fetch = require('node-fetch');

async function testSynonymSearch() {
  console.log('=== 测试同义词搜索功能 ===\n');

  // 测试1: 搜索"空调"（不使用同义词）
  console.log('【测试1】搜索"空调"（不使用同义词）');
  try {
    const res1 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '空调',
        documentId: 'doc-001',
        includeSynonyms: false,
      }),
    });

    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`  找到 ${data1.results.length} 个结果\n`);
    }
  } catch (err) {
    console.error('  搜索失败:', err.message);
  }

  // 测试2: 搜索"空调"（使用同义词）
  console.log('【测试2】搜索"空调"（使用同义词）');
  try {
    const res2 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '空调',
        documentId: 'doc-001',
        includeSynonyms: true,
      }),
    });

    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`  找到 ${data2.results.length} 个结果`);
      if (data2.results.length > 0) {
        console.log(`  示例结果: 第${data2.results[0].pageNumber}页`);
        console.log(`  匹配文本: "${data2.results[0].text.substring(0, 80)}..."\n`);
      }
    }
  } catch (err) {
    console.error('  搜索失败:', err.message);
  }

  // 测试3: 搜索"A/C"（应该匹配空调的同义词）
  console.log('【测试3】搜索"A/C"（使用同义词，应匹配空调）');
  try {
    const res3 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'A/C',
        documentId: 'doc-001',
        includeSynonyms: true,
      }),
    });

    if (res3.ok) {
      const data3 = await res3.json();
      console.log(`  找到 ${data3.results.length} 个结果`);
      if (data3.results.length > 0) {
        console.log(`  示例结果: 第${data3.results[0].pageNumber}页\n`);
      }
    }
  } catch (err) {
    console.error('  搜索失败:', err.message);
  }

  // 测试4: 搜索"Accelerator Pedal Sensor"（应匹配油门踏板）
  console.log('【测试4】搜索"Accelerator Pedal Sensor"（使用同义词）');
  try {
    const res4 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Accelerator Pedal Sensor',
        documentId: 'doc-001',
        includeSynonyms: true,
      }),
    });

    if (res4.ok) {
      const data4 = await res4.json();
      console.log(`  找到 ${data4.results.length} 个结果`);
      if (data4.results.length > 0) {
        console.log(`  示例结果: 第${data4.results[0].pageNumber}页\n`);
      }
    }
  } catch (err) {
    console.error('  搜索失败:', err.message);
  }
}

testSynonymSearch();
