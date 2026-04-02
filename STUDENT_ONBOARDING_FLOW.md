# Student Onboarding Flow - Implementation Guide

## Overview
Students now follow a 3-step onboarding flow before accessing the exam form dashboard:
1. **Step 1**: Select Institute and Stream
2. **Step 2**: Complete Profile Setup
3. **Step 3**: Access Dashboard and Apply for Exams

---

## Key Changes

### 1. Institute Visibility
- **Students see ALL institutes** (regardless of status)
- **Public/Anonymous users** see only APPROVED and PENDING institutes
- **Institute status** only matters for INSTITUTE user (admin) login capability

### 2. Student Profile
- Student profile is created when they select an institute
- Cannot be changed after initial selection
- Must include firstName, lastName, and motherName before dashboard access

### 3. Exam Applications
- Students can only apply for **ACTIVE exams**
- Must have completed onboarding (institute + profile) first

---

## Frontend Implementation

### Step 1: Check Onboarding Status on App Startup

After student logs in, immediately check their setup status:

```typescript
// In your auth service or app component
async checkStudentSetupStatus() {
  const response = await this.http.get('/api/students/setup-status').toPromise();
  
  return {
    instituteSelected: response.instituteSelected,
    profileComplete: response.profileComplete,
    allowDashboardAccess: response.onboardingSteps.allowDashboardAccess
  };
}
```

**Response Example:**
```json
{
  "instituteSelected": false,
  "profileComplete": false,
  "student": null,
  "onboardingSteps": {
    "step1_instituteSelected": false,
    "step2_profileComplete": false,
    "allowDashboardAccess": false
  }
}
```

### Step 2A: Show Institute Selection Screen (if not selected)

If `instituteSelected === false`, show institute selection:

```typescript
async getInstitutes() {
  const response = await this.http.get('/api/institutes').toPromise();
  // Returns ALL institutes for logged-in students
  return response.institutes;
}
```

Present institutes in a searchable/filterable list:
- By District
- By City
- By Name

Allow student to select:
- Institute (select one)
- Stream (Arts, Science, Commerce, HSC.VOC)

### Step 2B: Student Selects Institute

When student confirms selection, call:

```typescript
selectInstitute(instituteId: number, streamCode: string) {
  return this.http.post('/api/students/select-institute', {
    instituteId,
    streamCode
  }).toPromise();
}
```

**Request Body:**
```json
{
  "instituteId": 5,
  "streamCode": "SCIENCE"
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Institute and Stream selected successfully",
  "student": {
    "id": 42,
    "userId": 7,
    "instituteId": 5,
    "streamCode": "SCIENCE",
    "firstName": "",
    "lastName": ""
  }
}
```

**Error if already selected:**
```json
{
  "error": "INSTITUTE_ALREADY_SELECTED",
  "message": "Institute and Stream cannot be changed after initial selection. Please contact support if you need to change."
}
```

### Step 3: Show Profile Setup Screen

If `profileComplete === false`, show profile setup form:

```typescript
updateStudentProfile(data: {
  firstName: string;
  lastName: string;
  motherName: string;
  dob?: string;           // ISO date
  gender?: string;
  aadhaar?: string;
  mobile?: string;
  address?: string;
  pinCode?: string;
  streamCode?: string;
  minorityReligionCode?: string;
  categoryCode?: string;
  divyangCode?: string;
  mediumCode?: string;
}) {
  return this.http.patch('/api/students/me', data).toPromise();
}
```

**Required Fields for Dashboard Access:**
- firstName (min 2 chars)
- lastName (min 2 chars)
- motherName (min 2 chars)

**Optional Fields:**
- dob (ISO 8601 datetime)
- gender
- aadhaar (12 digits)
- address
- pinCode (max 10 chars)
- mobile (10 digits, must start with 6-9)
- Various PDF code fields

**Success Response:**
```json
{
  "ok": true,
  "student": {
    "id": 42,
    "instituteId": 5,
    "userId": 7,
    "firstName": "Amol",
    "lastName": "Bhalerao",
    "motherName": "Sunanda",
    // ... other fields
  }
}
```

### Step 4: Check Status Again + Show Dashboard

After profile update, check setup-status again:

```typescript
if (response.allowDashboardAccess) {
  // Show dashboard with exam selection
  this.router.navigate(['/dashboard']);
} else {
  // Still need more profile data
  console.log('Profile incomplete:', response);
}
```

---

## API Endpoints Reference

### Check Student Setup Status
```
GET /api/students/setup-status
Authorization: Bearer <STUDENT_TOKEN>
```
**Returns**: onboarding progress, institute selection status, profile completion status

### Get All Institutes (for student selection)
```
GET /api/institutes
Authorization: Bearer <STUDENT_TOKEN>
```
**Returns**: ALL institutes (students see all, public sees approved only)

### Select Institute and Stream
```
POST /api/students/select-institute
Authorization: Bearer <STUDENT_TOKEN>
Content-Type: application/json

{
  "instituteId": <number>,
  "streamCode": "<string>"
}
```

