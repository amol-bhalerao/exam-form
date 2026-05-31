# Database setup (phpMyAdmin / MySQL)

See also **[../REQUIREMENTS.md](../REQUIREMENTS.md)** for full project requirements.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Full `CREATE TABLE` schema (generated from Prisma; default DB: `hsc_exam_local`) |
| `sync_missing_columns.sql` | Upgrade an older DB (adds `streams.shortCode`, etc.) |
| `seed.sql` | Roles, demo users, streams, sample subjects |
| `../college-data.sql` | **1315 institutes** from Excel (run after `seed.sql`) |

## Order to run in phpMyAdmin

1. `schema.sql` — on a **new** database only, OR run `sync_missing_columns.sql` on existing DB
2. `seed.sql` — demo logins
3. `college-data.sql` — all colleges (large file, may take a minute)

Or from project root (recommended):

```bash
cd backend
npm run db:sync
node scripts/seed-users.mjs
```

## Demo logins (password: **Admin@123**)

| Role | Username |
|------|----------|
| Super Admin | `superadmin` |
| Board | `board` |
| Institute | `institute1` |
| Student | `student1` |

Also: `board_demo` / `Board@12345` if created via `npm run seed:board-user`
