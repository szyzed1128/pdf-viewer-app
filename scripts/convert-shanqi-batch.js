const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');

async function convertBatch() {
  console.log('分批转换陕汽PDF页面...\n');

  const pdfPath = path.resolve(__dirname, '../public/pdfs/shanqi_circuit.pdf');
  const outputFolder = 'shanqi-ocr-output';

  // 创建输出目录
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  console.log(`PDF路径: ${pdfPath}`);
  console.log(`输出目录: ${outputFolder}\n`);

  try {
    // 分5批处理,每批5页左右
    const batches = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23]
    ];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const pagesToProcess = batches[batchIndex];
      console.log(`\n=== 批次 ${batchIndex + 1}/${batches.length}: 页面 ${pagesToProcess.join(', ')} ===`);

      for (const pageNum of pagesToProcess) {
        try {
          console.log(`  转换第${pageNum}页...`);
          const pages = await pdfToPng(pdfPath, {
            disableFontFace: false,
            useSystemFonts: false,
            viewportScale: 2.0,
            outputFolder: outputFolder,
            pagesToProcess: [pageNum],
            strictPagesToProcess: false,
            verbosityLevel: 0
          });

          if (pages && pages.length > 0) {
            console.log(`  ✓ 第${pageNum}页: ${pages[0].name}`);
          }
        } catch (error) {
          console.error(`  ✗ 第${pageNum}页失败: ${error.message}`);
        }
      }
    }

    // 统计结果
    const pngFiles = fs.readdirSync(outputFolder).filter(f => f.endsWith('.png'));
    console.log(`\n✓ 转换完成: ${pngFiles.length} 个PNG文件`);

  } catch (error) {
    console.error('转换失败:', error.message);
  }
}

convertBatch();
