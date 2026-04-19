# Student Registration Manager System - Complete Plan

## Overview
Build a multi-student registration system where managers can register multiple students under their account, and students can be registered under multiple managers (e.g., school and coaching center).

---

## 1. User Role Architecture

### User Types:
1. **Student Manager** - Can register and manage multiple students
   - Typically: School principal, coaching center admin, HOD
   - Access: `/app/manager/register-students` - Register new students
   - Access: `/app/manager/my-students` - View/edit students they registered
   - Can generate exam forms for their students

2. **Student** - Self-registration or manager-registered
   - Access: `/app/student/profile` - Own profile
   - Access: `/app/student/exam-form` - Generate own exam form
   - Can see managers who registered them

3. **Super Admin** - Oversees all registrations

### Registration Scenarios:
- **Scenario A**: School manager registers students from their institution
  - Manager's institute = Student's institute
  - One-to-many relationship
  
- **Scenario B**: Coaching center registers students from multiple institutes
  - Manager's institute ≠ Student's institute (can differ)
  - Student can have multiple managers (school + coaching)

---

## 2. Current Database Schema (Student Model)

```prisma
model Student {
  id           Int
  instituteId  Int          // Required: Where student appears
  userId       Int?         // If student has own account (optional)
  managerUserId Int?        // Who registered them (can be multiple)
  aadhaar      String?      // UNIQUE KEY for lookup
  firstName    String?
  middleName   String?
  lastName     String?
  ...
}
```

**Issue**: `managerUserId` can only have ONE manager. Need to support multiple managers.

### Required Schema Change:
Add many-to-many relationship:
```prisma
model StudentManager {
  id           Int
  studentId    Int
  managerUserId Int
  registeredAt DateTime
  isPrimary    Boolean  // Primary manager (school usually)
  
  student      Student
  manager      User
  
  @@unique([studentId, managerUserId])
}
```

---

## 3. Frontend Registration Flow

### Step 1: Manager Dashboard
```
/app/manager/register-students
├── Button: "+ Add New Student"
├── Table: My Registered Students (with actions: Edit, Delete, View Exam Forms)
└── Search/Filter: By institute, name, aadhaar
```

### Step 2: Student Registration Modal/Form

**Form Structure** (Tab-based):

#### Tab 1: Basic Info (Aadhaar Lookup)
```
┌─────────────────────────────────┐
│ Step 1: Basic Information       │
├─────────────────────────────────┤
│                                 │
│ Aadhaar Number: [12-digits]    │
│ (Autouppercase, numbers only)   │
│                                 │
│ [Lookup from Existing] button   │
│                                 │
│ Results:                        │
│ ✓ If found: Show found student  │
│   details in read-only format   │
│   Modal shows: Existing student │
│   details, with option to:      │
│   - Use this student (link)     │
│   - Register as new (copy data) │
│                                 │
│ ✗ If not found:                │
│   Continue to next tab          │
│                                 │
│ [Next] button (no mandatory)    │
└─────────────────────────────────┘
```

#### Tab 2: Personal Details
```
┌─────────────────────────────────┐
│ Step 2: Personal Details        │
├─────────────────────────────────┤
│ First Name: [UPPERCASE ONLY]    │
│ Middle Name: [Optional]         │
│ Last Name: [UPPERCASE ONLY]     │
│ Mother Name: [Optional]         │
│ Date of Birth: [Date picker]    │
│ Gender: [Select]                │
│                                 │
│ [Back] [Next] buttons           │
│ Mandatory fields shown in red   │
└─────────────────────────────────┘
```

#### Tab 3: Institute & Stream
```
┌─────────────────────────────────┐
│ Step 3: Institute & Stream      │
├─────────────────────────────────┤
│ Institute: [Search dropdown]    │
│ Stream: [Select: Science/...]   │
│ Medium: [Select: Marathi/...]   │
│ Category: [Select]              │
│                                 │
│ [Back] [Next] buttons           │
└─────────────────────────────────┘
```

#### Tab 4: Contact Information
```
┌─────────────────────────────────┐
│ Step 4: Contact Information     │
├─────────────────────────────────┤
│ Mobile: [10 digits, 6-9 start]  │
│ Address: [Text area]            │
│ PinCode: [6 digits]             │
│ District: [Auto-filled from pin]│
│ Taluka: [Auto-filled]           │
│ Village: [Auto-filled]          │
│                                 │
│ [Back] [Next] buttons           │
└─────────────────────────────────┘
```

#### Tab 5: Additional Details (Optional)
```
┌─────────────────────────────────┐
│ Step 5: Additional Details      │
├─────────────────────────────────┤
│ Aadhaar: [12 digits]            │
│ APAAR ID: [Optional, UPPERCASE] │
│ Saral ID: [Optional, UPPERCASE] │
│ SSC Seat No: [UPPERCASE opt.]   │
│ SSC Percentage: [Optional]      │
│ SSC Year: [Optional]            │
│                                 │
│ [Back] [Submit] buttons         │
└─────────────────────────────────┘
```

---

## 4. Backend Requirements

### New API Endpoints:

#### 1. Lookup Student by Aadhaar
```
GET /api/students/lookup-by-aadhaar?aadhaar=123456789012
Response: { found: true, student: {...} } or { found: false }
Access: Manager users only (check institute)
```

