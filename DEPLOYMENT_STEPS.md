# ⚡ COMPLETE DEPLOYMENT & TESTING WALKTHROUGH

## Overview
- **Frontend**: 13 files ready to upload (Angular build)
- **Backend**: Fixed Prisma issue (Linux binaries)
- **Testing**: Comprehensive E2E tests with all user roles

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- ✅ Frontend build exists: `frontend/dist/exam-form/browser/`
- ✅ Backend code optimized and tested locally
- ✅ SSH key added to Hostinger
- ⏳ Frontend needs to be uploaded to public_html
- ⏳ Backend Prisma binaries need to be generated on Linux

---

## 🚀 DEPLOYMENT STEPS (Do These in Order)

### PART A: Upload Frontend (5 minutes)

**Step A1**: Open Hostinger File Manager
- URL: hpanel.hostinger.com
- Go to: **Files → File Manager**
- Location: `/home/u441114691/public_html/`

**Step A2**: Clear old files
- Select all files (Ctrl+A)
- Delete them

**Step A3**: Upload new frontend
- Source folder on your computer: 
  ```
  c:\Users\UT\OneDrive\Desktop\hsc_exam\frontend\dist\exam-form\browser\
  ```
- Upload all files:
  - `index.html`
  - `main-*.js`
  - `polyfills-*.js`
  - `styles-*.css`
  - `chunk-*.js` (all chunks)
  - `assets/` (folder)
  - `.htaccess`
  - `favicon.ico`

**Step A4**: Verify
- Should see ~13-15 files in public_html
- No errors during upload

✓ **Expected**: https://hsc-exam-form.hisofttechnology.com/ loads with login form

---

### PART B: Fix Backend Prisma (10 minutes) ⚠️ CRITICAL

**Step B1**: SSH to Hostinger
- Option 1: Use Hostinger **Advanced → Terminal** in cPanel
- Option 2: Use SSH client: `ssh -p 65002 u441114691@45.130.228.77`

**Step B2**: Run these commands (one at a time):

```bash
cd ~/app
```
Press Enter. Should show: `/home/u441114691/app`

```bash
rm -rf node_modules
```
Press Enter. Wait for prompt.

```bash
npm install --production=false
```
Press Enter. ⏳ **WAIT 2-3 MINUTES** for it to finish.
Expected end message: `added 433 packages`

```bash
npx prisma generate
```
Press Enter. ✓ Expected: `✔ Generated Prisma Client`

```bash
pm2 restart app
```
Press Enter. ✓ Expected: `app restarting` or `app: ✓ Restarted`

**Step B3**: Verify backend started
```bash
pm2 status
```
Should show `app` with status `online` or `running` (in green)

✓ **Expected**: `/api/health` returns `{"ok": true, ...}`
✗ **WRONG**: `/api/public/exams` returns 500 error (check if Prisma command ran)

---

## 🧪 TESTING (Do These in Order)

### Test 1: Frontend Loading (2 min)

Open in browser: `https://hsc-exam-form.hisofttechnology.com/`

**Look for**:
- ✓ Page loads without blank/error screens
- ✓ Login form visible
- ✓ "HSC Exam" or form title appears
- ✓ F12 Console (right-click → Inspect) shows NO red errors
- ✓ Network tab shows CSS/JS files loading (status 200, not 404)

**If failing**:
- Check `.htaccess` exists in public_html/
- Check all files uploaded
- Clear cache: Ctrl+Shift+Delete in browser

---

### Test 2: Backend Health Check (1 min)

In browser DevTools Console (F12), paste:
```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log(d))
```

Expected output:
```json
{
  "ok": true,
  "service": "hsc-exam-backend",
  "version": "prod-2026-03-25",
  "timestamp": "2026-03-28T...",
  "uptimeSeconds": 100+
}
```

✓ **PASS**: Returns 200 OK with status info
✗ **FAIL**: Returns 500 or times out

---

### Test 3: Get Exams (THIS WAS BROKEN) (1 min)

In browser DevTools Console (F12), paste:
```javascript
fetch('/api/public/exams').then(r => r.json()).then(d => console.log('Status:', d, typeof d))
```

Expected output (should return exam array):
```
[
  {
    "id": "exam_id_1",
    "name": "HSC 2024",
    "stream": "Science",
    ...
  },
  ...
]
```

✓ **PASS**: Returns 200 with exam data (NOT 500 error)
✗ **FAIL**: Still returns 500 (Prisma not generated - redo Step B2)

---

### Test 4: Student Login Test (2 min)

