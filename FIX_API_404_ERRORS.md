# 🚨 CRITICAL FIX - API 404 ERRORS

## Root Cause Identified
Your `/api/public/exams` returns 404 because:
1. ✗ Backend code NOT uploaded to `/home/u441114691/app`
2. ✗ Root `.htaccess` NOT configured to route `/api` to backend
3. ✗ Apache is routing all requests to frontend Angular app

---

## ✅ SOLUTION (3 Steps)

### STEP 1: Create Root .htaccess (2 minutes)

**File to create:** In your home directory, NOT public_html

#### Via Hostinger File Manager:
1. Go to **Files → File Manager**
2. Click **Home** or navigate to `/home/u441114691/`
3. Click **+ Create New File**
4. Name: `.htaccess`
5. Click **Create**
6. Click to edit it
7. Paste this content:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # CRITICAL: Route /api requests to Node.js backend
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L,QSA]
    
    # Route everything else to Angular frontend
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public_html/index.html [L]
</IfModule>

<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
</IfModule>
```

8. Click **Save**

✓ **Expected**: File shows as `.htaccess` in file manager

---

### STEP 2: Upload Backend Code (10 minutes)

**Source:** `c:\Users\UT\OneDrive\Desktop\hsc_exam\backend\`
**Destination:** `/home/u441114691/app/` (create this folder)

#### Via Hostinger File Manager:
1. Navigate to `/home/u441114691/`
2. Create folder: **+ Create Folder** → name: `app`
3. Enter the `app` folder
4. Upload these from your `backend/` folder:
   - `src/` folder (entire folder)
   - `prisma/` folder (entire folder)
   - `package.json`
   - `package-lock.json`
   - `.env` (has MySQL config inside)
   - `.npmrc`
   - `.prettierrc`
   - `.eslintrc.js`

**Faster Option - Via FTP/SFTP Client:**
- Use FileZilla or WinSCP
- Connect to: `45.130.228.77:65002` with your SSH credentials
- Upload `backend/` folder to `/home/u441114691/app/`

---

### STEP 3: Install & Start Backend (5 minutes)

#### Via Hostinger Terminal:
1. In Hostinger cPanel → **Advanced → Terminal**
2. Run these commands (one at a time), waiting for each to complete:

```bash
cd ~/app
npm install --production=false
```
⏳ **WAIT 3-5 MINUTES** for npm to finish
Expected: `added 433 packages`

```bash
npx prisma generate
```
✓ Expected: `✔ Generated Prisma Client`

```bash
node src/server.js &
```
This starts the backend in background

```bash
ps aux | grep "node src/server.js" | grep -v grep
```
Should show the process running

---

## 🧪 TESTING (Verify Everything Works)

Wait **10 seconds** after starting backend, then test:

### Test 1: Frontend loads ✓
Browse: `https://hsc-exam-form.hisofttechnology.com/`
- ✓ Should load Angular login form
- ✓ F12 shows NO red errors

### Test 2: Health Check ✓
Browser DevTools (F12):
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

**Expected Response:**
```json
{
  "ok": true,
  "service": "hsc-exam-backend",
  "version": "prod-2026-03-25",
  "timestamp": "2026-03-28T...",
  "uptimeSeconds": 50+
}
```

✓ **PASS**: Returns 200 OK
✗ **FAIL**: Returns 404 (check .htaccess, check port 5000)

### Test 3: Get Exams (THIS IS THE ONE THAT WAS BROKEN) ✓
Browser DevTools:
```javascript
fetch('/api/public/exams').then(r => r.json()).then(console.log)
```

**Expected Response:** Array of exams
```json
[
  {
    "id": "exam1",
    "name": "HSC 2024",
    "stream": "Science",
    ...
  }
]
```

✓ **PASS**: Returns 200 with exam data (NOT 404!)
✗ **FAIL**: Returns 404 (backend not running or .htaccess not set)
✗ **FAIL**: Returns 500 (run `npx prisma generate` again)

