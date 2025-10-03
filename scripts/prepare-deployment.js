const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== 准备项目部署 ===\n');

// 1. 检查必要文件
console.log('步骤1: 检查必要文件...');
const requiredFiles = [
  'package.json',
  'next.config.js',
  'database.sqlite',
  'public/pdfs'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - 缺失!`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n错误: 缺少必要文件，请先完成项目配置。');
  process.exit(1);
}

// 2. 检查PDF文件大小
console.log('\n步骤2: 检查PDF文件大小...');
const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
const pdfFiles = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));

let totalSize = 0;
const fileSizes = [];

pdfFiles.forEach(file => {
  const filePath = path.join(pdfsDir, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  totalSize += stats.size;
  fileSizes.push({ file, sizeMB });
  console.log(`  ${file}: ${sizeMB} MB`);
});

const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`\n  总大小: ${totalSizeMB} MB`);

// 3. 推荐部署方案
console.log('\n步骤3: 推荐部署方案...\n');

if (totalSize < 100 * 1024 * 1024) {
  console.log('  ✓ PDF总大小 < 100MB');
  console.log('  推荐方案: Railway 或 Vercel + Vercel Blob');
  console.log('  预计成本: 免费 或 $5/月');
} else if (totalSize < 500 * 1024 * 1024) {
  console.log('  ⚠ PDF总大小: 100MB - 500MB');
  console.log('  推荐方案: 云服务器（阿里云/腾讯云轻量应用服务器）');
  console.log('  预计成本: ￥25-40/月');
} else {
  console.log('  ⚠ PDF总大小 > 500MB');
  console.log('  推荐方案: 云服务器 + 对象存储（OSS）');
  console.log('  预计成本: ￥40-80/月');
}

// 4. 检查数据库
console.log('\n步骤4: 检查数据库...');
const sqlite3 = require('sqlite3');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
  if (err) {
    console.error('  ✗ 数据库读取失败:', err.message);
    db.close();
    return;
  }

  console.log(`  ✓ 文档数量: ${row.count}`);

  db.get('SELECT COUNT(*) as count FROM document_pages', (err, row) => {
    if (err) {
      console.error('  ✗ 页面数据读取失败:', err.message);
    } else {
      console.log(`  ✓ 页面数量: ${row.count}`);
    }

    db.get('SELECT COUNT(*) as count FROM synonyms', (err, row) => {
      if (err) {
        console.error('  ✗ 同义词读取失败:', err.message);
      } else {
        console.log(`  ✓ 同义词数量: ${row.count}`);
      }

      db.close();

      // 5. 生成部署配置建议
      console.log('\n步骤5: 生成部署配置...\n');

      const deploymentConfig = {
        totalPdfSize: `${totalSizeMB} MB`,
        documentsCount: 4,
        recommendedPlatform: totalSize < 100 * 1024 * 1024 ? 'Railway/Vercel' : '云服务器',
        databaseType: 'SQLite',
        estimatedMonthlyCost: totalSize < 100 * 1024 * 1024 ? '免费-$5' : '¥25-80'
      };

      console.log('部署配置建议:');
      console.log(JSON.stringify(deploymentConfig, null, 2));

      // 6. 创建部署检查清单
      console.log('\n步骤6: 部署前检查清单...\n');
      console.log('  [ ] 1. 运行 npm run build 测试生产构建');
      console.log('  [ ] 2. 准备域名（可选）');
      console.log('  [ ] 3. 选择部署平台（Railway/Vercel/云服务器）');
      console.log('  [ ] 4. 配置数据库（SQLite/Turso/PostgreSQL）');
      console.log('  [ ] 5. 上传PDF文件到服务器或对象存储');
      console.log('  [ ] 6. 配置环境变量');
      console.log('  [ ] 7. 部署应用');
      console.log('  [ ] 8. 测试所有功能');
      console.log('  [ ] 9. 配置HTTPS（如使用云服务器）');
      console.log('  [ ] 10. 设置备份策略');

      console.log('\n=== 准备完成！请查看 DEPLOYMENT.md 了解详细部署步骤 ===\n');
    });
  });
});
