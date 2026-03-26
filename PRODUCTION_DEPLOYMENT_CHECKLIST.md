# HSC EXAM SYSTEM - PRODUCTION DEPLOYMENT GUIDE

**Last Updated:** March 26, 2026  
**Target Platform:** Hostinger Shared Hosting + MySQL  
**Runtime:** Node.js 22.x

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] Run `npm test` in backend - all tests passing
- [ ] Run `npm test` in frontend - all tests passing  
- [ ] Run `npm run build` in frontend - no errors
- [ ] Run `npm run lint` to check for code issues
- [ ] Review security recommendations from `npm audit`
- [ ] Check all console.log statements removed (replace with logging)

### 2. Environment Configuration
- [ ] Copy `.env.development.template` to `.env.production`
- [ ] Update all environment variables:
  - `NODE_ENV=production`
  - `JWT_SECRET` - generate secure random string (32+ chars)
  - `JWT_REFRESH_SECRET` - generate new secure random string
  - `ENCRYPTION_KEY` - generate with `openssl rand -base64 32`
  - `GOOGLE_CLIENT_ID` - Production Google OAuth credentials
  - `CASHFREE_APP_ID` - Production Cashfree credentials
  - `CASHFREE_SECRET_KEY` - Production Cashfree secret
  - `CASHFREE_MODE=production`
  - `DATABASE_URL` - Production MySQL connection string
  - `BACKEND_URL` - Your production domain
  - `FRONTEND_URL` - Your production domain
  - `CORS_ORIGIN` - Your production domain only

### 3. Database Preparation
- [ ] Backup existing production database (if migrating)
- [ ] Create new MySQL database on Hostinger
- [ ] Verify MySQL version compatibility (5.7+ or 8.0+)
- [ ] Test connection string before deployment
- [ ] Plan migration strategy (zero-downtime preferred)

### 4. Security Hardening
- [ ] Enable HTTPS on domain
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Update CORS to production domain only
- [ ] Review Helmet.js CSP configuration
- [ ] Enable HSTS headers (Helmet auto-enables this)
- [ ] Rate limiting settings reviewed
- [ ] Audit log configuration enabled
- [ ] Encryption key securely stored (NOT in git)

### 5. Service Configuration
- [ ] Google OAuth: Add production domain to authorized origins
- [ ] Google OAuth: Update GOOGLE_CLIENT_ID/SECRET for production
- [ ] Cashfree: Configure production Kashfree account
- [ ] Cashfree: Update webhook URL to production endpoint
- [ ] Cashfree: White-list your server IP in dashboard

### 6. Frontend Build & Deployment
- [ ] `npm run build` successful in frontend/
- [ ] Update API base URL to production backend
- [ ] Test build locally: `npm start` (from dist/)
- [ ] Verify all environment configs point to production
- [ ] Run production build: `npm run build -- --prod`
- [ ] Check bundle size warnings (aim for <600KB main bundle)

---

## 🚀 Hostinger Deployment Steps

### Step 1: Prepare Backend on Hostinger

1. **SSH into your Hostinger account:**
   ```bash
   ssh username@your-server-ip
   ```

2. **Navigate to application directory:**
   ```bash
   cd /home/username/public_html
   # or your preferred deployment directory
   ```

3. **Clone or upload your code:**
   ```bash
   # Clone from Git
   git clone https://github.com/your-repo/hsc-exam.git
   cd hsc-exam/backend
   
   # OR upload via FTP/SFTP to /backend directory
   ```

4. **Install dependencies:**
   ```bash
   npm install --production
   # This installs only production dependencies (no devDeps)
   ```

5. **Generate Prisma client for production OS:**
   ```bash
   npx prisma generate
   # CRITICAL: This must run on production server to get correct binaries
   ```

6. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   # This applies all pending migrations to production DB
   ```

7. **Seed initial data (if first deployment):**
   ```bash
   npm run db:seed
   # Or manually run: npx prisma db seed
   ```

### Step 2: Start Backend with Process Manager

**Use PM2 (Recommended) or Node process manager:**

```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start backend with PM2
pm2 start src/server.js --name "hsc-exam-api" --env production

# Make it auto-restart on server reboot
pm2 startup
pm2 save
```

**Alternative: Use Systemd service (check Hostinger docs)**

### Step 3: Deploy Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd /path/to/hsc-exam/frontend
   ```

2. **Build production bundle:**
   ```bash
   npm run build --prod
   ```

3. **Deploy dist/ folder to web root:**
   ```bash
   # Copy to public_html for web serving
   cp -r dist/exam-form/* /home/username/public_html/
   ```

4. **Configure .htaccess for Angular routing:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Step 4: Configure Reverse Proxy (Nginx)

Ask Hostinger support to configure Nginx for Node.js:

