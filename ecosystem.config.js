module.exports = {
  apps: [
    {
      name: 'hsc-api',
      script: './backend/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart policy
      max_memory_restart: '500M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      // Auto restart on file change (development only)
      watch: process.env.NODE_ENV === 'development' ? ['backend/src'] : false,
      ignore_watch: ['node_modules', 'logs', 'dist']
    }
  ]
};
