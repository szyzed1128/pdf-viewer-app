import path from 'path';
import { extractPDFText } from '../lib/pdf-extractor';
import { database } from '../lib/database';

// PDF文件映射
const PDF_FILES = [
  { id: 'doc-001', filename: 'manual.pdf' },
  { id: 'doc-002', filename: 'jiangling_circuit.pdf' },
  { id: 'doc-003', filename: 'shanqi_circuit.pdf' },
  { id: 'doc-004', filename: 'jiefang_wiring.pdf' }
];

async function main() {
  console.log('开始提取PDF文本...\n');

  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('数据库已初始化\n');

  for (const doc of PDF_FILES) {
    try {
      const pdfPath = path.join(process.cwd(), 'public', 'pdfs', doc.filename);
      console.log(`处理文档: ${doc.id} - ${doc.filename}`);

      // 提取PDF文本
      const extractionResult = await extractPDFText(pdfPath);
      console.log(`  提取到 ${extractionResult.totalPages} 页`);

      // 存储每一页到数据库
      for (const page of extractionResult.pages) {
        await database.insertDocumentPage(
          doc.id,
          page.pageNumber,
          page.text,
          page.componentNames
        );
        console.log(`  ✓ 第 ${page.pageNumber} 页已存储 (元件: ${page.componentNames.length} 个)`);
      }

      console.log(`✓ 文档 ${doc.id} 处理完成\n`);
    } catch (error) {
      console.error(`✗ 处理文档 ${doc.id} 失败:`, error);
    }
  }

  console.log('所有PDF文本提取完成！');
  process.exit(0);
}

main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
