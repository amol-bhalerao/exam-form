# 🚀 Local Development & Deployment Setup Guide

## ✅ SETUP COMPLETE - Everything is working locally!

### Current Status
- ✅ **Local MySQL Database**: Connected and working (`hsc_exam_local` on localhost:3306)
- ✅ **Backend API**: Running on `http://localhost:3000`
- ✅ **Frontend**: Running on `http://localhost:4200`
- ✅ **Database Seeding**: Test users and institutes loaded
- ✅ **Profile Guard**: Enhanced to enforce profile completion for STUDENT role only
- ✅ **Route Protection**: Dashboard now requires completed profile for students

---

## 🔧 LOCAL DEVELOPMENT SETUP

### Prerequisites
- Node.js 20.x LTS
- MySQL 5.7+ (local installation)
- PowerShell or Terminal

### Environment Configuration

Both `.env` and `.env.development` are configured for local development:

```
NODE_ENV=development
DATABASE_URL=mysql://root:@localhost:3306/hsc_exam_local
JWT_ACCESS_SECRET=Jaya_@1991_HSC_Exam_Access_Secret_2024
JWT_REFRESH_SECRET=Jaya_@1991_HSC_Exam_Refresh_Secret_2024
```

### How to Start Development Servers

**Terminal 1 - Backend API:**
```powershell
cd "c:\Users\UT\OneDrive\Desktop\hsc_exam\backend"
$env:NODE_ENV='development'
$env:JWT_ACCESS_SECRET='Jaya_@1991_HSC_Exam_Access_Secret_2024'
$env:JWT_REFRESH_SECRET='Jaya_@1991_HSC_Exam_Refresh_Secret_2024'
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\UT\OneDrive\Desktop\hsc_exam\frontend"
npm start
```

The frontend will automatically open at `http://localhost:4200`

---

## 📊 Database Structure

### Tables Created:
- `roles` - SUPER_ADMIN, BOARD, INSTITUTE, STUDENT
- `institutes` - Demo Junior College 1 & 2
- `users` - Test users for each role
- `students` - Student profiles linked to users
- Plus: applications, exams, masters, etc.

### Test Credentials:
```
Super Admin:  superadmin / Password@123
Board:        board / Password@123
Institute:    institute1 / Password@123
Student:      student1 / Password@123
```

---

## 🔐 Authentication & Authorization

### Profile Guard (Enhanced)
- **Location**: `frontend/src/app/core/auth.guard.ts`
- **Logic**:
  - STUDENT role: Requires completed profile to access dashboard
  - SUPER_ADMIN, BOARD, INSTITUTE roles: Bypass profile check immediately
  - Redirects to `/student/select-institute` if profile missing

### Protected Routes:
1. **Dashboard** (`/app/dashboard`) - Requires profile for STUDENT role only
2. **Applications** (`/app/student/applications`) - Profile + STUDENT role required
3. **Profile Settings** (`/app/student/profile`) - Profile required

---

## 🧪 E2E Testing Scenarios

### Scenario 1: New Student Login (No Profile)
1. Go to `http://localhost:4200`
2. Click "Login with Google"
3. Use student account: `student@example.com`
4. **Expected**: Redirected to `/student/select-institute`
5. ✅ **Verify**: Profile Guard is working

### Scenario 2: Complete Profile Selection
1. Select "Demo Junior College 1"
2. Select "Science" stream
3. Click "Confirm"
4. **Expected**: POST to `/api/students/select-institute` succeeds
5. ✅ **Verify**: Profile created in database

### Scenario 3: Access Dashboard with Profile
1. Navigate to `/app/dashboard`
2. **Expected**: Dashboard loads successfully (no redirect)
3. ✅ **Verify**: Profile Guard allows access with completed profile

### Scenario 4: Access Applications
1. Click "My Exams" or navigate to `/app/student/applications`
2. **Expected**: Applications list loads (empty initially)
3. ✅ **Verify**: GET `/api/applications/my` returns 200

### Scenario 5: Admin/Board User (No Profile Check)
1. Login as board user: `board@example.com`
2. Navigate to `/app/dashboard`
3. **Expected**: Dashboard accessible immediately
4. ✅ **Verify**: Profile Guard bypassed for non-STUDENT role

---

## 📦 Production Deployment

### Hostinger Deployment Process

1. **Update Production Database Connection**
   - Update `.env.production` with Hostinger MySQL credentials
   - Or set environment variables in Hostinger cPanel

2. **Build Frontend**
   ```powershell
   cd frontend
   npm run build
   ```
   Output: `frontend/dist/browser/`

3. **Deploy to Hostinger**
   - Upload `frontend/dist/browser/` to `public_html/`
   - Upload `backend/` to Node.js app directory
   - Ensure `npm install` runs on Hostinger
   - Ensure `npx prisma generate` runs to create OS-specific binaries

