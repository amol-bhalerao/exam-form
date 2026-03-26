# Student Profile & Google Authentication Setup Guide

## Overview
This guide explains how students can use the new Student Profile page, Google authentication, and form auto-fill features.

---

## Student Profile Management

### What is the Student Profile?
The Student Profile page allows students to:
- **Personal Details**: Store full name, date of birth, gender, Aadhar number, contact information
- **College Information**: Record college name, branch, admission year, stream, and board
- **Subject Marks**: Maintain records of marks for fresh admission and backlog subjects

When students fill the exam form later, all this information is automatically pre-filled from their profile, saving time and reducing errors.

### How to Access Student Profile
1. **After logging in via Google**, click **Profile** → **Student Profile**
2. Or navigate directly to: `/app/student/profile`

### Tab-by-Tab Guide

#### 1. Personal Details Tab
Fill in the following information that will be auto-populated in exam forms:
- **First Name** and **Last Name** ✓ (Required)
- **Email** ✓ (Required)
- **Mobile Number** (optional but recommended)
- **Date of Birth** (optional)
- **Gender** (Male, Female, Other)
- **Aadhar Number** (optional)
- **Roll Number** (optional)
- **Address, City, State, Pincode** (optional)

Click **Save Changes** to store.

#### 2. College Information Tab
Document your educational institution details:
- **College Name** ✓ (Required)
- **College Branch** (e.g., Main Campus, Downtown Campus)
- **Admission Year** (e.g., 2022, 2023, 2024)
- **Stream** (Science, Commerce, Arts, Vocational)
- **Board** (MSBSHSE, CBSE, ICSE, Other)

Click **Save Changes** to store.

#### 3. Subject Marks Tab
Manage your academic subjects and grades:

**Fresh Admission Subjects:**
Students taking fresh exams can:
1. Click **Add Subject**
2. Select or type subject name (English, Mathematics, Physics, Chemistry, Biology, etc.)
3. Enter **Max Marks** (typically 100)
4. Enter **Obtained Marks** (your score)
5. Set **Grade** (A+, A, B+, B, C, D, E)
6. Percentage is auto-calculated
7. Click **Add**

**Backlog Subjects:**
For subjects you're retaking:
1. Click **Add Backlog Subject**
2. Same process, but mark as "This is a backlog subject" ✓
3. These subjects are managed separately from fresh admission subjects

**Managing Subjects:**
- View all subjects in organized tables
- Delete subjects using the delete button
- Average percentage is displayed automatically in the Summary tab

#### 4. Summary Tab
View your complete profile summary:
- Name, Email, Mobile
- College and Stream
- Count of fresh and backlog subjects
- Average academic percentage

---

## Google Authentication Flow

### Google Client ID
**Client ID**: `260515642590-5ipgojov7maa51m9j8hutpcu01dckkui.apps.googleusercontent.com`

### How Student Login Works

#### Step 1: Navigate to Student Login
1. Go to home page `/`
2. You'll see **3 login options**: Student, Institute, Admin
3. Click **Student Login**

#### Step 2: Google Sign-In
1. You'll see the **"Continue with Google"** button
2. Click it
3. A Google login popup appears
4. Sign in with your Google account (email + password)
5. Grant permission if prompted

#### Step 3: Auto-Account Creation
- **First Time Login**: 
  - Backend automatically creates a student account linked to your Google email
  - An initial student profile is created with your name from Google
  - You can edit details immediately in Student Profile page

- **Subsequent Logins**:
  - Your account is retrieved automatically
  - You're logged in with JWT tokens
  - Tokens stored securely in localStorage

#### Step 4: Access Exam Forms
After login, you can:
1. Go to **Student** → **Fill Exam Form**
2. All your profile details are **automatically pre-filled**
3. Update any information as needed
4. Submit the form

---

## User Type Selection & Separate Login Pages

### Login Route Structure
- **Default login path**: `/login` → Shows user type selection
- **Student login**: `/student-login` or `/google-login`
- **Institute login**: `/institute-login` (email + password)
- **Admin login**: `/admin-login` (username + password + security code)

### Why Separate Logins?
1. **Security**: Students use Google OAuth (passwordless), Institutes use credentials, Admins use additional security code
2. **UX**: Each user type sees relevant options and information
3. **Access Control**: Routes are role-protected (formGuard ensures Google auth for forms)

### Student Login Page Features
✓ Board branding (logo, name, address, contact)
✓ Feature highlights (6 features listed)
✓ Security messaging
✓ Google Sign-In button
✓ Language selector (Marathi/English)
✓ Mobile responsive design
✓ Professional styling with animations

### Institute Login Page Features
✓ Blue color scheme to differentiate from student
✓ Left panel: Board branding + institute features
✓ Right panel: Email & password form
✓ Email validation
✓ Dashboard redirect after login

### Admin Login Page Features
✓ Orange/warning color for security
✓ Admin badge and role designation
✓ Restricted access notice
✓ Security code (6-digit) requirement
✓ Username + secure password form
✓ Security warning about public computers
✓ Emergency support links

---

## Form Auto-Fill Feature

### How It Works
1. Student completes **Student Profile** page (fill personal, college, subject details)
2. When filling **Exam Form**, the system checks StudentProfileService
3. All matching fields are **automatically populated**:
   - Name, Email, Mobile, Address
   - Birth Date, Gender
   - College Name, Stream
   - Subject selections (only subjects in profile)

### Benefits
- **Saves Time**: No need to re-type information
- **Reduces Errors**: Consistent data across forms
- **Better UX**: Quick form completion

