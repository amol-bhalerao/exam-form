# Production Deployment & Troubleshooting Guide

## Current Issues

Your production environment has these problems:

1. ✗ **Backend Old Code Running** - Health endpoint returns `{ "ok": true }` instead of enhanced response with `buildId`, `service`, `timestamp`, `uptimeSeconds`
2. ✗ **Public Routes Returning 404** - `/api/public/news`, `/api/public/exams` 
3. ✗ **Stats Returning 503** - `/api/public/stats` - Database or connection issue
4. ✗ **Login Returning 500** - `/api/auth/login` - Token/database error
5. ✗ **Landing Page Failing** - Cannot load news, exams, stats, or login

## Root Cause

Your Node.js process on Hostinger is **running old compiled code** (`dist/src/server.js` from before recent changes).

---

## Step-by-Step Fix

### Phase 1: Deploy Latest Frontend (Local)

```bash
# 1. Frontend already built, verify output
cd frontend/dist/exam-form
ls -la  # Should see index.html, main-*.js, styles-*.css

# 2. Prepare for deployment (this is what you'll SCP to Hostinger)
```

**Files to Upload to Hostinger `public_html/`:**
- Copy entire contents of `frontend/dist/exam-form/*` → `public_html/`

---

### Phase 2: SSH into Hostinger & Restart Backend

```bash
# 1. SSH to your Hostinger account
ssh username@your-hostinger-domain.com

# 2. Navigate to backend folder
cd nodejs/hsc-exam-backend
# OR (depending on your Hostinger setup)
cd ~/public_html/../nodejs
cd ~/backend

# 3. Check if Node process is running
ps aux | grep node
ps aux | grep "dist/src/server.js"

# 4. Stop the current Node process (if running)
pkill -f "node dist/src/server.js"
# OR if using PM2:
pm2 stop hsc-exam-backend
pm2 delete hsc-exam-backend

# 5. Verify old process is dead
sleep 2
ps aux | grep node

# 6. Pull latest code (if using git)
git pull origin main

# 7. Install/update dependencies
npm install

# 7b. Generate Prisma engines for Linux platform (CRITICAL!)
# This MUST run on the production server (not locally)
# It generates the correct Query Engine binary for Debian/Linux
npx prisma generate

# 8. Build TypeScript
npm run build

# 9. Set environment variables
export NODE_ENV=production
export DATABASE_URL="mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam"
export CORS_ORIGIN="https://hsc-exam-form.hisofttechnology.com"
export BUILD_ID="prod-$(date +%s)"

# 10. Start Node process (choose ONE):

# Option A: Run directly
node dist/src/server.js

# Option B: Run in background with nohup
nohup node dist/src/server.js > server.log 2>&1 &

# Option C: Use PM2 (recommended for production)
npm install -g pm2
pm2 start dist/src/server.js --name "hsc-exam-backend"
pm2 save
pm2 startup

# 11. Verify it's running
ps aux | grep node
curl http://localhost:3000/api/health
```

---

### Phase 3: Upload Frontend Files

**From your local machine:**

```bash
# Copy frontend dist to Hostinger public_html
scp -r frontend/dist/exam-form/* username@hsc-exam-form.hisofttechnology.com:~/public_html/

# Verify files uploaded
ssh username@hsc-exam-form.hisofttechnology.com "ls -la ~/public_html/index.html"
```

**Ensure `.htaccess` is in public_html for Angular SPA routing:**

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

### Phase 4: Test All Endpoints

#### Test 1: Health Check (Verify New Code is Running)

**Local:**
```bash
curl http://localhost:3000/api/health
```

**Production:**
```bash
curl https://hsc-exam-form.hisofttechnology.com/api/health
```

**Expected Response:**
```json
{
  "ok": true,
  "service": "hsc-exam-backend",
  "version": "dev-0",
  "timestamp": "2026-03-24T16:36:57.230Z",
  "uptimeSeconds": 293.24
}
```

If still returning `{ "ok": true }` only → **Node process is still running old code**

#### Test 2: Public Routes

```bash
# News
curl https://hsc-exam-form.hisofttechnology.com/api/public/news

# Exams
curl https://hsc-exam-form.hisofttechnology.com/api/public/exams

# Stats
curl https://hsc-exam-form.hisofttechnology.com/api/public/stats
```

