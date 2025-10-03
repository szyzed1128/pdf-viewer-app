const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 测试所有文档的搜索功能 ===\n');

// 测试用例
const testCases = [
  { documentId: 'doc-001', query: '油门踏板', name: 'DFH系列 - 油门踏板' },
  { documentId: 'doc-001', query: 'ECU', name: 'DFH系列 - ECU' },
  { documentId: 'doc-004', query: '针脚', name: '解放J6L - 针脚' },
  { documentId: 'doc-004', query: '挂车', name: '解放J6L - 挂车' },
  { documentId: 'doc-002', query: '连接器', name: '江铃福顺 - 连接器' },
  { documentId: 'doc-002', query: '熔断器', name: '江铃福顺 - 熔断器' },
  { documentId: 'doc-003', query: '控制', name: '陕汽轩德翼3 - 控制' },
];

let testIndex = 0;

function runNextTest() {
  if (testIndex >= testCases.length) {
    console.log('\n=== 测试完成 ===\n');

    // 检查各文档的页面数据格式
    console.log('=== 检查各文档的数据格式 ===\n');

    ['doc-001', 'doc-004', 'doc-002', 'doc-003'].forEach(docId => {
      db.get(
        'SELECT * FROM document_pages WHERE document_id = ? LIMIT 1',
        [docId],
        (err, page) => {
          if (!err && page) {
            console.log(`${docId} 第一页文本格式:`);
            const hasTitle = page.page_text.includes('[TITLE]');
            const hasDesc = page.page_text.includes('[DESCRIPTION]');
            const hasText = page.page_text.includes('[TEXT]');
            console.log(`  包含[TITLE]: ${hasTitle ? '✓' : '✗'}`);
            console.log(`  包含[DESCRIPTION]: ${hasDesc ? '✓' : '✗'}`);
            console.log(`  包含[TEXT]: ${hasText ? '✓' : '✗'}`);
            console.log('  前100字符:', page.page_text.substring(0, 100).replace(/\n/g, ' '));
            console.log('');
          }

          if (docId === 'doc-003') {
            db.close();
          }
        }
      );
    });

    return;
  }

  const testCase = testCases[testIndex];
  testIndex++;

  console.log(`【测试 ${testIndex}/${testCases.length}】${testCase.name}`);
  console.log(`  查询词: "${testCase.query}"`);

  // 获取文档页面
  db.all(
    'SELECT * FROM document_pages WHERE document_id = ?',
    [testCase.documentId],
    (err, pages) => {
      if (err) {
        console.error('  ❌ 查询失败:', err);
        runNextTest();
        return;
      }

      let totalMatches = 0;
      const matchedPages = [];

      pages.forEach(page => {
        const regex = new RegExp(testCase.query, 'gi');
        const matches = (page.page_text.match(regex) || []).length;

        if (matches > 0) {
          totalMatches += matches;
          matchedPages.push({
            pageNumber: page.page_number,
            matches: matches
          });
        }
      });

      if (totalMatches > 0) {
        console.log(`  ✓ 找到 ${totalMatches} 个匹配项，涉及 ${matchedPages.length} 个页面`);
        console.log(`  匹配页面: ${matchedPages.slice(0, 5).map(p => `第${p.pageNumber}页(${p.matches}处)`).join(', ')}${matchedPages.length > 5 ? ` ...` : ''}`);
      } else {
        console.log(`  ⚠ 未找到匹配项`);
      }

      console.log('');
      runNextTest();
    }
  );
}

runNextTest();
