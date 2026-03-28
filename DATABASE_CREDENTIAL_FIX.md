# Database Credential Issue - Fix Guide

## Problem
The `/api/public/exams` endpoint returns 500 with error:
```
Invalid `prisma.role.findUnique()` invocation:
Authentication failed against database server, the provided database credentials for `u441114691_exam` are not valid.
```

## Root Cause
The `DATABASE_URL` environment variable on Hostinger is either:
1. Not set
2. Incorrectly formatted
3. Contains wrong credentials

## Solution

### Step 1: Find Current DATABASE_URL
1. Go to Hostinger cPanel → Node.js
2. Click on your HSC Exam API app (hsc-api.hisofttechnology.com)
3. Look for "Environment Variables" section
4. Note down the current `DATABASE_URL` value

### Step 2: Verify Database Credentials
Your MySQL database credentials should be:
```
Host:     127.0.0.1 (or localhost)
Port:     3306
User:     u441114691_exam
Password: Exam%401234567890
Database: u441114691_exam
```

### Step 3: Set Correct DATABASE_URL
In Hostinger cPanel Node.js app → Environment Variables, set:
```
DATABASE_URL=mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam
```

**IMPORTANT:** 
- The `%40` is the URL-encoded version of `@`
- If password has special characters, encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `:` → `%3A`

### Step 4: Test Connection
1. After setting DATABASE_URL, click "Save" in Hostinger
2. Restart the Node.js app
3. Wait 30 seconds for restart to complete
4. Visit: `https://hsc-api.hisofttechnology.com/api/admin/status`
5. Check if database shows "OK" status

## Alternative: Check in Shell

If you have SSH access to Hostinger:
```bash
# SSH into Hostinger
cd ~/nodejs

# Check environment variables
env | grep DATABASE_URL

# Test database connection manually
mysql -h 127.0.0.1 -u u441114691_exam -p u441114691_exam
# Password: Exam%401234567890
```

## Using Status Dashboard

The new status dashboard will help identify the exact issue:

1. **Go to:** `https://hsc-exam-form.hisofttechnology.com/admin/status`
2. **Look for:**
   - **Database Check:** Shows if connection is successful
   - **Database Tables:** Shows which tables are accessible
   - **Logs:** Shows exact error messages
3. **Fix:** Update DATABASE_URL based on error message shown

## Verify All Tables After Fix

Once database connects, verify these tables exist:
- ✅ Exams
- ✅ Institutes
- ✅ Users
- ✅ Streams
- ✅ Subjects
- ✅ Boards

All should show row counts in the status dashboard.

---

**After Setting DATABASE_URL Correctly:**
1. Hostinger will automatically rebuild
2. Wait 3-5 minutes for deployment
3. Restart Node.js app in cPanel
4. Test `/api/public/exams` endpoint again
5. It should now return exam data (if database has records)

## If Still Failing

Check the dashboard logs for:
1. Exact error message
2. Database error code
3. Connection timeout vs authentication failure
4. Network connectivity issues

Share the error from the dashboard logs for further diagnosis.
