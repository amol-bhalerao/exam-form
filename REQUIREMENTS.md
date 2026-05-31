# HSC Exam Form Management System — Requirements & Implementation

**Stack:** Angular 17 + Node.js/Express + Prisma + MySQL (`hsc_exam_local`)  
**Last updated:** 2026-05-18

---

## 1. Product overview

Multi-tenant Maharashtra HSC Board exam form system with roles:

| Role | Capabilities |
|------|----------------|
| **Super Admin** | Institutes, users, masters, health, payments |
| **Board** | Exams (all-stream), verified applications, reject, bulk print, Excel export |
| **Institute** | View/edit applications, reject, print, teachers, stream-subjects |
| **Student** | Profile, managed students, apply, pay (optional), print after verify |

---

## 2. Database

| File | Purpose |
|------|---------|
| `database/schema.sql` | Full schema (from Prisma) |
| `database/seed.sql` | Demo users, streams, sample institute |
| `database/sync_missing_columns.sql` | Upgrade older DBs |
| `college-data.sql` | 1315 institutes (import separately) |

**Setup:**
```bash
cd backend
npm run db:columns
npm run db:seed-users      # passwords: Admin@123
npm run db:seed-mock       # optional mock exam + application
npm run db:assign-sequences  # backfill institute/board sequence numbers
```

**Demo logins:** `superadmin`, `board`, `institute1`, `student1` / **Admin@123**

---

## 3. Application workflow

```
DRAFT → (student submits) → INSTITUTE_VERIFIED (auto)
  ├── institute reject → REJECTED_BY_INSTITUTE
  └── board reject → REJECTED_BY_BOARD
```

- No manual institute verify step (auto on submit).
- Board lists **institute-verified** applications only; no payment gate for board print.
- Print allowed for board/institute when `INSTITUTE_VERIFIED` or `BOARD_APPROVED`.

---

## 4. Feature checklist

### Done
- [x] JWT auth, RBAC, tenant isolation by `institute_id`
- [x] Student managed profiles + Aadhaar lookup (photo/signature URLs)
- [x] Exam application stepper: Institute → Pre-filled → Personal → Academic → Bank → Subjects → Review
- [x] Subject autocomplete search (code/name)
- [x] Bank details prefill from `fee_reimbursement`
- [x] Institute applications AG Grid (edit, print, reject)
- [x] Board exams: optional stream = **All Streams**
- [x] Board print single + bulk (`/print/board/forms?ids=`)
- [x] Excel/print list with subjects in one cell
- [x] Prisma schema + SQL seed files
- [x] API smoke test: `npm run test:smoke`

### Done (continued)
- [x] Form sequence numbers on print (`INST001-SCI-EXM001-0024` / `SCI-EXM001-000145`)
- [x] `npm run db:assign-sequences` backfill for verified applications
- [x] Super admin overview API + dashboard cards
- [x] College import from `college-data.sql` (Super Admin → Institutes)
- [x] Dev exam fee default `EXAM_FEE_PAISE=0` (production remains ₹500)

### Planned / partial
- [ ] Landing page polish + Google OAuth production config (`GOOGLE_CLIENT_ID`)
- [ ] Platform fee payment gateway production (Cashfree; sandbox mock exists)
- [ ] Teachers CRUD full E2E verification

---

## 5. API smoke test

With backend on port 3000:

```bash
cd backend
npm run test:smoke
```

Tests: health, login, streams, managed students, board exams, institute list.

---

## 6. Key routes (frontend)

| Path | Role |
|------|------|
| `/app/institute/applications` | Institute grid |
| `/app/institute/applications/:id` | Institute edit form |
| `/app/board/applications` | Board verified list |
| `/app/board/exams` | Create exam (All Streams) |
| `/print/board/forms?ids=1,2` | Bulk print |
| `/app/student/applications/:id` | Student exam form |

---

## 7. Environment

- Backend: `backend/.env` → `DATABASE_URL=mysql://root:@localhost:3306/hsc_exam_local`
- Frontend dev: `http://localhost:4200`
- API: `http://localhost:3000/api`

---

## 8. Deployment notes

- Run `npm run db:sync` or `database/schema.sql` on production once.
- Set `BACKEND_URL` for student photo/signature asset URLs.
- Production API: configure `frontend` `environment.prod.ts` via `generate-env.mjs`.

---

## 9. Archived documentation

Previous phase guides (`PHASE_2`–`PHASE_5`, `IMPLEMENTATION_*`, deployment notes) were merged into this file. See git history for originals.
