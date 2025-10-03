const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractManualPDF() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF文件...');
    const pdfData = await pdfParse(dataBuffer);

    console.log('\n====== PDF基本信息 ======');
    console.log('总页数:', pdfData.numpages);
    console.log('文件信息:', pdfData.info);
    console.log('\n====== 完整文本内容 ======');
    console.log(pdfData.text);
    console.log('\n====== 文本长度 ======');
    console.log('总字符数:', pdfData.text.length);

    // 保存完整文本到文件
    const outputPath = path.join(__dirname, 'manual-full-text.txt');
    fs.writeFileSync(outputPath, pdfData.text, 'utf-8');
    console.log('\n完整文本已保存到:', outputPath);

    // 尝试按页分割
    console.log('\n====== 尝试识别页面分隔 ======');

    // 方法1: 使用换页符
    if (pdfData.text.includes('\f')) {
      const pages = pdfData.text.split('\f');
      console.log('使用换页符(\\f)分割, 找到', pages.length, '页');

      // 保存每一页的前200个字符用于检查
      pages.forEach((page, index) => {
        console.log(`\n--- 第 ${index + 1} 页预览 (前200字符) ---`);
        console.log(page.substring(0, 200));
      });
    } else {
      console.log('未找到换页符(\\f)');
    }

    // 保存分析结果
    const analysisPath = path.join(__dirname, 'manual-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify({
      totalPages: pdfData.numpages,
      textLength: pdfData.text.length,
      hasFormFeed: pdfData.text.includes('\f'),
      info: pdfData.info
    }, null, 2));
    console.log('\n分析结果已保存到:', analysisPath);

  } catch (error) {
    console.error('提取PDF失败:', error);
  }
}

extractManualPDF();
