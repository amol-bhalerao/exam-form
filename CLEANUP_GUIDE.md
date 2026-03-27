# Files & Code to Remove/Cleanup for Production

## 📦 Files to Remove Before Deployment

### Root Directory - Delete These Files

These are development guides and test files that shouldn't be in production:

```bash
# Navigation: cd /home/u441114691/public_html/hsc-exam

# Remove development documentation (keep only README.md for reference)
rm -f API_TEST_REPORT.md
rm -f CASHFREE_INTEGRATION_GUIDE.md
rm -f IMPLEMENTATION_GUIDE.md
rm -f IMPLEMENTATION_SUMMARY.md
rm -f QUICK_START.md
rm -f STUDENT_PROFILE_GOOGLE_GUIDE.md
rm -f TESTING_GUIDE.md
rm -f UNIT_TESTING_GUIDE.md
rm -f END_TO_END_TESTING_GUIDE.md
rm -f POSTMAN_GUIDE.md
rm -f PRODUCTION_DEPLOYMENT_CHECKLIST.md
rm -f PROJECT_STATUS.md

# Remove development scripts
rm -f test-apis.ps1
rm -f test-apis-comprehensive.ps1
rm -f fix-frontend.ps1

# Remove Postman collections (use API documentation instead)
rm -f hsc-exam-api.postman_collection.json
rm -f hsc-exam-local.postman_environment.json
rm -f hsc-exam-production.postman_environment.json

# Remove old deployment templates
rm -f HOSTINGER_ENV_TEMPLATE.txt

# Remove database seed files (if data is already seeded)
rm -rf database/
rm -rf "requirement docs/"

# Remove git history for smaller deployment
# rm -rf .git
```

### Backend - Clean Development Dependencies

```bash
cd backend

# Remove test files and dev tools
find . -name "*.test.js" -delete
find . -name "*.spec.js" -delete
find . -name "__tests__" -type d -exec rm -rf {} \; 2>/dev/null

# Keep only production dependencies
npm prune --production

# Remove unnecessary documentation
rm -f *.md  # Keep only if needed

# Clean Prisma cache
rm -rf .prisma
```

### Frontend - Optimize Build Size

```bash
cd ../frontend

# Remove node_modules (will be reinstalled from package-lock.json)
rm -rf node_modules

# Remove test files
find . -name "*.spec.ts" -delete
find . -name ".karma.conf.js" | xargs rm -f

# Build for production (smaller, minified)
npm install --production
npm run build

# Remove frontend source code after build (optional - decreases deployment size)
# rm -rf src/

# Remove only the dist folder will be served
```

### Database Directory - Cleanup

```bash
# If seed files are no longer needed
rm -f backend/prisma/seed_hsc_exam_form_db.sql
rm -f backend/prisma/seed_data.sql
rm -f backend/prisma/simple_seed.sql
# Keep: migration files and schema.prisma as they're needed for updates

# Keep college_seed.json for future reference only
```

### Environment Files - Setup Production Only

```bash
# Development environment files to remove
rm -f .env                          # Remove local dev env
rm -f .env.development              # Remove dev-specific vars
rm -f .env.development.local        # Remove local overrides

# Keep only:
# .env.production - Update with actual values before deployment
```

---

## 🧹 Code Cleanup & Optimization

### Remove Unused Code

1. **Remove test routes** in `backend/src/routes/`
   - Look for any routes marked as "test", "debug", "temp"
   - Check for mock data endpoints

2. **Remove console.log statements** (unless critical for monitoring)
   ```bash
   # Find debug logs
   grep -r "console.log" backend/src/ | grep -v "error\|warn\|info"
   ```

3. **Remove unused middleware** (remove from server.js if not used)
   - Commented middleware
   - Old authentication attempts
   - Test-only middleware

4. **Remove unused routes** from `backend/src/swagger.js`
   - Old API endpoints
   - Test endpoints

### Compress frontend assets

