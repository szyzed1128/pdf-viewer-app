// PM2 配置文件
// 用途: 配置应用的启动方式、环境变量、日志等

module.exports = {
  apps: [
    {
      name: 'pdf-viewer-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 自动重启配置
      watch: false,
      max_memory_restart: '1G',

      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 进程崩溃自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // 优雅退出
      kill_timeout: 5000,
    }
  ]
};
