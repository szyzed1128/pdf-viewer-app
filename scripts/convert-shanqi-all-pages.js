const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');

async function convertAllPages() {
  console.log('开始转换陕汽PDF所有页面...\n');

  const pdfPath = path.resolve(__dirname, '../public/pdfs/shanqi_circuit.pdf');
  const outputFolder = 'shanqi-ocr-output';

  console.log(`PDF路径: ${pdfPath}`);
  console.log(`输出目录: ${outputFolder}\n`);

  try {
    const pages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0,
      outputFolder: outputFolder,
      strictPagesToProcess: false,
      verbosityLevel: 0
    });

    console.log(`✓ 成功转换 ${pages.length} 页`);
    pages.forEach((page, index) => {
      console.log(`  第${index + 1}页: ${page.name}`);
    });

  } catch (error) {
    console.error('转换失败:', error.message);
  }
}

convertAllPages();
