const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function checkAllPagesContent() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF所有页面内容...\n');
    const pdfData = await pdfParse(dataBuffer);

    // 使用"电气系统原理图"分割文本
    const fullText = pdfData.text;
    const sections = fullText.split('电气系统原理图');

    console.log(`总共找到 ${sections.length - 1} 页\n`);

    // 检查前3页的详细内容
    for (let i = 1; i <= Math.min(3, sections.length - 1); i++) {
      const pageContent = sections[i];
      const lines = pageContent.split('\n').map(line => line.trim()).filter(line => line);

      console.log(`\n========== 第 ${i} 页 ==========`);
      console.log(`总字符数: ${pageContent.length}`);
      console.log(`总行数: ${lines.length}`);
      console.log('\n逐行内容:');
      lines.forEach((line, index) => {
        console.log(`  行${index + 1}: "${line}"`);
      });
    }

  } catch (error) {
    console.error('提取失败:', error);
  }
}

checkAllPagesContent();
