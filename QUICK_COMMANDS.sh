# QUICK COMMAND REFERENCE - Run These on Hostinger Terminal

## Backend Prisma Fix (CRITICAL)

Copy & paste each command one at a time:

```bash
cd ~/app
```

```bash
rm -rf node_modules
```

```bash
npm install --production=false
```

```bash
npx prisma generate
```

```bash
pm2 restart app
```

## Verify It Works

```bash
pm2 status
```
Should show `app` as `online`

```bash
curl https://hsc-exam-form.hisofttechnology.com/api/health
```
Should return JSON with `"ok": true`

```bash
curl https://hsc-exam-form.hisofttechnology.com/api/public/exams
```
Should return 200 with exam data (NOT 500 error)

## Test Login

```bash
curl -X POST https://hsc-exam-form.hisofttechnology.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'
```

Should return token and user object.

## View Logs

```bash
pm2 logs app
```

Shows real-time logs. Press Ctrl+C to exit.

## Restart Backend (if needed)

```bash
pm2 restart app
```

## Kill & Restart Everything

```bash
pm2 stop app
pm2 start app
```