### Update Student Profile
```
PATCH /api/students/me
Authorization: Bearer <STUDENT_TOKEN>
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "motherName": "string",
  // ... optional fields
}
```

### Get Current Student Profile
```
GET /api/students/me
Authorization: Bearer <STUDENT_TOKEN>
```
**Returns**: Full student profile including institute

---

## Frontend Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Student Logs In                                                  │
│ (Redirected to /student-onboarding)                             │
└──────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ GET /api/students/setup-status
         │ Check: instituteSelected?    │
         └──────────────────┬───────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
                  ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ NO               │  │ YES              │
         │ Show Institute   │  │ Check:           │
         │ Selection Form   │  │ profileComplete? │
         └────────┬─────────┘  └────┬─────────────┘
                  │                 │
                  │            ┌────┴────┐
       ┌──────────┴──────┐     │         │
       │                 │     ▼         ▼
       │         ┌──────────────────┐  ┌────────────────┐
       │         │ GET /api/institutes
       │         │ Display all       │  │ profileComplete
       │         │ institutes (1000+ │  │ = true
       │         └──────┬────────────┘  │ Go to Dashboard
       │                │                │ (DONE)
       │                │                └────────────────┘
       │                │
       │        ┌───────┴──────────┐
       │        │ Student selects  │
       │        │ institute +      │
       │        │ stream           │
       │        └────────┬─────────┘
       │                 │
       │    ┌────────────┴────────────────┐
       │    │ POST /api/students/select   │
       │    │        -institute           │
       │    └────────┬───────────────────┘
       │             │
       └─────────────┴──────┐
                            │
                            ▼
                  ┌──────────────────────┐
                  │ Show Profile Setup    │
                  │ Form                  │
                  │ (First/Last/Mother)   │
                  └────────┬──────────────┘
                           │
                  ┌────────┴──────────┐
                  │ PATCH /api/       │
                  │ students/me       │
                  │ (with profile     │
                  │ updates)          │
                  └────────┬──────────┘
                           │
                  ┌────────┴──────────┐
                  │ GET /api/students/│
                  │ setup-status      │
                  └────────┬──────────┘
                           │
                           ▼
                  ┌──────────────────────┐
                  │ allowDashboardAccess │
                  │ = true               │
                  │ → Navigate to        │
                  │   /dashboard         │
                  └──────────────────────┘
```

---

## Frontend Validation Rules

### Institute Selection
- ✅ Must select at least one institute
- ✅ Must select a stream (Arts, Science, Commerce, HSC.VOC)
- ✅ Cannot be changed after confirmation

### Profile Setup (Required fields)
- **firstName**: 2-50 chars, letters/spaces/hyphens/apostrophes only
- **lastName**: 2-50 chars, letters/spaces/hyphens/apostrophes only
- **motherName**: 2-50 chars, letters/spaces/hyphens/apostrophes only

### Profile Setup (Optional fields)
- **mobile**: 10 digits, must start with 6-9
- **dob**: Valid ISO 8601 datetime
- **aadhaar**: Exactly 12 digits
- **pinCode**: Max 10 characters
- **address**: Text (no specific validation)
- **gender**: Any string
- **other codes**: Subject to master data validation in UI

---

## Handling Edge Cases

### Student refreshes page during onboarding
→ Check setup-status again to get latest state and show appropriate screen

### Student tries to return to institute selection after selecting
→ API returns INSTITUTE_ALREADY_SELECTED error
→ UI should show message: "Your institute selection is already confirmed. Contact support to change it."

### Student has institute but no profile data
→ Show profile setup form, profile fields are optional for immediate access BUT minimum required are firstName/lastName/motherName

### Student with incomplete profile tries to apply for exam
→ Backend should validate profile completeness before allowing application submission

---

## Testing Checklist

- [ ] After login, immediately call GET /api/students/setup-status
- [ ] Verify institute list shows 1000+ institutes for students
- [ ] Can select any institute (regardless of status)
- [ ] Cannot select different institute twice
- [ ] Profile update validates required fields
- [ ] Cannot access dashboard until profile complete
- [ ] After profile complete, allowDashboardAccess = true
- [ ] Can only apply for ACTIVE exams
- [ ] Institute status doesn't affect student exam access (only affects institute admin login)

---

## Migration Notes

**For existing students:**
- If they already have a student profile, they're already onboarded ✅
- If they don't have a profile, they'll be sent to institute selection screen ✅
- No data migration needed - existing structure supports this flow ✅

**For newly registered students:**
- Will follow the 3-step flow automatically ✅

---

## Super Admin Diagnostics

Check institute distribution:
```bash
curl "https://api.example.com/api/institutes/admin/stats" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

Response shows:
- Total institutes
- Count by status (APPROVED, PENDING, REJECTED, DISABLED)
- Count of institutes accepting applications
- Number of institutes visible to students

If all institutes are PENDING and you want them visible, approve them:
```bash
curl -X PATCH "https://api.example.com/api/institutes/admin/approve-all-pending" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```