### Test 4: Student Login ✓
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)
```

Expected: `{token: "...", user: {...}}`

### Test 5: Admin Login ✓
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@hisofttechnology.com',
    password: 'admin123'
  })
}).then(r => r.json()).then(console.log)
```

Expected: `{token: "...", user: {...}}`

---

## 🔧 TROUBLESHOOTING

### Problem: Still getting 404 for /api/public/exams

**Check 1:** Is `.htaccess` in the RIGHT location?
- Should be: `/home/u441114691/.htaccess` (HOME directory)
- NOT in: `/home/u441114691/public_html/.htaccess`
- Verify via File Manager

**Check 2:** Is backend running?
```bash
ps aux | grep "node src/server.js"
```
Should show process. If not:
```bash
cd ~/app && node src/server.js &
```

**Check 3:** Test directly from server:
```bash
curl http://127.0.0.1:5000/api/health
```
If this works but website doesn't, `.htaccess` issue.
If this fails, backend not running.

### Problem: Getting 500 error for /api/public/exams

**Cause:** Prisma not generated for Linux

**Fix:**
```bash
cd ~/app
npx prisma generate
ps aux | grep "node" | grep -v grep  # Check process
kill <PID>  # Kill if running
node src/server.js &  # Restart
```

### Problem: Backend crashes on start

**Check logs:**
```bash
pm2 logs app  # if using PM2
# or
tail -f ~/app.log  # if logging to file
```

**Common issues:**
1. MySQL database not accessible
2. `.env` has wrong credentials
3. Prisma not generated (`npx prisma generate`)

---

## ✅ FINAL CHECKLIST

- [ ] Root `.htaccess` created in `/home/u441114691/`
- [ ] Backend code uploaded to `/home/u441114691/app/`
- [ ] `npm install --production=false` completed (433 packages)
- [ ] `npx prisma generate` completed successfully
- [ ] `node src/server.js &` is running (check with ps aux)
- [ ] Frontend loads: https://hsc-exam-form.hisofttechnology.com/
- [ ] `/api/health` returns 200 OK
- [ ] `/api/public/exams` returns 200 OK with exam data
- [ ] Student login works
- [ ] Admin login works
- [ ] Protected endpoints return 401 without token

---

## 📋 FILES TO UPLOAD

**Location:** `c:\Users\UT\OneDrive\Desktop\hsc_exam\backend`

**To:** `/home/u441114691/app/`

```
backend/
├── src/             ← UPLOAD (source code)
├── prisma/          ← UPLOAD (database config)
├── package.json     ← UPLOAD
├── package-lock.json ← UPLOAD
├── .env             ← UPLOAD (has MySQL credentials)
├── .npmrc           ← UPLOAD
├── .prettierrc       ← UPLOAD
├── .eslintrc.js     ← UPLOAD
└── node_modules/    ← SKIP (will be created by npm install)
```

---

## 🆘 STILL NOT WORKING?

**If `/api/public/exams` still returns 404 after all steps:**

1. **Check `/home/u441114691/` directory listing:**
   ```bash
   ls -la ~/
   ```
   Should show `.htaccess` file

2. **Check backend directory:**
   ```bash
   ls -la ~/app/src/
   ```
   Should show files (server.js, etc)

3. **Test backend directly:**
   ```bash
   curl http://127.0.0.1:5000/api/public/exams
   ```
   If this returns data but website returns 404, ProxyPass issue

4. **Check which port backend is on:**
   ```bash
   netstat -tulpn | grep LISTEN
   ```
   Look for Node.js process and what port it's using

5. **View current .htaccess:**
   ```bash
   cat ~/.htaccess
   ```
   Make sure ProxyPass rules are correct

---

**ONCE WORKING:** Run comprehensive tests:
```powershell
npm run test:e2e
```
(from your local machine)
