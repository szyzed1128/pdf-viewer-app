const fs = require('fs');
const path = require('path');

async function classifyShanqiText() {
  try {
    console.log('开始分类陕汽轩德翼3PDF的OCR文本...\n');

    const dataPath = path.join(__dirname, 'shanqi-all-text-data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`文档: ${rawData.documentName}`);
    console.log(`总页数: ${rawData.totalPages}`);
    console.log(`待分类的页面数: ${rawData.allPageTexts.length}\n`);

    const tableTexts = [];
    const descriptionTexts = [];
    const circuitTexts = [];

    for (const pageData of rawData.allPageTexts) {
      const { pageNumber, text, confidence } = pageData;

      if (!text || text.trim().length === 0) {
        console.log(`第 ${pageNumber} 页: 无文本内容，跳过`);
        continue;
      }

      console.log(`\n=== 处理第 ${pageNumber} 页 ===`);
      console.log(`文本长度: ${text.length} 字符`);
      console.log(`置信度: ${confidence?.toFixed(2) || 'N/A'}%`);

      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      console.log(`有效行数: ${lines.length}`);

      let pageTableLines = [];
      let pageDescLines = [];
      let pageCircuitLines = [];

      for (const line of lines) {
        const tableKeywords = ['管脚', '序号', '功能', '信号', '针脚', '连接器', '插接件',
                               '熔断器', '继电器', '保险丝', '型号', '位置', '线束',
                               'Pin', 'Terminal', '端子', '接线', '插头', '插座',
                               'X1', 'X2', 'X3', 'F1', 'F2', 'J1', 'J2', 'J3', 'CN', 'P'];

        const descKeywords = ['符合', '应', '技术条件', '要求', '标准', '未注', '制造厂',
                             '日期标记', '公司标志', '开始供应', '样品', '复验',
                             '公差', '材料', '性能', '按', 'QB', 'JB', '规定', '说明'];

        let isTable = false;
        for (const keyword of tableKeywords) {
          if (line.includes(keyword)) {
            isTable = true;
            break;
          }
        }

        if (!isTable && /[A-Z]\d+[:\-\s]/.test(line)) {
          isTable = true;
        }

        if (isTable) {
          pageTableLines.push(line);
          continue;
        }

        let isDesc = false;
        for (const keyword of descKeywords) {
          if (line.includes(keyword)) {
            isDesc = true;
            break;
          }
        }

        if (!isDesc && line.length > 20 && /[。，、；]/.test(line)) {
          isDesc = true;
        }

        if (isDesc) {
          pageDescLines.push(line);
          continue;
        }

        pageCircuitLines.push(line);
      }

      if (pageTableLines.length > 0) {
        tableTexts.push({
          pageNumber,
          text: pageTableLines.join('\n'),
          lineCount: pageTableLines.length
        });
      }

      if (pageDescLines.length > 0) {
        descriptionTexts.push({
          pageNumber,
          text: pageDescLines.join('\n'),
          lineCount: pageDescLines.length
        });
      }

      if (pageCircuitLines.length > 0) {
        circuitTexts.push({
          pageNumber,
          text: pageCircuitLines.join('\n'),
          lineCount: pageCircuitLines.length
        });
      }

      console.log(`  - 表格文本: ${pageTableLines.length} 行`);
      console.log(`  - 说明文本: ${pageDescLines.length} 行`);
      console.log(`  - 电路图文本: ${pageCircuitLines.length} 行`);
    }

    const classifiedData = {
      documentName: rawData.documentName,
      documentId: rawData.documentId,
      totalPages: rawData.totalPages,
      tableTexts: tableTexts,
      descriptionTexts: descriptionTexts,
      circuitTexts: circuitTexts
    };

    const outputPath = path.join(__dirname, 'shanqi-classified-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(classifiedData, null, 2), 'utf-8');

    console.log('\n\n====== 分类完成 ======');
    console.log(`输出文件: ${outputPath}`);
    console.log(`\n分类统计:`);
    console.log(`  表格文本 (元件标题): ${tableTexts.length} 个片段, ${tableTexts.reduce((sum, t) => sum + t.lineCount, 0)} 行`);
    console.log(`  说明文本 (元件描述): ${descriptionTexts.length} 个片段, ${descriptionTexts.reduce((sum, t) => sum + t.lineCount, 0)} 行`);
    console.log(`  电路图文本 (普通文本): ${circuitTexts.length} 个片段, ${circuitTexts.reduce((sum, t) => sum + t.lineCount, 0)} 行`);

    console.log('\n分类数据已保存，可用于导入数据库。');

  } catch (error) {
    console.error('分类处理失败:', error);
  }
}

classifyShanqiText();
