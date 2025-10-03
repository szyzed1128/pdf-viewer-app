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

      // 提取所有行
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length > 0) {
        let titleLine = '';

        // 查找第一个有效的标题行(不是纯数字页码格式)
        for (let j = 0; j < lines.length && j < 3; j++) {
          const line = lines[j];
          // 跳过纯页码格式: 14-1, 14-2 等
          if (/^\d+-\d+$/.test(line)) {
            console.log(`跳过页码行: "${line}"`);
            continue;
          }
          // 跳过编号格式: 3700001-94001.H190926
          if (/^\d{7}-\d{4,6}\.?H?\d{6}$/.test(line)) {
            console.log(`跳过编号行: "${line}"`);
            continue;
          }
          // 找到有效标题
          titleLine = line;
          console.log(`找到标题行: "${titleLine}"`);
          break;
        }

        if (!titleLine && lines.length > 0) {
          // 如果前面都是页码/编号,使用第一个非数字行
          titleLine = lines[0];
        }

        // 清理标题:移除可能残留的编号和页码
        titleLine = titleLine.replace(/\d{7}-\d{4,6}\.?H?\d{6}/g, '');
        titleLine = titleLine.replace(/\s+\d+-\d+\s*/g, ' ');
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
