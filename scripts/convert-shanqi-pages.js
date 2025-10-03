const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');

async function convertPages() {
  const pdfPath = path.resolve(__dirname, '../public/pdfs/shanqi_circuit.pdf');

  // 预览几个代表性页面: 第1, 5, 10, 15, 20, 23页
  const pagesToPreview = [1, 5, 10, 15, 20, 23];

  for (let i of pagesToPreview) {
    const pages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 1.0,
      outputFolder: 'shanqi-preview',
      pagesToProcess: [i],
      strictPagesToProcess: false,
      verbosityLevel: 0
    });
    console.log(`第${i}页已转换: ${pages[0].name}`);
  }

  console.log('\n全部转换完成！');
}

convertPages();