#### 2. Get Student's Managers
```
GET /api/students/:id/managers
Response: [{ id, userId, firstName, lastName, institute, isPrimary }]
```

#### 3. Link Existing Student to Manager
```
POST /api/students/:id/link-manager
Body: { isPrimary: boolean }
Sets up StudentManager relationship
```

#### 4. Create Managed Student (Updated)
```
POST /api/students/managed
Now returns detailed validation with mandatory field highlights
```

#### 5. Manager Dashboard - List
```
GET /api/managers/my-students
Response: Paginated list with filters
```

---

## 5. Input Validation & Constraints

### Frontend Validation:
1. **Case Conversion**: 
   - Names → UPPERCASE (real-time)
   - Seat numbers → UPPERCASE
   - IDs (Aadhaar, APAAR, Saral) → UPPERCASE

2. **Language Restriction**:
   - Only English/Latin characters
   - Numbers allowed for specific fields
   - Use `@keydown` to prevent Devanagari input
   ```typescript
   // Block non-ASCII characters
   @HostListener('keydown', ['$event'])
   onKeyDown(event: KeyboardEvent) {
     const char = event.key;
     if (!/^[A-Za-z0-9\s\-\']$/.test(char) && !isControlKey(event)) {
       event.preventDefault();
     }
   }
   ```

3. **Mandatory Field Highlighting**:
   - On form submission attempt, highlight all empty mandatory fields in RED
   - Show error summary above form
   - Move focus to first error field

### Backend Validation:
- Zod schema validates all fields
- Returns detailed error messages with field locations
- Prevents special characters in names

---

## 6. Implementation Steps

### Phase 1: Backend Enhancements
- [ ] Add StudentManager junction table
- [ ] Create lookup-by-aadhaar endpoint
- [ ] Create link-manager endpoint
- [ ] Update managed student creation to use StudentManager
- [ ] Add manager dashboard endpoints

### Phase 2: Frontend Form Overhaul
- [ ] Restructure student registration modal into tabs
- [ ] Add Aadhaar lookup with existing student detection
- [ ] Implement input restrictions (uppercase, English only)
- [ ] Add Next/Back navigation
- [ ] Add mandatory field highlighting
- [ ] Implement responsive layout

### Phase 3: Manager Dashboard
- [ ] Create /app/manager/register-students page
- [ ] List students with pagination/filtering
- [ ] Inline edit/delete actions
- [ ] Connect to exam form generation

### Phase 4: Exam Form Generation
- [ ] Integration with manager's students
- [ ] Auto-populate student data
- [ ] Generate exam forms for batch
- [ ] Download/print options

---

## 7. Data Flow Examples

### Example 1: School Manager Registers Student
```
School Manager (User A)
  ↓ Registering
  └─→ Student: Raj Kumar (Institute B, Stream: Science)
       └─→ StudentManager(studentId=101, managerId=A, isPrimary=true)
       └─→ Ready for exam form generation
```

### Example 2: Student with Dual Registration
```
Student: Priya Sharma (Institute B, Science)
  ├─→ Manager 1: School Principal (isPrimary=true)
  │    └─→ Managed through school
  │
  └─→ Manager 2: Coaching Center (isPrimary=false)
       └─→ Also registered in coaching center
       └─→ Can receive updates from both
```

### Example 3: Aadhaar Lookup & Link
```
Manager tries to register new student with existing Aadhaar:
  1. Enters Aadhaar: 123456789012
  2. System finds existing: Rahul Desai (Registered by School A)
  3. Options shown:
     a) Link to my account (becomes secondary manager)
     b) Register as new (rare case - data entry error)
```

---

## 8. Login/Authentication Approach

### Option 1: Separate Manager Login (Recommended for now)
- Keep student and manager as separate login types
- Manager has role: MANAGER
- Student has role: STUDENT
- Both can coexist

### Option 2: Unified Login (Future)
- Single user account with multiple roles
- User selects role on login
- Same person can be "Manager" for school and "Student" for coaching

### Recommended: Option 1 for MVP
- Simpler implementation
- Clear separation of responsibilities
- Easy to audit

---

## 9. Exam Form Generation Integration

### Flow:
```
Manager Dashboard
  ↓ Select Students
  ↓ Generate Forms (Batch)
  ↓ Review & Validate
  ↓ Submit to Board
  ↓ Track Status
```

---

## 10. Timeline Estimate

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Database schema change | 1-2 hours |
| 2 | Backend endpoints | 3-4 hours |
| 3 | Frontend form redesign | 4-5 hours |
| 4 | Manager dashboard | 3-4 hours |
| 5 | Exam form integration | 4-5 hours |
| | Testing & refinement | 2-3 hours |
| | **Total** | **17-23 hours** |

---

## Success Criteria

✅ Manager can register multiple students in one flow
✅ Aadhaar lookup prevents duplicate registrations
✅ Tab-based form with Next/Back navigation
✅ Mandatory fields validated and highlighted clearly
✅ Input restrictions enforce English + Uppercase
✅ Students can be linked to multiple managers
✅ Exam forms generated from registered students
✅ No connection refused errors
✅ Responsive design on mobile & desktop
✅ Comprehensive error messages
