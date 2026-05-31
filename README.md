# HSC Exam Form Management System

Angular + Node.js + MySQL application for Maharashtra HSC board exam forms.

## Quick start

```bash
# Backend
cd backend
npm install
npm run db:columns
npm run db:seed-users
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run start
```

- App: http://localhost:4200  
- API: http://localhost:3000/api  
- Login: `student1` / `Admin@123` (also `board`, `institute1`, `superadmin`)

## Documentation

See **[REQUIREMENTS.md](./REQUIREMENTS.md)** for full requirements, workflow, database setup, and feature status.

## Scripts

| Command | Where | Purpose |
|---------|-------|---------|
| `npm run db:seed-users` | backend | Demo users (Admin@123) |
| `npm run db:seed-mock` | backend | Mock exam + verified application |
| `npm run test:smoke` | backend | API smoke test |
| `npm run test:flow` | backend | Flow tests (needs submitted app) |
