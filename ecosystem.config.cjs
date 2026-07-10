module.exports = {
  apps: [
    {
      name: "vue-laporan-keuangan",
      script: "bun",
      args: "run preview --host 0.0.0.0",
      cwd: "./frontend",
      interpreter: "none", // Menjalankan bun secara langsung tanpa melalui interpreter Node.js internal PM2
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
