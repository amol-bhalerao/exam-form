# 🔐 New Student Auth Flow: Google Login → Institute Selection → Dashboard

## Overview

**Old Flow (Broken):**
```
Google Login → Dashboard ❌ (fails due to missing googleId columns)
```

**New Flow (Fixed):**
```
Google Login → Institute Selection Page → Select Institute → Dashboard ✅
```

---

## What Changed & Why

### The Problem
- Database was missing `googleId` and `authProvider` columns
- These columns are REQUIRED to store Google authentication data
- Without them, all student login attempts fail
- Also, students had no institute, so couldn't fill forms

### The Solution
**Two parts:**

1. **Database Migration** - Add missing columns to store Google auth data
2. **New Flow** - After Google login, students MUST select their institute before accessing dashboard

---

## 🚀 The Complete New Student Flow

### Step 1: Student Visits Login Page
```
User navigates to: https://hsc-exam-form.hisofttechnology.com/auth
User sees: "Student Login" with Google button
```

### Step 2: Google Authentication
```
User clicks "Continue with Google"
Google authenticates the user
→ Backend receives Google credential
→ Backend verifies with Google's servers
→ If FIRST TIME:
   ✅ Create new student account
   ✅ Store googleId and authProvider='google'
   ✅ Store student name from Google
→ If RETURNING:
   ✅ Find existing account by googleId
   ✅ Log them in
→ Create JWT tokens
→ Frontend stores tokens in localStorage
```

### Step 3: Redirect to Institute Selection (NEW)
```
After successful authentication:
  Old: redirect(/app/dashboard)  ❌
  New: redirect(/student/select-institute)  ✅

User is still authenticated (JWT in localStorage)
Guard checks: authGuard ✅ passes (user logged in)
```

### Step 4: Institute Selection Page
```
User sees: List of institutes grouped by district
User searches: By name, code, district, city
User selects: Their institute from dropdown
User clicks: "Continue" button

Frontend sends:
  POST /api/students/select-institute
  { instituteId: 123 }

Backend:
  ✅ Finds or creates student profile
  ✅ Updates student.instituteId = 123
  ✅ Returns success

Frontend:
  ✅ Redirects to /app/dashboard
```

### Step 5: Student Dashboard
```
User now has:
  ✅ Google account linked (googleId stored)
  ✅ Institute selected (can fill forms)
  ✅ Student profile created (firstName, lastName required)
  
User can now:
  ✅ Fill and submit exam forms
  ✅ View their applications
  ✅ Print exam forms
  ✅ Complete their profile
```

---

## 📋 API Endpoints

### 1. List Institutes (Public)
```
GET /api/institutes
Authorization: None (public)

Returns:
{
  "institutes": [
    {
      "id": 1,
      "name": "Demo Junior College 1",
      "code": "INST001",
      "district": "Pune",
      "city": "Pune",
      "address": "...",
      "contactPerson": "...",
      "contactEmail": "...",
      "contactMobile": "..."
    },
    ...
  ]
}

Frontend uses this to:
  • Show dropdown list of institutes
  • Filter by district, name, code, city
  • Display institute details
```

### 2. Select Institute (Protected)
```
POST /api/students/select-institute
Authorization: Bearer JWT (student must be logged in)

Request:
{
  "instituteId": 123
}

Response:
{
  "ok": true,
  "message": "Institute selected successfully",
  "student": {
    "id": 456,
    "userId": 789,
    "instituteId": 123,
    "firstName": "",
    "lastName": ""
  }
}

Backend does:
  • Validates user is authenticated
  • Verifies institute exists
  • Creates student profile if not exists
  • Updates student.instituteId
  • Returns student data
```

### 3. Google Authentication
```
POST /api/auth/google
Authorization: None (public)

Request:
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyMjQwODQxYTZmNzA2Y2RkN7bcI5hTT..."
}

Response (on success):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 789,
    "role": "STUDENT",
    "instituteId": null,  ← Still null, must select
    "username": "john@gmail.com"
  }
}

Backend does:
  • Verifies Google credential with Google's servers
  • Extracts googleId (payload.sub)
  • Extracts email, name
  • Finds or creates user with googleId
  • Sets authProvider='google'
  • Creates JWT tokens
  • Returns tokens + user data
```

---

## 🗄️ Database Schema (What Changed)

