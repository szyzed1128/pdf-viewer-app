const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 为江铃和陕汽PDF添加更多专业术语
const newSynonyms = [
  {
    term: '连接器',
    synonyms: ['插接件', 'Connector', '接插件', '插头', '插座', '接口']
  },
  {
    term: '熔断器',
    synonyms: ['保险丝', 'Fuse', '保险', '熔丝', '电气保护器']
  },
  {
    term: '继电器',
    synonyms: ['Relay', '中继器', '电磁继电器', '开关继电器']
  },
  {
    term: '线束',
    synonyms: ['Wiring Harness', '电线束', '导线束', '线缆', '电缆束', 'Harness']
  },
  {
    term: '自动变速器',
    synonyms: ['AT', 'Automatic Transmission', '自动挡', '自动变速箱', 'TCU']
  },
  {
    term: 'ADAS',
    synonyms: ['Advanced Driver Assistance Systems', '自适应巡航', '先进驾驶辅助系统', '驾驶辅助']
  },
  {
    term: '发动机',
    synonyms: ['Engine', '引擎', '动力单元', 'Motor', '马达']
  },
  {
    term: '传感器',
    synonyms: ['Sensor', '感应器', '探测器', '检测器']
  },
  {
    term: '电路图',
    synonyms: ['Circuit Diagram', '线路图', '电气原理图', 'Wiring Diagram', '接线图', '电路原理图']
  },
  {
    term: '国六',
    synonyms: ['国六排放', 'China VI', '国VI', '排放标准', 'CN6']
  },
  {
    term: '天然气',
    synonyms: ['Natural Gas', 'NG', 'CNG', '压缩天然气', '气体燃料']
  },
  {
    term: '玉柴',
    synonyms: ['YC', 'Yuchai', 'YUCHAI', '玉柴发动机']
  },
  {
    term: '锡柴',
    synonyms: ['FAW', 'Xichai', '一汽锡柴', 'CA']
  },
  {
    term: '管脚',
    synonyms: ['针脚', '引脚', 'Pin', 'Terminal', '端子', '接线端', '脚位']
  },
  {
    term: '序号',
    synonyms: ['编号', 'No.', 'Number', '序列号', '标号']
  },
  {
    term: '信号',
    synonyms: ['Signal', '电信号', '信号线', '数据线']
  },
  {
    term: '功能',
    synonyms: ['Function', '作用', '用途', '用处']
  },
  {
    term: '型号',
    synonyms: ['Model', '规格', '牌号', 'Type', '款型']
  },
  {
    term: '位置',
    synonyms: ['Position', '安装位置', '布置位置', 'Location', '位点']
  }
];

console.log('=== 添加新同义词到数据库 ===\n');

const addSynonym = (term, synonyms) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM synonyms WHERE term = ?', [term], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        console.log(`✓ 术语 "${term}" 已存在，跳过`);
        resolve();
      } else {
        db.run(
          'INSERT INTO synonyms (term, synonyms) VALUES (?, ?)',
          [term, JSON.stringify(synonyms)],
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`✓ 添加术语 "${term}" 及其 ${synonyms.length} 个同义词`);
              resolve();
            }
          }
        );
      }
    });
  });
};

(async () => {
  try {
    for (const item of newSynonyms) {
      await addSynonym(item.term, item.synonyms);
    }

    console.log('\n=== 添加完成 ===');
    console.log(`总计处理 ${newSynonyms.length} 个术语\n`);

    // 显示最终统计
    db.all('SELECT COUNT(*) as count FROM synonyms', [], (err, rows) => {
      if (!err && rows.length > 0) {
        console.log(`数据库中现有 ${rows[0].count} 个术语\n`);
      }
      db.close();
    });
  } catch (error) {
    console.error('错误:', error);
    db.close();
  }
})();