### Important Notes
- Student can **always update** any auto-filled field in the form
- Updating form data **does NOT change** the student profile (they're independent)
- To permanently change personal information, use **Student Profile** page

---

## Subject Management for Different Application Types

### Fresh Admission (नवीन प्रवेश)
- Student is applying for exams for the first time
- Add subjects from regular subjects list
- Mark as **NOT** backlog
- System uses percentage for eligibility evaluation

### Backlog Subjects (बॅकलॉग विषय)
- Student failed or wants to improve previous exam
- Subject previously taken and scored marks already exist
- Mark as **IS** backlog subject
- Both fresh and backlog applications tracked separately

---

## Backend Integration Requirements

### API Endpoint: `/api/student/profile`

**GET /api/student/profile**
```
Authorization: Bearer <JWT_TOKEN>
Response:
{
  "userId": 123,
  "firstName": "Hari",
  "lastName": "Sharma",
  "email": "hari@example.com",
  "mobile": "+919876543210",
  "collegeName": "MIT Pune",
  "stream": "SCIENCE",
  "subjects": [
    {
      "subjectId": 1,
      "subjectName": "Physics",
      "maxMarks": 100,
      "obtainedMarks": 95,
      "percentage": 95,
      "grade": "A+",
      "isBacklog": false
    }
  ]
}
```

**POST /api/student/profile**
```
Authorization: Bearer <JWT_TOKEN>
Body:
{
  "firstName": "Updated",
  "lastName": "Name",
  "mobile": "+919876543210",
  "collegeName": "MIT",
  "stream": "SCIENCE",
  "subjects": [...]
}
Response: Updated student profile object
```

### Database Fields Needed
```sql
ALTER TABLE Student ADD COLUMN (
  dateOfBirth DATE,
  gender ENUM('MALE', 'FEMALE', 'OTHER'),
  aadharNumber VARCHAR(12),
  rollNumber VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  collegeBranch VARCHAR(200),
  admissionYear INT,
  board VARCHAR(50)
);

-- New table for subject marks
CREATE TABLE StudentSubject (
  id BIGINT PRIMARY KEY,
  studentId BIGINT NOT NULL,
  subjectId INT,
  subjectName VARCHAR(100) NOT NULL,
  maxMarks INT NOT NULL,
  obtainedMarks DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2),
  isBacklog BOOLEAN DEFAULT false,
  percentage DECIMAL(5,2),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES User(id)
);
```

---

## Translation Keys Added

### Marathi
- `studentProfile`: 'विद्यार्थी प्रोफाईल'
- `personalDetails`: 'व्यक्तिगत तपशील'
- `collegeInfo`: 'महाविद्यालय माहिती'
- `subjectMarks`: 'विषय गुण'
- `selectUserType`: 'वापरकर्तेचा प्रकार निवडा'
- And 80+ more translations

### English
- All above keys with English translations
- Consistent with existing terminology

---

## Testing Checklist

- [ ] Navigate to `/login` → See user type selection page
- [ ] Click "Student" → Navigate to Google login page
- [ ] Google button loads and sign-in works
- [ ] After login → Redirect to `/app/dashboard`
- [ ] Navigate to `/app/student/profile` → Form loads with tabs
- [ ] Fill Personal Details → Click Save → Check localStorage persistence
- [ ] Add Fresh Subject → Add Backlog Subject → View in tables
- [ ] Check Summary tab shows correct totals
- [ ] Switch language (Marathi ↔ English) → All labels update
- [ ] Institute login page works with credentials
- [ ] Admin login page shows security code requirement
- [ ] Mobile responsive (480px, 768px breakpoints)
- [ ] Form auto-fill works when filling exam form

---

## Browser DevTools Debugging

**Check localStorage**:
```javascript
// View all stored data
console.log(JSON.parse(localStorage.getItem('user')))
console.log(localStorage.getItem('accessToken'))
console.log(localStorage.getItem('language'))
```

**Test StudentProfileService**:
```typescript
// In browser console
ng.getComponent(document.querySelector('app-student-profile') as any).profileService.profile$()
```

**Google OAuth Debug**:
- Check Network tab for `/auth/google` POST requests
- Response should contain `accessToken`, `refreshToken`, `user`

---

## Troubleshooting

### Google Sign-In Button Not Showing
- Check if `260515642590-5ipgojov7maa51m9j8hutpcu01dckkui.apps.googleusercontent.com` is authorized in Google Cloud Console
- Check CSP headers allow Google scripts
- In DevTools Network tab, look for failed `https://accounts.google.com` requests

### Profile Not Loading
- Check if user is authenticated (`accessToken` in localStorage)
- Check Network tab for 401 or 403 on `/api/student/profile`
- Ensure `StudentProfileService` is provided in `app.config.ts`

### Form Auto-Fill Not Working
- Check `StudentApplicationEditComponent` calls `studentProfileService.getProfileForAutoFill()`
- FormGroup must have matching control names
- Check browser console for form binding errors

### Language Switching Not Working
- Verify `I18nService.setLanguage()` updates signal
- Check all components subscribed properly to language signal
- Confirm `pure: false` on translate pipe

---

## Next Steps

1. **Backend**: Implement `/api/student/profile` GET/POST endpoints
2. **Database**: Add StudentSubject table and update Student schema
3. **Testing**: Test entire flow from login → profile → form filling
4. **Deployment**: Ensure Google OAuth credentials set in production
5. **Monitoring**: Track profile completion rates and form submission success

---

## Support & Contact

- **Board**: MSBSHSE, Pune
- **Website**: https://mahahsscboard.in
- **Email**: support@hscexam.in
- **Emergency**: +91-20-2570-5000

