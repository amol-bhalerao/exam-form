# Production Environment Variables & Setup Guide

## 🔑 Required Environment Variables

### Backend Configuration (.env.production)

Copy the template from `.env.production` and update these values:

```bash
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com              # → Update with actual domain

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

DATABASE_URL=mysql://user:password@localhost:3306/hsc_exam_prod

# Generate strong credentials:
# Username: hsc_exam_prod_user
# Password: Use a strong password (min 16 chars, mix of letters, numbers, symbols)
# Database: hsc_exam_prod

# =============================================================================
# GOOGLE OAUTH 2.0
# =============================================================================

GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_STRING
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# Get from: https://console.cloud.google.com
# 1. Create OAuth 2.0 Web Application credentials
# 2. Add authorized redirect URI
# 3. Copy Client ID and Client Secret

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================

JWT_SECRET=your_jwt_secret_min_32_characters_long_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long_here

# Generate using:
# Linux/Mac: openssl rand -hex 32
# Windows: 
#   - Use online generator: https://randomkeygen.com/
#   - Or: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_EXPIRES_IN=7
JWT_REFRESH_EXPIRES_IN=30

# =============================================================================
# CASHFREE PAYMENTS (Production)
# =============================================================================

CASHFREE_API_KEY=your_cashfree_production_api_key
CASHFREE_SECRET_KEY=your_cashfree_production_secret_key
CASHFREE_MODE=PROD

# Get from: https://dashboard.cashfree.com (Production)
# Mode options: PROD (production), SANDBOX (testing)

# =============================================================================
# EMAIL NOTIFICATIONS
# =============================================================================

ADMIN_EMAIL=admin@your-company.com
NOTIFICATION_EMAIL=no-reply@your-company.com
SUPPORT_EMAIL=support@your-company.com

# Optional: SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=no-reply@your-domain.com

# =============================================================================
# LOGGING
# =============================================================================

LOG_LEVEL=info                    # error, warn, info, debug
LOG_REQUEST_BODIES=false
LOG_RESPONSE_BODIES=false

# =============================================================================
# SECURITY
# =============================================================================

CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration (environment.prod.ts)

Update these values in `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  
  // Update with your production domain
  apiUrl: 'https://your-domain.com/api',
  apiBaseUrl: 'https://your-domain.com',
  
  // Google OAuth - same Client ID as backend
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  
  // ... other configs stay as is
};
```

---

## 📝 Checklist Before Deployment

- [ ] Create MySQL database `hsc_exam_prod` on Hostinger
- [ ] Create MySQL user with all privileges on the database
- [ ] Copy `.env.production` to backend directory with actual values
- [ ] Update `environment.prod.ts` with actual domain
- [ ] Generate strong JWT secrets (use `openssl rand -hex 32`)
- [ ] Register production domain in Google OAuth console
- [ ] Get Cashfree production credentials (if using payments)
- [ ] Have domain SSL/HTTPS configured on Hostinger
- [ ] Have SMTP credentials if using email notifications
- [ ] Create logs directory: `mkdir -p logs`
- [ ] Install PM2 globally: `npm install -g pm2`

---

## 🚀 How to Find Your Credentials

### Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 Web Application credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
6. Copy Client ID and Secret

### Cashfree Credentials
1. Sign up at https://cashfree.com
2. Create production account
3. Go to https://dashboard.cashfree.com
4. Navigate to Settings → API Keys
5. Copy API Key and Secret Key

### MySQL Credentials (Hostinger)
1. Log in to Hostinger control panel
2. Go to Databases → MySQL/MariaDB
3. Create new database: `hsc_exam_prod`
4. Create database user with strong password
5. Grant all privileges to the user on the database
6. CONNECTION STRING FORMAT:
   ```
   mysql://username:password@localhost:3306/hsc_exam_prod
   ```

### JWT Secrets
Generate using these commands:

**Linux/macOS:**
```bash
openssl rand -hex 32
openssl rand -hex 32  # Run twice for JWT_SECRET and JWT_REFRESH_SECRET
```

**Windows (Node.js):**
```batch
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Online (if no command line):**
https://randomkeygen.com/ (copy from "SHA-256 Hashes")

---

## 🔒 Security Best Practices

1. **Never commit `.env.production`** - keep it out of git
2. **Use strong passwords** - minimum 16 characters, mix of:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Symbols (!@#$%^&*)
3. **Rotate secrets regularly** - especially JWT secrets
4. **Enable HTTPS** - always use SSL/TLS on production
5. **Set proper CORS origins** - only allow your domain
6. **Monitor logs** - check for suspicious activity
7. **Regular backups** - backup database regularly
8. **Keep dependencies updated** - run `npm audit fix`

---

## 🐛 Common Issues & Solutions

### Issue: "DATABASE_URL is required"
**Solution:** Make sure `.env.production` exists in backend/ with valid DATABASE_URL

### Issue: "Cannot find module @prisma/client"
**Solution:** Run `npm run build` in backend directory to generate Prisma client

### Issue: "Google OAuth callback mismatch"
**Solution:** Ensure redirect URI in `.env.production` matches exactly what's registered in Google Console

### Issue: "Port 3000 already in use"
**Solution:** Change PORT in `.env.production` or kill process: `lsof -ti:3000 | xargs kill -9`

### Issue: "CORS error when calling API"
**Solution:** Update CORS_ORIGIN in `.env.production` to match your frontend domain

---

## 📞 Support

For issues with specific services:
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Cashfree**: https://docs.cashfree.com/
- **Hostinger**: https://www.hostinger.com/support
- **Prisma**: https://www.prisma.io/docs/
