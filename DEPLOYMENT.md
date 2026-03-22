# Deployment Guide - Hostinger

## Hostinger Setup Details

- **Website**: exam.hisofttechnology.com
- **Database**: u441114691_exam
- **Database User**: u441114691_exam
- **Server**: 127.0.0.1:3306
- **phpMyAdmin**: https://auth-db1234.hstgr.io/index.php?db=u441114691_exam

## Step 1: Prepare Backend for Deployment

Navigate to the backend folder:
```bash
cd backend
```

## Step 2: Configure Environment Variables

Create or update `backend/.env` with Hostinger credentials:

```env
# HOSTINGER PRODUCTION DATABASE
DATABASE_URL="mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam"

# JWT Secrets (generate strong values for production)
JWT_ACCESS_SECRET="your-strong-secret-here"
JWT_REFRESH_SECRET="your-strong-refresh-secret-here"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL_DAYS="7"

# PRODUCTION CORS
CORS_ORIGIN="https://exam.hisofttechnology.com"
```

**Important Notes:**
- Special characters in passwords are URL-encoded: `@` → `%40`
- Keep `.env` file **private** - never commit it to git (already in .gitignore)
- Replace JWT secrets with strong random values

## Step 3: Generate Strong JWT Secrets

Run this in your terminal to generate secure secrets:

```javascript
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'));"
```

Use the generated values in your `.env` file.

## Step 4: Deploy to Hostinger

### Option A: Using Git Import (Recommended)

1. In Hostinger control panel, go to **Node.js** hosting
2. Click **Import Repository**
3. Connect your GitHub repo: `https://github.com/amol-bhalerao/exam-form.git`
4. **Source Root**: Select `backend` folder
5. **Start Command**: `npm start`
6. Click **Deploy**

Hostinger will:
- Clone the repo
- Install dependencies from `backend/package.json`
- Build TypeScript: `npm run build`
- Start the app: `npm start` → `node dist/server.js`

### Option B: Manual Deployment

1. SSH into your Hostinger server
2. Clone the repository:
   ```bash
   git clone https://github.com/amol-bhalerao/exam-form.git
   cd exam-form/backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build TypeScript:
   ```bash
   npm run build
   ```
5. Set up database (first time only):
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. Start the server:
   ```bash
   npm start
   ```

## Step 5: Set Environment Variables in Hostinger

In Hostinger control panel:

1. Go to **Environment Variables** section
2. Add the following:
   - `DATABASE_URL` = `mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam`
   - `JWT_ACCESS_SECRET` = (your strong secret)
   - `JWT_REFRESH_SECRET` = (your strong secret)
   - `CORS_ORIGIN` = `https://exam.hisofttechnology.com`
   - `ACCESS_TOKEN_TTL` = `15m`
   - `REFRESH_TOKEN_TTL_DAYS` = `7`

Or manually in `backend/.env` file on the server.

## Step 6: Verify Deployment

1. Check if the server is running:
   ```
   https://exam.hisofttechnology.com/api/docs
   ```
   (Should show Swagger API documentation)

2. Test a health check endpoint:
   ```bash
   curl https://exam.hisofttechnology.com/api/health
   ```

## Database Access

- **Local development**: http://localhost:3000
- **Hostinger phpmyadmin**: https://auth-db1234.hstgr.io/index.php?db=u441114691_exam
- **Database**: u441114691_exam
- **User**: u441114691_exam
- **Password**: Exam@1234567890

## Troubleshooting

### Server won't start
- Check logs in Hostinger control panel
- Verify DATABASE_URL is correct and password is URL-encoded
- Ensure `npm start` can run: `node dist/server.js`

### Database connection failed
- Verify server address: `127.0.0.1:3306`
- Test credentials in phpMyAdmin
- Check DATABASE_URL format: `mysql://user:password@host:port/database`

### CORS errors
- Update CORS_ORIGIN to your production domain
- For both HTTP and HTTPS, use: `https://exam.hisofttechnology.com`

### Migrations failed
- Run manually: `npm run db:migrate`
- Check Prisma schema: `backend/prisma/schema.prisma`

## Local Development vs Production

| Config | Local | Production |
|--------|-------|-----------|
| DATABASE_URL | mysql://root:@localhost:3306/hsc-exam-form-db | mysql://u441114691_exam:Exam%401234567890@127.0.0.1:3306/u441114691_exam |
| CORS_ORIGIN | http://localhost:4200 | https://exam.hisofttechnology.com |
| JWT Secrets | Can be simple for testing | Must be strong & unique |
| Access | Localhost only | Public internet |

## Database Migrations

After first deployment, you may need to run migrations:

```bash
cd backend
npm run db:migrate  # Apply pending migrations
npm run db:seed    # Load seed data if needed
```

## Useful Commands

```bash
# Build the application
npm run build

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# View logs
npm run lint

# Start production server
npm start
```

## Support

For Hostinger support: https://support.hostinger.com
For database issues: Access phpMyAdmin at https://auth-db1234.hstgr.io/index.php?db=u441114691_exam
