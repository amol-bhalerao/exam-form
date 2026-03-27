# Architecture & Configuration Visual Guide

## Current Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       INTERNET / USERS                          │
│                                                                   │
│            https://hsc-exam-form.hisofttechnology.com           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTPS (SSL/TLS)
                             │
        ┌────────────────────▼────────────────────────┐
        │   HOSTINGER cPanel (Reverse Proxy/Router)   │
        │         45.130.228.77:65002                 │
        └────────────┬─────────────────┬──────────────┘
                     │                 │
        ┌────────────▼──────┐  ┌──────▼──────────────┐
        │   Frontend Route  │  │   Backend Route    │
        │   (/)             │  │   (/api/*)         │
        │                   │  │                    │
        └────────────┬──────┘  └──────┬──────────────┘
                     │                │
        ┌────────────▼──────┐  ┌──────▼──────────────┐
        │ Angular Frontend  │  │  Node.js Backend   │
        │ (Already Deployed)│  │  (Port 5000)       │
        │ /app/frontend/    │  │  (Running via PM2) │
        │ - index.html      │  │  /app/backend/     │
        │ - main-*.js       │  │ - Express.js       │
        │ - styles-*.css    │  │ - Prisma ORM       │
        │ - assets/         │  │                    │
        └───────────────────┘  └──────┬──────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  MySQL Database    │
                           │  (127.0.0.1:3306)  │
                           │  u441114691_exam   │
                           └────────────────────┘
```

---

## Configuration Steps Flow

```
START
  │
  ├─► Step 1: Access cPanel
  │      └─► Login to hostinger.com → Manage → cPanel
  │
  ├─► Step 2: Configure Reverse Proxy
  │      └─► Set /api/* → http://127.0.0.1:5000/api/
  │
  ├─► Step 3: Set Document Root
  │      └─► Point domain to /home/u441114691/app/frontend
  │
  ├─► Step 4: Configure DNS
  │      └─► Ensure A record points to 45.130.228.77
  │
  ├─► Step 5: Enable SSL/HTTPS
  │      └─► AutoSSL → Install Let's Encrypt Certificate
  │
  └─► Step 6: Test Everything
         └─► Verify API health, Frontend loads, All endpoints working
            
  │
  ▼
SUCCESS! ✅ 
Your HSC Exam system is live in production!
```

---

## File Structure on Hostinger Server

```
/home/u441114691/
├── app/
│   ├── frontend/                    ← Document Root Points Here
│   │   ├── index.html              ← Angular entry point
│   │   ├── main-XXXXX.js           ← Your Angular app bundle
│   │   ├── polyfills-XXXXX.js      ← Angular polyfills
│   │   ├── styles-XXXXX.css        ← Compiled SCSS
│   │   └── assets/                 ← Images, icons, etc.
│   │
│   └── backend/                     ← Node.js backend
│       ├── src/
│       │   ├── server.js           ← Express server (PM2 runs this)
│       │   ├── routes/             ← API routes
│       │   │   ├── auth.js
│       │   │   ├── applications.js
│       │   │   ├── exams.js
│       │   │   └── ...
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── env.js
│       ├── prisma/
│       │   ├── schema.prisma       ← Database schema
│       │   └── migrations/         ← Database migrations
│       ├── package.json
│       ├── .env                    ← Secrets (DATABASE_URL, JWT keys, etc.)
│       └── node_modules/           ← Dependencies (NEVER uploaded)
│
└── .pm2/logs/
    └── app-*.log                   ← Application logs
```

---

## Request Flow Examples

### Example 1: User Visit Frontend

```
User Action: Opens https://hsc-exam-form.hisofttechnology.com

Request Path: GET /
           ↓
cPanel Reverse Proxy: "This is /, not /api, so serve from frontend"
           ↓
Serve: /home/u441114691/app/frontend/index.html
           ↓
Browser loads: Angular application with login form
           ↓
User sees: HSC Exam login page ✅
```

### Example 2: User Login (API Call)

```
User Action: Clicks login, submits: POST /api/auth/login

Request: {"email": "student@example.com", "password": "..."}
           ↓
cPanel Reverse Proxy: "This is /api, forward to backend on port 5000"
           ↓
Node.js Backend (Port 5000):
  - Express receives POST /api/auth/login
  - auth.js route handler processes request
  - Prisma queries MySQL database
  - JWT token generated
           ↓
Response: {"accessToken": "...", "user": {...}}
           ↓
Browser receives: Token stored in local storage
           ↓
User is logged in: Redirected to dashboard ✅
```

### Example 3: Get Colleges (Public Endpoint)

```
User Action: App loads, needs college list

Request: GET /api/public/colleges
           ↓
cPanel Reverse Proxy: Forward to localhost:5000
           ↓
Node.js Backend:
  - Express receives GET /api/public/colleges
  - public.js route handler processes
  - Prisma queries: SELECT * FROM colleges
  - Returns JSON array
           ↓
Response: 
[
  {"id": 1, "name": "St. Xavier's College", ...},
  {"id": 2, "name": "IIT Mumbai", ...},
  ...
]
           ↓
Frontend displays: College dropdown populated ✅
```

---

## Port Usage Explanation

| Port | Service | Purpose | Notes |
|------|---------|---------|-------|
| **65002** | SSH | Access your server remotely | Used for deployments |
| **5000** | Node.js Backend | Express API server | Only locally accessible (127.0.0.1:5000) |
| **3306** | MySQL | Database server | Only locally accessible |
| **443** | HTTPS | Secure web traffic | Public, from reverse proxy |
| **80** | HTTP | Regular web traffic | Auto-redirects to 443 (HTTPS) |

---

## Common Settings Reference

### Reverse Proxy Configuration

**Option 1: Using Hostinger Reverse Proxy Manager**
```
Source URL: /api/
Destination: http://127.0.0.1:5000/api/
```

**Option 2: Using .htaccess (More Common)**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]
</IfModule>
```

### Document Root Setting
```
Current: /public_html
Change to: /home/u441114691/app/frontend
```

### DNS A Record
```
Type: A
Name: hsc-exam-form.hisofttechnology.com (or @)
Address: 45.130.228.77
TTL: 3600 (or automatic)
```

---

## Verification Checklist

After configuration, verify each item:

### 1. Frontend Accessibility
```
Test: Open https://hsc-exam-form.hisofttechnology.com in browser
Expected: See HSC Exam login form
Status: ☐ Working / ☐ Not Working
```

### 2. API Health Check
```
Test: https://hsc-exam-form.hisofttechnology.com/api/health
Expected: Returns JSON response
Status: ☐ JSON / ☐ Still HTML (means reverse proxy not working)
```

### 3. Public Data Endpoints
```
Test: https://hsc-exam-form.hisofttechnology.com/api/public/colleges
Expected: JSON array with colleges
Status: ☐ Working / ☐ 404 / ☐ Still HTML
```

### 4. SSL Certificate
```
Browser: Check lock icon 🔒 in address bar
Test: https:// (green) vs http:// (should redirect)
Status: ☐ Secure / ☐ Warning / ☐ Not secure
```

### 5. Backend Logs
```
SSH into server and run:
pm2 logs
Expected: See application startup messages, no errors
Status: ☐ Running / ☐ Errors visible
```

---

## If Something Doesn't Work

### Step 1: Check What's Actually Happening
```bash
# SSH to server and check:
curl http://127.0.0.1:5000/api/health    # Direct backend test
curl https://hsc-exam-form.hisofttechnology.com/api/health  # Via proxy
```

### Step 2: Verify Configuration
```
Is /api going to port 5000?     ☐ Yes / ☐ No
Is document root /app/frontend? ☐ Yes / ☐ No
Is SSL enabled?                 ☐ Yes / ☐ No
Is backend running?             pm2 status → Shows "online"? ☐ Yes / ☐ No
```

### Step 3: Check Logs
```bash
# Backend logs (on server):
pm2 logs

# Frontend errors (in browser):
F12 → Console → Look for red errors

# cPanel logs:
/home/u441114691/public_html/error_log
```

---

## Support Resources

| Resource | Link |
|----------|------|
| **Hostinger Help** | https://support.hostinger.com |
| **cPanel Documentation** | https://documentation.cpanel.net |
| **Let's Encrypt Info** | https://letsencrypt.org |
| **Node.js on Hostinger** | https://support.hostinger.com/en/articles/360000479652 |

---

**You're almost there! Once you complete these configuration steps, your HSC Exam system will be fully operational in production!** 🚀

