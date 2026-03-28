# 🚨 Critical Issues - Action Plan (Do This Now)

## Summary of Issues Found

1. ❌ **Admin Status Route** - Redirecting to home (FIXED - needs redeployment)
2. ❌ **Google Login Error** - Missing `googleId` column (NEEDS MIGRATION)
3. ❌ **Empty Exams API** - Schema mismatch (NEEDS MIGRATION)

**Root Cause:** Database migrations haven't been applied to Hostinger

---

## ✅ STEP-BY-STEP SOLUTION

### STEP 1: Wait for Hostinger Auto-Rebuild (3-5 min)
- Code was just pushed with route fixes
- Hostinger will auto-deploy from GitHub
- This will fix the admin/status redirect issue

### STEP 2: Access Admin Dashboard (After rebuild)
```
Visit: https://hsc-exam-form.hisofttechnology.com/admin/status
```
- Should NOW load the dashboard (not redirect to home)
- Will show: **Schema Compatibility: FAILED** ← This is expected
- Will show error about missing `googleId` column

### STEP 3: Apply Database Migrations ⚠️ CRITICAL
**Choose ONE method:**

#### METHOD A: Via SSH (Recommended)
```bash
# SSH into Hostinger
ssh u441114691@45.130.228.77 -p 65002
# Password: your SSH password

# Navigate to backend
cd ~/nodejs/backend

# Apply migrations
npx prisma migrate deploy

# This will add the missing columns to your database
```

#### METHOD B: Via Hostinger cPanel Terminal
1. Go to Hostinger cPanel → Advanced → Terminal (or NodeJS → Terminal)
2. Run:
   ```bash
   cd ~/nodejs/backend
   npx prisma migrate deploy
   ```

#### METHOD C: Via phpmyadmin (If SSH fails)
1. Log into your database at: `https://auth-db1234.hstgr.io/`
2. Run this SQL:
   ```sql
   ALTER TABLE users ADD COLUMN googleId VARCHAR(200) UNIQUE NULL;
   ALTER TABLE users ADD COLUMN authProvider VARCHAR(20) NULL;
   ```

### STEP 4: Restart Node.js App
1. Go to Hostinger cPanel → Node.js
2. Find `hsc-exam-api` app
3. Click **Restart**
4. Wait 30 seconds

### STEP 5: Verify Fix
1. Visit: `https://hsc-exam-form.hisofttechnology.com/admin/status`
2. Look for **"Schema Compatibility: OK"** (should be green now)
3. All database tables should show OK status

### STEP 6: Test APIs
```bash
# Test 1: Health check
curl https://hsc-api.hisofttechnology.com/api/health
# Should return: {"ok": true, ...}

# Test 2: Public exams (should return data now)
curl https://hsc-api.hisofttechnology.com/api/public/exams
# Should return exam data

# Test 3: Google login
# Visit https://hsc-exam-form.hisofttechnology.com
# Click "Login with Google"
# Should work without errors
```

### STEP 7: Seed Database (Optional but Recommended)
If tables are empty (0 records), add sample data:
```bash
# Via SSH:
cd ~/nodejs/backend
npm run db:seed

# Or manually add exam data via phpmyadmin
```

---

## 🎯 What Each Migration Does

| Migration | What it does | When to Apply |
|---|---|---|
| `20260316185047_init` | Creates all base tables | Always first |
| `20260319085322_add_college_udise` | Adds college fields | After init |
| `20260320133520_add_institute_invites` | Adds invite system | After college |
| `20260326000000_add_google_auth` | **Adds googleId column** ← YOU NEED THIS | After invites |

**Running `npx prisma migrate deploy` applies ALL pending migrations in order.**

---

## 📋 Troubleshooting

### If you get "permission denied" during migration:
```bash
# Check Node.js version
node --version

# Try with npx:
npx prisma migrate deploy

# If still fails, use npm script:
npm run db:migrate
```

### If you get "connection failed":
- Check DATABASE_URL is set correctly in Hostinger
- Refer to [DATABASE_CREDENTIAL_FIX.md](./DATABASE_CREDENTIAL_FIX.md)

### If migration shows "already applied":
- That's OK! Means it already ran
- Run `npx prisma migrate status` to see applied migrations

### If tables still show 0 records after migration:
- That's OK! Means data just needs to be added
- Run `npm run db:seed` to populate sample data

---

## Dashboard Status (What to Expect)

### BEFORE Migration:
```
Database: PASS (connection works)
Schema Compatibility: FAILED ❌
  Error: "googleId column not found"
  Solution: Run npx prisma migrate deploy
  
Tables: Some show OK, some show FAILED
```

### AFTER Migration:
```
Database: PASS ✅
Schema Compatibility: OK ✅
  All required fields present
  
Tables: All show OK ✅
  Exams: 0-X records (depends on data)
  Institutes: 0-X records
  Users: 0-X records
  etc.
```

---

## ⏱️ Estimated Time

- **Waiting for rebuild:** 5 minutes
- **Running migration:** 2-5 minutes
- **Restarting app:** 1 minute
- **Total:** ~10 minutes

---

## 🎓 What You're Doing & Why

```
BEFORE:
  Hostinger DB has old schema (no googleId)
  ↓
  Prisma tries to use googleId column
  ↓
  Column doesn't exist → ERROR ❌

AFTER:
  Run: npx prisma migrate deploy
  ↓
  Migration script adds googleId column to database
  ↓
  Prisma can now use googleId → WORKS ✅
```

---

## If You're Still Stuck

1. **Check admin/status dashboard** - Copy the exact error message
2. **Share the error** from the logs section
3. **Check DATABASE_MIGRATION_REQUIRED.md** - Full detailed guide
4. **Verify DATABASE_URL** - Using DATABASE_CREDENTIAL_FIX.md

---

## 📞 Quick Reference

| Issue | Status | Fix |
|-------|--------|-----|
| Admin route 404/redirect | ✅ DEPLOYED | Waiting for rebuild |
| Google login `googleId error` | 🔧 FIX READY | Step 3: Apply migrations |
| Empty exams data | 🔧 FIX READY | Step 3: Apply migrations |
| Database connection failed | ⚠️ Check creds | See DATABASE_CREDENTIAL_FIX.md |

---

**Next Action:** Do STEP 1-6 above in order. Most should take only 10 minutes total.
