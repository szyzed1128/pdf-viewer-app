const fs = require('fs');
const path = require('path');

const classifiedPath = path.join(__dirname, 'jiangling-classified-data.json');
const rawPath = path.join(__dirname, 'jiangling-all-text-data.json');

const classifiedData = JSON.parse(fs.readFileSync(classifiedPath, 'utf-8'));
const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

console.log('=== 调试江铃缺失页面 ===\n');

// 找出分类数据中缺失的页面
const classifiedPages = new Set();
for (const item of classifiedData.tableTexts) classifiedPages.add(item.pageNumber);
for (const item of classifiedData.descriptionTexts) classifiedPages.add(item.pageNumber);
for (const item of classifiedData.circuitTexts) classifiedPages.add(item.pageNumber);

const missingInClassified = [];
for (let i = 1; i <= classifiedData.totalPages; i++) {
  if (!classifiedPages.has(i)) {
    missingInClassified.push(i);
  }
}

console.log(`分类数据中缺失的页面 (${missingInClassified.length}个):`);
console.log(missingInClassified.slice(0, 10).join(', '), '...\n');

// 检查原始OCR数据
console.log(`原始OCR数据页数: ${rawData.allPageTexts.length}\n`);

// 检查前10个缺失页面在原始数据中的情况
console.log('检查前10个缺失页面在原始OCR数据中的情况:\n');

for (const pageNum of missingInClassified.slice(0, 10)) {
  const rawPage = rawData.allPageTexts.find(p => p.pageNumber === pageNum);
  if (rawPage) {
    const hasText = rawPage.text && rawPage.text.trim().length > 0;
    console.log(`第${pageNum}页:`);
    console.log(`  有文本: ${hasText ? '是' : '否'}`);
    console.log(`  置信度: ${rawPage.confidence}`);
    if (hasText) {
      console.log(`  文本长度: ${rawPage.text.length} 字符`);
      console.log(`  前100字符: ${rawPage.text.substring(0, 100).replace(/\n/g, ' ')}`);
    }
  } else {
    console.log(`第${pageNum}页: 在原始数据中不存在`);
  }
  console.log('');
}
