const fs = require('fs');
const path = require('path');

console.log('=== 分析各文档的分类数据覆盖情况 ===\n');

const files = [
  { file: 'jiangling-classified-data.json', name: '江铃福顺' },
  { file: 'jiefang-classified-data.json', name: '解放J6L' },
  { file: 'shanqi-classified-data.json', name: '陕汽轩德翼3' }
];

files.forEach(({ file, name }) => {
  const dataPath = path.join(__dirname, file);

  if (!fs.existsSync(dataPath)) {
    console.log(`${name}: 文件不存在\n`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`${name} (${data.documentId}):`);
  console.log(`  总页数: ${data.totalPages}`);
  console.log(`  表格文本数: ${data.tableTexts.length} 个片段`);
  console.log(`  说明文本数: ${data.descriptionTexts.length} 个片段`);
  console.log(`  电路图文本数: ${data.circuitTexts.length} 个片段`);

  // 统计涉及的页面数
  const titlePages = new Set(data.tableTexts.map(t => t.pageNumber));
  const descPages = new Set(data.descriptionTexts.map(t => t.pageNumber));
  const textPages = new Set(data.circuitTexts.map(t => t.pageNumber));

  const allPages = new Set([...titlePages, ...descPages, ...textPages]);

  console.log(`  涉及页面数: ${allPages.size}/${data.totalPages}`);
  console.log(`    - 有表格文本的页: ${titlePages.size}`);
  console.log(`    - 有说明文本的页: ${descPages.size}`);
  console.log(`    - 有电路图文本的页: ${textPages.size}`);

  // 找出没有任何分类的页面
  const missingPages = [];
  for (let i = 1; i <= data.totalPages; i++) {
    if (!allPages.has(i)) {
      missingPages.push(i);
    }
  }

  if (missingPages.length > 0) {
    console.log(`  ⚠ 缺失页面: ${missingPages.length} 页`);
    if (missingPages.length <= 20) {
      console.log(`    ${missingPages.join(', ')}`);
    } else {
      console.log(`    ${missingPages.slice(0, 10).join(', ')} ... ${missingPages.slice(-10).join(', ')}`);
    }
  } else {
    console.log(`  ✓ 所有页面都有分类`);
  }

  console.log('');
});
