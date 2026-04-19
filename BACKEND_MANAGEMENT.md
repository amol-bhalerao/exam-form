# 🛠️ Backend Management Guide

Quick reference for managing the deployed backend on Hostinger.

---

## 🚀 Start/Stop/Restart Backend

### Start (if stopped)
```bash
pm2 start ecosystem.config.js
pm2 start hsc-api     # by app name
```

### Stop
```bash
pm2 stop hsc-api
```

### Restart (reload config/code)
```bash
pm2 restart hsc-api
```

### Reload (graceful restart without downtime)
```bash
pm2 reload hsc-api
```

### Delete app
```bash
pm2 delete hsc-api
```

---

## 📋 View Logs & Status

### App Status
```bash
pm2 status           # Table view
pm2 info hsc-api     # Detailed info
```

### View Logs
```bash
pm2 logs hsc-api              # Live logs (press Ctrl+C to exit)
pm2 logs hsc-api --lines 50   # Last 50 lines
pm2 logs hsc-api --lines 100  # Last 100 lines
pm2 logs hsc-api --nostream   # Just print logs
pm2 logs hsc-api --err        # Error log only
```

### Real-time Monitoring
```bash
pm2 monit             # CPU, memory, requests
```

---

## 🔧 Update & Redeploy

### Pull Latest Code
```bash
git pull origin convert-into-js
```

### Install Updated Dependencies
```bash
npm install --legacy-peer-deps
cd backend && npm install --legacy-peer-deps
cd ..
```

### Run New Migrations
```bash
cd backend
npx prisma migrate deploy
npx prisma migrate status
cd ..
```

### Gracefully Restart with New Code
```bash
pm2 reload hsc-api
```

---

## 🔍 Debugging

### Check API Health
```bash
curl https://hsc-api.hisofttechnology.com/api/health
```

### Test Database Connection
```bash
cd backend
npx prisma db execute --stdin
# Paste SQL: SELECT 1;
# Then press Ctrl+D
```

### View All PM2 Processes
```bash
pm2 list
```

### Save PM2 Config (auto-start on reboot)
```bash
pm2 save
pm2 startup
```

---

## 🚨 Common Issues & Fixes

### App Crashed
```bash
# Check why it crashed
pm2 logs hsc-api --err --lines 50

# Restart
pm2 restart hsc-api
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Or change PORT in ecosystem.config.js and restart
pm2 restart hsc-api
```

### Out of Memory
```bash
# Check memory usage
pm2 monit

# Increase limit in ecosystem.config.js (max_memory_restart: '1000M')
pm2 restart hsc-api
```

### Database Connection Error
```bash
# Verify DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL

# Test connection
cd backend && npx prisma db push
```

---

## 📊 Auto-restart on Server Reboot

To auto-start backend when server reboots:

```bash
pm2 save      # Save PM2 config
pm2 startup   # Generate and run startup command
```

Then restart your server and verify:
```bash
pm2 status   # Should show app running
```

---

## 🔄 Zero-Downtime Deployment

### Deploy without stopping server
```bash
git pull origin convert-into-js
npm install --legacy-peer-deps
cd backend && npm install --legacy-peer-deps
npx prisma migrate deploy
cd ..
pm2 reload hsc-api    # Graceful reload with no downtime
```

---

## 📈 Monitoring

### Check Resource Usage
```bash
pm2 monit
```

### Watch for Errors
```bash
pm2 logs hsc-api --err
```

### Check Uptime
```bash
pm2 info hsc-api    # Shows restarts, uptime, etc
```

---

## 🔐 Security Checklist

- ✅ Keep `.env` file permissions restricted: `chmod 600 backend/.env`
- ✅ Don't commit `.env` to git (it's in .gitignore)
- ✅ Use strong JWT secrets (min 32 characters)
- ✅ Rotate secrets periodically
- ✅ Keep Node.js and npm updated
- ✅ Run `npm audit` to check for vulnerabilities

---

## 📞 Emergency Help

### Kill all PM2 processes
```bash
pm2 kill
```

### Manually start server
```bash
cd backend
NODE_ENV=production npm start
```

### Check system resources
```bash
top        # CPU & Memory
df -h      # Disk space
```

---

## 📝 Environment Variables Reference

**Critical (app won't start without):**
- `DATABASE_URL` - MySQL connection
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `CORS_ORIGIN` - Frontend URL

**Required for Google Login:**
- `GOOGLE_CLIENT_ID` - Get from Google Cloud Console

**Optional:**
- `CASHFREE_*` - Payment gateway
- `ENCRYPTION_KEY` - Data encryption

To update: Edit `backend/.env` then `pm2 restart hsc-api`

---

**Last Updated:** April 2, 2026  
**Status:** ✅ Production Ready
