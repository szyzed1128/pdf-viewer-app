const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 扩展的同义词列表
const newSynonyms = [
  {
    term: '空调',
    synonyms: ['空调系统', 'A/C', 'AC', 'Air Conditioning', '空调压缩机', '制冷系统', 'HVAC']
  },
  {
    term: '大灯',
    synonyms: ['前照灯', 'Headlight', 'Head Lamp', '前大灯', '头灯', '远光灯', '近光灯']
  },
  {
    term: '雾灯',
    synonyms: ['Fog Light', 'Fog Lamp', '前雾灯', '后雾灯']
  },
  {
    term: '转向灯',
    synonyms: ['转向信号灯', 'Turn Signal', 'Indicator', '方向灯', '闪光灯']
  },
  {
    term: '刹车灯',
    synonyms: ['制动灯', 'Brake Light', 'Stop Light', '刹车信号灯']
  },
  {
    term: '倒车灯',
    synonyms: ['倒车信号灯', 'Reverse Light', 'Back-up Light']
  },
  {
    term: 'ABS',
    synonyms: ['Anti-lock Braking System', '防抱死制动系统', '防抱死系统', 'ABS系统']
  },
  {
    term: 'ESP',
    synonyms: ['Electronic Stability Program', '电子稳定程序', 'ESC', '车身稳定系统']
  },
  {
    term: '发动机',
    synonyms: ['Engine', '引擎', '动力总成', 'Powertrain']
  },
  {
    term: '传感器',
    synonyms: ['Sensor', '感应器', '探测器', '检测器']
  },
  {
    term: '开关',
    synonyms: ['Switch', '按钮', 'Button', '控制开关']
  },
  {
    term: '电池',
    synonyms: ['Battery', '蓄电池', '电瓶', '动力电池']
  },
  {
    term: '发电机',
    synonyms: ['Generator', 'Alternator', '交流发电机', '充电机']
  },
  {
    term: '起动机',
    synonyms: ['Starter', 'Starter Motor', '马达', '启动马达', '起动马达']
  },
  {
    term: '喇叭',
    synonyms: ['Horn', '警报器', '鸣笛', '蜂鸣器']
  },
  {
    term: '仪表盘',
    synonyms: ['仪表板', 'Dashboard', 'Instrument Panel', '仪表', '组合仪表']
  },
  {
    term: '燃油泵',
    synonyms: ['油泵', 'Fuel Pump', '汽油泵', '柴油泵']
  },
  {
    term: '点火',
    synonyms: ['Ignition', '点火系统', '点火开关', '打火']
  },
  {
    term: '雨刮',
    synonyms: ['雨刷', 'Wiper', '雨刮器', '刮水器', '风窗雨刮']
  },
  {
    term: '车窗',
    synonyms: ['车窗玻璃', 'Window', '电动车窗', '车门玻璃']
  },
  {
    term: '后视镜',
    synonyms: ['倒车镜', 'Mirror', 'Rearview Mirror', '外后视镜', '内后视镜']
  },
  {
    term: '安全气囊',
    synonyms: ['气囊', 'Airbag', 'SRS', 'Air Bag']
  },
  {
    term: '座椅',
    synonyms: ['Seat', '座位', '驾驶座', '乘客座']
  },
  {
    term: '门锁',
    synonyms: ['Door Lock', '中控锁', '车门锁', '电子锁']
  },
  {
    term: '天窗',
    synonyms: ['Sunroof', 'Moonroof', '全景天窗', '电动天窗']
  }
];

console.log('开始添加扩展同义词...\n');

// 查看哪些术语已存在
db.all('SELECT term FROM synonyms', (err, existing) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }

  const existingTerms = new Set(existing.map(row => row.term));
  let addedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  const addSynonym = (index) => {
    if (index >= newSynonyms.length) {
      console.log(`\n完成！`);
      console.log(`新增: ${addedCount} 个`);
      console.log(`跳过: ${skippedCount} 个`);
      console.log(`更新: ${updatedCount} 个`);

      // 显示最终统计
      db.get('SELECT COUNT(*) as count FROM synonyms', (err, result) => {
        console.log(`\n当前同义词总数: ${result.count}`);
        db.close();
      });
      return;
    }

    const { term, synonyms } = newSynonyms[index];
    const synonymsJson = JSON.stringify(synonyms);

    if (existingTerms.has(term)) {
      // 更新现有记录
      db.run(
        'UPDATE synonyms SET synonyms = ? WHERE term = ?',
        [synonymsJson, term],
        (err) => {
          if (err) {
            console.error(`更新"${term}"失败:`, err);
          } else {
            console.log(`✓ 更新: ${term} (${synonyms.length}个同义词)`);
            updatedCount++;
          }
          addSynonym(index + 1);
        }
      );
    } else {
      // 插入新记录
      db.run(
        'INSERT INTO synonyms (term, synonyms) VALUES (?, ?)',
        [term, synonymsJson],
        (err) => {
          if (err) {
            console.error(`添加"${term}"失败:`, err);
          } else {
            console.log(`✓ 新增: ${term} (${synonyms.length}个同义词)`);
            addedCount++;
          }
          addSynonym(index + 1);
        }
      );
    }
  };

  addSynonym(0);
});
