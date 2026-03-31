# Database Synchronization & Migration Guide

## Overview

This guide explains how to synchronize changes between local and production databases, and how to manage database migrations.

---

## Database Sync Architecture

### Two Environments

1. **Local Database** (`hsc_exam_dev`)
   - Used for development and testing
   - Located at `localhost:3306`
   - Connection: `mysql://root:@localhost:3306/hsc_exam_dev`

2. **Production Database** (Hostinger)
   - Live customer data
   - Remote server
   - Connection: Defined in production `.env`

### How Changes Flow

```
Local Development
    ↓
Make schema changes in Prisma schema.prisma
    ↓
Test locally with `npm run db:push`
    ↓
Verify data integrity with API endpoints
    ↓
Export data using migration APIs
    ↓
Apply same schema changes to production
    ↓
Sync data using backup/restore
    ↓
Production Running
```

---

## Managing Schema Changes

### Step 1: Make Changes Only in Prisma Schema

**File**: `backend/prisma/schema.prisma`

```prisma
// Example: Add new field to user
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String?
  // Add new field:
  phone     String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Step 2: Test Locally

```bash
cd backend
npm run db:push
```

This command:
- Generates Prisma client
- Detects schema changes
- Applies changes to local database
- **Does NOT create migration files** (safe for dev)

### Step 3: Test with Your Code

```bash
npm run dev  # Start dev server
# Test new features manually or with npm run test
```

### Step 4: Sync to Production

#### Option A: Using Production Server Shell (Hostinger cPanel)

1. Login to Hostinger cPanel
2. Open "Terminal" or SSH
3. Navigate to backend directory
4. Run:
   ```bash
   npm run db:push
   ```
   This applies the same schema change to production database

#### Option B: Using Migration Export API

```bash
# Export current schema state
curl http://localhost:3000/api/migrations/schema/info \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

---

## Syncing Data Between Databases

### Check Database Status

**Verify both databases have same structure:**

```bash
# Local status
curl http://localhost:3000/api/migrations/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# This returns table names and row counts
{
  "database": "hsc_exam_dev",
  "tables": {
    "users": 10,
    "institutes": 2,
    "students": 5,
    "teachers": 15
  },
  "totalRecords": 32
}
```

### Export Data for Backup

```bash
# Export single table
curl http://localhost:3000/api/migrations/export/institutes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > institutes.json

# Export all users
curl http://localhost:3000/api/migrations/export/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > users.json
```

### Sync Institutes Data

If you add/edit institutes locally and want to sync to production:

```bash
# 1. Get list of institutes in local
curl http://localhost:3000/api/migrations/sync/institutes \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Compare with production institutes
# (same endpoint on production server)

# 3. Manually apply changes on production or use data migration API
```

---

## Typical Workflows

### Workflow 1: Add New Field to Existing Table

```bash
# 1. Edit schema.prisma
nano backend/prisma/schema.prisma
# Add your field, save, exit

# 2. Apply to local database
cd backend
npm run db:push
# You'll see: "✓ Synchronized 1 file in 100ms"

# 3. Test locally
npm run dev
curl http://localhost:3000/api/health  # Verify working

# 4. Login to Hostinger
ssh user@server.com
cd public_html/backend

# 5. Apply to production
npm run db:push

# 6. Verify production
# Use Hostinger cPanel MySQL tool or remote connection
```

### Workflow 2: Add New Table

Same as above, but ensure:
1. Define complete model in schema.prisma
2. All relationships are correct
3. Primary keys and unique constraints are set
4. Default values are appropriate

### Workflow 3: Modify Data Types

```prisma
// Before
email String?

// After
email String  // Make required
```

Then:
```bash
npm run db:push
# Prisma will show: "⚠ Possible data loss - some rows might be empty in email field"
# Review the changes, then continue

npm run db:push --force  # Force apply if you're sure
```

### Workflow 4: Rename Field (Careful!)

```prisma
// This won't auto-rename in DB, it creates a new field
// Instead, use raw SQL or:

// 1. Create new field in schema
email_new String?

// 2. npm run db:push

// 3. Migrate data: UPDATE users SET email_new = email;

// 4. Drop old field from schema

// 5. npm run db:push again
```

---

## Verification APIs

### Get Database Info

