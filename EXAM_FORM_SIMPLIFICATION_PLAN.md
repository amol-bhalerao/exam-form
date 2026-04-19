# HSC Exam Form Simplification Plan

## Goal
Use the official blank HSC application form as the source of truth and keep student input minimal while letting the institute or system prefill institute-owned fields.

---

## Field Ownership From Blank HSC Form

| Section | Field | Owner | Source |
|---|---|---|---|
| 1a | Index No | Institute | `Institute.code` |
| 1b | UDISE No | Institute | `Institute.udiseNo` |
| 1c | Student Saral ID | Institute/System | student profile / Saral sync |
| 2a | Application Sr No | System | generated `applicationNo` |
| 2b | Centre No | Board/Institute | institute/board allocation |
| 3 | Student name fields | Student + institute verification | profile/application |
| 4 | Residential address | Student | profile/application |
| 5 | Mobile no | Student | profile/application |
| 6 | Date of birth | Student / verified record | profile |
| 7 | Aadhaar no | Student | profile |
| 8 | Stream | Institute | stream mapping |
| 9 | Gender | Student | profile |
| 10 | Minority / Religion | Student | optional |
| 11 | Category | Student | profile/application |
| 12 | Divyang | Student | optional |
| 13 | Medium of instruction | Institute | institute default or profile |
| 14 | Type of candidate | System/Institute | selected application type |
| 15 | Subject details | Institute + Student | institute mapped subjects |
| 16 | Exemption count | System | derived from selected exemptions |
| 17 | Enrollment certificate no | Private candidate only | student/institute |
| 18 | Previous exam passing details | Repeater / improvement / ATKT | student |
| 19 | Last exam seat no | Repeater / backlog only | student |
| 20 | SSC passed from Maharashtra Board | Student | conditional |
| 21 | Eligibility certificate | Only if applicable | institute/student |
| 22 | Bank / reimbursement details | Student | conditional |

---

## Simplified Student Flow

### 1. Fresh / Regular Candidate
Show only:
- Name, DOB, Aadhaar, mobile, address
- Gender, category, divyang, minority if required
- Stream confirmation
- Subject selection only from institute-mapped subjects
- Medium and answer language should default from institute mapping

Hide or prefill:
- Index No, UDISE No, Centre No, Application Sr No
- Subject list outside institute mapping
- repeater/private-only sections

### 2. Backlog / Repeater / ATKT
Show everything from **Fresh** plus:
- last exam seat number
- previous exam month/year
- previous marks/exemption details only if relevant

### 3. Improvement Candidate
Show:
- last exam details
- only the subjects being improved
- no unnecessary fresh-admission fields

### 4. Private Candidate
Show:
- personal details
- enrollment certificate number
- previous qualification details
- subject selection

---

## UI Rules

1. **Institute-owned values must be read-only** in the student screen.
2. **Subjects should come from institute stream mapping first**.
3. **Answer language should auto-fill and lock** when the institute has fixed it.
4. **Conditional sections must appear only for relevant candidate types**.
5. **Print layout should stay single-page A4** by hiding empty optional sections.

---

## Recommended Implementation Order

1. Super admin sees institute users in a grid.
2. Institute settings shows **Index No** instead of **Institute Code**.
3. Student application edit page auto-fills institute-owned fields and hides irrelevant sections.
4. Print component renders only relevant blocks for the selected candidate type.
