# Hostinger Production Deployment Guide

## 🚀 Deployment Steps

### Step 1: SSH into Hostinger
```bash
ssh -p 65002 u441114691@45.130.228.77
```

### Step 2: Navigate to Application Directory
```bash
cd ~/public_html/hsc-exam  # or your deployed directory
```

### Step 3: Install Dependencies & Build
```bash
# Backend setup
cd backend
npm install
npm run build  # This generates Prisma engine for Debian/Linux
npm run db:migrate  # Run migrations if needed

# Frontend setup
cd ../frontend
npm install
npm run build  # Builds Angular production bundle

cd ..
```

### Step 4: Start Application with PM2
```bash
# Install PM2 globally if not present
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hsc-exam-api',
      script: './backend/src/server.js',
      cwd: '/home/u441114691/public_html/hsc-exam',
      env: {
        NODE_ENV: 'production'
      },
      instances: 2,
      exec_mode: 'cluster',
      error_file: 'logs/api-error.log',
      out_file: 'logs/api.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup cron
```

### Step 5: Configure Nginx (if using Hostinger's web server)
Point your domain to:
- **Backend API**: Forward `/api/*` to `http://localhost:3000`
- **Frontend**: Serve static files from `frontend/dist/browser`

Example Nginx config:
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    root /home/u441114691/public_html/hsc-exam/dist/browser;
    try_files $uri $uri/ /index.html;
    expires 1h;
}
```

---

## 📋 Required Environment Variables

### Backend (.env.production)
```
# Server
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# Database
DATABASE_URL="mysql://user:password@localhost:3306/hsc_exam_prod"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# JWT
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-random-refresh-secret-min-32-chars

# Cashfree Payments (Production)
CASHFREE_API_KEY=your-cashfree-api-key
CASHFREE_SECRET_KEY=your-cashfree-secret-key
CASHFREE_MODE=PROD

# Email/Notifications
ADMIN_EMAIL=admin@your-domain.com
NOTIFICATION_EMAIL=notifications@your-domain.com

# Logging
LOG_LEVEL=info
```

### Frontend (environment.prod.ts)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  apiBaseUrl: 'https://your-domain.com',
  googleClientId: 'your-google-client-id.apps.googleusercontent.com',
};
```

---

## 🔒 Security Checklist

- [ ] Set strong JWT secrets (use: `openssl rand -hex 32`)
- [ ] Use HTTPS/SSL certificate (Hostinger provides free SSL)
- [ ] Enable CORS only for your domain
- [ ] Set secure cookie flags (`httpOnly`, `secure`, `sameSite`)
- [ ] Enable rate limiting on API endpoints
- [ ] Regular database backups
- [ ] Monitor API logs for suspicious activity
- [ ] Keep dependencies updated (`npm audit`)

---

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs hsc-exam-api
```

### Update Application
```bash
cd ~/public_html/hsc-exam
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart hsc-exam-api
```

### Database Backup
```bash
mysqldump -u user -p hsc_exam_prod > backup_$(date +%Y%m%d).sql
```

---

## 🚨 Troubleshooting

### Issue: "Port 3000 already in use"
```bash
pm2 delete all
pm2 kill
npm run build
```

### Issue: "Prisma Query Engine not found"
This means Prisma binaries weren't regenerated for Linux. **Solution:**
```bash
cd backend
rm -rf node_modules .prisma
npm install
npm run build
```

### Issue: Frontend showing blank page
```bash
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

### Issue: Database connection error
```bash
# Check MySQL service
systemctl status mysql

# Test connection
mysql -u user -p -e "SELECT 1"
```

---

## 📞 Support
For Hostinger-specific issues, contact their support with:
- SSH credentials (provided above)
- Error logs from PM2 or Nginx
- Database connection details
