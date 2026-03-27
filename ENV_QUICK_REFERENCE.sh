#!/bin/bash
# Quick Environment Variables Reference
# Copy and customize these values for your .env.production

# ═════════════════════════════════════════════════════════════════════════════
# HOSTINGER SPECIFIC SETUP
# ═════════════════════════════════════════════════════════════════════════════

# Your Hostinger SSH Details (for reference)
# Host: 45.130.228.77
# Port: 65002
# Username: u441114691
# Command: ssh -p 65002 u441114691@45.130.228.77

# ═════════════════════════════════════════════════════════════════════════════
# BACKEND .env.production - COPY THIS TO backend/.env.production
# ═════════════════════════════════════════════════════════════════════════════

NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# 📝 DATABASE - Update with Hostinger MySQL credentials
DATABASE_URL=mysql://hsc_exam_prod_user:YOUR_STRONG_PASSWORD@localhost:3306/hsc_exam_prod

# 📝 GOOGLE OAUTH - Get from https://console.cloud.google.com
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_STRING
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# 📝 JWT SECRETS - Generate with: openssl rand -hex 32
JWT_SECRET=GENERATE_THIS_WITH_OPENSSL_RAND_HEX_32
JWT_REFRESH_SECRET=GENERATE_THIS_WITH_OPENSSL_RAND_HEX_32
JWT_EXPIRES_IN=7
JWT_REFRESH_EXPIRES_IN=30

# 📝 CASHFREE - Get from https://dashboard.cashfree.com
CASHFREE_API_KEY=YOUR_CASHFREE_API_KEY
CASHFREE_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY
CASHFREE_MODE=PROD

# 📝 EMAIL - Update with your email addresses
ADMIN_EMAIL=admin@your-company.com
NOTIFICATION_EMAIL=no-reply@your-company.com
SUPPORT_EMAIL=support@your-company.com

# Optional: SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=no-reply@your-domain.com

# Logging
LOG_LEVEL=info
LOG_REQUEST_BODIES=false
LOG_RESPONSE_BODIES=false

# Security & CORS
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_PAYMENT_GATEWAY=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STUDENT_SELF_REGISTRATION=true
ENABLE_INSTITUTE_SELF_REGISTRATION=true

# ═════════════════════════════════════════════════════════════════════════════
# FRONTEND environment.prod.ts - COPY THIS TO frontend/src/environments/
# ═════════════════════════════════════════════════════════════════════════════

# 📝 Update the apiUrl and googleClientId in environment.prod.ts:

apiUrl: 'https://your-domain.com/api'
apiBaseUrl: 'https://your-domain.com'
googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'

# ═════════════════════════════════════════════════════════════════════════════
# WHERE TO GET EACH VALUE
# ═════════════════════════════════════════════════════════════════════════════

# 🔗 DATABASE_URL - From Hostinger Control Panel
# 1. Log in to Hostinger
# 2. Go to: Databases → MySQL/MariaDB
# 3. Create Database: hsc_exam_prod
# 4. Create User: hsc_exam_prod_user
# 5. Set Strong Password
# 6. Format: mysql://username:password@localhost:3306/database_name

# 🔗 GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET - From Google Cloud
# 1. Go to https://console.cloud.google.com
# 2. Create New Project
# 3. Enable Google+ API
# 4. Create OAuth 2.0 Credentials (Web Application)
# 5. Add Authorized Redirect URI: https://your-domain.com/api/auth/google/callback
# 6. Copy Client ID and Secret

# 🔗 JWT_SECRET & JWT_REFRESH_SECRET - Generate Random Strings
# Linux/macOS:
#   openssl rand -hex 32
#   openssl rand -hex 32  # Run twice for both secrets
#
# Windows (PowerShell):
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#
# Or use online: https://randomkeygen.com/ (copy SHA-256 Hash)

# 🔗 CASHFREE_API_KEY & CASHFREE_SECRET_KEY - From Cashfree Dashboard
# 1. Go to https://dashboard.cashfree.com
# 2. Create production account
# 3. Settings → API Keys
# 4. Copy API Key and Secret Key

# 🔗 SMTP CREDENTIALS - From Hostinger Email/Your Email Provider
# 1. Create email address in Hostinger
# 2. Get SMTP details from email settings
# 3. Typical format: smtp.hostinger.com port 465

# 🔗 CORS_ORIGIN & APP_URL - Your Domain
# Replace with actual domain: examportal.com, hsc-exam.com, etc.

# ═════════════════════════════════════════════════════════════════════════════
# QUICK START CHECKLIST
# ═════════════════════════════════════════════════════════════════════════════

# 1️⃣ Copy backend/.env.production template and fill in all marked 📝 values
# 2️⃣ Run on your machine to generate JWT secrets:
#      Linux/Mac: openssl rand -hex 32
#      Windows: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 3️⃣ Update frontend/src/environments/environment.prod.ts
# 4️⃣ Test build: npm run build (in both backend and frontend)
# 5️⃣ Create Hostinger MySQL database and user
# 6️⃣ Register production domain in Google OAuth console
# 7️⃣ Deploy to Hostinger
# 8️⃣ Start with PM2: pm2 start ecosystem.config.cjs
# 9️⃣ Verify at https://your-domain.com

# ═════════════════════════════════════════════════════════════════════════════
# USEFUL COMMANDS
# ═════════════════════════════════════════════════════════════════════════════

# Generate JWT Secret (copy one at a time):
# openssl rand -hex 32

# Generate Multiple Secrets at once:
# for i in 1 2; do echo "Secret $i: $(openssl rand -hex 32)"; done

# Test Database Connection:
# mysql -u user -p -h localhost -e "SELECT 1"

# SSH to Hostinger:
# ssh -p 65002 u441114691@45.130.228.77

# PM2 Commands (on Hostinger):
# pm2 start ecosystem.config.cjs
# pm2 status
# pm2 logs
# pm2 restart hsc-exam-api
# pm2 stop hsc-exam-api

# ═════════════════════════════════════════════════════════════════════════════
# IMPORTANT NOTES
# ═════════════════════════════════════════════════════════════════════════════

# ⚠️ DO NOT commit .env.production to git
# ⚠️ Keep JWT secrets safe - don't share them
# ⚠️ Use HTTPS only in production (enable SSL on Hostinger)
# ⚠️ Backup database before first deployment
# ⚠️ Change Google OAuth redirect URI to production domain
# ⚠️ Update CORS_ORIGIN to match your domain exactly
# ⚠️ Database username/password should be strong and unique

# ═════════════════════════════════════════════════════════════════════════════
# QUESTIONS?
# ═════════════════════════════════════════════════════════════════════════════

# See: ENV_VARIABLES_GUIDE.md for detailed explanations
# See: HOSTINGER_PRODUCTION_SETUP.md for full deployment steps
# See: PRODUCTION_READINESS_SUMMARY.md for checklist
