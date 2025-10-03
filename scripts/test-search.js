const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 模拟搜索引擎的expandQuery函数
function expandQuery(query, synonymsMap) {
  const terms = query.toLowerCase().split(/\s+/);
  const expandedTerms = new Set();

  terms.forEach(term => {
    expandedTerms.add(term);
    const synonymList = synonymsMap.get(term);
    if (synonymList) {
      synonymList.forEach(synonym => expandedTerms.add(synonym.toLowerCase()));
    }
  });

  return Array.from(expandedTerms);
}

// 构建同义词映射
function buildSynonymsMap(synonymsData) {
  const synonymsMap = new Map();

  synonymsData.forEach(({ term, synonyms }) => {
    const allTerms = [term, ...synonyms];
    allTerms.forEach(t => {
      synonymsMap.set(t.toLowerCase(), allTerms);
    });
  });

  return synonymsMap;
}

// 在页面文本中搜索
function searchInPageText(pageText, searchTerms) {
  let matches = 0;
  const foundIn = [];

  // 提取三种类型的文本
  const titleMatch = pageText.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
  const descMatch = pageText.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
  const textMatch = pageText.match(/\[TEXT\](.*?)\[\/TEXT\]/s);

  const titleText = titleMatch ? titleMatch[1] : '';
  const descText = descMatch ? descMatch[1] : '';
  const circuitText = textMatch ? textMatch[1] : '';

  // 在标题中搜索
  if (titleText) {
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      const termMatches = (titleText.match(regex) || []).length;
      if (termMatches > 0) {
        matches += termMatches;
        if (!foundIn.includes('标题')) foundIn.push('标题');
      }
    });
  }

  // 在描述中搜索
  if (descText) {
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      const termMatches = (descText.match(regex) || []).length;
      if (termMatches > 0) {
        matches += termMatches;
        if (!foundIn.includes('描述')) foundIn.push('描述');
      }
    });
  }

  // 在文本中搜索
  if (circuitText) {
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      const termMatches = (circuitText.match(regex) || []).length;
      if (termMatches > 0) {
        matches += termMatches;
        if (!foundIn.includes('文本')) foundIn.push('文本');
      }
    });
  }

  return { matches, foundIn };
}

console.log('=== PDF搜索功能测试 ===\n');

// 首先获取同义词数据
db.all('SELECT * FROM synonyms', [], (err, synonymsData) => {
  if (err) {
    console.error('获取同义词失败:', err);
    db.close();
    return;
  }

  const parsedSynonyms = synonymsData.map(row => ({
    term: row.term,
    synonyms: JSON.parse(row.synonyms)
  }));

  const synonymsMap = buildSynonymsMap(parsedSynonyms);

  console.log(`✓ 加载了 ${synonymsData.length} 个同义词术语\n`);

  // 测试用例
  const testCases = [
    { documentId: 'doc-002', query: '连接器', name: '江铃福顺 - 连接器' },
    { documentId: 'doc-002', query: '熔断器', name: '江铃福顺 - 熔断器' },
    { documentId: 'doc-002', query: 'ADAS', name: '江铃福顺 - ADAS' },
    { documentId: 'doc-002', query: '自动变速器', name: '江铃福顺 - 自动变速器' },
    { documentId: 'doc-003', query: '玉柴', name: '陕汽轩德翼3 - 玉柴' },
    { documentId: 'doc-003', query: '天然气', name: '陕汽轩德翼3 - 天然气' },
    { documentId: 'doc-003', query: '国六', name: '陕汽轩德翼3 - 国六' },
    { documentId: 'doc-003', query: 'ECU', name: '陕汽轩德翼3 - ECU' }
  ];

  let testIndex = 0;

  function runNextTest() {
    if (testIndex >= testCases.length) {
      console.log('\n=== 测试完成 ===');
      db.close();
      return;
    }

    const testCase = testCases[testIndex];
    testIndex++;

    console.log(`\n【测试 ${testIndex}/${testCases.length}】${testCase.name}`);
    console.log(`  查询词: "${testCase.query}"`);

    // 扩展查询词（包含同义词）
    const searchTerms = expandQuery(testCase.query, synonymsMap);
    console.log(`  扩展后: ${searchTerms.slice(0, 5).join(', ')}${searchTerms.length > 5 ? ` ... (共${searchTerms.length}个)` : ''}`);

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
          const result = searchInPageText(page.page_text, searchTerms);
          if (result.matches > 0) {
            totalMatches += result.matches;
            matchedPages.push({
              pageNumber: page.page_number,
              matches: result.matches,
              foundIn: result.foundIn
            });
          }
        });

        if (totalMatches > 0) {
          console.log(`  ✓ 找到 ${totalMatches} 个匹配项，涉及 ${matchedPages.length} 个页面`);
          console.log(`  匹配页面: ${matchedPages.slice(0, 5).map(p => `第${p.pageNumber}页(${p.matches}处)`).join(', ')}${matchedPages.length > 5 ? ` ...` : ''}`);

          // 显示第一个匹配页面的详情
          if (matchedPages.length > 0) {
            const firstMatch = matchedPages[0];
            console.log(`  位置类型: ${firstMatch.foundIn.join(', ')}`);
          }
        } else {
          console.log(`  ⚠ 未找到匹配项`);
        }

        runNextTest();
      }
    );
  }

  runNextTest();
});