In browser DevTools Console (F12), paste:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
}).then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(d => console.log('Response:', d))
```

Expected output:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "student@example.com",
    "role": "student",
    "name": "Student Name"
  }
}
```

✓ **PASS**: Returns 200 with token and user
✗ **FAIL**: Returns 401 (bad credentials - try other user)
✗ **FAIL**: Returns 500 (database issue)

---

### Test 5: Admin Login Test (1 min)

In browser DevTools Console (F12), paste:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@hisofttechnology.com',
    password: 'admin123'
  })
}).then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(d => console.log('Response:', d))
```

Expected: Same as Student Login (token + admin user info)

✓ **PASS**: Returns 200 with admin token
✗ **FAIL**: Returns 401 (check credentials)

---

### Test 6: Protected Endpoint (1 min)

From Test 4 or 5, copy the `token` value (without quotes).

Paste in console (replace TOKEN with actual value):
```javascript
let token = "eyJhbGc..."; // Your token from login
fetch('/api/me', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json()).then(d => console.log(d))
```

Expected output:
```json
{
  "id": "user_id",
  "email": "student@example.com",
  "role": "student",
  "name": "Student Name",
  ...
}
```

✓ **PASS**: Returns user profile
✗ **FAIL**: Returns 401 (token invalid - get new one)
✗ **FAIL**: Returns 500 (server error)

---

### Test 7: Test Without Token (1 min)

For security, test that endpoints ARE protected:

```javascript
fetch('/api/me').then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(d => console.log(d))
```

Expected: **Status 401 Unauthorized**
(This is CORRECT - endpoints should require auth)

---

### Test 8: Get All Colleges (1 min)

```javascript
fetch('/api/public/colleges').then(r => r.json()).then(d => console.log(d))
```

Expected: Array of colleges (should NOT need login)

✓ **PASS**: Returns 200 with college list
✗ **FAIL**: Returns 404 (endpoint not implemented)

---

## ✅ FINAL CHECKLIST - Everything Working?

Check all boxes:

- [ ] Frontend loads at `https://hsc-exam-form.hisofttechnology.com/`
- [ ] No blank page or JavaScript errors (F12)
- [ ] `/api/health` returns 200 OK
- [ ] `/api/public/exams` returns 200 OK (NOT 500 anymore!)
- [ ] `/api/public/colleges` returns 200 OK
- [ ] Student login succeeds with `student@example.com` / `password123`
- [ ] Admin login succeeds with `admin@hisofttechnology.com` / `admin123`
- [ ] Protected endpoints return 401 without token
- [ ] Protected endpoints work with valid token
- [ ] Login form visible and interactive on frontend

---

## 🎯 EXPECTED RESULTS SUMMARY

| Test | Before | After Fix |
|------|--------|-----------|
| Frontend Home | ✓ Works | ✓ Works |
| `/api/health` | ✓ 200 OK | ✓ 200 OK |
| `/api/public/exams` | ✗ 500 | ✓ 200 (Fixed!) |
| `/api/public/colleges` | ✗ 404 | ✓ 200 |
| Student Login | ⏳ Unknown | ✓ 200 OK |
| Protected Endpoints | ⏳ Unknown | ✓ 200 OK |

---

## 🆘 TROUBLESHOOTING

### Problem 1: Frontend shows blank page
```
Cause: Files not uploaded or .htaccess missing
Fix: 
  1. Check public_html/ has 13+ files
  2. Verify .htaccess exists
  3. Clear browser cache (Ctrl+Shift+Delete)
```

### Problem 2: `/api/public/exams` still returns 500
```
Cause: Prisma not generated for Linux
Fix:
  1. SSH to Hostinger
  2. Run: cd ~/app && npx prisma generate
  3. Run: pm2 restart app
  4. Wait 5 seconds, test again
```

### Problem 3: Login returns 401
```
Cause: Bad credentials or user doesn't exist
Fix:
  1. Verify email/password in system
  2. Check database has test users
  3. Review backend logs: pm2 logs app
```

### Problem 4: Login returns 500
```
Cause: Backend database error
Fix:
  1. Check backend is running: pm2 status
  2. View logs: pm2 logs app
  3. Check database connection in .env
```

---

## 📞 SUPPORT RESOURCES

- Deployment guide: `MANUAL_DEPLOYMENT_GUIDE.md`
- Quick commands: `QUICK_COMMANDS.sh`
- Test suite: Run `npm run test:e2e` (after frontend uploaded)
- View logs: `pm2 logs app` (on Hostinger)

All files committed to GitHub (branch: `convert-into-js`)

---

**Ready? Start with Step A1! 🚀**