```nginx
upstream hsc_exam_api {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    location / {
        proxy_pass http://hsc_exam_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔍 Post-Deployment Verification

### Backend Health Checks

1. **Check API is running:**
   ```bash
   curl -i https://api.yourdomain.com/health
   # Should return 200 OK
   ```

2. **Test database connection:**
   ```bash
   curl -i https://api.yourdomain.com/api/health
   # Check health endpoint for DB status
   ```

3. **Review logs:**
   ```bash
   pm2 logs hsc-exam-api
   # Check for any startup errors or warnings
   ```

4. **Verify authentication:**
   ```bash
   curl -X POST https://api.yourdomain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   # Should return token or error (not 500)
   ```

### Frontend Health Checks

1. **Open in browser:** https://yourdomain.com
2. **Check Network tab:**
   - Verify API calls go to production backend
   - Confirm no CORS errors
   - Check bundle sizes in Network tab
3. **Test key flows:**
   - Student login
   - Application form submission
   - Payment initiation (sandbox test mode if available)
   - Admin dashboards

### Monitoring & Logs

1. **Monitor process:**
   ```bash
   pm2 monit  # Real-time monitoring
   pm2 logs   # View application logs
   ```

2. **Set up log rotation:**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:compress true
   ```

3. **Monitor database:**
   ```bash
   # Check MySQL connection pool status
   # Monitor disk usage for audit logs
   ```

---

## ⚠️ Critical Production Requirements

### 1. Prisma on Production Server
**CRITICAL:** Always run `npx prisma generate` on the production server:
- Windows builds won't work on Linux
- macOS builds won't work on Linux
- You must generate for the actual production OS

### 2. Environment Variables
- NEVER commit `.env.production` to git
- Use Hostinger's control panel or SSH to set env vars
- All secrets must be 32+ characters, random strings
- Rotate `JWT_SECRET` and `ENCRYPTION_KEY` annually

### 3. Database Backups
- Set up automated MySQL backups daily
- Test restore procedure before production
- Keep backups for minimum 30 days

### 4. SSL/TLS Certificate
- Use Let's Encrypt or Hostinger's free SSL
- Configure auto-renewal
- Test certificate with: `openssl s_client -connect yourdomain.com:443`

### 5. Monitoring & Alerting
- Set up ping monitoring (uptime robot, etc.)
- Configure error alerting (Sentry, LogRocket, etc.)
- Monitor database size and growth
- Monitor disk space on server

---

## 🆘 Troubleshooting

### Issue: "Prisma Client could not locate the Query Engine"
**Solution:** 
```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
npm install
```

### Issue: "CORS error when calling API"
**Solution:**
1. Verify `CORS_ORIGIN` environment variable set to production domain
2. Restart Node process: `pm2 restart hsc-exam-api`
3. Clear browser cache and try again

### Issue: "Database connection refused"
**Solution:**
1. Verify `DATABASE_URL` is correct
2. Test connection: `mysql -u user -p -h host -D database`
3. Check MySQL service is running
4. Verify firewall allows connection from server

### Issue: "Google login not working"
**Solution:**
1. Verify `GOOGLE_CLIENT_ID` set and matches production credentials
2. Add production domain to "Authorized Redirect URIs" in Google Console
3. Clear browser cookies and try again
4. Check browser console for CORS errors

### Issue: "Payment gateway not responding"
**Solution:**
1. Verify `CASHFREE_MODE=production` (not sandbox)
2. Verify Cashfree credentials are correct
3. Check server IP is whitelisted in Cashfree dashboard
4. Verify webhook URL is reachable: `curl https://yourdomain.com/api/payments/webhook`

---

## 📞 Support & Implementation

**For Hostinger-specific help:**
- Contact Hostinger support for Node.js/MySQL configuration
- Mention: "Deploy Node.js 22 with MySQL on Hostinger"

**For application-specific issues:**
- Check application logs: `pm2 logs`
- Check MySQL error log: `/var/log/mysql/error.log`
- Review Nginx access log: `/var/log/nginx/access.log`

---

## 🎯 Final Deployment Checklist

- [ ] Backend running on Node 22 with PM2
- [ ] Frontend deployed and serving production build
- [ ] All environment variables set correctly
- [ ] Database migrations applied successfully
- [ ] SSL/TLS certificate installed and valid
- [ ] Nginx reverse proxy configured and working
- [ ] Health check endpoints responding (200 OK)
- [ ] Authentication working (login/register)
- [ ] API CORS configured for production domain only
- [ ] Cashfree payments working (test transaction)
- [ ] Google OAuth working (test login)
- [ ] Logs being collected and rotated
- [ ] Monitoring/alerting configured
- [ ] Database backups configured
- [ ] Documentation created for ops team

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Version:** ___________  

Post your deployment status with this information for reference and support.
