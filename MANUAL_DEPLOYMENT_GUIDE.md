# MANUAL DEPLOYMENT & TESTING GUIDE

Since automated SSH/SFTP deployment is having connection stability issues with Hostinger, follow these manual steps.

---

## STEP 1: Upload Frontend Files via Hostinger File Manager

### 1.1 Access File Manager
1. Log in to **Hostinger Control Panel** (hpanel.hostinger.com)
2. Go to **Files → File Manager**
3. Ensure you're in: `/home/u441114691/public_html/`

### 1.2 Clear Old Files (if any)
1. Select all files in `public_html/`  
2. Delete them
3. Confirm deletion

### 1.3 Upload New Frontend
1. On your computer, locate: `c:\Users\UT\OneDrive\Desktop\hsc_exam\frontend\dist\exam-form\browser\`
2. **Select all files** in this folder (Ctrl+A)
3. Drag & drop to Hostinger File Manager, or use **Upload** button
4. Files to upload:
   - `index.html`
   - `main-*.js` (the main JavaScript bundle)
   - `polyfills-*.js`
   - `styles-*.css`
   - `chunk-*.js` (any other chunk files)
   - `assets/` folder
   - `.htaccess` file
   - `favicon.ico`

### 1.4 Verify Upload
After upload completes:
- Should show ~13-15 files in public_html
- `index.html` should be there
- `.htaccess` should be there (may be hidden - enable "Show hidden files")

---

## STEP 2: Fix Backend - Prisma Generation

### 2.1 SSH Access
1. In Hostinger Control Panel, go to **Advanced → Terminal** (or use SSH client)
2. Connect as: `u441114691@45.130.228.77:65002`
3. Paste SSH key password if prompted (or use SSH key authentication)

### 2.2 Run These Commands (One by One)

#### Command 1: Navigate to app directory
```bash
cd ~/app
```

#### Command 2: Clean node_modules
```bash
rm -rf node_modules
```

#### Command 3: Install all dependencies (including dev)
```bash
npm install --production=false
```
⏳ This takes 2-3 minutes. Wait for it to complete with "added XXX packages"

#### Command 4: Generate Prisma (CRITICAL)
```bash
npx prisma generate
```
✓ You should see: `✔ Generated Prisma Client`

#### Command 5: Restart backend
```bash
pm2 restart app
```
✓ You should see: `app: ✓ Restarted` or `app restarting`

### 2.3 Verify Backend is Running
```bash
pm2 status
```
Should show `app` with status `online` (green)

---

## STEP 3: Test Frontend Loading

### 3.1 In Browser
Open: `https://hsc-exam-form.hisofttechnology.com/`

You should see:
- ✓ Angular app loads
- ✓ Login form appears
- ✓ No console errors (F12 → Console)
- ✓ No 404 errors

### 3.2 Check Network (F12)
- CSS files load (styles-*.css)
- JS files load (main-*.js)
- No 404 errors for assets

---

## STEP 4: Test Backend APIs

### 4.1 Quick Tests in Browser Console

Open DevTools (F12 → Console) and paste:

**Test 1: Health Check**
```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log(d))
```
Expected response:
```json
{
  "ok": true,
  "service": "hsc-exam-backend",
  "version": "prod-2026-03-25",
  "uptimeSeconds": 123.456
}
```

**Test 2: Get All Exams**
```javascript
fetch('/api/public/exams').then(r => r.json()).then(d => console.log(d))
```
Expected response: Array of exams or `{"exams": [...]}`

**Test 3: Get Colleges**
```javascript
fetch('/api/public/colleges').then(r => r.json()).then(d => console.log(d))
```
Expected response: Array of colleges

---

## STEP 5: Test User Authentication

### 5.1 Student Login Test

In browser console:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(d => console.log(d))
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "student@example.com",
    "role": "student",
    "name": "..."
  }
}
```

### 5.2 Admin Login Test

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@hisofttechnology.com',
    password: 'admin123'
  })
}).then(r => r.json()).then(d => console.log(d))
```

### 5.3 Using Token

After successful login, copy the token and test protected endpoint:

```javascript
let token = "eyJhbGc..."; // From login response
fetch('/api/me', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json()).then(d => console.log(d))
```

Expected response: User profile

---

## STEP 6: Run Automated Tests (Optional)

If you have PowerShell, run comprehensive tests:

```powershell
# Test backend only
npm run test:production

# Test frontend + backend + all user types
npm run test:e2e
```

---

## TROUBLESHOOTING

### Problem: Frontend shows blank page
**Solution**: 
1. Check `/` loads (should see HTML)
2. Check Console (F12) for errors
3. Verify `.htaccess` is in public_html/
4. Check Network tab - CSS/JS loading?

### Problem: `/api/public/exams` returns 500
**Solution**:
1. SSH to Hostinger
2. Run: `cd ~/app && npx prisma generate && pm2 restart app`
3. Wait 5 seconds and test again

### Problem: Login fails
**Solution**:
1. Verify email/password are correct
2. Check backend logs: `pm2 logs app`
3. Verify database is accessible

### Problem: 401 Unauthorized errors
**Solution**: Normal - means authentication failed
- Use correct email/password
- Include full token in Authorization header

---

## TESTING CHECKLIST

- [ ] Frontend loads without errors
- [ ] CSS/JS files load (no 404s)
- [ ] `/api/health` returns 200
- [ ] `/api/public/exams` returns 200 with exam data (NOT 500)
- [ ] `/api/public/colleges` returns 200
- [ ] Student login succeeds with valid credentials
- [ ] Admin login succeeds with valid credentials
- [ ] Protected endpoints return 401 without token
- [ ] Protected endpoints work with valid token
- [ ] Login form visible on frontend
- [ ] No JavaScript errors in F12 Console

---

## FILES NEEDED FROM YOUR COMPUTER

When uploading via File Manager, you'll need these files:
- Source: `c:\Users\UT\OneDrive\Desktop\hsc_exam\frontend\dist\exam-form\browser\`
- All files in that folder

List of files:
- index.html
- .htaccess
- favicon.ico
- main-TYFS34VU.js (or whatever hash your build has)
- polyfills-HPZ7KTN2.js
- styles-2FRPIMUJ.css
- chunk-N5XRGBE2.js
- chunk-RCYLYLJE.js
- assets/ folder (with all images/icons)

---

## NEXT STEPS AFTER TESTING

If all tests pass:
1. Create a production deployment checklist
2. Set up automated backups
3. Configure email notifications
4. Monitor logs with: `pm2 logs app`
5. Set up PM2 auto-restart: `pm2 startup && pm2 save`
