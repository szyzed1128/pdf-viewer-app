const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');

async function extractJianglingPDF() {
  try {
    console.log('开始处理江铃福顺整车电路图册PDF (268页)...\n');

    const pdfPath = path.resolve(__dirname, '../public/pdfs/jiangling_circuit.pdf');
    const outputDirName = 'jiangling-ocr-output';
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
    const allPageTexts = [];

    console.log('步骤2: 使用OCR识别每一页的文字...');
    console.log('(这将需要较长时间,请耐心等待)\n');

    // 逐页进行OCR识别
    for (let i = 0; i < pngPages.length; i++) {
      const pageNumber = i + 1;
      const imagePath = path.resolve(process.cwd(), outputDirName, pngPages[i].name);

      console.log(`\n=== 正在处理第 ${pageNumber}/${pngPages.length} 页 ===`);
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
        allPageTexts.push({
          pageNumber: pageNumber,
          text: extractedText,
          confidence: result.data.confidence
        });

        // 保存单页文本文件
        const pageTextPath = path.join(outputDir, `page${pageNumber}-ocr.txt`);
        fs.writeFileSync(pageTextPath, extractedText, 'utf-8');

      } catch (error) {
        console.error(`\n  ✗ 第 ${pageNumber} 页识别失败:`, error.message);
        allPageTexts.push({
          pageNumber: pageNumber,
          text: '',
          error: error.message
        });
      }
    }

    console.log('\n\n====== 所有页面OCR识别完成 ======\n');

    // 创建数据结构
    const jianglingData = {
      documentName: '江铃福顺整车电路图册',
      documentId: 'doc-002',
      totalPages: pngPages.length,
      tableTexts: [],      // 元件标题 - 表格内的文本
      descriptionTexts: [], // 元件描述 - 独立说明文本
      circuitTexts: []      // 普通文本 - 电路图中的文本
    };

    // 暂时将所有OCR文本存入一个临时字段，等待后续分类处理
    jianglingData.allPageTexts = allPageTexts;

    // 保存完整数据
    const dataPath = path.join(__dirname, 'jiangling-all-text-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(jianglingData, null, 2), 'utf-8');
    console.log(`完整数据已保存到: ${dataPath}`);

    // 保存汇总报告
    const summaryPath = path.join(outputDir, 'ocr-summary.json');
    const summary = {
      totalPages: pngPages.length,
      successPages: allPageTexts.filter(p => !p.error).length,
      failedPages: allPageTexts.filter(p => p.error).length,
      totalCharacters: allPageTexts.reduce((sum, p) => sum + (p.text?.length || 0), 0),
      averageConfidence: allPageTexts.reduce((sum, p) => sum + (p.confidence || 0), 0) / allPageTexts.length,
      pages: allPageTexts.map(p => ({
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
    allPageTexts.forEach(page => {
      const status = page.error ? '✗ 失败' : '✓ 成功';
      console.log(`第${page.pageNumber}页: ${status} - ${page.text?.length || 0} 字符`);
    });

    console.log('\n\n提示: OCR文本提取完成，后续需要对文本进行分类处理（表格/说明/电路图）');

  } catch (error) {
    console.error('\n整体处理失败:', error);
  }
}

extractJianglingPDF();
