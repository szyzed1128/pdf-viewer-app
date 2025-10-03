const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'jiangling-classified-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('江铃PDF分类数据分析:\n');
console.log(`文档名: ${data.documentName}`);
console.log(`文档ID: ${data.documentId}`);
console.log(`总页数: ${data.totalPages}\n`);

console.log(`表格文本片段数: ${data.tableTexts.length}`);
console.log(`说明文本片段数: ${data.descriptionTexts.length}`);
console.log(`电路文本片段数: ${data.circuitTexts.length}\n`);

// 检查前几页的分类
console.log('前5页的分类情况:');
for (let page = 1; page <= 5; page++) {
  const tableItems = data.tableTexts.filter(t => t.pageNumber === page);
  const descItems = data.descriptionTexts.filter(t => t.pageNumber === page);
  const circuitItems = data.circuitTexts.filter(t => t.pageNumber === page);

  console.log(`\n第${page}页:`);
  console.log(`  表格文本: ${tableItems.length} 个片段`);
  console.log(`  说明文本: ${descItems.length} 个片段`);
  console.log(`  电路文本: ${circuitItems.length} 个片段`);

  if (tableItems.length === 0 && descItems.length === 0 && circuitItems.length === 0) {
    console.log(`  ⚠ 该页无任何分类文本`);
  }
}
