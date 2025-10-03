const { pdfToPng } = require('pdf-to-png-converter');
const path = require('path');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

async function checkDFHPages() {
  console.log('检查DFH PDF的页码问题...\n');

  // 1. 检查数据库
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  const get = promisify(db.get.bind(db));
  const all = promisify(db.all.bind(db));

  const doc = await get('SELECT * FROM documents WHERE id = ?', ['doc-001']);
  console.log(`文档: ${doc.original_name}`);
  console.log(`文件路径: ${doc.file_path}`);
  console.log(`声明总页数: ${doc.page_count}\n`);

  const pages = await all(
    'SELECT page_number FROM document_pages WHERE document_id = ? ORDER BY page_number',
    ['doc-001']
  );

  console.log(`数据库中页码范围: ${pages[0].page_number} - ${pages[pages.length - 1].page_number}`);
  console.log(`数据库中页数: ${pages.length}`);
  console.log(`所有页码: ${pages.map(p => p.page_number).join(', ')}\n`);

  db.close();

  // 2. 检查PDF实际页数
  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'manual.pdf');
  console.log('检查PDF文件...');

  try {
    const pngPages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 1.0,
      outputFolder: 'temp-check',
      pagesToProcess: [1, 2]  // 只检查前2页
    });

    console.log(`PDF实际总页数: ${pngPages.length > 0 ? '至少2页' : '未知'}`);

    for (const page of pngPages) {
      console.log(`  页面 ${page.pageNumber}: ${page.name}`);
    }
  } catch (error) {
    console.log('PDF检查失败:', error.message);
  }
}

checkDFHPages();
