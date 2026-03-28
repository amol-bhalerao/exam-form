# 📊 Database Schema & googleId Explained

## 🔴 **CRITICAL ISSUE: Missing Database Columns**

Your application is **failing because the database is missing critical columns** that the application code expects.

---

## What is `googleId`?

### Definition
`googleId` is a **unique identifier** provided by Google when a user authenticates via Google OAuth.

### Where it's used
- **Student Google Login:** When a student logs in with their Google account, Google sends back a unique `googleId`
- **Account Linking:** This ID is stored in the database to link the student's Google account to their HSC Exam Form account
- **Prevents Duplicate Accounts:** If the same student tries to sign up again with Google, the system checks if their `googleId` already exists

### Example
```
Google User: john.doe@gmail.com
Google Account ID: 103828372019283729  ← This is the googleId
Database stores: googleId = "103828372019283729"

Next time John logs in:
- Google authenticates him
- System finds googleId in database
- Account recognized as existing user
- User logged in instantly
```

---

## Missing Database Columns

Your Prisma schema expects these columns in the **users** table, but they don't exist:

### 1️⃣ **googleId** (VARCHAR, nullable)
```sql
ALTER TABLE users ADD COLUMN googleId VARCHAR(255) NULL UNIQUE;
```
**Purpose:** Stores Google's unique user ID for OAuth authentication  
**When populated:** When a student logs in via Google  
**Why it's missing:** Database migrations haven't been applied to production

### 2️⃣ **authProvider** (VARCHAR, nullable)
```sql
ALTER TABLE users ADD COLUMN authProvider VARCHAR(50) NULL;
```
**Purpose:** Tracks which OAuth provider authenticated the user  
**Values:** `"google"` or `null` (for credential login)  
**Example:**
- User logs in via Google → `authProvider = "google"`
- User logs in with username/password → `authProvider = null`

### 3️⃣ Other potentially missing columns
Depending on which migrations haven't been applied:
- `createdByUserId` - Tracks who created this user record
- `lastLoginAt` - When user last logged in
- Various timestamp columns

---

## Current Error: Why You're Getting "Column Does Not Exist"

### The Error
```
Invalid `prisma.user.findFirst()` invocation:
The column `u441114691_exam.users.googleId` does not exist in the current database
```

### What This Means
1. **Prisma schema** (in code) expects a `googleId` column
2. **Database schema** (actual MySQL) does NOT have this column
3. Mismatch causes all queries to fail

### Why Students Can't Login
**Student tries to login via Google:**
```
1. Student clicks "Continue with Google"
2. Google authenticates student ✅
3. App tries to query: `SELECT * FROM users WHERE googleId = "123456789"`
4. MySQL error: "Column googleId doesn't exist" ❌
5. Login fails
```

---

## Database vs Prisma Schema Mismatch

### What's in Your Code (Prisma Schema)
File: `backend/prisma/schema.prisma`
```typescript
model User {
  id              Int     @id @default(autoincrement())
  username        String  @unique
  email           String?
  passwordHash    String
  googleId        String? @unique      ← ⚠️ CODE EXPECTS THIS
  authProvider    String?               ← ⚠️ CODE EXPECTS THIS
  roleId          Int
  role            Role    @relation(fields: [roleId], references: [id])
  // ... other fields
}
```

### What's Actually in Database (MySQL)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  passwordHash VARCHAR(255),
  roleId INT,
  -- ⚠️ googleId column MISSING
  -- ⚠️ authProvider column MISSING
  // ... other fields
);
```

---

## The Solution: Apply Migrations

Migrations are **pre-written SQL commands** that synchronize your database with your code.

### How to Fix (3 Options)

#### **Option 1: SSH to Hostinger** (Recommended)
```bash
ssh u441114691@hisofttechnology.com -p 65002
cd /home/u441114691/nodejs/app
npm install
npx prisma migrate deploy  ← Apply all migrations
npm restart               ← Restart Node.js app
```

#### **Option 2: Use Hostinger cPanel Terminal**
1. Login to Hostinger cPanel
2. Go to **Terminal** (under Advanced)
3. Navigate to your app directory
4. Run the same commands as above

#### **Option 3: Manual SQL** (If migrations fail)
Connect to MySQL and run:
```sql
USE `u441114691_exam`;

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN googleId VARCHAR(255) NULL UNIQUE;
ALTER TABLE users ADD COLUMN authProvider VARCHAR(50) NULL;

