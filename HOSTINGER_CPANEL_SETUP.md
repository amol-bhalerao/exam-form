# Hostinger cPanel Configuration Guide

## 🚀 Complete Setup for HSC Exam Production Deployment

Follow these steps to complete your HSC Exam system setup on Hostinger.

---

## Step 1: Access Hostinger cPanel

1. Go to https://hostinger.com and log in with your account
2. Click **Manage** next to your hosting account
3. Click **cPanel** to enter the control panel
4. You'll see the cPanel dashboard

**Note:** Your Hostinger account details:
- Username: `u441114691`
- Server: `45.130.228.77`
- Port: `65002`

---

## Step 2: Configure Reverse Proxy for API Routes

The reverse proxy tells Hostinger to send `/api` requests to your Node.js backend running on port 5000.

### In Hostinger cPanel:

1. **Look for "Reverse Proxy" or scroll down** in the main cPanel dashboard
2. If not visible, search for **"Reverse Proxy Manager"** or **"Proxy"**
3. **Alternative:** Look under **Advanced** section or **Web Development**

### If Using Reverse Proxy Manager:

1. Click **"Add Proxy"** or **"Create Proxy"**
2. Fill in these details:
   ```
   Source URL: /api/
   Destination: http://127.0.0.1:5000/api/
   ```
3. Click **Create Proxy**
4. Repeat for root API:
   ```
   Source URL: /api
   Destination: http://127.0.0.1:5000/api
   ```

### If Reverse Proxy Not Available:

**Use Apache Configuration (.htaccess)** - More Common:

1. In cPanel, go to **File Manager**
2. Navigate to `/public_html/` (your document root)
3. Create or edit `.htaccess` file with this content:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Route /api requests to Node.js backend
    RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]
    
    # Route all other requests to Angular frontend
    RewriteRule ^(?!api/).*$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
</IfModule>
```

4. Save the file

---

## Step 3: Set Document Root (Point to Frontend)

The document root tells Hostinger where your frontend files are located.

### Steps:

1. In cPanel, click **"Addon Domains"** or **"Domains"**
2. Find your domain: `hsc-exam-form.hisofttechnology.com`
3. Click **Manage** next to the domain
4. Look for **"Document Root"** field
5. Change it to:
   ```
   /home/u441114691/app/frontend
   ```
6. Click **Save** or **Update**

---

## Step 4: Configure DNS (If Not Already Done)

This points your domain to Hostinger's servers.

### Steps:

1. In cPanel, go to **Zones** or **DNS Zone Editor**
2. Select your domain: `hsc-exam-form.hisofttechnology.com`
3. Make sure these DNS records exist:

**A Record:**
```
Type: A
Name: @ (or your domain)
Address: 45.130.228.77
```

**If using Hostinger nameservers:**
- Go to your domain registrar
- Point nameservers to Hostinger:
  ```
  ns1.hostinger.com
  ns2.hostinger.com
  ns3.hostinger.com
  ns4.hostinger.com
  ```

---

## Step 5: Enable SSL/HTTPS

Hostinger usually enables Let's Encrypt automatically, but verify:

### Steps:

1. In cPanel, look for **"SSL/TLS"** or **"AutoSSL"**
2. Click **AutoSSL**
3. If your domain is listed, click **Install** next to it
4. If not listed, click **Manage** and add your domain:
   - Domain: `hsc-exam-form.hisofttechnology.com`
   - Click **Issue SSL**
5. Wait 5-15 minutes for certificate generation

---

## Step 6: Verify Everything Works

After completing the above steps, test your deployment:

### 1. Test Frontend (Angular App):
```
Open in browser: https://hsc-exam-form.hisofttechnology.com
```
**Expected:** You should see your HSC Exam application login page

### 2. Test API Health:
```
Open in browser: https://hsc-exam-form.hisofttechnology.com/api/health
```
**Expected:** Should return JSON response (not HTML)

### 3. Test Public Endpoints:
```
https://hsc-exam-form.hisofttechnology.com/api/public/colleges
https://hsc-exam-form.hisofttechnology.com/api/public/streams
https://hsc-exam-form.hisofttechnology.com/api/public/subjects
```
**Expected:** Should return JSON data for colleges, streams, subjects

### 4. Test on Your Computer:
Run this command in PowerShell:
```powershell
curl -s https://hsc-exam-form.hisofttechnology.com/api/health
```

---

## Troubleshooting

### Issue: Still getting HTML response instead of JSON

**Solution:**
- Reverse proxy not configured correctly
- Check `.htaccess` syntax in Step 3
- Make sure Node.js backend is running on port 5000
- Contact Hostinger support to verify proxy settings

### Issue: SSL Certificate Error

**Solution:**
- Wait 15-30 minutes for certificate to be issued
- Clear browser cache and reload
- Try accessing with `https://` (not `http://`)

### Issue: Frontend shows blank page

**Solution:**
- Check if files are in correct directory: `/home/u441114691/app/frontend`
- Verify document root is set correctly
- Check browser console for errors (F12 → Console tab)

### Issue: 404 Error on API calls

**Solution:**
- Verify reverse proxy is configured
- Check Node.js backend is running (it should be via PM2)
- Verify port 5000 is not blocked

---

## Quick Reference: Your Configuration

| Setting | Value |
|---------|-------|
| **Domain** | hsc-exam-form.hisofttechnology.com |
| **Document Root** | /home/u441114691/app/frontend |
| **API Base URL** | http://127.0.0.1:5000 |
| **Reverse Proxy Source** | /api/ |
| **Reverse Proxy Target** | http://127.0.0.1:5000/api/ |
| **SSL** | Let's Encrypt (AutoSSL) |
| **DNS Servers** | ns1/ns2/ns3/ns4.hostinger.com |

---

## After Everything is Configured

Your system will work as follows:

```
User Browser Request
        ↓
https://hsc-exam-form.hisofttechnology.com
        ↓
Hostinger cPanel receives request
        ↓
- If path is /api/* → Forward to Node.js (port 5000)
- If path is /* → Serve Angular frontend from /app/frontend
        ↓
Response returned to user
```

---

## Support

If you encounter any issues:

1. **Check Hostinger Status:** https://www.hostinger.com/status
2. **Contact Hostinger Support:** Through cPanel → Support
3. **Verify Backend is Running:** SSH into server and check:
   ```bash
   pm2 status
   pm2 logs
   ```

---

## ✅ Checklist

After completing all steps, verify:

- [ ] Reverse proxy configured (/api → localhost:5000)
- [ ] Document root set to /app/frontend
- [ ] DNS pointing to Hostinger
- [ ] SSL certificate installed
- [ ] Frontend loads at domain URL
- [ ] /api/health returns JSON
- [ ] Public endpoints return data
- [ ] Login form appears and works

Once all items are checked, your production deployment is **complete!** 🎉

