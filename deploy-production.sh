#!/bin/bash
# HSC Exam - Automated Deployment Script for Hostinger
# Run this on your Hostinger server via SSH
# It will handle all deployment steps automatically

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  HSC Exam System - Automated Deployment Script        ║${NC}"
echo -e "${BLUE}║  Target: https://hsc-exam-form.hisofttechnology.com   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration - These values will be set by the user
NODE_ENV="production"
API_PORT="5000"
API_HOST="0.0.0.0"

DATABASE_URL="${DATABASE_URL:-}"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-}"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL_DAYS="7"

CORS_ORIGIN="https://hsc-exam-form.hisofttechnology.com"
FRONTEND_URL="https://hsc-exam-form.hisofttechnology.com"

GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
GOOGLE_REDIRECT_URI="https://hsc-exam-form.hisofttechnology.com/api/auth/google/callback"

# Navigation
BACKEND_DIR="/home/u441114691/domains/hsc-exam-form.hisofttechnology.com/nodejs"
FRONTEND_DIR="/home/u441114691/domains/hsc-exam-form.hisofttechnology.com/public_html"

echo -e "${YELLOW}Starting HSC Exam Deployment...${NC}"
echo ""

# ============================================================================
# STEP 1: Check if directories exist
# ============================================================================
echo -e "${YELLOW}[STEP 1] Checking directories...${NC}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}✗ Backend directory not found: $BACKEND_DIR${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Backend directory found${NC}"

# ============================================================================
# STEP 2: Navigate to backend and create .env file
# ============================================================================
echo -e "${YELLOW}[STEP 2] Creating .env configuration file...${NC}"

cd "$BACKEND_DIR"

# Create .env file with all credentials
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=$NODE_ENV
API_PORT=$API_PORT
API_HOST=$API_HOST

# Database Configuration
DATABASE_URL=$DATABASE_URL

# JWT Secrets
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL=$ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL_DAYS=$REFRESH_TOKEN_TTL_DAYS

# CORS and Frontend
CORS_ORIGIN=$CORS_ORIGIN
FRONTEND_URL=$FRONTEND_URL

# Google OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# ============================================================================
# STEP 3: Install dependencies
# ============================================================================
echo -e "${YELLOW}[STEP 3] Installing dependencies...${NC}"
echo "This may take 2-3 minutes..."

npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi

echo ""

# ============================================================================
# STEP 4: Build (Prisma client generation)
# ============================================================================
echo -e "${YELLOW}[STEP 4] Building Prisma client...${NC}"

npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful - Prisma client generated${NC}"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi

echo ""

# ============================================================================
# STEP 5: Database setup
# ============================================================================
echo -e "${YELLOW}[STEP 5] Setting up database...${NC}"

npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database schema created/updated${NC}"
else
  echo -e "${RED}✗ Database setup failed${NC}"
  echo "Check your DATABASE_URL credentials"
  exit 1
fi

echo ""

# ============================================================================
# STEP 6: Install PM2 globally (if not already installed)
# ============================================================================
echo -e "${YELLOW}[STEP 6] Setting up PM2 process manager...${NC}"

npm install -g pm2 2>/dev/null || true

echo -e "${GREEN}✓ PM2 ready${NC}"

echo ""

# ============================================================================
# STEP 7: Stop existing PM2 process (if any)
# ============================================================================
echo -e "${YELLOW}[STEP 7] Stopping existing processes...${NC}"

pm2 delete "hsc-exam-api" 2>/dev/null || true

echo -e "${GREEN}✓ Ready to start${NC}"

echo ""

# ============================================================================
# STEP 8: Start the application with PM2
# ============================================================================
echo -e "${YELLOW}[STEP 8] Starting HSC Exam API with PM2...${NC}"

pm2 start src/server.js --name "hsc-exam-api" --env production

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Application started${NC}"
else
  echo -e "${RED}✗ Failed to start application${NC}"
  exit 1
fi

echo ""

# ============================================================================
# STEP 9: Save PM2 configuration for auto-restart on reboot
# ============================================================================
echo -e "${YELLOW}[STEP 9] Saving PM2 configuration...${NC}"

pm2 save

echo -e "${GREEN}✓ PM2 configured for auto-restart${NC}"

echo ""

# ============================================================================
# STEP 10: Verify deployment
# ============================================================================
echo -e "${YELLOW}[STEP 10] Verifying deployment...${NC}"

# Wait a moment for server to start
sleep 2

# Check if PM2 process is online
if pm2 list | grep -q "hsc-exam-api.*online"; then
  echo -e "${GREEN}✓ Application is running${NC}"
else
  echo -e "${RED}✗ Application may not be running${NC}"
  echo "Check logs with: pm2 logs hsc-exam-api"
fi

# Test API
echo ""
echo -e "${YELLOW}Testing API endpoint...${NC}"

API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ API responding correctly${NC}"
elif [ "$API_RESPONSE" = "000" ]; then
  echo -e "${YELLOW}⚠ Cannot test API (may still be starting)${NC}"
  echo "  Wait 30 seconds and test manually:"
  echo "  curl http://localhost:5000/api/health"
else
  echo -e "${YELLOW}⚠ API responded with status: $API_RESPONSE${NC}"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║             DEPLOYMENT COMPLETE ✓                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Backend Status:${NC}"
echo -e "  API URL: https://hsc-exam-form.hisofttechnology.com/api/"
echo -e "  Status: $(pm2 list | grep hsc-exam-api | awk '{print $11}')"
echo ""

echo -e "${GREEN}Next Steps:${NC}"
echo -e "  1. Upload frontend: Download hsc-exam-frontend-build.zip"
echo -e "     Extract to /public_html/ via FTP"
echo ""
echo -e "  2. Test API:"
echo -e "     curl https://hsc-exam-form.hisofttechnology.com/api/health"
echo ""
echo -e "  3. Visit Frontend:"
echo -e "     https://hsc-exam-form.hisofttechnology.com/"
echo ""

echo -e "${GREEN}Useful Commands:${NC}"
echo -e "  Check status:      pm2 status"
echo -e "  View logs:         pm2 logs hsc-exam-api"
echo -e "  Restart:           pm2 restart hsc-exam-api"
echo -e "  Stop:              pm2 stop hsc-exam-api"
echo -e "  Real-time logs:    pm2 logs hsc-exam-api --follow"
echo ""

echo -e "${YELLOW}Note:${NC} Frontend not uploaded yet. Use FTP to upload files to /public_html/"
echo ""