Expected: JSON response with data (or empty arrays if no data in DB)

#### Test 3: Login

```bash
curl -X POST https://hsc-exam-form.hisofttechnology.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "password123"}'
```

Expected:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "userId": 1,
    "role": "STUDENT",
    "username": "test_user"
  }
}
```

---

## Troubleshooting by Error

### Issue: Health endpoint still returns `{ "ok": true }` only

**Cause:** Old Node process still running

**Fix:**
```bash
# Kill all node processes
pkill -9 node

# Wait 
sleep 3

# Verify all dead
ps aux | grep node

# Start fresh
cd ~/nodejs/backend
nohup node dist/src/server.js > server.log 2>&1 &

# Check logs
tail -f server.log
```

### Issue: 404 on /api/public/* routes

**Cause:** Backend not running, or routes not compiled

**Fix:**
```bash
# Rebuild
npm run build

# Check if public.js exists
ls -la dist/src/routes/public.js

# Restart
pkill node
nohup node dist/src/server.js > server.log 2>&1 &

# Check logs for errors
tail -f server.log
```

### Issue: 503 Service Unavailable on /api/public/stats

**Cause:** Database connection error

**Fix:**
```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Test database connection
mysql -u u441114691_exam -p -h 127.0.0.1

# Check MySQL is running
ps aux | grep mysql

# Restart backend
pkill node
nohup node dist/src/server.js > server.log 2>&1 &

# Check logs
cat server.log | grep -i "error"
```

### Issue: 500 on /api/auth/login

**Cause:** Database, JWT secret, or validation error

**Fix:**
```bash
# Check logs
tail -f server.log

# Verify env vars
echo $JWT_ACCESS_SECRET
echo $JWT_REFRESH_SECRET
echo $DATABASE_URL

# Check database has 'roles' table
mysql -u u441114691_exam -p u441114691_exam -e "SELECT * FROM roles LIMIT 5;"

# Ensure STUDENT role exists
mysql -u u441114691_exam -p u441114691_exam -e "SELECT * FROM roles WHERE name='STUDENT';"

# Restart
pkill node
nohup node dist/src/server.js > server.log 2>&1 &
```

### Issue: Frontend not loading (404 or blank page)

**Cause:** `.htaccess` missing or frontend files not deployed

**Fix:**
```bash
# 1. Check if public_html has index.html
ls -la ~/public_html/index.html

# 2. Check .htaccess exists
cat ~/public_html/.htaccess

