# Database Migration - Critical Fix Required

## Problem Summary

The production database on Hostinger is missing important columns that the application expects:
- ❌ `googleId` column in `users` table
- ❌ Other schema mismatches between Prisma and actual database
- ❌ This causes Google login to fail
- ❌ This causes empty API responses even when data exists

## Root Cause

**Prisma migration files exist but haven't been deployed to the production database.**

```
What happened:
1. ✅ Migrations created locally and committed to Git
2. ✅ Code deployed to Hostinger
3. ❌ Migrations NOT RUN on production database
4. ❌ Result: Database tables missing required columns
```

## Current Schema Mismatch

**Your Prisma schema expects:**
```
users table:
  - id (INT)
  - roleId (INT)
  - instituteId (INT) 
  - username (VARCHAR)
  - passwordHash (VARCHAR)
  - email (VARCHAR)
  - mobile (VARCHAR)
  - status (ENUM)
  - googleId (VARCHAR) ← MISSING!
  - authProvider (VARCHAR) ← MISSING!
  - createdAt (DATETIME)
```

**Actual database has:**
```
users table (OLD schema):
  - Only the basic columns
  - Missing: googleId, authProvider, and other required fields
  - Result: Queries fail because Prisma expects columns that don't exist
```

## Solution: Apply Migrations

### Quick Fix (Recommended - Uses Hostinger SSH)

**Step 1: SSH into Hostinger**
```bash
ssh u441114691@45.130.228.77 -p 65002
# Or use your actual Hostinger SSH credentials
```

**Step 2: Navigate to backend**
```bash
cd ~/nodejs/backend
# or wherever your backend code is deployed
```

**Step 3: Apply all pending migrations**
```bash
npx prisma migrate deploy
```

Expected output:
```
Applying migration: 20260316185047_init
Applying migration: 20260319085322_add_college_udise
Applying migration: 20260320133520_add_institute_invites
Applying migration: 20260326000000_add_google_auth
✓ Successfully applied migrations
```

**Step 4: Verify**
```bash
# Query should succeed now:
mysql -h 127.0.0.1 -u u441114691_exam -p -e "DESCRIBE u441114691_exam.users;"
# Password: Exam%401234567890
```

You should see columns including:
- `googleId`
- `authProvider`

### Alternative: Using Hostinger cPanel

**If SSH doesn't work:**

1. Go to Hostinger cPanel → Advanced → Node.js
2. Find your `hsc-api` app
3. Click "Terminal" button
4. Run:
   ```bash
   cd ~/nodejs/backend
   npx prisma migrate deploy
   ```

### Manual: Using Database Admin

**If Prisma commands fail (last resort):**

Log into your database admin (phpmyadmin) and run this SQL:

```sql
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN googleId VARCHAR(200) UNIQUE NULL;
ALTER TABLE users ADD COLUMN authProvider VARCHAR(20) NULL;

-- Verify
DESCRIBE users;
```

## Verification

### Method 1: Check via Dashboard
After migration, visit: `https://hsc-exam-form.hisofttechnology.com/admin/status`
- Database should show "OK"
- All tables should be accessible
- Status should change from FAILED to PASS

### Method 2: Check via SSH
```bash
mysql -h 127.0.0.1 -u u441114691_exam -p u441114691_exam

# In MySQL:
DESCRIBE users;

# Should see: googleId, authProvider columns
```

### Method 3: Test APIs
```bash
# Should now work:
curl https://hsc-api.hisofttechnology.com/api/public/exams

# Google login should work in browser
```

## Timeline of Migrations

The project has these migrations that need to be applied:

1. **20260316185047_init**
   - Creates initial schema
   - Tables: roles, institutes, users, streams, subjects, boards, exams, etc.

2. **20260319085322_add_college_udise**
   - Adds college and UDISE number fields

3. **20260320133520_add_institute_invites**
   - Adds institute invitation system

4. **20260326000000_add_google_auth**
   - Adds googleId and authProvider columns
   - **← This is why Google login fails!**

## Why This Happened

The migration process works like this:

```
Local Development:
  npm run db:migrate → Creates migration files ✅
                   → Runs migrations on local DB ✅
                   
Git:
  Migration files committed ✅
  
Production (Hostinger):
  Code deployed ✅
  Migration files in place ✅
  Migrations NOT RUN ❌ ← THE PROBLEM!
```

## Prevention for Future

After this fix, always run after deployment:

```bash
# On production/Hostinger:
npx prisma migrate deploy  # Applies any pending migrations

# Or in production environment:
npm run db:migrate  # If you set up this script
```

## Rollback (If Needed)

If something goes wrong during migration:

```bash
# View migration history
npx prisma migrate status

# Rollback last migration (advanced, use carefully)
npx prisma migrate resolve --rolled-back "migration_name"
```

## Estimated Time

- **Via SSH:** 2-5 minutes
- **Via cPanel Terminal:** 2-5 minutes  
- **Via Manual SQL:** 1-2 minutes (but riskier)

## Next Steps

1. **Run the migration** using one of the methods above
2. **Wait 1-2 minutes** for completion
3. **Restart Node.js app** in Hostinger cPanel
4. **Visit admin/status dashboard** to verify
5. **Test Google login** on the frontend
6. **Check /api/public/exams** returns data

## If Still Failing

After running migrations, if APIs still fail:

1. Restart the Node.js app in cPanel
2. Clear browser cache
3. Check `/admin/status` dashboard for specific errors
4. Verify `DATABASE_URL` is still correctly set
5. Share the exact error from dashboard logs

---

**Status:** ⚠️ BLOCKING - Must fix before system works!
