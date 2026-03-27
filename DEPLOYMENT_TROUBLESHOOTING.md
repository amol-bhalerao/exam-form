# deployment Troubleshooting & Manual Steps

## Current Status
✅ **Backend Code**: Optimized and tested locally (commit: c4e2256)
✅ **SSH Key**: Generated and added to Hostinger  
❌ **Automated Deployment**: Hostinger SSH server has channel operation issues

## SSH Key Details
**Public Key**: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOnNmPgzrSii2+hn2hX/4fLwRLPgni5JLtH/O/sOOdVN`
**Private Key Location**: `~/.ssh/hostinger`  
**Hostinger Status**: ✅ Added and recognized (see Hostinger Control Panel)

## Manual Deployment Instructions

### Option 1: Via Hostinger cPanel File Manager  
1. Log in to Hostinger Control Panel
2. Go to **Files → File Manager**
3. Navigate to `/home/u441114691/app/` (or `~/app`)
4. Upload these folders from your local `backend/` directory:
   - `src/` (source code)
   - `prisma/` (database config)
5. Upload these files:
   - `package.json` (dependencies list)
   - `.npmrc` (npm configuration)
   - `.prettierrc` (code formatting)
   - `.eslintrc.js` (linting rules)

### Option 2: Via Hostinger Terminal (if available)
1. In Hostinger cPanel, go to **Terminal** or **SSH Terminal**
2. Run these commands:
   ```bash
   cd ~/app
   npm install --production=false
   npx prisma generate
   pm2 restart app
   ```

### Option 3: Automated Script (if SSH issues resolve)
```powershell
npm run deploy:backend
```

## What Needs to Happen on Hostinger
After uploading files, these MUST be run on the server:

```bash
cd ~/app
npm install --production=false         # Install dependencies (including devDependencies)
npx prisma generate                    # Generate Prisma client for Linux
pm2 restart app                        # Restart the Node.js application
```

## Testing After Deployment
```bash
# Test backend is responding
curl https://hsc-exam-form.hisofttechnology.com/api/health

# Should return status 200 with response
```

## Files Ready for Upload
All these files have been optimized and committed to GitHub:
- ✅ `backend/src/` - Source code
- ✅ `backend/prisma/` - Database schema
- ✅ `backend/package.json` - Reorganized dependencies  
- ✅ `backend/.npmrc` - npm optimization
- ✅ `backend/.prettierrc` - Code formatting config
- ✅ `backend/.eslintrc.js` - Linting rules

## If SSH Continues to Have Issues
Contact Hostinger Support and mention:
- SSH key authentication works (handshake successful)
- SSH channel operations fail with "Connection reset" error
- Request to either:
  1. Fix SSH server configuration
  2. Enable direct SCP/SFTP access
  3. Provide alternative deployment method (webhook, git hook, etc.)
