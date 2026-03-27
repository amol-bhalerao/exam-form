/**
 * PM2 Ecosystem Configuration
 * 
 * Usage on Hostinger:
 * 1. npm install -g pm2
 * 2. pm2 start ecosystem.config.cjs
 * 3. pm2 save
 * 4. pm2 startup
 */

module.exports = {
  apps: [
    {
      // ═══════════════════════════════════════════════════════════════════
      // HSC Exam System - Backend API
      // ═══════════════════════════════════════════════════════════════════
      
      name: 'hsc-exam-api',
      script: './backend/src/server.js',
      interpreter: 'node',
      
      // Environment & Path Configuration
      cwd: process.cwd(), // Current working directory
      env: {
        NODE_ENV: 'production',
        // Load from .env.production in backend/
      },
      
      // Clustering & Performance
      instances: 2,                    // Use 2 instances for better availability
      exec_mode: 'cluster',            // Load balance across instances
      max_memory_restart: '512M',      // Restart if memory exceeds 512MB
      max_restarts: 10,                // Max restart attempts
      min_uptime: '10s',               // Minimum uptime before counting restart
      
      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,               // Keep logs separate per instance
      
      // Auto-restart & Monitoring
      autorestart: true,               // Auto-restart on crash
      watch: false,                    // Don't watch for file changes (production)
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Process Management
      kill_timeout: 5000,              // Wait 5 seconds before force-kill
      wait_ready: false,               // Wait for ready signal
      
      // Health Check
      listen_timeout: 10000,           // Timeout for ready event
      shutdown_with_message: true,     // Graceful shutdown
      
      // Source Maps (for debugging)
      source_map_support: true,
      
      // Additional options
      node_args: [
        '--max-old-space-size=1024',   // Limit heap to 1GB
        '--no-warnings'                // Suppress warnings in production
      ]
    }
  ],

  // ═════════════════════════════════════════════════════════════════════
  // Deployment Configuration
  // ═════════════════════════════════════════════════════════════════════
  
  deploy: {
    production: {
      user: 'u441114691',
      host: '45.130.228.77',
      port: 65002,
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/home/u441114691/public_html/hsc-exam',
      'pre-deploy-local': 'echo "Deploying..."',
      'post-deploy': 'npm install && npm run build',
      'pre-deploy': 'npm install -g pm2',
      'exec-mode': 'cluster'
    }
  }
};

// ═════════════════════════════════════════════════════════════════════════
// Notes for Hostinger Deployment
// ═════════════════════════════════════════════════════════════════════════

/**
 * Initial Setup (one-time):
 * 
 * 1. SSH into Hostinger:
 *    ssh -p 65002 u441114691@45.130.228.77
 * 
 * 2. Install PM2 globally:
 *    npm install -g pm2
 * 
 * 3. Navigate to application:
 *    cd ~/public_html/hsc-exam
 * 
 * 4. Install dependencies:
 *    npm install (in both backend and frontend if needed)
 * 
 * 5. Start application:
 *    pm2 start ecosystem.config.cjs
 * 
 * 6. Make PM2 auto-start on reboot:
 *    pm2 startup
 *    pm2 save
 * 
 * ───────────────────────────────────────────────────────────────────────
 * 
 * Common PM2 Commands:
 * 
 * pm2 start ecosystem.config.cjs     - Start application
 * pm2 stop hsc-exam-api              - Stop application
 * pm2 restart hsc-exam-api           - Restart application
 * pm2 delete hsc-exam-api            - Remove from PM2
 * pm2 status                         - Show application status
 * pm2 logs                           - View real-time logs
 * pm2 logs hsc-exam-api --err        - View error logs only
 * pm2 monit                          - Monitor resource usage (CPU/Memory)
 * pm2 save                           - Save configuration
 * pm2 unstartup                      - Disable auto-startup
 * 
 * ───────────────────────────────────────────────────────────────────────
 * 
 * Scaling & Performance:
 * 
 * - instances: 2 means 2 node processes will run in parallel
 *   Increase if you have more CPU cores: instances: 4
 * 
 * - max_memory_restart: 512M
 *   Restart if one instance uses more than 512MB RAM
 *   Adjust based on your available memory
 * 
 * - max_restarts: 10
 *   If app restarts 10 times within a minute, PM2 will stop trying
 *   Check logs to see what's causing crashes
 * 
 * ───────────────────────────────────────────────────────────────────────
 * 
 * Monitoring:
 * 
 * Watch resource usage:
 *   pm2 monit
 * 
 * View detailed logs:
 *   pm2 logs hsc-exam-api
 * 
 * View only errors:
 *   pm2 logs hsc-exam-api --err
 * 
 * Clear logs:
 *   pm2 flush
 * 
 * ───────────────────────────────────────────────────────────────────────
 * 
 * Troubleshooting:
 * 
 * Application won't start?
 *   1. Check logs: pm2 logs
 *   2. Verify .env.production exists in backend/
 *   3. Check database connection
 *   4. Ensure Node.js and npm are installed
 * 
 * Memory issues?
 *   1. Check current usage: pm2 monit
 *   2. Increase max_memory_restart if needed
 *   3. Reduce instances count if running on limited RAM
 *   4. Check for memory leaks in logs
 * 
 * Port already in use?
 *   1. Check what's using port 3000: lsof -i :3000
 *   2. Kill process: kill -9 <PID>
 *   3. Or change PORT in .env.production
 */
