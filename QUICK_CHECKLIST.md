# QUICK SETUP CHECKLIST

## 📋 Before You Start
- [ ] You have access to Hostinger cPanel
- [ ] You know your domain: `hsc-exam-form.hisofttechnology.com`
- [ ] Backend is running on Hostinger (files uploaded successfully)
- [ ] Frontend is deployed to Hostinger

---

## 🔧 STEP-BY-STEP CONFIGURATION

### STEP 1: Login to Hostinger
- [ ] Go to https://hostinger.com
- [ ] Login with your account
- [ ] Click "Manage" next to your hosting
- [ ] Click "cPanel" button

---

### STEP 2: Configure Reverse Proxy (CRITICAL!)
**This tells Hostinger to send `/api` requests to your Node.js backend**

#### Option A: Using Hostinger Reverse Proxy Manager
- [ ] In cPanel, search for "Reverse Proxy" or "Proxy Manager"
- [ ] Click "Add Proxy" or "Create Proxy"
- [ ] Enter these values:
    - Source URL: `/api/`
    - Destination: `http://127.0.0.1:5000/api/`
- [ ] Click "Create"
- [ ] Repeat for `/api` (without trailing slash)

#### Option B: Using .htaccess (If Proxy Manager not available)
- [ ] Go to "File Manager"
- [ ] Navigate to `/public_html/`
- [ ] Find or create `.htaccess` file
- [ ] Add this code:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
</IfModule>
```
- [ ] Save file

---

### STEP 3: Set Document Root
**This tells Hostinger where your frontend files are**

- [ ] In cPanel, go to "Addon Domains" or "Domains"
- [ ] Find: `hsc-exam-form.hisofttechnology.com`
- [ ] Click "Manage" next to it
- [ ] Find "Document Root" field
- [ ] Change from `/public_html` to:
    ```
    /home/u441114691/app/frontend
    ```
- [ ] Click "Save" or "Update"

---

### STEP 4: Configure DNS (If needed)
**This points your domain to Hostinger's servers**

#### Option A: DNS Already Set Up
If your domain registrar shows Hostinger nameservers, skip to Step 5.

#### Option B: DNS Needs Setup
- [ ] Go to "Zones" or "DNS Zone Editor" in cPanel
- [ ] Select your domain
- [ ] Verify A Record exists:
    - Type: `A`
    - Name: `hsc-exam-form.hisofttechnology.com` or `@`
    - Address: `45.130.228.77`
- [ ] If missing, create it
- [ ] Also check CNAME if using subdomain

#### Option C: Change at Domain Registrar
If nameservers not pointing to Hostinger:
- [ ] Go to your domain registrar (GoDaddy, Namecheap, etc.)
- [ ] Edit nameservers to:
    ```
    ns1.hostinger.com
    ns2.hostinger.com
    ns3.hostinger.com
    ns4.hostinger.com
    ```
- [ ] Wait 24-48 hours for DNS propagation

---

### STEP 5: Enable SSL/HTTPS Certificate
**This enables secure HTTPS connection**

- [ ] In cPanel, go to "SSL/TLS" or "AutoSSL"
- [ ] Look for your domain
- [ ] If not listed, click "Manage" → Add your domain
- [ ] Click "Install" or "Issue SSL"
- [ ] Wait 5-15 minutes for certificate
- [ ] Verify: Lock icon 🔒 appears in browser address bar

---

## ✅ VERIFICATION TESTS

After completing all steps above, run these tests:

### Test 1: Frontend Loads
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com

Expected: See HSC Exam login form
☐ Working    ☐ Blank page    ☐ 404 Error    ☐ Connection refused
```

### Test 2: API Health Check
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com/api/health

Expected: See JSON response (not HTML)
☐ JSON response    ☐ HTML page    ☐ 404 Error    ☐ Timeout
```

### Test 3: Get Colleges Data
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com/api/public/colleges

Expected: JSON array with college names
☐ JSON data    ☐ HTML page    ☐ 404 Error    ☐ Empty
```

### Test 4: Test with PowerShell
```powershell
# Run in PowerShell:
curl -s https://hsc-exam-form.hisofttechnology.com/api/health

Expected: Returns JSON text
☐ Success    ☐ HTML output    ☐ Error
```

### Test 5: Run Verification Script
```powershell
# Run this command in your project directory
node verify-config.js

Expected: All tests pass ✅
☐ All passed    ☐ Warnings    ☐ Failed
```

---

## 🆘 TROUBLESHOOTING

### Issue: Getting HTML instead of JSON from /api endpoints

**Cause:** Reverse proxy not configured or not working

**Solution:**
1. Verify reverse proxy in cPanel
2. Check .htaccess syntax
3. Restart web server (cPanel → Restart Services)
4. Wait 5 minutes for changes to apply

---

### Issue: Frontend shows blank/white page

**Cause:** Document root not set correctly or Angular bundle not deployed

**Solution:**
1. Check document root is `/home/u441114691/app/frontend`
2. Verify files exist: SSH → `ls -la /home/u441114691/app/frontend`
3. Check browser console: Press F12 → Console → Look for red errors

---

### Issue: SSL Certificate shows warning

**Cause:** Certificate not yet issued or domain mismatch

**Solution:**
1. Wait 15 minutes for certificate generation
2. Clear browser cache and retry
3. Verify domain name is correct
4. Check cPanel → SSL/TLS → AutoSSL status

---

### Issue: Getting 404 errors on API calls

**Cause:** Backend not responding or reverse proxy misconfigured

**Solution:**
1. SSH to server and check: `pm2 status`
2. If offline, run: `pm2 start app`
3. Check logs: `pm2 logs`
4. Verify port 5000 is accessible internally

---

## 📞 Get Help

If above troubleshooting doesn't work:

1. **Hostinger Support:** In cPanel click "Support"
2. **Ask Hostinger to help with:**
   - Setting up reverse proxy for `/api/*` → `localhost:5000`
   - Setting document root to `/home/u441114691/app/frontend`
   - Verifying Node.js is enabled

---

## ✨ Final Checklist

- [ ] Reverse proxy configured
- [ ] Document root set
- [ ] DNS pointing to Hostinger
- [ ] SSL certificate installed
- [ ] Frontend loads at domain
- [ ] /api/health returns JSON
- [ ] All college/stream/subject endpoints work
- [ ] Login form appears
- [ ] No console errors in browser (F12)

---

## 🎉 YOU'RE DONE!

Once all above items are checked, your HSC Exam system is **LIVE in PRODUCTION**! 

### Start testing:
1. Open https://hsc-exam-form.hisofttechnology.com
2. Create a test account
3. Test login
4. Test all features (forms, payments, etc.)
5. Monitor logs: `pm2 logs`

**Enjoy your new HSC Exam system!** 🚀

---

**Reference Configuration Values:**
```
Domain:              hsc-exam-form.hisofttechnology.com
Document Root:       /home/u441114691/app/frontend
Backend API:         http://127.0.0.1:5000
Database:            MySQL (127.0.0.1:3306)
Frontend Files:      /home/u441114691/app/frontend
Backend Files:       /home/u441114691/app/backend
Server IP:           45.130.228.77
SSH Port:            65002
Node.js Port:        5000
```
