# Maharashtra HSC Board Exam Form Management (Multi-tenant)

Monorepo:

- `frontend/`: Angular app (Student/Institute/Board/Super Admin portals)
- `backend/`: Node.js + Express API (JWT auth, RBAC, MySQL via Prisma)

## Prerequisites

- Node.js 18+ (recommended 20+)
- MySQL 8+

## Quick start

1) Create a MySQL database (example: `hsc_exam`).

2) Configure backend env.

Create `backend/.env`:

```bash
DATABASE_URL="mysql://root:password@localhost:3306/hsc_exam"
JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL_DAYS="7"
CORS_ORIGIN="http://localhost:4200"
```

3) Install dependencies:

```bash
npm run install:all
```

4) Run migrations + seed:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

5) Start dev servers:

Windows:

```bash
npm run dev:win
```

Other shells:

```bash
npm run dev
```

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

## Seeded demo credentials

- **Super Admin**: `superadmin` / `Password@123`
- **Board Management**: `board` / `Password@123`
- **Institute**: `institute1` / `Password@123`
- **Student**: `student1` / `Password@123`

## Print form

Student print route:

- `http://localhost:4200/student/forms/:id/print`

The print layout is A4 portrait and designed to fit on one page.

