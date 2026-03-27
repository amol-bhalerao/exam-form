# Hostinger Shared Node.js Hosting Setup Guide

## 🎯 Your Situation

You have **Shared Node.js Hosting** (NOT VPS with cPanel), which means:
- ✅ Everything deploys automatically
- ✅ No need for reverse proxy or .htaccess
- ✅ Environment variables are managed through Hostinger panel
- ✅ Backend and Frontend routing is handled automatically

**The guides for cPanel don't apply to you.** This guide is for shared hosting only.

---

## 📋 How Shared Node.js Hosting Works

When you have shared Node.js hosting on Hostinger:

```
Your Domain Request
        ↓
Hostinger Nodes.js Server (Automatic Routing)
        ↓
├─ Frontend: Served from /public_html or /frontend directory
└─ Backend: Served from Node.js process (Automatic)
        ↓
Response to User
```

**No manual configuration needed** - Hostinger handles everything automatically!

---

## 🔧 EXACT CHANGES YOU NEED TO MAKE

### Only ONE Thing to Do:

**Set these Environment Variables in Hostinger Panel**

Go to your Hostinger hosting panel → Environment Variables section and set:

```
NODE_ENV = production

DATABASE_URL = mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam

JWT_ACCESS_SECRET = Jaya_@1991_HSC_Exam_Access_Secret_2024

JWT_REFRESH_SECRET = Jaya_@1991_HSC_Exam_Refresh_Secret_2024

GOOGLE_CLIENT_ID = <your-actual-id-if-you-have>

GOOGLE_CLIENT_SECRET = <your-actual-secret-if-you-have>

CORS_ORIGIN = https://hsc-exam-form.hisofttechnology.com

FRONTEND_URL = https://hsc-exam-form.hisofttechnology.com

API_PORT = 5000

API_HOST = 0.0.0.0

GOOGLE_REDIRECT_URI = https://hsc-exam-form.hisofttechnology.com/api/auth/google/callback

LOG_LEVEL = info

ACCESS_TOKEN_TTL = 15m

REFRESH_TOKEN_TTL_DAYS = 7
```

---

## 📍 How to Set Environment Variables on Hostinger Shared Hosting

### Steps:

1. **Go to Hostinger Dashboard**
   - Login to hostinger.com
   - Click "Manage" next to your hosting account

2. **Find Environment Variables Section**
   - Look for: **"Environment Variables"** or **"Env Variables"**
   - It's usually in: **Hosting → Node.js** or **Settings → Environment**
   - Scroll down if not immediately visible

3. **Add Each Variable**
   - Click **"Add Variable"** or **"New Variable"**
   - Enter:
     - **Name:** `NODE_ENV`
     - **Value:** `production`
   - Click **Save** or **Add**

4. **Repeat for all variables above**
   - Add one variable at a time
   - After each, click Save

5. **Restart Application**
   - Look for **"Restart Application"** button
   - Click it to apply changes

---

## ✅ What's Already Done Automatically

Hostinger shared hosting automatically handles:

| Item | Status | Details |
|------|--------|---------|
| **Reverse Proxy** | ✅ Auto | Hostinger routes /api to Node.js |
| **Frontend Serving** | ✅ Auto | Hostinger serves Angular from correct folder |
| **Backend Running** | ✅ Auto | Node.js process runs automatically |
| **Build Process** | ✅ Auto | npm install & npm run build run automatically |
| **Port Assignment** | ✅ Auto | Port 5000 assigned automatically |
| **SSL/HTTPS** | ✅ Auto | Let's Encrypt on all shared hosting |
| **Domain Routing** | ✅ Auto | Hostinger DNS already configured |

---

## 🎯 THAT'S IT!

Seriously, that's all you need to do. Just set the environment variables and you're live!

No cPanel, no .htaccess, no reverse proxy configuration needed.

---

## ✨ How Your App Works on Shared Hosting

