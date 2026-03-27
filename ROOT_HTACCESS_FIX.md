# ROOT .HTACCESS FOR HOSTINGER - CRITICAL FIX

This file controls how Apache routes requests.

**Current Problem:**
- `/api/*` requests return 404
- Should go to Node.js backend on port 5000
- Instead, going to Angular frontend

**Solution:** Create this `.htaccess` file in `/home/u441114691/` (NOT in public_html!)

```apache
# Hostinger Root .htaccess for Node.js + Angular SPA

# Enable mod_rewrite
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Pass API requests to Node.js backend
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    # Redirect everything else to Angular frontend in public_html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/public_html
    RewriteRule ^(.*)$ public_html/index.html [L]
</IfModule>

# Enable proxy module
<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
</IfModule>
```

**OR Alternative if above doesn't work:**

```apache
# If ProxyPass is available
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Pass API to backend
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^api(.*)$ http://127.0.0.1:5000/api$1 [P,L,QSA]
    
    # SPA routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ public_html/index.html [L]
</IfModule>
```

---

## HOW TO CREATE THIS FILE

### Via Hostinger File Manager
1. Go to **Files → File Manager**
2. Navigate to `/home/u441114691/` (home directory, NOT public_html)
3. **Create New File** → Name it `.htaccess`
4. Paste one of the configs above
5. Save

### Via FTP
Upload `.htaccess` to `/home/u441114691/` directory

---

## BACKEND STARTUP OPTIONS

Once backend code is uploaded to `/home/u441114691/app`, you need to start it:

### Option 1: Via Hostinger Node.js Feature (RECOMMENDED)
- In Hostinger cPanel: **Advanced → Node.js**
- Create new Node.js app:
  - Entry point: `src/server.js`
  - Directory: `/home/u441114691/app`
  - Port: `5000`
  - Click "Create"

### Option 2: Via Startup Script
1. Create file: `/home/u441114691/startup.sh`
2. Content:
```bash
#!/bin/bash
cd /home/u441114691/app
npm install --production=false
npx prisma generate
node src/server.js
```
3. Make executable in cPanel Terminal:
```bash
chmod +x ~/startup.sh
```

### Option 3: Via Forever/PM2 (if installed)
```bash
cd ~/app
pm2 start src/server.js --name app
pm2 startup
pm2 save
```

---

## BACKEND UPLOAD CHECKLIST

Backend needs these files in `/home/u441114691/app/`:

- ✓ `src/` - all source files
- ✓ `prisma/` - database config
- ✓ `package.json` - dependencies list
- ✓ `.env` - environment variables (MySQL config)
- ✓ `.npmrc` - npm settings
- ✓ `node_modules/` - optional (will be created by npm install)

---

## TESTING AFTER SETUP

### Test 1: Frontend loads
```
https://hsc-exam-form.hisofttechnology.com/
Should show Angular login form
```

### Test 2: Backend health check
```
https://hsc-exam-form.hisofttechnology.com/api/health
Should return JSON: {"ok": true, ...}
(NOT 404 or 301 redirect)
```

### Test 3: Get exams (this was broken)
```
https://hsc-exam-form.hisofttechnology.com/api/public/exams
Should return: [exam1, exam2, ...]
(NOT 404)
```

---

## TROUBLESHOOTING

### Problem: Still getting 404 for /api
**Check:**
1. Is `.htaccess` in ROOT directory (`/home/u441114691/`), NOT in `public_html/`?
2. Is backend running on port 5000?
3. Is `mod_proxy` enabled in Apache?

Try this test:
```bash
curl http://127.0.0.1:5000/api/health
```
(Should work if backend is running)

### Problem: Getting 301 redirect
**Cause:** `.htaccess` rules not set up

**Fix:**
1. Create proper `.htaccess` in root
2. Make sure it has ProxyPass enabled

### Problem: Backend crashes after starting
**Check:**
1. Is `/home/u441114691/app/.env` set to MySQL (not SQLite)?
2. Can it connect to database?
3. Is Prisma generated? `npx prisma generate`
4. View logs:
```bash
pm2 logs app
# or
tail -f ~/app.log
```
