# Database Setup Guide for HSC Exam Form

## Option 1: Using Hostinger's File Manager + phpMyAdmin (Easiest)

1. **Upload backend files to Hostinger** (if not already done):
   - Upload the entire `backend/` folder to `~/domains/hsc-exam-form.hisofttechnology.com/nodejs/`
   - Make sure `.env` file is uploaded with correct database credentials

2. **Run migrations via SSH** (once SSH is enabled):
   ```bash
   ssh u441114691@hsc-exam-form.hisofttechnology.com
   cd ~/domains/hsc-exam-form.hisofttechnology.com/nodejs
   npm install  # If not already installed
   npx prisma migrate deploy
   npm run seed  # Run the seed script
   ```

## Option 2: Using Hostinger Control Panel

1. Go to **phpMyAdmin** in your Hostinger control panel
2. Select database: `u441114691_exam`
3. Click **Import** and upload the migration SQL files from `backend/prisma/migrations/`
4. Execute them in order:
   - First: `20260316185047_init/migration.sql`
   - Then: `20260319085322_add_college_udise/migration.sql`
   - Then: `20260320133520_add_institute_invites/migration.sql`

## Option 3: Manual npm/Node setup on Hostinger

Once backend is deployed to Hostinger:

1. **Install dependencies**:
   ```bash
   cd ~/domains/hsc-exam-form.hisofttechnology.com/nodejs
   npm install
   ```

2. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed the database**:
   ```bash
   npm run seed
   ```

## Expected Seed Data

After seeding, you'll have:

### Test Accounts (all with password: `Password@123`)
- **Superadmin**: `superadmin` (Full system access)
- **Board Admin**: `board` (Board-level access)
- **Institute Admin**: `institute1` (Institute-level access)
- **Student**: `student1` (Student access)

### Test Colleges/Institutes
- Demo Junior College 1 (APPROVED) - Code: INST001
- Demo Junior College 2 (PENDING) - Code: INST002
- 200+ colleges from `college_seed.json` (APPROVED)

### Test Data
- 2 Streams (Science, Commerce)
- 12 Subjects per stream
- Exam configurations ready for testing

## Verification

After setup, verify the database:
1. Check that all tables are created
2. Verify test users exist
3. Test login with: `superadmin / Password@123`

## Troubleshooting

If migrations fail:
- Ensure `.env` file has correct `DATABASE_URL`
- Check database credentials: `u441114691_exam / Exam@1234567890`
- Verify database name is correct: `u441114691_exam`
- Check Hostinger database host (usually `127.0.0.1` or specific Hostinger host)

## Backend package.json Scripts

```json
{
  "scripts": {
    "build": "node node_modules/typescript/bin/tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed with: `npm run seed`
