const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function ocrShanqiHQ() {
  try {
    console.log('开始对高质量陕汽PDF进行OCR识别...\n');

    const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'shanqi_circuit_hq.pdf');
    console.log(`PDF路径: ${pdfPath}\n`);

    const allPageTexts = [];
    const totalPages = 23;

    // 分批处理，每批3页
    const batchSize = 3;

    for (let startPage = 1; startPage <= totalPages; startPage += batchSize) {
      const endPage = Math.min(startPage + batchSize - 1, totalPages);
      const pagesToProcess = [];
      for (let i = startPage; i <= endPage; i++) {
        pagesToProcess.push(i);
      }

      console.log(`\n=== 批次 ${Math.ceil(startPage/batchSize)}: 处理第 ${startPage}-${endPage} 页 ===\n`);

      try {
        // 转换当前批次的页面为PNG
        const pngPages = await pdfToPng(pdfPath, {
          disableFontFace: false,
          useSystemFonts: false,
          viewportScale: 2.0,
          pagesToProcess: pagesToProcess
        });

        console.log(`✓ 转换了 ${pngPages.length} 页为PNG`);

        // 对每一页进行OCR
        for (const pngPage of pngPages) {
          const pageNumber = pngPage.pageNumber;
          console.log(`\n  正在OCR识别第 ${pageNumber} 页...`);

          const { data: { text, confidence } } = await Tesseract.recognize(
            pngPage.content,
            'chi_sim+eng',
            {
              logger: info => {
                if (info.status === 'recognizing text') {
                  process.stdout.write(`\r    进度: ${(info.progress * 100).toFixed(1)}%`);
                }
              }
            }
          );

          console.log(`\n    ✓ 完成 (置信度: ${confidence.toFixed(2)}%)`);
          console.log(`    文本长度: ${text.length} 字符`);

          allPageTexts.push({
            pageNumber: pageNumber,
            text: text,
            confidence: confidence
          });
        }

        // 保存中间结果
        const tempData = {
          documentName: "陕汽轩德翼3整车电路图",
          documentId: "doc-003",
          totalPages: totalPages,
          processedPages: allPageTexts.length,
          allPageTexts: allPageTexts
        };

        const tempPath = path.join(__dirname, 'shanqi-hq-ocr-temp.json');
        fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2), 'utf-8');
        console.log(`  ✓ 已保存中间结果到: ${tempPath}`);

      } catch (error) {
        console.error(`  ✗ 批次 ${Math.ceil(startPage/batchSize)} 处理失败:`, error.message);
        console.log('  继续下一批次...');
      }

      // 等待2秒，让系统释放内存
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 保存最终结果
    const avgConfidence = allPageTexts.reduce((sum, p) => sum + p.confidence, 0) / allPageTexts.length;

    const finalData = {
      documentName: "陕汽轩德翼3整车电路图",
      documentId: "doc-003",
      totalPages: totalPages,
      allPageTexts: allPageTexts
    };

    const outputPath = path.join(__dirname, 'shanqi-hq-all-text-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

    console.log('\n\n====== OCR识别完成 ======');
    console.log(`输出文件: ${outputPath}`);
    console.log(`成功识别: ${allPageTexts.length}/${totalPages} 页`);
    console.log(`平均置信度: ${avgConfidence.toFixed(2)}%\n`);

  } catch (error) {
    console.error('OCR识别失败:', error);
  }
}

ocrShanqiHQ();
