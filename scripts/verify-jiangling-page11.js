const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function verifyPage11() {
  console.log('验证江铃PDF第11页内容...\n');

  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'jiangling_circuit.pdf');
  const outputDir = path.join(__dirname, 'verify-output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log('转换PDF第11页为图片...');

  // 只转换第11页
  const pngPages = await pdfToPng(pdfPath, {
    disableFontFace: false,
    useSystemFonts: false,
    viewportScale: 2.0,
    outputFolder: 'verify-output',
    pagesToProcess: [11]
  });

  console.log(`✓ 转换完成: ${pngPages.length} 页\n`);

  if (pngPages.length > 0) {
    const pngPage = pngPages[0];
    console.log(`PNG信息: pageNumber=${pngPage.pageNumber}, name=${pngPage.name}`);

    console.log('\nOCR识别第11页文字...');
    const imagePath = path.join(__dirname, 'verify-output', pngPage.name);

    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'chi_sim+eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\r进度: ${(m.progress * 100).toFixed(1)}%`);
          }
        }
      }
    );

    console.log('\n\n========== 第11页OCR文本 (前500字符) ==========');
    console.log(text.substring(0, 500));
    console.log('\n包含"继电器": ', text.includes('继电器'));
    console.log('包含"保险": ', text.includes('保险'));
  }
}

verifyPage11();
