# 🔐 Complete Login Guide

## Overview
The HSC Exam Form System supports multiple user roles. Each role has a dedicated login portal with specific URLs and credentials.

---

## 📚 User Types & Login URLs

### 1️⃣ **Student Login** (Google OAuth)
**URL:** `https://hsc-exam-form.hisofttechnology.com/auth`

**Features:**
- Login via Google Account
- Fill and submit exam forms
- Auto-populate profile from Google
- One-click sign-up

**Steps:**
1. Go to the login URL above
2. Click "Continue with Google"
3. Sign in with your Google account
4. Accept permissions
5. Done! You're logged in

**Alternative URLs:** 
- `https://hsc-exam-form.hisofttechnology.com/student-login`
- `https://hsc-exam-form.hisofttechnology.com/google-login`

---

### 2️⃣ **Board Portal Login**
**URL:** `https://hsc-exam-form.hisofttechnology.com/board-login`

**Username:** `board`  
**Password:** `Password@123`

**Features:**
- Create and manage exams
- View student applications
- Manage board news and announcements
- Configure exam streams and subjects
- View analytics and reports

**Dashboard:** `https://hsc-exam-form.hisofttechnology.com/app/board/exams`

---

### 3️⃣ **Super Admin Portal Login**
**URL:** `https://hsc-exam-form.hisofttechnology.com/admin-login`

**Username:** `superadmin`  
**Password:** `Password@123`

**Features:**
- Manage all institutes
- Create board and institute users
- Configure system-wide settings
- Manage master data (streams, subjects, etc.)
- View all users and their roles

**Dashboard:** `https://hsc-exam-form.hisofttechnology.com/app/super/institutes`

---

### 4️⃣ **Institute Portal Login**
**URL:** `https://hsc-exam-form.hisofttechnology.com/institute-login`

**Username:** `institute1`  
**Password:** `Password@123`

**Features:**
- View student applications from your institute
- Manage institute profile
- Add teachers and staff
- Configure streams and subjects
- Download reports

**Dashboard:** `https://hsc-exam-form.hisofttechnology.com/app/institute/applications`

---

## 🔑 Quick Reference - All Credentials

| Role | URL | Username | Password |
|------|-----|----------|----------|
| **Student** | `hsc-exam-form.../auth` | Google OAuth | - |
| **Board** | `hsc-exam-form.../board-login` | `board` | `Password@123` |
| **Super Admin** | `hsc-exam-form.../admin-login` | `superadmin` | `Password@123` |
| **Institute** | `hsc-exam-form.../institute-login` | `institute1` | `Password@123` |

---

## 📍 Board Portal - Key Features (Most Important)

### Create a New Exam
1. Login to Board Portal: `https://hsc-exam-form.hisofttechnology.com/board-login`
2. Navigate to **Board → Exams**
3. Click **Create New Exam**
4. Fill in details:
   - **Exam Name:** e.g., "HSC Final Exam 2026"
   - **Academic Year:** e.g., "2025-2026"
   - **Session:** e.g., "Spring" or "Winter"
   - **Stream:** Select (Science, Arts, Commerce, etc.)
   - **Application Open:** Set to today or earlier
   - **Application Close:** Set to a FUTURE date ⚠️ Important!
   - **Late Fee Close:** Optional
   - **Instructions:** Add exam instructions
5. Click **Create Exam**
6. Exam will now appear on student login page

⚠️ **Note:** Exams only show to students if `applicationClose` is in the FUTURE.

---

## 🎯 Recommended First Steps

### 1. Test Student Login
- [ ] Visit `https://hsc-exam-form.hisofttechnology.com/auth`
- [ ] Login via Google
- [ ] Fill out your profile

### 2. Login as Board User
- [ ] Visit `https://hsc-exam-form.hisofttechnology.com/board-login`
- [ ] Username: `board` | Password: `Password@123`
- [ ] Create a test exam with future `applicationClose` date

### 3. Verify Exam Shows to Students
- [ ] Logout (if logged in as board)
- [ ] Login as student via Google
- [ ] Check if your new exam appears in the dashboard

### 4. Explore Other Portals
- [ ] Super Admin: `hsc-exam-form.../admin-login`
- [ ] Institute: `hsc-exam-form.../institute-login`

---

## ❓ Troubleshooting

### Student Login Shows Only Google (No Form Fields)
✅ This is **normal** - students must use Google OAuth

### Can't See Exams in Student View
- Check if `applicationClose` date is in the FUTURE
- Verify exam was created successfully as board user
- Check database directly via admin dashboard

### Wrong Password Error
- Verify exact username and password (case-sensitive)
- Check credentials table in this guide
- Reset password in Super Admin portal if needed

### "This account uses Google Sign-In" Error
- The account is set up for Google OAuth only
- Use `https://hsc-exam-form.hisofttechnology.com/auth` (Google login)
- Don't use credential login form

---

## 🔄 Session Management

**Auto-Logout Duration:** 24 hours  
**Refresh Token Valid For:** 30 days  
**Login Keeps Session:** Yes (across browser tabs)

---

## 🛡️ Security Notes

- ✅ Passwords are hashed (bcrypt)
- ✅ HTTPS enforced
- ✅ CORS protection enabled
- ✅ Rate limiting on auth routes
- ⚠️ Change default passwords in production
- ⚠️ Keep Google OAuth credentials secure

---

## 📞 Support / Reset

Need to reset credentials? Contact Super Admin to:
- Create new user accounts
- Reset passwords
- Change user roles
- Activate/deactivate users

---

## 📱 Mobile Access

All portals are fully responsive and work on mobile devices:
- Tablets: Full layout
- Phones: Optimized mobile view
- All features available on mobile

---

**Last Updated:** March 28, 2026  
**System:** HSC Exam Form v1.0
