# Frontend Deployment Guide

## Frontend Build Complete ✅

The Angular frontend has been built successfully and is located at:
```
frontend/dist/exam-form/
```

## How to Upload to Hostinger

### Step 1: Access Hostinger File Manager

1. Login to **Hostinger Control Panel**
2. Go to **File Manager**
3. Navigate to `public_html/` folder

### Step 2: Upload Frontend Files

**Option A: Using File Manager UI**
1. Delete existing files in `public_html/` (keep `.htaccess` if exists)
2. Upload all files from `frontend/dist/exam-form/` to `public_html/`
3. Wait for upload to complete

**Option B: Using SSH (Faster for large files)**
```bash
# SSH to your server
ssh u441114691@exam.hisofttechnology.com

# Navigate to public_html
cd ~/domains/exam.hisofttechnology.com/public_html

# Upload files from your local machine (run from your PC)
scp -r "C:\Users\UT\OneDrive\Desktop\hsc_exam\frontend\dist\exam-form\*" u441114691@exam.hisofttechnology.com:~/domains/exam.hisofttechnology.com/public_html/
```

**Option C: Using FTP**
1. Use an FTP client (FileZilla, Cyberduck, etc.)
2. Connect to: `exam.hisofttechnology.com`
3. Upload folder: `frontend/dist/exam-form/*` to `/public_html/`

### Step 3: Create .htaccess for Angular Routing

Create a file `.htaccess` in `public_html/` with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files, directories, or symlinks
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  
  # Rewrite everything else to index.html
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures Angular routing (client-side navigation) works correctly.

### Step 4: Verify Deployment

Open your browser and navigate to:
```
https://exam.hisofttechnology.com/
```

You should see the login page.

## Test Users Available

All test accounts are pre-configured in the database with password: **`Password@123`**

### Super Admin Account
- **URL**: https://exam.hisofttechnology.com/
- **Username**: `superadmin`
- **Password**: `Password@123`
- **Access**: Full system administration, manage board, institutes, users

### Board User Account
- **URL**: https://exam.hisofttechnology.com/
- **Username**: `board`
- **Password**: `Password@123`
- **Access**: Board management, approve institute applications, manage exams

### Institute User Account
- **URL**: https://exam.hisofttechnology.com/
- **Username**: `institute1`
- **Password**: `Password@123`
- **Institute**: Demo Junior College 1 (APPROVED)
- **Access**: Manage teachers, students, stream-subjects, applications

### Student User Account
- **URL**: https://exam.hisofttechnology.com/
- **Username**: `student1`
- **Password**: `Password@123`
- **Institute**: Demo Junior College 1
- **Access**: View dashboard, create exam applications, download forms

## User Role Hierarchy

```
┌─────────────────────────┐
│   SUPER ADMIN           │ (Full access to everything)
├─────────────────────────┤
│  BOARD MANAGEMENT       │ (Approve/reject institutes & apps)
├─────────────────────────┤
│  INSTITUTE ADMIN        │ (Manage staff, students, exams)
├─────────────────────────┤
│  STUDENTS               │ (Apply for exams, submit forms)
└─────────────────────────┘
```

## Frontend to Backend Connection

The frontend automatically detects the environment:
- **Local**: Connects to `http://localhost:3000/api`
- **Production**: Connects to `https://exam.hisofttechnology.com/api`

This is configured in: `frontend/src/app/core/api.ts`

## Troubleshooting

### Blank Page or 404
- Check that all files were uploaded to `public_html/`
- Verify `.htaccess` is in `public_html/`
- Clear browser cache (Ctrl+Shift+Delete)

### API Errors
- Ensure backend is running on Hostinger
- Check backend `.env` is correctly configured
- Verify CORS_ORIGIN includes `https://exam.hisofttechnology.com`

### Login Not Working
- Confirm backend database has test users
- Check backend is accessible: `https://exam.hisofttechnology.com/api/health`
- Verify JWT secrets in backend `.env`

## Local Development

For local testing, revert the frontend API endpoint:

1. Update `frontend/src/app/core/api.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

2. Run frontend:
```bash
cd frontend
npm start
```

3. Run backend in another terminal:
```bash
cd backend
npm run dev
```

Access at: `http://localhost:4200`

## Adding More Test Users

To add more test users to the database, modify `backend/prisma/seed.ts` and run:

```bash
cd backend
npm run db:seed
```

Example format:
```typescript
await prisma.user.upsert({
  where: { username: 'newuser' },
  update: {},
  create: {
    username: 'newuser',
    passwordHash: await bcrypt.hash('Password@123', 10),
    roleId: boardRole.id,  // or any role
    status: 'ACTIVE',
    email: 'newuser@example.com'
  }
});
```

## File Structure

```
frontend/
├── dist/exam-form/          ← Production build files
│   ├── index.html           ← Main entry point
│   ├── styles-*.css         ← Global styles
│   ├── main-*.js            ← Application code
│   ├── polyfills-*.js       ← Browser compatibility
│   └── assets/              ← Images, fonts, etc
├── src/
│   ├── app/core/api.ts      ← API endpoint config
│   ├── app/core/auth.ts     ← Authentication
│   └── ...
└── .htaccess                ← Apache routing (add to public_html)
```

##Next Steps

1. ✅ Frontend built
2. 📤 Upload frontend to `public_html/`
3. 📝 Create `.htaccess`
4. 🔐 Login with test accounts
5. ✅ Test UI and backend integration

For backend deployment issues, see `DEPLOYMENT.md`
