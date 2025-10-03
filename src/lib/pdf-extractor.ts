import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface PageData {
  pageNumber: number;
  text: string;
  componentNames: string[];
}

export interface PDFExtractionResult {
  totalPages: number;
  pages: PageData[];
  fullText: string;
}

/**
 * 从PDF文件中提取文本，按页分离
 */
export async function extractPDFText(filePath: string): Promise<PDFExtractionResult> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // pdf-parse 不直接支持按页提取，我们需要通过分析文本来分页
    // 通常PDF文本中会有换页符 \f，我们用它来分页
    const fullText = pdfData.text;
    const pageTexts = fullText.split('\f').filter(text => text.trim().length > 0);

    const pages: PageData[] = pageTexts.map((text, index) => {
      const componentNames = extractComponentNames(text);
      return {
        pageNumber: index + 1,
        text: text.trim(),
        componentNames
      };
    });

    return {
      totalPages: pdfData.numpages,
      pages,
      fullText
    };
  } catch (error) {
    console.error(`提取PDF失败 ${filePath}:`, error);
    throw error;
  }
}

/**
 * 从文本中提取元器件名称
 * 识别规则：
 * - 中文元件名（如：油门踏板、挂车控制模块、ECU等）
 * - 英文缩写（如：APS、TCM、ECU等）
 * - 英文全称（如：Electronic Control Unit等）
 */
function extractComponentNames(text: string): string[] {
  const componentNames = new Set<string>();

  // 常见元器件关键词列表
  const componentKeywords = [
    '油门踏板', '踏板位置传感器', 'Accelerator Pedal Sensor', 'APS',
    '挂车控制模块', 'Trailer Control Module', 'TCM', '拖车控制器',
    'ECU', 'Electronic Control Unit', '电子控制单元', '发动机控制单元',
    '针脚', '引脚', 'Pin', 'Terminal', '端子',
    'ADAS', '自适应巡航', 'AT', '自动变速器',
    '传感器', 'Sensor', '控制器', 'Controller', '模块', 'Module'
  ];

  // 在文本中查找这些关键词
  componentKeywords.forEach(keyword => {
    // 使用正则表达式进行不区分大小写的匹配
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(text)) {
      componentNames.add(keyword);
    }
  });

  // 额外：查找数字+针（如：120针）
  const pinMatch = text.match(/\d+针/g);
  if (pinMatch) {
    pinMatch.forEach(pin => componentNames.add(pin));
  }

  return Array.from(componentNames);
}

/**
 * 提取多个PDF文件
 */
export async function extractMultiplePDFs(filePaths: string[]): Promise<Map<string, PDFExtractionResult>> {
  const results = new Map<string, PDFExtractionResult>();

  for (const filePath of filePaths) {
    try {
      console.log(`正在提取: ${filePath}`);
      const result = await extractPDFText(filePath);
      results.set(filePath, result);
      console.log(`✓ 成功提取 ${filePath}: ${result.totalPages} 页`);
    } catch (error) {
      console.error(`✗ 提取失败 ${filePath}:`, error);
    }
  }

  return results;
}
