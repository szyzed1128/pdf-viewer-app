const fs = require('fs');
const path = require('path');

async function classifyJianglingText() {
  try {
    console.log('开始分类江铃福顺PDF的OCR文本...\n');

    // 读取OCR提取的原始数据
    const dataPath = path.join(__dirname, 'jiangling-all-text-data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`文档: ${rawData.documentName}`);
    console.log(`总页数: ${rawData.totalPages}`);
    console.log(`待分类的页面数: ${rawData.allPageTexts.length}\n`);

    // 初始化分类数组
    const tableTexts = [];       // 元件标题 - 表格内的文本
    const descriptionTexts = [];  // 元件描述 - 独立说明的文本
    const circuitTexts = [];      // 普通文本 - 电路图中的文本

    // 逐页分析和分类
    for (const pageData of rawData.allPageTexts) {
      const { pageNumber, text, confidence } = pageData;

      if (!text || text.trim().length === 0) {
        console.log(`第 ${pageNumber} 页: 无文本内容，跳过`);
        continue;
      }

      console.log(`\n=== 处理第 ${pageNumber} 页 ===`);
      console.log(`文本长度: ${text.length} 字符`);
      console.log(`置信度: ${confidence?.toFixed(2) || 'N/A'}%`);

      // 将文本按行分割
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      console.log(`有效行数: ${lines.length}`);

      // 分类策略:
      // 1. 表格文本特征: 包含管脚、序号、功能、信号、针脚、连接器等关键词，或包含数字编号模式
      // 2. 独立说明文本特征: 包含"符合"、"应"、"技术条件"、"要求"、"标准"等说明性词汇
      // 3. 电路图文本: 其他文本（标注、元件符号等）

      let pageTableLines = [];
      let pageDescLines = [];
      let pageCircuitLines = [];

      for (const line of lines) {
        // 表格特征关键词
        const tableKeywords = ['管脚', '序号', '功能', '信号', '针脚', '连接器', '插接件',
                               '熔断器', '继电器', '保险丝', '型号', '位置', '线束',
                               'Pin', 'Terminal', '端子', '接线', '插头', '插座',
                               'X1', 'X2', 'X3', 'F1', 'F2', 'J1', 'J2', 'J3', 'CN', 'P'];

        // 说明文本特征关键词
        const descKeywords = ['符合', '应', '技术条件', '要求', '标准', '未注', '制造厂',
                             '日期标记', '公司标志', '开始供应', '样品', '复验',
                             '公差', '材料', '性能', '按', 'QB', 'JB', '规定', '说明'];

        // 检查是否为表格文本
        let isTable = false;
        for (const keyword of tableKeywords) {
          if (line.includes(keyword)) {
            isTable = true;
            break;
          }
        }

        // 检查数字编号模式 (如: "1 |", "01 |", "F1", "X1:1" 等)
        if (!isTable && /[A-Z]\d+[:\-\s]/.test(line)) {
          isTable = true;
        }

        if (isTable) {
          pageTableLines.push(line);
          continue;
        }

        // 检查是否为说明文本
        let isDesc = false;
        for (const keyword of descKeywords) {
          if (line.includes(keyword)) {
            isDesc = true;
            break;
          }
        }

        // 长句子(>20字符)且包含"。"、"，"等标点的可能是说明文本
        if (!isDesc && line.length > 20 && /[。，、；]/.test(line)) {
          isDesc = true;
        }

        if (isDesc) {
          pageDescLines.push(line);
          continue;
        }

        // 其余为电路图文本
        pageCircuitLines.push(line);
      }

      // 保存该页的分类结果
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

    // 更新数据结构
    const classifiedData = {
      documentName: rawData.documentName,
      documentId: rawData.documentId,
      totalPages: rawData.totalPages,
      tableTexts: tableTexts,           // 元件标题 - 表格内的文本 (最高优先级)
      descriptionTexts: descriptionTexts, // 元件描述 - 独立说明文本 (中等优先级)
      circuitTexts: circuitTexts         // 普通文本 - 电路图中文本 (最低优先级)
    };

    // 保存分类后的数据
    const outputPath = path.join(__dirname, 'jiangling-classified-data.json');
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

classifyJianglingText();