4. **Set Environment Variables in Hostinger cPanel**
   ```
   NODE_ENV=production
   DATABASE_URL=mysql://u441114691_exam:PASSWORD@127.0.0.1:3306/u441114691_exam
   JWT_ACCESS_SECRET=Jaya_@1991_HSC_Exam_Access_Secret_2024
   JWT_REFRESH_SECRET=Jaya_@1991_HSC_Exam_Refresh_Secret_2024
   CORS_ORIGIN=https://hsc-exam-form.hisofttechnology.com
   BACKEND_URL=https://hsc-api.hisofttechnology.com
   FRONTEND_URL=https://hsc-exam-form.hisofttechnology.com
   GOOGLE_CLIENT_ID=260515642590-5ipgojov7maa51m9j8hutpcu01dckkui.apps.googleusercontent.com
   ```

5. **Verify Deployment**
   - Check `https://hsc-exam-form.hisofttechnology.com` loads
   - Test `/api/health` endpoint
   - Test Google login flow

---

## 🐛 Troubleshooting

### Backend Won't Start
**Error**: `JWT_ACCESS_SECRET undefined`
**Fix**: Ensure NODE_ENV and JWT secrets are set in PowerShell before `npm start`:
```powershell
$env:NODE_ENV='development'
$env:JWT_ACCESS_SECRET='Jaya_@1991_HSC_Exam_Access_Secret_2024'
$env:JWT_REFRESH_SECRET='Jaya_@1991_HSC_Exam_Refresh_Secret_2024'
npm start
```

### Database Connection Error
**Error**: `Authentication failed against database server`
**Fix**: Ensure MySQL is running locally:
```powershell
# Windows
net start MySQL80

# Or check your MySQL service name and start it
```

### Frontend Can't Connect to Backend
**Error**: CORS errors in console
**Fix**: Ensure backend is running and listening on port 3000
```powershell
curl http://localhost:3000/api/health
```

### Profile Guard Blocking Non-Students
**Error**: Board/Institute users can't access dashboard
**Fix**: Check `auth.guard.ts` includes role check:
```typescript
if (user?.role && user.role !== 'STUDENT') return true;
```

---

## 📁 Project Structure

```
hsc_exam/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # CORS, rate-limit, auth
│   │   ├── env.js          # Environment configuration
│   │   └── server.js       # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed-clean.js   # Test data seed script
│   ├── .env                # Local environment
│   ├── .env.development    # Dev overrides
│   ├── .env.production     # Hostinger config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── auth.guard.ts       # Role & profile enforcement
│   │   │   │   ├── app.routes.ts       # Route configuration
│   │   │   │   └── auth.service.ts
│   │   │   ├── dashboard/
│   │   │   ├── student/
│   │   │   │   ├── profile/            # Profile form
│   │   │   │   └── select-institute/   # Institute selection
│   │   │   └── ...
│   │   └── main.ts
│   └── package.json
│
├── database/
│   ├── db_schema.sql       # Reference schema
│   └── seed_hsc_exam_form_db.sql
│
├── .env                    # Root level (not used)
└── package.json            # Root package.json
```

---

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes**
   - Edit files in `backend/src/`
   - Backend auto-reloads with `npm run dev` (use `--watch` flag)
   - Changes apply immediately

2. **Frontend Changes**
   - Edit files in `frontend/src/`
   - Angular dev server auto-rebuilds
   - Changes apply immediately (hot reload)

3. **Database Changes**
   - Update `backend/prisma/schema.prisma`
   - Run: `npx prisma db push`
   - Run: `npx prisma db seed` to re-seed if needed

### Git Workflow
```powershell
# After making changes
git add .
git commit -m "Description of changes"
git push origin main  # or your branch
```

---

## ✨ Key Improvements Made

### 1. Profile Guard Enhancement ✅
- **Before**: Blocked ALL non-STUDENT roles from dashboard
- **After**: Only STUDENT role requires profile; admins bypass check
- **File**: `frontend/src/app/core/auth.guard.ts`

### 2. Dashboard Protection ✅
- **Change**: Added `canActivate: [profileGuard]` to dashboard route
- **Effect**: Students without profile redirected to `/student/select-institute`
- **File**: `frontend/src/app/core/app.routes.ts`

### 3. Local Database Setup ✅
- **Database**: `hsc_exam_local` on `localhost:3306`
- **Seeding**: 4 test users, 2 institutes, 1 student profile
- **File**: `backend/prisma/seed-clean.js`

### 4. Environment Configuration ✅
- **Both Local & Production**: Use same environment pattern
- **Frontend**: Routes file with guards
- **Backend**: Express server with Prisma ORM

---

## 📞 Support & Next Steps

### Immediate Tasks
1. ✅ Test E2E flow: Login → Select Institute → Dashboard → Applications
2. ✅ Verify profile guard working for all user roles
3. ✅ Check form control binding errors are resolved

### Before Production
1. Set up Google OAuth on Hostinger (if not done)
2. Configure Cashfree payment gateway (optional)
3. Test complete payment flow
4. Perform security review
5. Load test with 100+ concurrent users

### Documentation
- ✅ [DATABASE_CONNECTION_GUIDE.md](DATABASE_CONNECTION_GUIDE.md) - SSH tunnel & remote DB setup
- ✅ [This file] - Local dev setup & deployment guide
- ❓ API documentation - Available at `/api-docs` endpoint

