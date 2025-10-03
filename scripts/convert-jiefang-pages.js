const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');

async function convertPages() {
  const pdfPath = path.resolve(__dirname, '../public/pdfs/jiefang_wiring.pdf');

  for (let i = 2; i <= 13; i++) {
    const pages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 1.0,
      outputFolder: 'jiefang-preview',
      pagesToProcess: [i],
      strictPagesToProcess: false,
      verbosityLevel: 0
    });
    console.log(`第${i}页已转换: ${pages[0].name}`);
  }

  console.log('\n全部转换完成！');
}

convertPages();
