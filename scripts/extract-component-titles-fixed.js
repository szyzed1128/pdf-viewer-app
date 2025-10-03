const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractComponentTitles() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF文件...\n');

    // 使用pdf-parse的页面提取功能
    const pdfData = await pdfParse(dataBuffer, {
      // 逐页提取
      pagerender: async function(pageData) {
        return pageData.getTextContent().then(function(textContent) {
          let text = '';
          textContent.items.forEach(function(item) {
            text += item.str + ' ';
          });
          return text;
        });
      }
    });

    console.log(`PDF总页数: ${pdfData.numpages}\n`);

    // 分析文本,按"电气系统原理图"分割
    const fullText = pdfData.text;
    const pages = fullText.split(/(?=电气系统原理图)/);

    console.log(`通过"电气系统原理图"分割后,找到 ${pages.length} 个部分\n`);

    // 存储元件标题的数据结构
    const componentTitles = [];

    // 遍历每一页,提取元件标题
    pages.forEach((pageContent, index) => {
      if (!pageContent.trim()) return;

      // 页码从1开始计数
      const pageNumber = index === 0 ? 1 : index;

      // 如果是第一个空页,跳过
      if (index === 0 && !pageContent.includes('电气系统原理图')) {
        return;
      }

      // 查找"电气系统原理图"后的第一行非空文本
      const lines = pageContent.split('\n').map(line => line.trim()).filter(line => line);

      console.log(`\n--- 处理第 ${pageNumber} 页 ---`);
      console.log('前5行内容:');
      lines.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i}: ${line}`);
      });

      // 跳过"电气系统原理图"这一行,找到下一行作为元件标题
      const titleIndex = lines.findIndex(line => line.includes('电气系统原理图'));

      if (titleIndex !== -1 && titleIndex + 1 < lines.length) {
        let componentTitle = lines[titleIndex + 1];

        // 清理掉编号部分
        const originalTitle = componentTitle;

        // 移除类似 "3700001-94001.H190926" 的编号
        componentTitle = componentTitle.replace(/\d{7}-\d{5}\.H\d{6}/g, '');
        // 移除类似 "3700001-94011.H190923" 的编号
        componentTitle = componentTitle.replace(/\d{7}-\d{5,6}\.H\d{6}/g, '');
        // 移除类似 "14-1" 的页码
        componentTitle = componentTitle.replace(/\s*\d+-\d+\s*/g, '');
        componentTitle = componentTitle.trim();

        if (componentTitle) {
          componentTitles.push({
            pageNumber: pageNumber,
            title: componentTitle
          });

          console.log(`✓ 提取到标题: ${componentTitle}`);
        } else {
          console.log(`✗ 未能提取标题 (原文: ${originalTitle})`);
        }
      } else {
        console.log(`✗ 未找到"电气系统原理图"或其后的内容`);
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

    // 同时保存为CSV格式
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
