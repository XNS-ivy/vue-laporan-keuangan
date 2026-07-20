module.exports = {
  apps: [
    {
      name: "vue-laporan-keuangan",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0 --port 3020",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      error_file: "../logs/pm2-error.log",
      out_file: "../logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
