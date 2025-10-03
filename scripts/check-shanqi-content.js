const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查陕汽PDF内容 ===\n');

db.all(
  'SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number LIMIT 5',
  ['doc-003'],
  (err, pages) => {
    if (err) {
      console.error('查询错误:', err);
      db.close();
      return;
    }

    console.log(`找到 ${pages.length} 页数据\n`);

    pages.forEach((page, index) => {
      console.log(`\n【第 ${page.page_number} 页】`);
      console.log('文本长度:', page.page_text.length);

      // 提取各部分
      const titleMatch = page.page_text.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
      const descMatch = page.page_text.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
      const textMatch = page.page_text.match(/\[TEXT\](.*?)\[\/TEXT\]/s);

      if (titleMatch && titleMatch[1].trim()) {
        console.log('\n标题部分 (前200字符):');
        console.log(titleMatch[1].substring(0, 200).replace(/\n/g, ' '));
      }

      if (descMatch && descMatch[1].trim()) {
        console.log('\n描述部分 (前200字符):');
        console.log(descMatch[1].substring(0, 200).replace(/\n/g, ' '));
      }

      if (textMatch && textMatch[1].trim()) {
        console.log('\n文本部分 (前500字符):');
        console.log(textMatch[1].substring(0, 500).replace(/\n/g, ' '));
      }

      // 检查是否包含特定关键词
      const keywords = ['玉柴', '天然气', '国六', 'ECU', 'Econtrol', '120针'];
      const found = keywords.filter(kw => page.page_text.includes(kw));
      if (found.length > 0) {
        console.log(`\n包含关键词: ${found.join(', ')}`);
      }
    });

    // 检查所有页面是否包含关键词
    console.log('\n\n=== 全文档关键词统计 ===\n');
    db.all(
      'SELECT * FROM document_pages WHERE document_id = ?',
      ['doc-003'],
      (err, allPages) => {
        if (err) {
          console.error('查询错误:', err);
          db.close();
          return;
        }

        const allText = allPages.map(p => p.page_text).join('\n');
        const keywords = [
          '玉柴', 'YC', 'Yuchai',
          '天然气', 'Natural Gas', 'CNG',
          '国六', 'CN6',
          'ECU', 'Electronic',
          'Econtrol', '120',
          '发动机', 'Engine',
          '控制', 'Control'
        ];

        keywords.forEach(kw => {
          const regex = new RegExp(kw, 'gi');
          const matches = (allText.match(regex) || []).length;
          if (matches > 0) {
            console.log(`"${kw}": ${matches} 次`);
          }
        });

        db.close();
      }
    );
  }
);
