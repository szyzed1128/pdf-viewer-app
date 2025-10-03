const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractComponentTitles() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF文件...\n');
    const pdfData = await pdfParse(dataBuffer);

    // 分析文本结构,找到页面分隔模式
    const fullText = pdfData.text;

    // 使用"电气系统原理图"作为页面标识
    const pages = fullText.split(/(?=电气系统原理图)/);

    console.log(`找到 ${pages.length} 个页面\n`);

    // 存储元件标题的数据结构
    const componentTitles = [];

    // 遍历每一页,提取元件标题
    pages.forEach((pageContent, index) => {
      if (!pageContent.trim()) return;

      const pageNumber = index + 1;

      // 查找"电气系统原理图"后的第一行非空文本
      const lines = pageContent.split('\n').map(line => line.trim()).filter(line => line);

      // 跳过"电气系统原理图"这一行,找到下一行作为元件标题
      const titleIndex = lines.findIndex(line => line.includes('电气系统原理图'));

      if (titleIndex !== -1 && titleIndex + 1 < lines.length) {
        let componentTitle = lines[titleIndex + 1];

        // 清理掉编号部分 (如: 3700001-94001.H190926 和 14-1 这样的编号)
        // 移除类似 "3700001-94001.H190926" 的编号
        componentTitle = componentTitle.replace(/\d{7}-\d{5}\.H\d{6}/g, '');
        // 移除类似 "14-1" 的页码
        componentTitle = componentTitle.replace(/\d+-\d+/g, '');
        componentTitle = componentTitle.trim();

        if (componentTitle) {
          componentTitles.push({
            pageNumber: pageNumber,
            title: componentTitle,
            rawContent: pageContent.substring(0, 200) // 保存前200字符用于调试
          });

          console.log(`第 ${pageNumber} 页: ${componentTitle}`);
        }
      }
    });

    console.log(`\n\n====== 提取结果汇总 ======`);
    console.log(`总共提取了 ${componentTitles.length} 个元件标题\n`);

    // 以表格形式展示
    console.log('页码\t元件标题');
    console.log('----\t--------');
    componentTitles.forEach(item => {
      console.log(`${item.pageNumber}\t${item.title}`);
    });

    // 保存为JSON格式
    const outputPath = path.join(__dirname, 'component-titles.json');
    fs.writeFileSync(outputPath, JSON.stringify(componentTitles, null, 2), 'utf-8');
    console.log(`\n结果已保存到: ${outputPath}`);

    // 同时保存为CSV格式,方便查看
    const csvContent = '页码,元件标题\n' +
      componentTitles.map(item => `${item.pageNumber},"${item.title}"`).join('\n');
    const csvPath = path.join(__dirname, 'component-titles.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`CSV格式已保存到: ${csvPath}`);

    // 预留其他文本类型的数据结构
    const allTextData = {
      documentName: 'DFH系列汽车使用手册',
      totalPages: pdfData.numpages,
      componentTitles: componentTitles,
      componentDescriptions: [], // 预留:元件描述文本
      normalTexts: [] // 预留:普通文本
    };

    const allDataPath = path.join(__dirname, 'manual-all-text-data.json');
    fs.writeFileSync(allDataPath, JSON.stringify(allTextData, null, 2), 'utf-8');
    console.log(`完整数据结构已保存到: ${allDataPath}`);

  } catch (error) {
    console.error('提取失败:', error);
  }
}

extractComponentTitles();
