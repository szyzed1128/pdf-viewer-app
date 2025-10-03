import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private async init() {
    const run = promisify(this.db.run.bind(this.db));

    await run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_size INTEGER,
        page_count INTEGER,
        extracted_text TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS document_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        page_text TEXT NOT NULL,
        component_names TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        UNIQUE(document_id, page_number)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS synonyms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL,
        synonyms TEXT NOT NULL
      )
    `);

    await this.insertDefaultSynonyms();
    await this.insertDefaultDocuments();
  }

  private async insertDefaultSynonyms() {

    const synonymsData = [
      {
        term: '油门踏板',
        synonyms: ['踏板位置传感器', 'Accelerator Pedal Sensor', 'APS', '加速踏板', '油门传感器']
      },
      {
        term: '挂车控制模块',
        synonyms: ['Trailer Control Module', 'TCM', '拖车控制器', '挂车控制器', '拖车模块']
      },
      {
        term: 'ECU',
        synonyms: ['Electronic Control Unit', '电子控制单元', '发动机控制单元', '控制模块']
      },
      {
        term: '针脚',
        synonyms: ['引脚', 'Pin', 'Terminal', '端子', '接线端']
      },
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

    for (const item of synonymsData) {
      const existing = await new Promise((resolve, reject) => {
        this.db.get('SELECT * FROM synonyms WHERE term = ?', [item.term], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!existing) {
        await new Promise((resolve, reject) => {
          this.db.run('INSERT INTO synonyms (term, synonyms) VALUES (?, ?)', [
            item.term,
            JSON.stringify(item.synonyms)
          ], (err) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
      }
    }
  }

  private async insertDefaultDocuments() {
    const documentsData = [
      {
        id: 'doc-001',
        filename: 'manual.pdf',
        originalName: 'DFH系列汽车使用手册',
        filePath: '/pdfs/manual.pdf',
        fileSize: 24469660,
        pageCount: 14,
        extractedText: '汽车使用手册 DFH1180E3 DFH5180CCYE3 DFH5180XXYE3系列 发动机控制系统 ECU 电子控制单元 油门踏板 加速踏板 APS 踏板位置传感器 针脚连接 电路图 故障诊断 维修手册'
      },
      {
        id: 'doc-002',
        filename: 'jiangling_circuit.pdf',
        originalName: '江铃福顺整车电路图册',
        filePath: '/pdfs/jiangling_circuit.pdf',
        fileSize: 46091594,
        pageCount: 268,
        extractedText: '江铃 福顺 整车电路图册 ADAS 自适应巡航 AT 自动变速器 ECU 电子控制单元 发动机控制模块 挂车控制模块 拖车控制器 TCM Trailer Control Module 油门踏板 踏板位置传感器 Accelerator Pedal Sensor APS 针脚 引脚 Pin Terminal 端子 接线端 电路连接图'
      },
      {
        id: 'doc-003',
        filename: 'shanqi_circuit.pdf',
        originalName: '陕汽轩德翼3整车电路图',
        filePath: '/pdfs/shanqi_circuit.pdf',
        fileSize: 57289722,
        pageCount: 23,
        extractedText: '陕汽 轩德翼3 整车电路图 玉柴 ECI-CFV 天然气系统 Econtrol 120针 ECU Electronic Control Unit 电子控制单元 发动机控制单元 控制模块 国六 排放标准 油门踏板 加速踏板 APS 踏板位置传感器 挂车控制模块 针脚图 端子连接 电路原理图'
      },
      {
        id: 'doc-004',
        filename: 'jiefang_wiring.pdf',
        originalName: '一汽解放新款J6L整车线束图',
        filePath: '/pdfs/jiefang_wiring.pdf',
        fileSize: 9255323,
        pageCount: 13,
        extractedText: '一汽解放 新款J6L 整车线束图 选装配置 锡柴 自主FA10 气驱罐 国六 发动机控制系统 ECU 电子控制单元 油门踏板连接 APS传感器 挂车控制模块 TCM 针脚号 Pin脚定义 线束连接图 电气原理图'
      }
    ];

    for (const doc of documentsData) {
      const existing = await new Promise((resolve, reject) => {
        this.db.get('SELECT * FROM documents WHERE id = ?', [doc.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!existing) {
        await new Promise((resolve, reject) => {
          this.db.run(
            'INSERT INTO documents (id, filename, original_name, file_path, file_size, page_count, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [doc.id, doc.filename, doc.originalName, doc.filePath, doc.fileSize, doc.pageCount, doc.extractedText],
            (err) => {
              if (err) reject(err);
              else resolve(undefined);
            }
          );
        });
      } else {
        // 更新现有文档的页数和文件大小信息
        await new Promise((resolve, reject) => {
          this.db.run(
            'UPDATE documents SET page_count = ?, file_size = ? WHERE id = ?',
            [doc.pageCount, doc.fileSize, doc.id],
            (err) => {
              if (err) reject(err);
              else resolve(undefined);
            }
          );
        });
      }
    }
  }

  async insertDocument(doc: any) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO documents (id, filename, original_name, file_path, file_size, page_count, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [doc.id, doc.filename, doc.originalName, doc.filePath, doc.fileSize, doc.pageCount, doc.extractedText],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  // 新增：插入文档页数据
  async insertDocumentPage(documentId: string, pageNumber: number, pageText: string, componentNames: string[] = []) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO document_pages (document_id, page_number, page_text, component_names) VALUES (?, ?, ?, ?)',
        [documentId, pageNumber, pageText, JSON.stringify(componentNames)],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  // 新增：获取文档的所有页
  async getDocumentPages(documentId: string) {
    const pages: any = await new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [documentId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    return pages.map((page: any) => ({
      ...page,
      component_names: page.component_names ? JSON.parse(page.component_names) : []
    }));
  }

  // 新增：获取特定页
  async getDocumentPage(documentId: string, pageNumber: number) {
    const page: any = await new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM document_pages WHERE document_id = ? AND page_number = ?', [documentId, pageNumber], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (page) {
      return {
        ...page,
        component_names: page.component_names ? JSON.parse(page.component_names) : []
      };
    }
    return null;
  }

  async getDocuments() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM documents ORDER BY upload_date DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getDocument(id: string) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getSynonyms(term: string) {
    const result: any = await new Promise((resolve, reject) => {
      this.db.get('SELECT synonyms FROM synonyms WHERE term = ?', [term], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    return result ? JSON.parse(result.synonyms) : [];
  }

  async getAllSynonyms() {
    const results: any = await new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM synonyms', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    return results.map((row: any) => ({
      term: row.term,
      synonyms: JSON.parse(row.synonyms)
    }));
  }
}

export const database = new Database();
