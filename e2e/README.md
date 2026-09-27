# Tests

| Suite | Where | Needs | Command |
|---|---|---|---|
| Backend unit | `backend/tests/unit`, `*.unit.test.js`, `tests/node` | nothing | `cd backend && npm run test:unit` |
| Backend API | `backend/tests/api` | running backend + MySQL | `cd backend && npm run test:api` |
| Frontend unit | `frontend/src/**/*.spec.ts` | Chrome | `cd frontend && npm run test:ci` |
| End-to-end | `e2e/tests` | backend + MySQL + built frontend | `cd e2e && npx playwright test` |

API and end-to-end suites are skipped automatically when no backend is reachable.

## One-time setup for API and end-to-end tests

1. **MySQL** – any local MySQL 8 works. With Docker:
   ```
   docker compose -f e2e/docker-compose.yml up -d
   ```
2. **Backend environment** – create `backend/.env.development`:
   ```
   DATABASE_URL="mysql://root:root@127.0.0.1:3306/hsc_exam_local"
   ```
3. **Schema and seed data** (from `backend/`, with `NODE_ENV=development`):
   ```
   npx prisma db push
   node scripts/sync-db-columns.mjs
   mysql -uroot -proot hsc_exam_local < ../database/seed.sql
   npm run db:seed-users
   npm run db:seed-mock
   ```
   This creates `superadmin`, `board`, `institute1` and `student1` (password `Admin@123`) and one mock application.
4. **Frontend build** (from `frontend/`): `npx ng build --configuration development`
5. **Browsers** (from `e2e/`, first time only): `npm install && npx playwright install chromium`

## Running

```
cd backend && npm start          # or let Playwright start it
cd e2e && npx playwright test     # desktop + phone (@responsive tests)
npx playwright show-report        # HTML report with traces for failures
```

Never point these tests at the production database: they log in as the seeded
users and change their language preference.
