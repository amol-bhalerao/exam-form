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

For backend only:
```bash
cd backend
npm install
```

For full setup (backend + frontend):
```bash
cd backend && npm install
cd ../frontend && npm install
```

4) Run migrations + seed:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

5) Start dev server:

Backend only:
```bash
cd backend
npm run dev
```

- Backend API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api/docs`

(Note: To run frontend locally, navigate to `frontend/` folder and run `ng serve`)

## Hostinger Deployment

This is a monorepo. To deploy on Hostinger:

1. **Clone the repo and navigate to backend:**
   ```bash
   git clone https://github.com/amol-bhalerao/exam-form.git
   cd exam-form/backend
   ```

2. **Or use Hostinger Git Importer:**
   - Select the repo
   - Specify root directory as: `backend` (the backend subfolder)
   - Set Start command to: `npm start`

3. **Environment Variables:**
   Set these in Hostinger environment/config:
   - `DATABASE_URL`: MySQL connection string
   - `JWT_ACCESS_SECRET`: Secure random string
   - `JWT_REFRESH_SECRET`: Secure random string
   - `CORS_ORIGIN`: Your frontend URL

4. **Deployment will automatically:**
   - Run `npm install` in backend folder
   - Build TypeScript to dist/
   - Start server with `node dist/server.js`

## Seeded demo credentials

- **Super Admin**: `superadmin` / `Password@123`
- **Board Management**: `board` / `Password@123`
- **Institute**: `institute1` / `Password@123`
- **Student**: `student1` / `Password@123`

## Print form

Student print route:

- `http://localhost:4200/student/forms/:id/print`

The print layout is A4 portrait and designed to fit on one page.

# exam-form
