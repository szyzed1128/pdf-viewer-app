const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

async function ocrFromPng() {
  try {
    console.log('开始OCR识别陕汽PDF的PNG图片...\n');

    const outputDirName = 'shanqi-ocr-output';
    const outputDir = path.resolve(process.cwd(), outputDirName);

    // 获取所有PNG文件
    const pngFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    console.log(`找到 ${pngFiles.length} 个PNG文件\n`);

    const allPageTexts = [];

    for (let i = 0; i < pngFiles.length; i++) {
      const pageNumber = i + 1;
      const imagePath = path.join(outputDir, pngFiles[i]);

      console.log(`\n=== 正在处理第 ${pageNumber}/${pngFiles.length} 页 ===`);
      console.log(`图片: ${pngFiles[i]}`);

      try {
        const result = await Tesseract.recognize(
          imagePath,
          'chi_sim+eng',
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

        allPageTexts.push({
          pageNumber: pageNumber,
          text: extractedText,
          confidence: result.data.confidence
        });

        // 每5页保存一次
        if (pageNumber % 5 === 0 || pageNumber === pngFiles.length) {
          const shanqiData = {
            documentName: '陕汽轩德翼3整车电路图',
            documentId: 'doc-003',
            totalPages: pngFiles.length,
            allPageTexts: allPageTexts
          };
          const dataPath = path.join(__dirname, 'shanqi-all-text-data.json');
          fs.writeFileSync(dataPath, JSON.stringify(shanqiData, null, 2), 'utf-8');
          console.log(`  ✓ 已保存中间结果 (${pageNumber}/${pngFiles.length})`);
        }

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

    // 保存最终数据
    const shanqiData = {
      documentName: '陕汽轩德翼3整车电路图',
      documentId: 'doc-003',
      totalPages: pngFiles.length,
      allPageTexts: allPageTexts
    };

    const dataPath = path.join(__dirname, 'shanqi-all-text-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(shanqiData, null, 2), 'utf-8');
    console.log(`完整数据已保存到: ${dataPath}`);

    // 显示统计
    const successCount = allPageTexts.filter(p => p.text && p.text.length > 0).length;
    const avgConfidence = allPageTexts.reduce((sum, p) => sum + (p.confidence || 0), 0) / allPageTexts.length;

    console.log('\n====== 统计信息 ======');
    console.log(`成功识别: ${successCount}/${pngFiles.length} 页`);
    console.log(`平均置信度: ${avgConfidence.toFixed(2)}%`);

  } catch (error) {
    console.error('OCR识别失败:', error);
  }
}

ocrFromPng();
