# 🚀 Quick Reference & Command Guide

**For HSC Exam Form - Production Ready Setup**

---

## ⚡ Start Everything (Quickest Way)

```bash
# Terminal 1: Backend
cd c:\Users\UT\OneDrive\Desktop\hsc_exam\backend
npm start
# Runs on: http://localhost:3000

# Terminal 2: Frontend
cd c:\Users\UT\OneDrive\Desktop\hsc_exam\frontend
ng serve
# Runs on: http://localhost:4200
```

**Then open**: http://localhost:4200/health

---

## 🔍 Verify System is Working

### Instant Checks (Copy-Paste Commands)

```bash
# 1. Is backend alive?
curl http://localhost:3000/api/health/metrics/ping

# 2. Is database healthy?
curl http://localhost:3000/api/health/metrics/status

# 3. What's the API status?
curl http://localhost:3000/api/health/metrics/ready

# 4. How many users online?
curl http://localhost:3000/api/health/metrics/sessions
```

### Visual Checks

```
Health Dashboard: http://localhost:4200/health
Login Page:       http://localhost:4200/student-login
Student Profile:  http://localhost:4200/app/student/profile
```

---

## 📋 Validation Checklist (5 Min)

```bash
# 1. System alive?
curl -I http://localhost:3000/api/health/metrics/ping | grep 200

# 2. Build successful?
cd frontend && ng build 2>&1 | grep "bundle generation complete"

# 3. Database OK?
curl http://localhost:3000/api/health/metrics/status | grep '"healthy": true'

# 4. Rate limiter fixed?
grep "skipSuccessfulRequests: true" backend/src/middleware/rate-limit.js

# 5. Latest code?
git log --oneline | head -1 | grep "deployment\|health\|production"
```

**All pass?** ✅ You're good to deploy!

---

## 🔧 Common Tasks

### Deploy to Production

```bash
git pull origin convert-into-js
cd backend && npm install && NODE_ENV=production npm start &
cd frontend && npm run build
# Copy dist/exam-form to your web server
```

### Restart Services

```bash
# Kill all node processes
pkill -f "node"  # Or: Ctrl+C in terminals

# Start fresh
cd backend && npm start &
cd frontend && ng serve &
```

### Check Health Non-Stop

```bash
# Watch health every 5 seconds
while true; do
  curl -s http://localhost:3000/api/health/metrics/status | jq '.status'
  sleep 5
done
```

### Monitor Memory

```bash
# Real-time memory check
while true; do
  curl -s http://localhost:3000/api/health/metrics/status | jq '.sessions.memory'
  sleep 10
done
```

---

## 🐛 Quick Troubleshooting

### "TOO_MANY_AUTH_REQUESTS"?

```bash
# Step 1: Verify fix
grep "skipSuccessfulRequests: true" backend/src/middleware/rate-limit.js
# Should show the line

# Step 2: Restart
pkill -f "node"
npm start

# Step 3: Clear cache & try again
# Browser: Ctrl+Shift+Delete → Clear cache
```

### Health Page Not Loading?

```bash
# Frontend running?
curl http://localhost:4200/health

# Backend running?
curl http://localhost:3000/api/health/metrics/status

# Check console
# Browser: F12 → Console tab
```

### Database Offline?

```bash
# Check connection
curl http://localhost:3000/api/health/metrics/status | jq '.database'

# Should show: "healthy": true

# If false, check DATABASE_URL in .env
echo $DATABASE_URL
```

### High Memory?

```bash
# Check active sessions
curl http://localhost:3000/api/health/metrics/sessions | jq '.activeUsers'

# If > 1000, consider:
# 1. Restart backend
# 2. Set up Redis (for production)
# 3. Check memory: http://localhost:4200/health (see memory %)
```

---

## 📊 Monitoring Commands

### See Everything

```bash
# Full status
curl http://localhost:3000/api/health/metrics/status | jq

# Pretty format
curl http://localhost:3000/api/health/metrics/status | jq '.status, .database.healthy, .sessions.activeConnections'
```

### Session Stats

```bash
# Who's online?
curl http://localhost:3000/api/health/metrics/sessions | jq '.sessionsByRole'

# Last hour logins
curl http://localhost:3000/api/health/metrics/sessions | jq '.lastHourLogins'
```

### Performance Check

```bash
# Response time
curl http://localhost:3000/api/health/metrics/status | jq '.performance'

# Database latency
curl http://localhost:3000/api/health/metrics/status | jq '.database.latency'
```

---

## 🔐 Git Commands

### See What Changed

```bash
# Last 5 commits
git log --oneline -5

# What was fixed?
git log --oneline --grep="rate\|auth\|health"

# See exact changes
git show HEAD
```

### Go Back to Stable Version

```bash
# Current version
git rev-parse HEAD | cut -c1-7

# Go to production version
git checkout 05105a10  # Latest deployment-ready

# Go to latest
git checkout convert-into-js
```

### View Documentation

```bash
# Deployment guide
cat DEPLOYMENT_READY.md

# Production setup
cat PRODUCTION_GUIDE.md

# Health validation
cat HEALTH_VALIDATION_GUIDE.md
```