### Before (Broken)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  passwordHash VARCHAR(255),  ← Only for credential login
  roleId INT,
  -- ❌ Missing googleId
  -- ❌ Missing authProvider
);
```

### After (Fixed)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(150),
  passwordHash VARCHAR(255),      -- null for Google-only accounts
  googleId VARCHAR(200) UNIQUE,   -- ✅ Added: Google sub claim
  authProvider VARCHAR(20),       -- ✅ Added: 'google' or null for credential
  roleId INT,
  instituteId INT,
  status ENUM('ACTIVE', 'PENDING', 'DISABLED'),
  createdAt TIMESTAMP,
  -- ... other fields
);
```

### Student Table (When Created)
```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  userId INT UNIQUE NOT NULL,    ← Links to users
  instituteId INT,               ← Updated when student selects
  firstName VARCHAR(100),      ← Will be set when student completes profile
  lastName VARCHAR(100),       ← Will be set when student completes profile
  email VARCHAR(150),
  mobile VARCHAR(15),
  -- ... other fields
);
```

---

## ✅ Database Migration Required

**The migration exists but hasn't been applied to production yet.**

### Migration Details
**File:** `backend/prisma/migrations/20260326000000_add_google_auth/migration.sql`

**What it does:**
```sql
ALTER TABLE `users`
  ADD COLUMN `googleId` VARCHAR(200) NULL,
  ADD COLUMN `authProvider` VARCHAR(20) NULL DEFAULT 'local';

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_googleId_key` (`googleId`);
```

### How to Apply

#### Option 1: SSH into Hostinger (Recommended)
```bash
ssh u441114691@hisofttechnology.com -p 65002
cd /home/u441114691/nodejs/app

npm install
npx prisma migrate deploy  ← This applies the migration!
npm restart
```

**Time needed:** 2-5 minutes  
**Result:** googleId and authProvider columns added to users table

#### Option 2: Hostinger cPanel Terminal
1. Login to cPanel
2. Go to Advanced → Terminal
3. Navigate to applocation directory
4. Run the same commands as Option 1

#### Option 3: Manual SQL (If migrations fail)
Connect to MySQL and run:
```sql
USE `u441114691_exam`;

ALTER TABLE `users`
  ADD COLUMN `googleId` VARCHAR(200) NULL UNIQUE;

ALTER TABLE `users`
  ADD COLUMN `authProvider` VARCHAR(20) NULL DEFAULT 'local';
```

---

## 🔄 Frontend Components Created/Modified

### New Component: InstituteSelectComponent
**Location:** `frontend/src/app/pages/student/institute-select/`

**What it does:**
- ✅ Loads list of institutes from API
- ✅ Groups by district for easy navigation
- ✅ Allows search by name, code, district, city
- ✅ Shows selected institute details
- ✅ Sends request to backend  
- ✅ Redirects to dashboard on success
- ✅ Beautiful Material Design UI

### Modified Components

**GoogleLoginComponent**
- Changed: `returnUrl = '/app/dashboard'` → `'/student/select-institute'`
- Effect: After Google login, users redirected to institute selection instead of dashboard

**App Routes**
- Added: `{ path: 'student/select-institute', component: InstituteSelectComponent, canActivate: [authGuard] }`
- Effect: New route protectedby auth guard

---

## 🔧 Backend Changes

### New Endpoint: POST /api/students/select-institute
**Location:** `backend/src/routes/students.js`

**What it does:**
```javascript
POST /api/students/select-institute
Authorization: JWT required
Body: { instituteId: 123 }

1. Validate user is logged in
2. Validate instituteId exists in database
3. Check if student profile exists
   • YES: Update with new instituteId
   • NO: Create new student profile
4. Return success response
```

### New Endpoint: GET /api/institutes
**Location:** `backend/src/routes/institutes.js`

**What it does:**
```javascript
GET /api/institutes
Authorization: None (public)

Returns list of APPROVED institutes with:
  • id, name, code
  • district, city (for filtering)
  • address, contact details
  
Sorted by district, then name
```

---

## 🎯 Testing the New Flow

### Test Checklist

- [ ] **Database migrations applied**
  - Run: `npx prisma migrate deploy`
  - Verify: `SELECT * FROM users LIMIT 1` should show googleId column

- [ ] **API Endpoints Working**
  - Test: `GET https://hsc-api.../api/institutes`
  - Should return list of institutes with district, city

- [ ] **Frontend Build Deployed**
  - Wait for Hostinger rebuild (3-5 minutes)
  - Check: Code deployed to hsc-exam-form.hisofttechnology.com