```
1. User visits: https://hsc-exam-form.hisofttechnology.com
                        ↓
   Hostinger automatically serves Angular frontend
                        ↓
2. Frontend loads and makes API call (e.g., GET /api/public/colleges)
                        ↓
   Hostinger automatically routes to Node.js backend
                        ↓
3. Node.js uses the environment variables you set
   - Connects to MySQL with DATABASE_URL
   - Uses JWT secrets from environment
   - CORS configured from CORS_ORIGIN variable
                        ↓
4. Response sent back to frontend
                        ↓
5. User sees college list in dropdown ✅
```

---

## 🔍 Verification Steps

### Test 1: Check if API is responding
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com/api/health

Expected: See JSON response (not HTML)
Result: ☐ JSON ☐ HTML ☐ 404
```

### Test 2: Check if Frontend loads
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com

Expected: See login form
Result: ☐ Works ☐ Blank ☐ 404
```

### Test 3: Test API from PowerShell
```powershell
curl -s https://hsc-exam-form.hisofttechnology.com/api/health
Expected: Returns JSON text
```

### Test 4: Try Login
```
1. Open https://hsc-exam-form.hisofttechnology.com
2. Try to login with a test account
3. Check if it works
```

---

## 🆘 If Something Doesn't Work

### Problem: Getting HTML instead of JSON from /api

**On Shared Hosting:** This usually means the backend isn't starting properly.

**Check:**
1. Hostinger panel → Application logs (should show "Listening on port 5000")
2. Verify all environment variables are set correctly
3. Click "Restart Application" button

### Problem: Environment variables not taking effect

**Solution:**
1. After adding variables, click **"Restart Application"**
2. Wait 30 seconds
3. Clear browser cache (Ctrl+Shift+Delete)
4. Test again

### Problem: Database connection error

**Check:**
```
Make sure DATABASE_URL is exactly:
mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam

Special characters (@, :) must be URL-encoded as %40, %3A
```

### Problem: Frontend shows blank page

**Check:**
1. Browser console for errors (F12 → Console)
2. Verify CORS_ORIGIN is correct
3. Check if Angular build was successful

---

## 📋 Environment Variables Quick Reference

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Tells Node.js it's production |
| `DATABASE_URL` | `mysql://...` | MySQL connection string |
| `JWT_ACCESS_SECRET` | Your secret | Token signing key |
| `JWT_REFRESH_SECRET` | Your secret | Refresh token signing key |
| `CORS_ORIGIN` | Your domain | Allow CORS from this domain |
| `FRONTEND_URL` | Your domain | Frontend URL for redirects |
| `API_PORT` | `5000` | Port Node.js runs on |
| `API_HOST` | `0.0.0.0` | Listen on all interfaces |

---

## 🚀 You're Actually Already Done!

Your application is probably **already working** if:
- ✅ Files are deployed to server
- ✅ Backend is running
- ✅ Environment variables are mostly set

Just make sure the environment variables match what's in the table above, and you should be good to go!

---

## 📞 If You Need Help

If something still doesn't work:

1. **Check Hostinger Logs:**
   - Panel → Logs → Application Logs
   - Shows any errors from Node.js startup

2. **Verify Database Connection:**
   - SSH into server: `mysql -h 127.0.0.1 -u u441114691_exam -p u441114691_exam`
   - Verify database and tables exist

3. **Contact Hostinger Support:**
   - Ask: "How do I verify Node.js backend is running?"
   - Ask: "Are environment variables being passed to Node.js?"

---

## ✅ Final Checklist

- [ ] All environment variables set in Hostinger panel
- [ ] Application restarted after setting variables
- [ ] Frontend loads at your domain
- [ ] /api/health endpoint returns JSON
- [ ] Login form appears and works
- [ ] Can successfully login
- [ ] Database queries work (shows colleges, streams, etc.)

Once all above are checked, your HSC Exam is **LIVE!** 🎉

---

## 🎯 TLDR (Too Long; Didn't Read)

**You don't need cPanel or command line.**

Just do this:
1. Go to Hostinger hosting panel
2. Find "Environment Variables"
3. Add all the variables from the table above with their values
4. Click "Restart Application"
5. Test at https://hsc-exam-form.hisofttechnology.com

**Done! Your app is live!** 🚀
