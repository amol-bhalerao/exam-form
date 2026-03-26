# HSC Exam Application - Testing Guide

## Environment Status
- **Frontend**: http://localhost:4200 ✅
- **Backend**: http://localhost:3000 ✅
- **Test Mode**: Enabled (devMode = true in google-auth.service.ts)

---

## Test Cases by User Role

### 1. STUDENT (Google OAuth Test Login)

#### Test 1.1: Landing Page Redirect
1. Navigate to `http://localhost:4200/`
2. You should be redirected to `/app/dashboard` immediately (if logged in from previous test)
3. If not logged in, see landing page with "Sign in with Google (TEST MODE)" button

#### Test 1.2: Google Login
1. Go to `http://localhost:4200/google-login`
2. Click "Sign in with Google (TEST MODE)" button
3. Should see console log: `✅ Test authentication successful!`
4. Should redirect to `/app/dashboard`
5. Check localStorage → `hsc_auth` key should contain valid JWT token

#### Test 1.3: Sidebar Navigation (STUDENT)
1. From dashboard, check sidebar has:
   - ✅ Dashboard (active)
   - ✅ My Applications
   - ✅ My Profile
2. Click **My Applications** → Should navigate to `/app/student/applications`
3. Click **My Profile** → Should navigate to `/app/profile`
4. All links use `/app` prefix (fixed)
5. Text color should be bright and readable (light #e2e8f0)

#### Test 1.4: Student Profile (`/app/student/profile`)
1. Click "My Profile" from sidebar
2. Should show tabs:
   - Personal Details
   - College Information
   - Subject Marks (if applicable)
3. Fill personal details:
   - First Name, Last Name
   - Email, Mobile
   - Date of Birth
   - Gender, Aadhar, Roll Number
   - Address, City, State, Pincode
4. Click "Save Changes" → Should save successfully
5. Refill form and verify data persists

#### Test 1.5: My Applications (`/app/student/applications`)
1. Click "My Applications" from sidebar
2. Should show list of available exams to apply for
3. Click exam → Should open exam form at `/app/student/applications/:id`

#### Test 1.6: Exam Form Fill (`/app/student/applications/:id`)
1. Should show multi-step form:
   - Personal Details (pre-filled from profile)
   - Address & Contact
   - Subject Selection
   - Document Upload
   - Summary & Submit
2. Fill all required fields
3. Select multiple subjects (if available)
4. Should prevent submission if required fields empty
5. Click Submit → Should save exam application

#### Test 1.7: Exam Form Print (`/app/student/forms/:id/print`)
1. After submitting exam form, should see print option
2. Click Print button
3. Form should display in A4 format (210mm x 297mm)
4. Should include:
   - Index No, UDISE No, Student ID
   - Student Name, Parents Names
   - Address, Mobile, DOB
   - Selected Subjects
   - Photo placeholder
   - Signature lines
5. Print to PDF and verify:
   - Fits on single A4 page
   - All data clearly visible
   - No overflow or missing fields

#### Test 1.8: Navbar at `/app/profile`
1. Navigate to `/app/profile`
2. Check navbar (toolbar):
   - Should occupy full width ✅ (fixed)
   - Should show username and role
   - Should show logout button
3. Verify no half-width spacing issue

---

### 2. ADMIN / BOARD (Credential Login)

#### Test 2.1: Board Login
1. Navigate to `http://localhost:4200/auth`
2. Should show Student login card ONLY (fixed - other cards removed)
3. For testing board user, directly check database or create via backend

#### Test 2.2: Board Dashboard (`/app/dashboard`)
1. Login as BOARD user
2. Sidebar should show:
   - Dashboard
   - Exams
   - Applications
   - Teachers
   - Subjects
   - Streams
   - My Profile

#### Test 2.3: Board Menu Navigation
1. Click **Exams** → `/app/board/exams`
2. Click **Applications** → `/app/board/applications`
3. Click **Teachers** → `/app/board/teachers`
4. Click **Subjects** → `/app/board/subjects`
5. Click **Streams** → `/app/board/streams`
6. All should use `/app` prefix (fixed)
7. Text colors should be bright and readable

---

### 3. INSTITUTE (Credential Login)

#### Test 3.1: Institute Dashboard
1. Login as INSTITUTE user
2. Sidebar should show:
   - Dashboard
   - Student Applications
   - Institute Details
   - Teachers
   - Stream Subjects
   - My Profile

#### Test 3.2: Institute Menu Navigation
1. Click **Student Applications** → `/app/institute/applications`
2. Click **Institute Details**  → `/app/institute/settings`
3. Click **Teachers** → `/app/institute/teachers`
4. Click **Stream Subjects** → `/app/institute/stream-subjects`
5. All navigation should work correctly

---

### 4. SUPER_ADMIN (Credential Login)

#### Test 4.1: Super Admin Dashboard
1. Login as SUPER_ADMIN user
2. Sidebar should show:
   - Dashboard
   - Institutes
   - Institute Users
   - Board Users
   - Master Data
   - My Profile

#### Test 4.2: Super Admin Navigation
1. Click **Institutes** → `/app/super/institutes`
2. Click **Institute Users** → `/app/super/institute-users`
3. Click **Board Users** → `/app/super/users`
4. Click **Master Data** → `/app/super/masters`
5. All should navigate correctly

---

## Logout Test

### Test 5: Logout Flow
1. From any dashboard, click **Logout** button (top-right)
2. Should:
   - Clear localStorage `hsc_auth` key
   - Redirect to landing page `/`
   - Show login options again

### Test 5.2: Logout Redirect
1. After logout, try accessing `/app/dashboard` directly
2. Should redirect to `/login` or `/auth` (protected by authGuard)

---

## Cross-Browser Tests

### Test 6: Mobile Responsiveness
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test on iPhone 12 (390x844):
   - Sidebar should collapse on mobile
   - Menu toggle button should work
   - Forms should be readable
   - Print layout should not be affected

### Test 7: Dark Mode (if applicable)
1. Check if dark mode CSS variables work
2. Sidebar colors should have proper contrast

---

## Error Scenarios

### Test 8: Invalid Token
1. Manually edit localStorage `hsc_auth` to invalid JWT
2. Navigate to `/app/dashboard`
3. Should show 401 error or redirect to login

### Test 9: Expired Session
1. Clear localStorage `hsc_auth`
2. Navigate to protected routes
3. Should redirect to `/auth` or `/login`

---

## Network Tests

### Test 10: API Calls
1. Open DevTools → Network tab
2. Navigate through app
3. Check all API calls:
   - Have `Authorization: Bearer {token}` header ✅ (authInterceptor)
   - Return 200 status
   - Don't return 401 Unauthorized (fixed)

### Test 10.2: `/api/me` Endpoint
1. Login as student
2. Check Network tab
3. Should see `GET /api/me` returning 200 with user profile
4. Previously was returning 401 (now fixed)

---

## Summary Checklist

### Sidebar & Navigation ✅
- [ ] Sidebar text is readable (light color)
- [ ] All sidebar routes use `/app` prefix
- [ ] Navbar occupies full width
- [ ] Active link highlighting works
- [ ] Icons display correctly

### Student Features ✅
- [ ] Logged-in students redirect from landing page
- [ ] Student profile saves correctly
- [ ] Multiple exams can be filled
- [ ] Exam form submissions work
- [ ] Print format is A4 single page

### Role-Based Access ✅
- [ ] Student can't access Board/Institute pages
- [ ] Board can't access Admin pages
- [ ] Institute pages show correct permissions
- [ ] Super Admin has all access

### Authentication ✅
- [ ] Google login works (test mode)
- [ ] Tokens stored correctly
- [ ] API calls include Authorization header
- [ ] 401 errors redirect to login
- [ ] Logout clears session

---

## Test Data

### Student Test Account
- **Email**: test-student-{timestamp}@hsc-exam-dev.local
- **Username**: auto-generated
- **Role**: STUDENT
- **Created on**: First Google login (test mode)

### Credentials for Other Roles
Check with your DBA or use:
```bash
# Backend: Create test users via Prisma seed
npm run db:seed
```

---

## Reporting Issues

If any test fails, check:
1. **Frontend Console (F12)**: TypeScript errors?
2. **Network Tab**: API call details and responses
3. **Backend Logs**: Server-side errors
4. **localStorage**: Check `hsc_auth` key exists and contains valid JWT

---

## Next Steps After Testing

1. Change `devMode = false` in `google-auth.service.ts` to enable real Google OAuth
2. Test real Google login (wait for Google Cloud propagation)
3. Deploy to production
4. Create comprehensive HSC exam form with all required fields
5. Implement multi-form support in student dashboard