---

## 🧪 Load Testing

### Light Load (10 requests)

```bash
for i in {1..10}; do
  curl -s http://localhost:3000/api/health/metrics/status > /dev/null
  echo "Request $i done"
done
```

### Medium Load (100 concurrent)

```bash
# Requires: Apache Bench (ab)
# Install: apt-get install apache2-utils (Linux)
#          brew install httpd (Mac)

ab -n 100 -c 10 http://localhost:3000/api/health/metrics/status
# -n: 100 requests total
# -c: 10 concurrent
```

### Login Load Test

```bash
for i in {1..20}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    > /dev/null &
done
wait
echo "20 logins complete"
```

---

## 📝 Important Files

### Check These Files

```bash
# Rate limiter (the fix)
cat backend/src/middleware/rate-limit.js | grep -A3 "skipSuccessfulRequests"

# Health metrics API
cat backend/src/routes/health-metrics.js | head -20

# Health dashboard
cat frontend/src/app/pages/health/health-check.component.ts | head -10

# Documentation
ls -la *.md
# DEPLOYMENT_READY.md
# PRODUCTION_GUIDE.md
# HEALTH_VALIDATION_GUIDE.md
```

---

## 🎯 Daily Operations

### Morning Check

```bash
# Everything OK?
curl http://localhost:3000/api/health/metrics/status | jq '.status'
# Should show: "HEALTHY"
```

### Monitor User Activity

```bash
# Who's logged in?
curl http://localhost:3000/api/health/metrics/sessions | jq
```

### Before Deploy

```bash
# Verify code
git log --oneline -1
# Should show latest fix

# Build frontend
ng build 2>&1 | grep "complete"

# Check tests/validation
curl http://localhost:3000/api/health/metrics/ready
```

---

## 🚨 Emergency Procedures

### System Down?

```bash
# 1. Check what's wrong
curl http://localhost:3000/api/health/metrics/status

# 2. Restart everything
pkill -f "node"
pkill -f "ng"

# 3. Start fresh
npm start  # Backend
# Terminal 2: ng serve  # Frontend

# 4. Verify
curl http://localhost:3000/api/health/metrics/ping
```

### Database Connection Lost?

```bash
# 1. Check status
curl http://localhost:3000/api/health/metrics/status | jq '.database'

# 2. Verify connection string
echo $DATABASE_URL

# 3. Test connection
psql $DATABASE_URL -c "SELECT 1"

# 4. Restart backend
npm start
```

### Rate Limiter Still Blocking Users?

```bash
# 1. Verify fix is present
grep -n "skipSuccessfulRequests" backend/src/middleware/rate-limit.js

# 2. Must show: skipSuccessfulRequests: true

# 3. If not, rollback
git show HEAD:backend/src/middleware/rate-limit.js | grep skipSuccessfulRequests

# 4. Restart
npm start
```

---

## 📞 Help Commands

### Show This Guide Again

```bash
cat QUICK_REFERENCE.md
```

### List All Documentation

```bash
ls -la *.md
# Outputs all guide files
```

### Check Version

```bash
git describe --tags || git rev-parse --short HEAD
# Shows: v1.0.0-production or commit hash
```

### Show Recent Changes

```bash
git log --oneline -10
# Shows last 10 commits
```

---

## ⚙️ Environment Variables

### Required for Backend

```bash
# .env file in backend/
DATABASE_URL=postgresql://user:password@host/dbname
GOOGLE_CLIENT_ID=your-google-id
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Optional (for Redis/Production)

```bash
REDIS_HOST=redis-server.com
REDIS_PORT=6379
DATABASE_POOL_MAX=20
SESSION_TTL_HOURS=24
```

### Check Current

```bash
# Show all env vars (backend/)
env | grep -E "DATABASE|GOOGLE|JWT|NODE|REDIS"
```

---

## 🎓 Learning Resources

### Files to Read First

1. **DEPLOYMENT_READY.md** ← Start here
2. **QUICK_REFERENCE.md** ← This file
3. **HEALTH_VALIDATION_GUIDE.md** ← For testing
4. **PRODUCTION_GUIDE.md** ← For scaling

### Code to Review

```bash
# Main fix
cat backend/src/middleware/rate-limit.js | grep -A10 "authLimiter"

# Health UI
cat frontend/src/app/pages/health/health-check.component.ts | head -50

# Routing
cat frontend/src/app/app.routes.ts | grep -A2 "health"
```

---

## 🎉 You're Set!

**Bookmark This**: You now have all the commands you need.

**One Command to Remember**:
```bash
http://localhost:4200/health
```
^^ This shows everything visually.

**Quick Deploy**:
```bash
git pull && npm install && npm start
```

**Verify It Works**:
```bash
curl http://localhost:3000/api/health/metrics/status
```

---

**Status**: ✅ Everything Ready  
**Version**: v1.0.0-production  
**Last Updated**: April 4, 2026

*Keep this file bookmarked. It has everything you need day-to-day.*