-- Add other migration columns as needed
ALTER TABLE users ADD COLUMN createdByUserId INT NULL;
ALTER TABLE users ADD COLUMN lastLoginAt DATETIME NULL;
```

---

## After Migration: What Changes

### Column Structure (After)
```
users table now has:
├── id (existing)
├── username (existing)
├── email (existing)
├── passwordHash (existing)
├── googleId ← ✅ NEW
├── authProvider ← ✅ NEW
├── roleId (existing)
├── status (existing)
├── createdByUserId ← ✅ NEW
└── ... other columns
```

### Student Login Flow (After Migration)
```
1. Student clicks "Continue with Google"
2. Google authenticates: "This is john with ID 103828..."
3. App queries: SELECT * FROM users WHERE googleId = "103828..."
4. Database finds the column ✅ and returns data
5. Student logged in successfully ✅
```

---

## Verification: Check If Fixed

### Method 1: Login as Student
- Visit: `https://hsc-exam-form.hisofttechnology.com/auth`
- Click "Continue with Google"
- If you login successfully → Migrations worked! ✅

### Method 2: Check API Status Dashboard
- Visit: `https://hsc-exam-form.hisofttechnology.com/admin/status`
- Look for "Schema Compatibility: OK" (green) → Fixed! ✅
- If it says "FAILED" → Migrations haven't been applied yet

### Method 3: Direct Database Query
```sql
DESCRIBE users;
-- Look for 'googleId' and 'authProvider' columns
-- If they appear → Fixed! ✅
```

---

## Why This Happened

### Root Cause
1. **Prisma migrations created** ✅ (Files exist in code)
2. **Code deployed** ✅ (Frontend and backend uploaded)
3. **Database migrations NOT applied** ❌ (Never ran `npx prisma migrate deploy`)

### Timeline
- March 26: Prisma schema updated with googleId, authProvider
- March 27: Code committed and deployed to Hostinger
- March 28 (NOW): Users report "googleId doesn't exist" error
- **Reason:** Nobody ran the migration command on production database

---

## Prevention: For Future Deployments

**Always run migrations AFTER deploying code:**

```bash
# On production server after deployment:
cd /home/u441114691/nodejs/app
npm install
npx prisma generate      # Regenerate Prisma client
npx prisma migrate deploy # ← Apply pending migrations
npm restart               # Restart app with new schema
```

**Add to deployment script:**
```bash
#!/bin/bash
git pull
npm install
npx prisma generate
npx prisma migrate deploy  # ← Include this
npm rebuild
node dist/src/server.js
```

---

## Affected Features (Until Fixed)

| Feature | Status | Issue |
|---------|--------|-------|
| Student Google Login | ❌ | Fails on googleId lookup |
| Student Credential Login | ✅ | Works (doesn't use googleId) |
| Board Login | ✅ | Works (uses username) |
| Institute Login | ✅ | Works (uses username) |
| Admin Login | ✅ | Works (uses username) |
| Public Exams List | ❌ | Query fails if any schema-dependent field accessed |

---

## Summary

| Item | Details |
|------|---------|
| **What's wrong** | Database missing `googleId` and `authProvider` columns |
| **Why it happened** | Migrations created but not applied to production |
| **How to fix** | Run `npx prisma migrate deploy` on Hostinger |
| **Time to fix** | 5-10 minutes |
| **Features broken** | Google OAuth student login |
| **How to verify** | Try student login or check admin status dashboard |

---

## Quick Action Checklist

- [ ] SSH into Hostinger application directory
- [ ] Run `npx prisma migrate deploy`
- [ ] Wait for completion
- [ ] Restart Node.js app in cPanel
- [ ] Test student login with Google account
- [ ] Confirm "Schema Compatibility: OK" in admin dashboard
- [ ] Test board login and create exam
- [ ] Verify all portals working

---

**Last Updated:** March 28, 2026  
**Status:** ⚠️ CRITICAL - Blocking student authentication  
**Action Required:** YES - Apply migrations to production database