```bash
curl http://localhost:3000/api/migrations/schema/info \
  -H "Authorization: Bearer TOKEN"

Response:
{
  "database": "hsc_exam_dev",
  "tables": [
    { "TABLE_NAME": "users", "row_count": 10 },
    { "TABLE_NAME": "institutes", "row_count": 2 }
  ],
  "environment": "development",
  "timestamp": "2026-03-31T..."
}
```

### Verify DB Connectivity

```bash
curl -X POST http://localhost:3000/api/migrations/verify \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

Response:
{
  "status": "CONNECTED",
  "database": "hsc_exam_dev",
  "mysqlVersion": "8.0.28",
  "tableCount": 12,
  "timestamp": "2026-03-31T..."
}
```

### Check Institutes With Data Counts

```bash
curl http://localhost:3000/api/migrations/sync/institutes \
  -H "Authorization: Bearer TOKEN"

Response:
{
  "database": "hsc_exam_dev",
  "totalInstitutes": 2,
  "institutes": [
    {
      "id": 1,
      "name": "Institute A",
      "code": "INSTA",
      "status": "APPROVED",
      "users": 2,
      "students": 10,
      "teachers": 15
    }
  ]
}
```

---

## Important Notes

### DO's ✅
- Always test schema changes locally first
- Export data before major changes
- Keep local database in sync with production structure
- Document any custom SQL changes
- Version control your schema.prisma changes

### DON'Ts ❌
- Never run migrations on production without testing locally
- Don't drop tables without backup
- Don't modify production data structures during business hours
- Don't skip db:push - use it to detect conflicts early
- Don't edit migration files manually

---

## Troubleshooting

### "Prisma Client not generated"
```bash
npm run db:generate
npm run build
```

### "Cannot connect to database"
```bash
# Check .env file has DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npm run migrations/verify
```

### "Migration failed on production"
```bash
# Login to production server
# Check error logs
cat /var/log/npm-errors.log

# Try again
npm run db:push

# If stuck, restore from backup and retry
```

### "Data not syncing between local and prod"
```bash
# 1. Check database structures are same
curl http://localhost:3000/api/migrations/schema/info
curl https://production-server/api/migrations/schema/info

# 2. Export and compare data
curl http://localhost:3000/api/migrations/export/TABLE_NAME > local.json
curl https://production/api/migrations/export/TABLE_NAME > prod.json

# 3. Compare files
diff local.json prod.json

# 4. Manual sync if needed using exports
```

---

## Environment-Specific Connections

### Development (.env.development)
```
NODE_ENV=development
DATABASE_URL=mysql://root:@localhost:3306/hsc_exam_dev
```

### Production (.env.production)
```
NODE_ENV=production
DATABASE_URL=mysql://user:password@server:3306/database_name
```

---

## Commands Quick Reference

```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Apply schema changes to current database
npm run db:push

# Open Prisma Studio (visual DB editor)
npm run db:studio

# View database schema info
curl http://localhost:3000/api/migrations/schema/info \
  -H "Authorization: Bearer TOKEN"

# Get sync status (table counts)
curl http://localhost:3000/api/migrations/sync/status \
  -H "Authorization: Bearer TOKEN"

# Export table data
curl http://localhost:3000/api/migrations/export/TABLE_NAME \
  -H "Authorization: Bearer TOKEN"

# Check database connectivity
curl -X POST http://localhost:3000/api/migrations/verify \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

---

## Best Practices

1. **Test Locally First**
   - Make schema change
   - Run `npm run db:push`
   - Test with your code
   - Verify no data loss

2. **Backup Before Production**
   - Export data using API
   - Save `.json` files
   - Store in version control

3. **Apply Same Changes to Prod**
   - Same schema changes
   - SSH into production
   - Run `npm run db:push`
   - Verify with API endpoints

4. **Monitor After Sync**
   - Check table counts match
   - Verify data integrity
   - Run full test suite
   - Monitor error logs

5. **Document Changes**
   - Add comments to schema.prisma
   - Log what changed and why
   - Keep git commits clear

---

## When Both Databases Are In Sync

You can confidently:
✅ Make changes to code
✅ Deploy new features
✅ Scale to more users
✅ Add new institutes/students
✅ Migrate data safely
✅ Support production issues

Your databases are synchronized if:
- Table counts match (from `/sync/status`)
- Schema structures identical (compare with `/schema/info`)
- No pending changes shown in `npm run db:push`