```bash
cd frontend/dist/browser

# Compress images (if not already done by build)
find . -name "*.png" -o -name "*.jpg" | xargs -I {} sh -c 'echo "Compressing {}"'

# Check sizes
du -sh .
du -sh ../
```

---

## 📋 Deployment Cleanup Checklist

- [ ] Run `npm prune --production` in backend after npm install
- [ ] Remove all .env.development.* files
- [ ] Delete test files and spec files
- [ ] Remove development documentation files
- [ ] Remove Postman collections (not needed in production)
- [ ] Remove test scripts (*.ps1, *.sh test files)
- [ ] Ensure database is empty of seed data (keep only schema)
- [ ] Remove node_modules from version control
- [ ] Verify `dist/` folders are gitignored
- [ ] Check `.gitignore` includes node_modules, dist/, .env*
- [ ] Set .env.production as restricted file (chmod 600)
- [ ] Remove git history if storage is limited: `git gc --aggressive`

---

## 🔍 Files to Keep for Production

### Must Keep
```
.env.production          - Production environment variables
backend/src/            - All source code
backend/prisma/         - Schema and migrations
frontend/dist/          - Built Angular application
ecosystem.config.cjs    - PM2 configuration
package.json            - Dependencies list
package-lock.json       - Locked dependencies
```

### Good to Keep
```
README.md                       - Basic project documentation
DEPLOYMENT.md                   - Deployment information
FRONTEND_DEPLOYMENT.md          - Frontend deployment steps
PRODUCTION_DEPLOYMENT_GUIDE.md  - Detailed production guide
HOSTINGER_PRODUCTION_SETUP.md   - Hostinger-specific guide
ENV_VARIABLES_GUIDE.md          - Environment variable reference
database/db_schema.sql          - Database schema backup (read-only)
```

### Can Remove Safely
```
All .md files except listed above
All *.ps1 and *.sh test scripts
All Postman files
All "requirement" directories
All test/spec files
.git directory (clone fresh if needed)
node_modules (regenerated from package-lock.json)
```

---

## 🚀 Automated Cleanup Script

Run this one-liner to automate most of the cleanup:

```bash
#!/bin/bash

# Navigate to project root
cd /home/u441114691/public_html/hsc-exam

# Remove documentation files
rm -f API_TEST_REPORT.md IMPLEMENTATION_GUIDE.md QUICK_START.md \
      STUDENT_PROFILE_GOOGLE_GUIDE.md TESTING_GUIDE.md UNIT_TESTING_GUIDE.md \
      END_TO_END_TESTING_GUIDE.md POSTMAN_GUIDE.md PRODUCTION_DEPLOYMENT_CHECKLIST.md \
      PROJECT_STATUS.md CASHFREE_INTEGRATION_GUIDE.md IMPLEMENTATION_SUMMARY.md

# Remove test files and scripts
rm -f test-apis.ps1 test-apis-comprehensive.ps1 fix-frontend.ps1 \
      hsc-exam-*.postman_collection.json hsc-exam-*.postman_environment.json \
      HOSTINGER_ENV_TEMPLATE.txt

# Remove unnecessary directories
rm -rf "requirement docs/" database/

# Clean backend
cd backend
find . -name "*.spec.js" -o -name "*.test.js" | xargs rm -f
npm prune --production
rm -rf .prisma .env .env.development*
cd ..

# Clean frontend
cd frontend
find . -name "*.spec.ts" | xargs rm -f
rm -rf node_modules
npm install --production
npm run build
cd ..

# Set production env file permissions
chmod 600 backend/.env.production

echo "✓ Cleanup complete!"
```

---

## 💾 Total Size Reduction

Typical size reduction from cleanup:
- **Before**: ~400-500 MB (with all docs, node_modules, test files)
- **After**: ~50-80 MB (production minimal setup)
- **Hosting**: Should be under 100 MB total after compression

This significantly reduces deployment time on Hostinger!
