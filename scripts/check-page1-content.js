const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function checkPage1Content() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF第1页内容...\n');
    const pdfData = await pdfParse(dataBuffer);

    // 使用"电气系统原理图"分割文本
    const fullText = pdfData.text;
    const sections = fullText.split('电气系统原理图');

    // 第1页是sections[1]
    if (sections.length > 1) {
      const page1Content = sections[1];

      console.log('====== 第1页完整内容 ======\n');
      console.log(page1Content);
      console.log('\n====== 分析 ======');
      console.log(`总字符数: ${page1Content.length}`);

      // 按行显示
      const lines = page1Content.split('\n');
      console.log(`总行数: ${lines.length}\n`);

      console.log('====== 逐行内容 ======');
      lines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`第${index + 1}行: "${line.trim()}"`);
        }
      });

      // 保存到文件
      const outputPath = path.join(__dirname, 'page1-content.txt');
      fs.writeFileSync(outputPath, page1Content, 'utf-8');
      console.log(`\n第1页内容已保存到: ${outputPath}`);
    }

  } catch (error) {
    console.error('提取失败:', error);
  }
}

checkPage1Content();
