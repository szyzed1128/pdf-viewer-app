const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractComponentTitles() {
  try {
    const pdfPath = path.join(__dirname, '../public/pdfs/manual.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('开始解析PDF文件...\n');
    const pdfData = await pdfParse(dataBuffer);

    console.log(`PDF总页数: ${pdfData.numpages}\n`);

    // 使用"电气系统原理图"分割文本
    const fullText = pdfData.text;
    const sections = fullText.split('电气系统原理图');

    console.log(`通过"电气系统原理图"分割后,找到 ${sections.length} 个部分\n`);

    // 存储元件标题的数据结构
    const componentTitles = [];

    // 遍历每个部分(跳过第一个空部分)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      const pageNumber = i; // 页码从1开始

      console.log(`\n=== 第 ${pageNumber} 页 ===`);
      console.log('原始内容(前150字符):');
      console.log(section.substring(0, 150));

      // 提取第一行文本作为标题(去除多余空格和换行)
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length > 0) {
        let titleLine = lines[0];

        console.log(`\n第一行原始文本: "${titleLine}"`);

        // 清理标题:
        // 1. 移除编号格式: 3700001-94001.H190926
        titleLine = titleLine.replace(/\d{7}-\d{4,6}\.?H?\d{6}/g, '');
        // 2. 移除页码格式: 14-1, 14-2 等
        titleLine = titleLine.replace(/\s+\d+-\d+\s*/g, ' ');
        // 3. 清理多余空格
        titleLine = titleLine.replace(/\s+/g, ' ').trim();

        console.log(`清理后的标题: "${titleLine}"`);

        if (titleLine && titleLine.length > 0) {
          componentTitles.push({
            pageNumber: pageNumber,
            title: titleLine
          });
          console.log(`✓ 成功提取`);
        } else {
          console.log(`✗ 清理后标题为空`);
        }
      } else {
        console.log(`✗ 未找到任何文本行`);
      }
    }

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

    console.log('\n\n====== 详细列表 ======');
    componentTitles.forEach(item => {
      console.log(`- 第${item.pageNumber}页: ${item.title}`);
    });

  } catch (error) {
    console.error('提取失败:', error);
  }
}

extractComponentTitles();
