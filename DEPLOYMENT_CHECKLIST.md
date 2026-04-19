# 🚀 Hostinger Deployment Checklist

**Status:** Ready for Deployment  
**Last Updated:** April 2, 2026  
**Target:** Hostinger Node.js Server  

---

## ✅ What's Required for Deployment to Work

### **1. Environment Variables (CRITICAL** - App Won't Start Without These)

These variables **MUST** be set in Hostinger cPanel or via SSH in the backend `.env` file:

#### Required (App Won't Start):
- ✅ `DATABASE_URL` - MySQL connection string
- ✅ `JWT_ACCESS_SECRET` - Secret key for access tokens (min 6 chars)
- ✅ `JWT_REFRESH_SECRET` - Secret key for refresh tokens (min 6 chars)
- ✅ `CORS_ORIGIN` - Frontend URL for CORS

#### Required for Google Login:
- ⚠️ `GOOGLE_CLIENT_ID` - Get from https://console.cloud.google.com (optional but recommended)

#### Optional (App will work without):
- `CASHFREE_*` - Payment gateway (only if using payments)
- `ENCRYPTION_KEY` - For sensitive data encryption

---

## 📋 Step-by-Step Deployment

### **Step 1: SSH into Hostinger**

```bash
ssh -p 65002 u441114691@45.130.228.77
# Or use Hostinger's Terminal in cPanel
```

---

### **Step 2: Navigate to Backend Directory**

```bash
cd ~/domains/hsc-api.hisofttechnology.com/public_html
# or wherever your backend directory is
```

---

### **Step 3: Create .env File with Required Variables**

```bash
cat > backend/.env << 'EOF'
# Database
DATABASE_URL="mysql://u441114691_exam:YOUR_PASSWORD@127.0.0.1:3306/u441114691_exam"

# JWT Secrets (Generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET="your_access_secret_min_6_chars"
JWT_REFRESH_SECRET="your_refresh_secret_min_6_chars"
ACCESS_TOKEN_TTL="60m"
REFRESH_TOKEN_TTL_DAYS="30"

# CORS & URLs
CORS_ORIGIN="https://hsc-exam-form.hisofttechnology.com"
BACKEND_URL="https://hsc-api.hisofttechnology.com"
FRONTEND_URL="https://hsc-exam-form.hisofttechnology.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your_google_client_id_here"

# Node Environment
NODE_ENV="production"
BUILD_ID="prod-2026-04-02"
EOF
```

---

### **Step 4: Verify Node.js is Installed**

```bash
node --version    # Should be v18+ (Hostinger has v20+)
npm --version     # Should be npm 8+
```

---

### **Step 5: Pull Latest Code**

If using git:

```bash
cd ..  # Parent directory
git clone https://github.com/amol-bhalerao/exam-form.git . --branch convert-into-js
# or: git pull origin convert-into-js
```

---

### **Step 6: Install Dependencies**

```bash
cd backend
npm install --legacy-peer-deps
```

---

### **Step 7: Run Database Migrations (IMPORTANT!)**

This creates missing tables and columns:

```bash
npx prisma migrate deploy
# Verify with:
npx prisma migrate status
```

---

### **Step 8: Check if PM2 is Installed**

```bash
npm list -g pm2
# If not installed globally, install it:
npm install -g pm2
```

---

### **Step 9: Start Backend with PM2**

```bash
# From the root directory (where ecosystem.config.js is):
pm2 start ecosystem.config.js
pm2 save            # Save PM2 config (auto-restart on reboot)
pm2 startup         # Enable auto-restart on server reboot
pm2 monit           # Monitor logs (press Ctrl+C to exit)
```

---

### **Step 10: Build and Deploy Frontend**

```bash
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Upload to frontend server:
# dist/exam-form/browser/* → your frontend hosting
```

---

## 🔍 Troubleshooting

### **Error: "Cannot find module"**
→ Run: `npm install --legacy-peer-deps`

### **Error: "Database connection failed"**
→ Check `DATABASE_URL` in `.env` is correct  
→ Verify MySQL is accessible on Hostinger

### **Error: "Missing migrations"**
→ Run: `npx prisma migrate deploy`

### **Error: "PM2 not found"**
→ Install globally: `npm install -g pm2`

### **Error: "EACCES: permission denied"**
→ Check file permissions: `chmod 755 backend/src/server.js`

### **Port Already in Use**
→ Check what's using port 3000: `lsof -i :3000`  
→ Or change PORT in ecosystem.config.js

---

## 📊 Verification Checklist

After deployment, verify:

```bash
# 1. Check backend is running
curl https://hsc-api.hisofttechnology.com/api/health

# 2. Check PM2 status
pm2 status

# 3. Check recent logs
pm2 logs hsc-api --lines 50

# 4. Test database connection
npx prisma db execute --stdin < /dev/null

# 5. Test public endpoint (should return master data)
curl https://hsc-api.hisofttechnology.com/api/masters/subjects

# 6. Open frontend
# Visit: https://hsc-exam-form.hisofttechnology.com
# Try logging in
```

---

## 🚨 Critical Issues & Solutions

### **Issue: "ng: command not found"**
✅ **FIXED** - We now use `npx ng` which resolves from node_modules

### **Issue: "zone.js version mismatch"**
✅ **FIXED** - Updated to zone.js ^0.15.0 for Angular 20.3

### **Issue: "devDependencies not installed in production"**
✅ **FIXED** - Using `npm install --legacy-peer-deps` flag

### **Issue: "401 Unauthorized on API calls"**
→ User is not logged in  
→ Or JWT secrets don't match frontend/backend

### **Issue: "500 Internal Server Error"**
→ Run migrations: `npx prisma migrate deploy`  
→ Check logs: `pm2 logs hsc-api`

---

## 📦 Files in Repository

- ✅ `ecosystem.config.js` - PM2 configuration for production
- ✅ `.env.example` - Template for environment variables
- ✅ `package.json` (root) - Build scripts
- ✅ `backend/package.json` - Backend dependencies
- ✅ `frontend/package.json` - Frontend dependencies
- ✅ `backend/src/env.js` - Environment variable validation

---

## 🎯 Summary

**What You Need to Do:**

1. ✅ SSH to Hostinger
2. ✅ Create `.env` file with required variables
3. ✅ Run: `npm install --legacy-peer-deps`
4. ✅ Run: `npx prisma migrate deploy`
5. ✅ Start: `pm2 start ecosystem.config.js`
6. ✅ Build frontend: `npm run build`
7. ✅ Test: `curl https://hsc-api.hisofttechnology.com/api/health`

**That's it!** The app should be running.

---

## 🆘 Still Having Issues?

1. Check recent logs: `pm2 logs hsc-api --lines 100`
2. Verify .env variables: `cat backend/.env`
3. Check database: `npx prisma db push --skip-generate`
4. Re-install deps: `rm -rf node_modules && npm install --legacy-peer-deps`
5. Restart: `pm2 restart hsc-api`

---

**Status:** ✅ Ready to Deploy  
**Build Quality:** ✅ Production Optimized  
**Code:** ✅ Pushed to GitHub (convert-into-js branch)