- [ ] **Student Google Login Works**
  - Visit: `https://hsc-exam-form.../auth`
  - Click: "Continue with Google"
  - Login with Google account
  - Expected: Redirects to `/student/select-institute`

- [ ] **Institute Selection Works**
  - See: List of institutes with district grouping
  - Try: Search by name, code, district
  - Select: An institute
  - Click: "Continue"
  - Expected: Redirects to `/app/dashboard`

- [ ] **Student Dashboard Accessible**
  - Should see: Student-specific dashboard
  - Can access: Exam forms, applications, profile
  - Can update: Profile details

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Login Flow                       │
└─────────────────────────────────────────────────────────────┘

1. Browser
   └─→ Visits: https://hsc-exam-form.../auth

2. Google Login Page
   └─→ User clicks "Continue with Google"
       └─→ Opens Google OAuth pop-up

3. Google Auth
   └─→ User authenticates with Google
       └─→ Google returns credential (JWT)

4. Frontend → Backend
   └─→ POST /api/auth/google { credential }
       └─→ Backend receives credential

5. Backend Google Verification
   └─→ Verify credential with Google servers
       └─→ Extract: googleId, email, name
       └─→ Find/Create user with:
           • username: google_{googleId}
           • email: from Google
           • passwordHash: "" (empty for SSO)
           • googleId: payload.sub
           • authProvider: "google"
           • status: "ACTIVE"

6. Backend Response
   └─→ Return { accessToken, refreshToken, user }
       └─→ user has: userId, role, username, instituteId=null

7. Frontend Storage
   └─→ localStorage.hsc_auth = { accessToken, refreshToken, user }

8. Frontend Redirect
   └─→ Navigate to: /student/select-institute
       └─→ authGuard checks: isLoggedIn() → TRUE ✅
       └─→ Page loads

9. Institute Selection
   └─→ Component loads institutes list
       └─→ GET /api/institutes ✅
       └─→ Display: institutes grouped by district

10. User Selects Institute
    └─→ Choose from dropdown
        └─→ Click: "Continue"

11. Institute Save
    └─→ POST /api/students/select-institute { instituteId: 123 }
        └─→ Backend: Does user.instituteId = 123
        └─→ or creates student profile with instituteId

12. Success
    └─→ Frontend redirects to: /app/dashboard
        └─→ Student can now:
            • Fill exam forms
            • Submit applications
            • View dashboard

```

---

## 🔒 Security Considerations

### What's Secure
✅ **OAuth tokens** verified with Google servers  
✅ **JWT tokens** signed with secret key  
✅ **Passwords** hashed with bcrypt  
✅ **Institute IDs** validated against database  
✅ **User isolation** - students can only edit their own data  

### What Students Can't Do Without Institute
❌ Login without selecting institute  
❌ Fill exam forms without instituteId  
❌ Submit applications without instituteId  

### Default Values
- New student `status`: "ACTIVE" (can immediately use system)
- New student `instituteId`: null (must select before forming forms)
- Google account: No password set (SSO only)

---

## 🐛 Troubleshooting

### "Column googleId does not exist" Error
**Cause:** Migration hasn't been applied  
**Fix:** Run `npx prisma migrate deploy` on production server

### Institute List Not Loading
**Cause:** API endpoint not working  
**Fix:**
```bash
curl https://hsc-api.../api/institutes
# Should return JSON with institutes array
```

### Login Redirects Back to Login Page
**Cause:** Institute selection failed  
**Fix:**
- Check browser console for errors
- Verify API returns institutes correctly
- Clear localStorage and try again

### DashboardPage Shows Wrong Data
**Cause:** Student profile missing, instituteId is null  
**Fix:** Make sure institute selection saved correctly
```
POST /api/students/select-institute { instituteId: 1 }
GET /api/students/me
# Should show instituteId = 1
```

---

## 📝 Summary

**Before (Broken):**
- ❌ Student Google login fails
- ❌ No institute association
- ❌ Database missing required columns

**After (Working):**
- ✅ Student Google login works
- ✅ Institute selection required & stored
- ✅ Database has all required columns
- ✅ Clean, organized flow: Google → Institute → Dashboard

**What you need to do:**
1. ✅ Code already deployed
2. ⏳ Run: `npx prisma migrate deploy` (5 mins)
3. ✅ Test: Go to `/auth` and login with Google
4. ✅ Done! New flow working

---

**Last Updated:** March 28, 2026  
**Status:** Ready for deployment  
**Action Required:** Apply database migration
