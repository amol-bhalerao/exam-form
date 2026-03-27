# Environment Variables Setup for Hostinger Shared Hosting

## 📝 Copy-Paste Environment Variables

Follow these exact steps using your **Hostinger hosting panel**:

---

## Step 1: Open Environment Variables Panel

1. Login to **hostinger.com**
2. Click **Manage** next to your hosting
3. Look for: **Environment Variables** or **Env Variables**
4. Click on it

You should see a form with fields like:
- Variable Name / Key
- Variable Value
- Add/Save buttons

---

## Step 2: Add Each Variable

For each variable below, click **"Add Variable"** and enter the exact values:

### Variable 1: NODE Environment

| Field | Value |
|-------|-------|
| **Name** | `NODE_ENV` |
| **Value** | `production` |

➜ Click **Save** or **Add**

---

### Variable 2: Database Connection

| Field | Value |
|-------|-------|
| **Name** | `DATABASE_URL` |
| **Value** | `mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam` |

➜ **Important:** Keep the `%40` (it's an encoded `@` symbol)

➜ Click **Save**

---

### Variable 3: JWT Access Secret

| Field | Value |
|-------|-------|
| **Name** | `JWT_ACCESS_SECRET` |
| **Value** | `Jaya_@1991_HSC_Exam_Access_Secret_2024` |

➜ Click **Save**

---

### Variable 4: JWT Refresh Secret

| Field | Value |
|-------|-------|
| **Name** | `JWT_REFRESH_SECRET` |
| **Value** | `Jaya_@1991_HSC_Exam_Refresh_Secret_2024` |

➜ Click **Save**

---

### Variable 5: CORS Origin

| Field | Value |
|-------|-------|
| **Name** | `CORS_ORIGIN` |
| **Value** | `https://hsc-exam-form.hisofttechnology.com` |

➜ **Important:** Use `https://` not `http://`

➜ Click **Save**

---

### Variable 6: Frontend URL

| Field | Value |
|-------|-------|
| **Name** | `FRONTEND_URL` |
| **Value** | `https://hsc-exam-form.hisofttechnology.com` |

➜ Click **Save**

---

### Variable 7: API Port

| Field | Value |
|-------|-------|
| **Name** | `API_PORT` |
| **Value** | `5000` |

➜ Click **Save**

---

### Variable 8: API Host

| Field | Value |
|-------|-------|
| **Name** | `API_HOST` |
| **Value** | `0.0.0.0` |

➜ Click **Save**

---

### Variable 9: Google OAuth Callback

| Field | Value |
|-------|-------|
| **Name** | `GOOGLE_REDIRECT_URI` |
| **Value** | `https://hsc-exam-form.hisofttechnology.com/api/auth/google/callback` |

➜ Click **Save**

---

### Variable 10: Log Level

| Field | Value |
|-------|-------|
| **Name** | `LOG_LEVEL` |
| **Value** | `info` |

➜ Click **Save**

---

### Variable 11: Access Token TTL (Optional)

| Field | Value |
|-------|-------|
| **Name** | `ACCESS_TOKEN_TTL` |
| **Value** | `15m` |

➜ Click **Save**

---

### Variable 12: Refresh Token TTL Days (Optional)

| Field | Value |
|-------|-------|
| **Name** | `REFRESH_TOKEN_TTL_DAYS` |
| **Value** | `7` |

➜ Click **Save**

---

### Variables 13 & 14: Google OAuth (Only if you have Google OAuth set up)

**If you're using Google login, add these. Otherwise skip:**

| Field | Value |
|-------|-------|
| **Name** | `GOOGLE_CLIENT_ID` |
| **Value** | `YOUR_CLIENT_ID_HERE` |

➜ Click **Save**

Then:

| Field | Value |
|-------|-------|
| **Name** | `GOOGLE_CLIENT_SECRET` |
| **Value** | `YOUR_CLIENT_SECRET_HERE` |

➜ Click **Save**

---

## Step 3: Restart Application

1. Look for a button that says **"Restart Application"** or **"Apply Changes"**
2. Click it
3. Wait 30-45 seconds for restart
4. Check the status - it should say "Running" or "Online"

---

## Step 4: Verify It Works

### Test 1: Check API
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com/api/health

You should see: JSON response (something like {"status":"OK"})
NOT: HTML page or 404 error
```

### Test 2: Check Frontend
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com

You should see: Login form with email and password fields
NOT: Blank page or 404 error
```

### Test 3: Test Public API
```
Open in browser:
https://hsc-exam-form.hisofttechnology.com/api/public/colleges

You should see: JSON array with college data
```

---

## 🎯 If Variables Already Exist

If some variables already exist in your panel:

1. **Just update their values** to match the table above
2. Don't create duplicates
3. Make sure the names match exactly (case-sensitive)

Some that Hostinger might already have:
- `NODE_ENV` (verify it's `production`)
- `DATABASE_URL` (verify it's correct)
- `API_PORT` (might already be set to `5000`)

---

## ❓ Common Questions

### Q: What if DATABASE_URL has special characters?

**A:** Use these replacements:
```
@ symbol = %40
: symbol = %3A (if needed)
/ symbol = %2F (if needed)
```

Your DATABASE_URL has `@` in password, so it must have `%40`.

### Q: What if I don't have Google OAuth set up?

**A:** Skip the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET variables.
The app will work without Google login.

### Q: Why do I use the domain URL instead of localhost?

**A:** In production (Hostinger), you use the real domain:
```
Development (local): http://localhost:3000
Production (Hostinger): https://hsc-exam-form.hisofttechnology.com
```

### Q: What if the app doesn't restart?

**A:** Try these:
1. Click "Restart Application" again
2. Wait 2 minutes instead of 30 seconds
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try in an incognito/private browser window

---

## ✅ Checklist - Completed?

- [ ] Set `NODE_ENV` = `production`
- [ ] Set `DATABASE_URL` = Full connection string
- [ ] Set `JWT_ACCESS_SECRET` = Your secret
- [ ] Set `JWT_REFRESH_SECRET` = Your secret
- [ ] Set `CORS_ORIGIN` = Your domain URL
- [ ] Set `FRONTEND_URL` = Your domain URL
- [ ] Set `API_PORT` = `5000`
- [ ] Set `API_HOST` = `0.0.0.0`
- [ ] Set `GOOGLE_REDIRECT_URI` = Full callback URL
- [ ] Set `LOG_LEVEL` = `info`
- [ ] Clicked "Restart Application"
- [ ] Waited for app to restart
- [ ] Tested API endpoint (returns JSON)
- [ ] Tested Frontend (shows login form)

---

## 🚀 You're Done!

Once all variables are set and app restarted, your HSC Exam system should be **fully functional** in production! 

Try:
1. Go to login page
2. Create an account (if registration is open)
3. Login
4. Test all features
5. Check database entries appear

Enjoy! 🎉

---

## 📞 Still Not Working?

If something doesn't work after setting environment variables:

1. **Check Application Logs** in Hostinger panel
2. **Verify each variable name is spelled correctly** (case-sensitive)
3. **Restart Application again**
4. **Clear browser cache** (F12 → Application → Clear Storage)
5. **Contact Hostinger support** with these details:
   - "My Node.js backend isn't connecting"
   - "Environment variables set but not working"