# 3. If missing, create it
cat > ~/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# 4. Re-deploy frontend
scp -r frontend/dist/exam-form/* username@hsc-exam-form.hisofftechnology.com:~/public_html/
```

### Issue: Frontend loads but API calls fail (CORS error)

**Cause:** CORS_ORIGIN env var incorrect or backend not set

**Fix (on Hostinger):**
```bash
# 1. Verify CORS env var
echo $CORS_ORIGIN

# 2. If not set, update and restart
export CORS_ORIGIN="https://hsc-exam-form.hisofttechnology.com"
pkill node
nohup node dist/src/server.js > server.log 2>&1 &

# 3. Or add to backend .env file
echo 'CORS_ORIGIN=https://hsc-exam-form.hisofftechnology.com' >> ~/nodejs/backend/.env

# 4. Restart again
pkill node
nohup node dist/src/server.js > server.log 2>&1 &
```

---

## Quick Deploy Script

Save this as `deploy.sh` on Hostinger:

```bash
#!/bin/bash

echo "=== HSC Exam Backend Deploy ==="

# Kill old process
echo "Stopping old process..."
pkill -f "node dist/src/server.js"
sleep 2

# Update code
echo "Pulling latest code..."
git pull origin main

# Install deps
echo "Installing dependencies..."
npm install

# Build
echo "Building TypeScript..."
npm run build

# Set env vars
export NODE_ENV=production
export DATABASE_URL="mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam"
export CORS_ORIGIN="https://hsc-exam-form.hisofttechnology.com"

# Start
echo "Starting backend..."
nohup node dist/src/server.js > server.log 2>&1 &

sleep 2
echo "Checking status..."
curl http://localhost:3000/api/health

echo "Deploy complete!"
```

**Usage:**
```bash
bash deploy.sh
```

---

## Database Verification Checklist

```bash
# Connect to DB
mysql -u u441114691_exam -p u441114691_exam -h 127.0.0.1

# In MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM roles;
SELECT * FROM roles;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM exams;
SELECT COUNT(*) FROM news;

# Exit
EXIT;
```

---

## After Everything is Working

1. ✅ Verify health endpoint returns full response with `buildId`, `service`, `version`
2. ✅ Test `/api/public/news`, `/api/public/exams`, `/api/public/stats` return 200
3. ✅ Test `/api/auth/login` returns tokens or correct error
4. ✅ Visit https://hsc-exam-form.hisofttechnology.com - should load landing page
5. ✅ Try login on landing page - should work without errors
6. ✅ Check browser console - no API 404/503/500 errors

---

## Prevention: Automate Future Deploys

Use PM2 to auto-restart on crashes:

```bash
# Install PM2 globally (one time)
npm install -g pm2

# Create ecosystem.config.js
cat > ~/nodejs/backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hsc-exam-backend',
    script: './dist/src/server.js',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam',
      CORS_ORIGIN: 'https://hsc-exam-form.hisofttechnology.com'
    },
    autorestart: true,
    max_memory_restart: '200M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save startup
pm2 save
pm2 startup

# View logs
pm2 logs hsc-exam-backend
pm2 monit  # Real-time monitor
```

---

## Support Commands

```bash
# SSH into Hostinger
ssh username@your-domain

# Check Node process status
ps aux | grep node
pm2 list

# View logs
tail -f server.log
pm2 logs hsc-exam-backend

# Test API locally on server
curl http://localhost:3000/api/health

# Restart cleanly
pkill node
sleep 2
nohup node dist/src/server.js > server.log 2>&1 &

# Check MySQL connection
mysql -u u441114691_exam -p -h 127.0.0.1 u441114691_exam -e "SELECT 1;"

# Clear PM2
pm2 flush
pm2 delete all
```

---

## Critical Issue: Prisma Query Engine Not Found

### Symptoms
```
"error": "Prisma Client could not locate the Query Engine for runtime \"debian-openssl-1.0.x\""
```

This happens when:
- Code is built on Windows locally (with Windows binaries)
- Deployed to Linux/Debian server without regenerating binaries
- Or npm modules were not properly installed on the server

### Solution (Immediate)

```bash
# SSH to server
ssh username@your-domain

# Navigate to backend
cd ~/nodejs/backend

# Reinstall and regenerate for Linux
npm install
npx prisma generate

# Rebuild if needed
npm run build

# Restart backend
pkill node
sleep 2
nohup node dist/src/server.js > server.log 2>&1 &

# Verify it works
curl http://localhost:3000/api/health
```

### Why This Happens

Prisma uses platform-specific Query Engine binaries:
- **Windows**: `libquery_engine-windows.dll`
- **Linux/Debian**: `libquery_engine-debian-openssl-1.0.x.so.node`

If you:
1. Build on Windows (TypeScript → JavaScript)
2. Deploy to Linux without running `prisma generate`
- Prisma can't find the Linux binary and fails

### Prevention

**Always run these steps on the production server after deploying:**

```bash
# Step 1: Install dependencies
npm install

# Step 2: Generate Prisma engines for the server's OS (CRITICAL!)
npx prisma generate

# Step 3: Build TypeScript
npm run build

# Step 4: Start the app
npm start
```

### Updated Deploy Script

Update your `deploy.sh` to include `prisma generate`:

```bash
#!/bin/bash
pkill -f "node dist/src/server.js"
sleep 2
git pull origin main
npm install
npx prisma generate    # ← ADD THIS LINE
npm run build
export NODE_ENV=production
export DATABASE_URL="mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam"
export CORS_ORIGIN="https://hsc-exam-form.hisofftechnology.com"
nohup node dist/src/server.js > server.log 2>&1 &
sleep 2
curl http://localhost:3000/api/health
echo "Deploy complete!"
```

---

**Status:** After implementation, your API should return 200 for all public routes, login should work, and landing page should load news/exams/stats.

If still having issues, check logs: `ssh your-server && tail -f ./server.log`
