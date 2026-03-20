# HSC Exam Form (Blank PDF) — Field Mapping Checklist

Source: `requirement docs/HSC BOARD EXAM-BLANK FORM.pdf`

This file lists **every field present in the blank PDF text extraction** and maps it to backend storage.

## Page 1 — Candidate + Subject Details

### Header
- **Board heading**: static print text
- **Exam session/year**: stored in `exams.session`, `exams.academicYear`

### (1) Institute identifiers
- **1a Index No** → `exam_applications.indexNo`
- **1b UDISE No** → `exam_applications.udiseNo`
- **1c Student saral ID** → `exam_applications.studentSaralId`

### (2) Application / center
- **2a Appl.Sr.No** → `exam_applications.applSrNo`
- **2b Centre No** → `exam_applications.centreNo`

### (3) Candidate name
- **3a Last name / Surname** → `students.lastName`
- **3b Candidate’s Name** → `students.firstName`
- **3c Middle/Father’s Name** → `students.middleName`
- **3d Mother’s Name** → `students.motherName`

### (4) Residential address
- **Address** → `students.address`
- **Pin Code** → `students.pinCode`

### (5) Mobile No
- **Mobile No** → `students.mobile`

### (6) Date of Birth
- **DOB (DDMMYYYY)** → `students.dob`

### (7) Aadhar No
- **Aadhar** → `students.aadhaar`

### (8) Stream (coded)
PDF options: 1) Science 2) Arts 3) Commerce 4) HSC Vocational 5) Technology Science  
- **Stream code** → `students.streamCode` (UI enforces choices)

### (9) Gender (coded)
PDF options: 1) Male 2) Female 3) Trans Gender  
- **Gender** → `students.gender` (stored as string)

### (10) Minority Religion (coded)
PDF options: 0) Hindu & other non-minority, 1) Muslim, 2) Christian, 3) Buddhist, 4) Sikh, 5) Parsi, 6) Jain, 7) Jew  
- **Minority religion code** → `students.minorityReligionCode`

### (11) Category (coded)
01 SC, 02 ST, 03 VJ(A), 04 NT(B), 05 NT(C), 06 NT(D), 07 OBC, 08 SBC, 09 OPEN, 10 SEBC, 11 EWS  
- **Category code** → `students.categoryCode`

### (12) Divyang (coded)
00 No Handicapped, 01..22 If Divyang Candidate  
- **Divyang code** → `students.divyangCode`

### (13) Medium of instruction (coded)
1 English, 2 Marathi, 3 Gujarati, 4 Kannada, 5 Urdu, 6 Sindhi Arabic, 7 Sindhi Devnagari, 8 Hindi  
- **Medium code** → `students.mediumCode`

### (14) Type of candidate (coded groups A–E)
- **A**: 1) Fresh 2) Repeater → `exam_applications.typeA`
- **B**: 1) Regular 2) Private 3) Isolated 4) Class Improvement → `exam_applications.typeB`
- **C**: 1) Exempted 2) Non Exempted → `exam_applications.typeC`
- **D**: 1) Agriculture 2) Bifocal 3) IT 4) General 5) Home Science → `exam_applications.typeD`
- **E**: Whether foreigner 1) Yes 2) No → `exam_applications.isForeigner`

### (15) Subject Details
Table columns: Sr No, Subjects, Lang of Ans code, (exempted note)
- **Selected subjects + lang code** → `exam_application_subjects` (rows)

### Exempted Subject Information (if exemption claimed)
Columns: Name, Code, Seat No, Month, Year, Marks Obt
- **Exempted subject rows** → `exempted_subject_info` (rows)

### Signatures/Photo placeholders (print-only)
- **Candidate signature box** → print placeholder
- **Candidate photo box** → print placeholder (optional future upload)

## Page 2 — Previous exam + eligibility + reimbursement

### (16) Total No. of Exemption Claimed
- **Total exemptions** → `exam_applications.totalExemptionsClaimed`

### (17) Enrollment Certificate No (Private Candidate)
Fields: month (Feb), year, enrollment no
- **Enrollment month/year/no** → `exam_applications.enrollmentCertMonth`, `enrollmentCertYear`, `enrollmentNo`

### (18) Previous Examination Passing Details
Table: Exam (SSC, XIth), Seat No, Month (Mar/Jul), Year, Name of board / Jr. College
- **Previous exam rows** → `previous_exams` (rows per student)

### (19) Last Exam Seat No (For Repeaters Only)
Fields: month (Feb/Jul), year, seat no
- **Last exam seat info** → `exam_applications.lastExamMonth`, `lastExamYear`, `lastExamSeatNo`

### (20) SSC passed from Maharashtra Board? (Yes/No)
- **SSC Maharashtra** → `exam_applications.sscPassedFromMaharashtra`

### (21) Eligibility Certificate issued by Divisional board? (Yes/No + certificate no)
- **Eligibility issued** → `exam_applications.eligibilityCertIssued`
- **Certificate no** → `exam_applications.eligibilityCertNo`

### (22) Fee reimbursement (drought prone areas)
A) Revenue Circle And Village  
B) Account No of Student/parent  
C) IFSC CODE  
D) Account Holder (Own/Father/Mother/Other Parent)
- **Reimbursement block** → `fee_reimbursement`

