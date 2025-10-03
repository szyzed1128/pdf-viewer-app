const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs');
const path = require('path');

async function convertShanqiHQPages() {
  try {
    console.log('开始转换高质量陕汽PDF为PNG图片...\n');

    const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'shanqi_circuit_hq.pdf');
    const outputDir = path.join(__dirname, 'shanqi-hq-preview');

    // 使用绝对路径避免路径问题
    const absoluteOutputDir = path.resolve(outputDir);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`PDF路径: ${pdfPath}`);
    console.log(`输出目录: ${outputDir}\n`);

    // 由于文件较大(119MB)，我们分批转换
    console.log('分批转换策略: 每次5页，避免内存溢出\n');

    const totalPages = 23;
    const batchSize = 5;

    for (let startPage = 1; startPage <= totalPages; startPage += batchSize) {
      const endPage = Math.min(startPage + batchSize - 1, totalPages);

      console.log(`\n=== 批次 ${Math.ceil(startPage/batchSize)}: 转换第 ${startPage}-${endPage} 页 ===`);

      try {
        const pngPages = await pdfToPng(pdfPath, {
          disableFontFace: false,
          useSystemFonts: false,
          viewportScale: 2.0,
          outputFolder: absoluteOutputDir,
          outputFileMask: 'page',
          paginationPattern: 'actual',
          strictPagination: true,
          pagesToProcess: startPage === 1 ? [1,2,3,4,5] :
                         startPage === 6 ? [6,7,8,9,10] :
                         startPage === 11 ? [11,12,13,14,15] :
                         startPage === 16 ? [16,17,18,19,20] :
                         [21,22,23]
        });

        console.log(`✓ 成功转换 ${pngPages.length} 页`);

        for (const png of pngPages) {
          console.log(`  - 第${png.pageNumber}页: ${png.name}`);
        }

      } catch (error) {
        console.error(`✗ 批次 ${Math.ceil(startPage/batchSize)} 转换失败:`, error.message);
        console.log('继续下一批次...');
      }

      // 等待2秒，让系统释放内存
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n====== 转换完成 ======');
    console.log(`图片保存在: ${outputDir}`);

    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
    console.log(`\n成功转换 ${files.length} 个页面`);

  } catch (error) {
    console.error('转换失败:', error);
  }
}

convertShanqiHQPages();
