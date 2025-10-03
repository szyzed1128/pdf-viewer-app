const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');

async function extractAllPagesWithOCR() {
  try {
    console.log('开始处理PDF所有14页...\n');

    const pdfPath = path.resolve(__dirname, '../public/pdfs/manual.pdf');
    const outputDirName = 'ocr-output-all';
    const outputDir = path.resolve(__dirname, outputDirName);

    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('步骤1: 将PDF所有页面转换为图片...');
    console.log(`PDF路径: ${pdfPath}`);
    console.log(`输出目录: ${outputDir}\n`);

    // 转换PDF所有页为PNG图片
    const pngPages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0,
      outputFolder: outputDirName,
      strictPagesToProcess: false,
      verbosityLevel: 0
    });

    console.log(`✓ 共转换了 ${pngPages.length} 页为图片\n`);

    // 存储所有页面的OCR结果
    const componentDescriptions = [];

    console.log('步骤2: 使用OCR识别每一页的文字...');
    console.log('(这将需要较长时间,请耐心等待)\n');

    // 逐页进行OCR识别
    for (let i = 0; i < pngPages.length; i++) {
      const pageNumber = i + 1;
      const imagePath = path.resolve(__dirname, outputDirName, pngPages[i].name);

      console.log(`\n=== 正在处理第 ${pageNumber} 页 ===`);
      console.log(`图片: ${pngPages[i].name}`);

      try {
        // 使用Tesseract进行OCR识别
        const result = await Tesseract.recognize(
          imagePath,
          'chi_sim+eng', // 简体中文 + 英文
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                process.stdout.write(`\r  识别进度: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );

        const extractedText = result.data.text;

        console.log(`\n  ✓ 第 ${pageNumber} 页识别完成`);
        console.log(`  提取字符数: ${extractedText.length}`);
        console.log(`  置信度: ${result.data.confidence.toFixed(2)}%`);

        // 保存该页的OCR结果
        componentDescriptions.push({
          pageNumber: pageNumber,
          text: extractedText,
          confidence: result.data.confidence
        });

        // 保存单页文本文件
        const pageTextPath = path.join(outputDir, `page${pageNumber}-ocr.txt`);
        fs.writeFileSync(pageTextPath, extractedText, 'utf-8');

      } catch (error) {
        console.error(`\n  ✗ 第 ${pageNumber} 页识别失败:`, error.message);
        componentDescriptions.push({
          pageNumber: pageNumber,
          text: '',
          error: error.message
        });
      }
    }

    console.log('\n\n====== 所有页面OCR识别完成 ======\n');

    // 读取已有的元件标题数据
    const existingDataPath = path.join(__dirname, 'manual-all-text-data.json');
    let allTextData = {
      documentName: 'DFH系列汽车使用手册',
      totalPages: 14,
      componentTitles: [],
      componentDescriptions: [],
      normalTexts: []
    };

    if (fs.existsSync(existingDataPath)) {
      const existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf-8'));
      allTextData.componentTitles = existingData.componentTitles || [];
    }

    // 更新元件描述数据
    allTextData.componentDescriptions = componentDescriptions;

    // 保存完整数据结构
    fs.writeFileSync(existingDataPath, JSON.stringify(allTextData, null, 2), 'utf-8');
    console.log(`完整数据已保存到: ${existingDataPath}`);

    // 保存汇总报告
    const summaryPath = path.join(outputDir, 'ocr-summary.json');
    const summary = {
      totalPages: pngPages.length,
      successPages: componentDescriptions.filter(p => !p.error).length,
      failedPages: componentDescriptions.filter(p => p.error).length,
      totalCharacters: componentDescriptions.reduce((sum, p) => sum + (p.text?.length || 0), 0),
      averageConfidence: componentDescriptions.reduce((sum, p) => sum + (p.confidence || 0), 0) / componentDescriptions.length,
      pages: componentDescriptions.map(p => ({
        pageNumber: p.pageNumber,
        characters: p.text?.length || 0,
        confidence: p.confidence,
        hasError: !!p.error
      }))
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`OCR汇总报告已保存到: ${summaryPath}`);

    // 显示统计信息
    console.log('\n====== 统计信息 ======');
    console.log(`成功识别页数: ${summary.successPages} / ${summary.totalPages}`);
    console.log(`总提取字符数: ${summary.totalCharacters}`);
    console.log(`平均置信度: ${summary.averageConfidence.toFixed(2)}%`);

    console.log('\n====== 各页字符数统计 ======');
    componentDescriptions.forEach(page => {
      const status = page.error ? '✗ 失败' : '✓ 成功';
      console.log(`第${page.pageNumber}页: ${status} - ${page.text?.length || 0} 字符`);
    });

  } catch (error) {
    console.error('\n整体处理失败:', error);
  }
}

extractAllPagesWithOCR();
