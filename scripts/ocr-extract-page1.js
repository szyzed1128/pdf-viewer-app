const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');

async function extractPage1WithOCR() {
  try {
    console.log('开始处理PDF第1页...\n');

    const pdfPath = path.resolve(__dirname, '../public/pdfs/manual.pdf');
    const outputDirName = 'ocr-output';
    const outputDir = path.resolve(__dirname, outputDirName);

    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('步骤1: 将PDF第1页转换为图片...');
    console.log(`PDF路径: ${pdfPath}`);
    console.log(`输出目录: ${outputDir}`);

    // 转换PDF第1页为PNG图片
    const pngPages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0,
      outputFolder: outputDirName,
      strictPagesToProcess: false,
      verbosityLevel: 0,
      pagesToProcess: [1] // 只处理第1页
    });

    if (pngPages.length === 0) {
      console.error('PDF转图片失败');
      return;
    }

    console.log(`✓ 第1页已转换为图片`);

    const imagePath = path.join(outputDir, pngPages[0].name);
    console.log(`图片路径: ${imagePath}\n`);

    console.log('步骤2: 使用OCR识别图片中的文字...');
    console.log('(这可能需要几分钟时间,请耐心等待)\n');

    // 使用Tesseract进行OCR识别 (支持中文+英文)
    const result = await Tesseract.recognize(
      imagePath,
      'chi_sim+eng', // 简体中文 + 英文
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\r识别进度: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('\n\n✓ OCR识别完成!\n');

    const extractedText = result.data.text;

    console.log('====== 识别到的文本内容 ======\n');
    console.log(extractedText);
    console.log('\n============================\n');

    // 保存识别结果
    const textOutputPath = path.join(outputDir, 'page1-ocr-result.txt');
    fs.writeFileSync(textOutputPath, extractedText, 'utf-8');
    console.log(`识别结果已保存到: ${textOutputPath}`);

    // 保存详细信息
    const detailsPath = path.join(outputDir, 'page1-ocr-details.json');
    fs.writeFileSync(detailsPath, JSON.stringify({
      pageNumber: 1,
      text: extractedText,
      confidence: result.data.confidence,
      words: result.data.words.length,
      lines: result.data.lines.length
    }, null, 2), 'utf-8');
    console.log(`详细信息已保存到: ${detailsPath}`);

  } catch (error) {
    console.error('OCR提取失败:', error);
  }
}

extractPage1WithOCR();
