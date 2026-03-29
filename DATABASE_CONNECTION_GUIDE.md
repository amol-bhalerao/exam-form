# 🗄️ Database Connection Setup Guide

## Current Configuration

**Database:** `u441114691_exam`  
**User:** `u441114691_exam`  
**Host:** Hostinger (via SSH tunnel)  
**SSH Host:** `45.130.228.77:65002`  
**Connection Method:** SSH Tunnel to localhost:3307

---

## Connection Setup

### Files Updated:
- ✅ `.env` - Production database URL
- ✅ `.env.development` - Development database URL (points to production for testing)
- ✅ `ssh-tunnel.ps1` - SSH tunnel script

### Connection String:
```
mysql://u441114691_exam:ExamHSC1234567890@localhost:3307/u441114691_exam
```

---

## How to Connect

### Step 1: Start the SSH Tunnel

Open a new PowerShell terminal and run:

```powershell
cd "c:\Users\UT\OneDrive\Desktop\hsc_exam"
powershell .\ssh-tunnel.ps1
```

**Keep this terminal open while working!** The tunnel must stay active.

You'll see output like:
```
🔐 Starting SSH Tunnel to Hostinger MySQL...
Tunnel is now active. Use this connection string:
mysql://u441114691_exam:ExamHSC1234567890@localhost:3307/u441114691_exam
```

### Step 2: Test Connection

In another PowerShell terminal:

```powershell
cd backend
npx prisma db push --skip-generate
```

---

## Troubleshooting

### Error: "Unknown authentication plugin `sha256_password'"
**This means:** The MySQL user on Hostinger uses an authentication method Prisma doesn't support.

**Fix:** Change the authentication plugin in Hostinger:
1. cPanel → Databases → MySQL Databases
2. Click user `u441114691_exam`
3. Click "Change Password"
4. Look for "Authentication Plugin" setting
5. Change to **mysql_native_password** or **caching_sha2_password**
6. Set password: `ExamHSC1234567890`
7. Save

### Error: "SSH: Can't connect to server at 45.130.228.77"
**This means:** SSH connection failed. Check:
- SSH host: `45.130.228.77`
- SSH port: `65002`
- SSH user: `u441114691` (your Hostinger username)
- Your SSH key is authorized in Hostinger

### Error: "Connection refused on localhost:3307"
**This means:** SSH tunnel isn't running. Make sure:
- You ran `powershell .\ssh-tunnel.ps1` in step 1
- The terminal is still open (don't close it)
- Wait 2-3 seconds for tunnel to establish

---

## Development Workflow

### Start Development Servers:

**Terminal 1 - SSH Tunnel (ALWAYS FIRST):**
```powershell
cd "c:\Users\UT\OneDrive\Desktop\hsc_exam"
powershell .\ssh-tunnel.ps1
```

**Terminal 2 - Backend:**
```powershell
cd backend
npm install
npm run dev
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm install
npm run start
```

---

## Environment Variables

Both `.env` and `.env.development` are configured to use the same production database via SSH tunnel.

**For local-only database** (if you want to disconnect from production):
- Edit `.env.development`
- Change DATABASE_URL to local MySQL: `mysql://root:@localhost:3306/hsc_exam_local`
- Don't run SSH tunnel

---

## Testing the Connection

Once connected, verify with:

```powershell
# In backend directory
npx prisma db push --skip-generate
npx prisma studio  # Opens interactive database viewer
```

You should see your production database schema and be able to browse tables!

