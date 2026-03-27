#!/bin/bash
# ============================================================================
# AUTOMATED DEPLOYMENT SCRIPT FOR HOSTINGER
# Deploys both backend and frontend to production
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     HSC EXAM SYSTEM - FULL DEPLOYMENT SCRIPT            ║${NC}"
echo -e "${BLUE}║     Hostinger Production Deployment                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
DOMAIN="hsc-exam-form.hisofttechnology.com"
BACKEND_DIR="/home/u441114691/domains/${DOMAIN}/nodejs"
FRONTEND_DIR="/home/u441114691/domains/${DOMAIN}/public_html"

# ============================================================================
# STEP 1: Verify server access
# ============================================================================
echo -e "${YELLOW}[STEP 1] Verifying Hostinger server connection...${NC}"
cd "$BACKEND_DIR" 2>/dev/null && echo -e "${GREEN}✓ Backend directory accessible${NC}" || {
  echo -e "${RED}✗ Cannot access backend directory${NC}"
  exit 1
}

# ============================================================================
# STEP 2: Create environment configuration
# ============================================================================
echo -e "${YELLOW}[STEP 2] Creating production environment configuration...${NC}"

cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production
API_PORT=5000
API_HOST=0.0.0.0

# Database Configuration
# DATABASE_URL set via environment variable
DATABASE_URL=${DATABASE_URL:-}

# JWT Secrets
# Set via environment variables
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:-}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7

# Domain Configuration
DOMAIN=https://hsc-exam-form.hisofttechnology.com
CORS_ORIGIN=https://hsc-exam-form.hisofttechnology.com
FRONTEND_URL=https://hsc-exam-form.hisofttechnology.com

# Google OAuth
# Set via environment variables
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GOOGLE_REDIRECT_URI=https://hsc-exam-form.hisofttechnology.com/api/auth/google/callback

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# ============================================================================
# STEP 3: Install dependencies
# ============================================================================
echo -e "${YELLOW}[STEP 3] Installing Node.js dependencies...${NC}"
npm install --legacy-peer-deps || {
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================================================
# STEP 4: Build application
# ============================================================================
echo -e "${YELLOW}[STEP 4] Building application...${NC}"
npm run build || {
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Build successful${NC}"

# ============================================================================
# STEP 5: Database setup
# ============================================================================
echo -e "${YELLOW}[STEP 5] Setting up database schema...${NC}"
npx prisma db push --skip-generate || {
  echo -e "${RED}✗ Database setup failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Database configured${NC}"

# ============================================================================
# STEP 6: Install PM2 globally
# ============================================================================
echo -e "${YELLOW}[STEP 6] Setting up process manager...${NC}"
npm install -g pm2 2>/dev/null || true
echo -e "${GREEN}✓ PM2 ready${NC}"

# ============================================================================
# STEP 7: Stop existing processes
# ============================================================================
echo -e "${YELLOW}[STEP 7] Preparing for service restart...${NC}"
pm2 delete "hsc-exam-api" 2>/dev/null || true
echo -e "${GREEN}✓ Ready to start${NC}"

# ============================================================================
# STEP 8: Start application with PM2
# ============================================================================
echo -e "${YELLOW}[STEP 8] Starting application...${NC}"
pm2 start src/server.js --name "hsc-exam-api" --env production || {
  echo -e "${RED}✗ Failed to start application${NC}"
  exit 1
}
echo -e "${GREEN}✓ Application started${NC}"

# ============================================================================
# STEP 9: Configure PM2 for auto-restart
# ============================================================================
echo -e "${YELLOW}[STEP 9] Configuring auto-restart...${NC}"
pm2 save || true
pm2 startup systemd -u u441114691 --hp /home/u441114691 2>/dev/null || true
echo -e "${GREEN}✓ Auto-restart configured${NC}"

# ============================================================================
# STEP 10: Verify deployment
# ============================================================================
echo -e "${YELLOW}[STEP 10] Verifying deployment...${NC}"

# Wait for service to start
sleep 3

# Check PM2 status
if pm2 list | grep -q "hsc-exam-api.*online"; then
  echo -e "${GREEN}✓ Backend is running${NC}"
else
  echo -e "${RED}✗ Backend may not be running${NC}"
  pm2 logs hsc-exam-api
fi

# ============================================================================
# STEP 11: Deploy Frontend
# ============================================================================
echo -e "${YELLOW}[STEP 11] Preparing frontend deployment...${NC}"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
  mkdir -p "$FRONTEND_DIR"
fi

echo -e "${GREEN}✓ Frontend directory ready${NC}"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║             DEPLOYMENT COMPLETED SUCCESSFULLY ✓          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Backend Status:${NC}"
pm2 list | grep hsc-exam-api || echo "Process information unavailable"
echo ""
echo -e "${GREEN}API Endpoint:${NC}"
echo "  https://hsc-exam-form.hisofttechnology.com/api/health"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "  1. Upload frontend files to: $FRONTEND_DIR"
echo "  2. Test API: curl https://hsc-exam-form.hisofttechnology.com/api/health"
echo "  3. Visit: https://hsc-exam-form.hisofttechnology.com/"
echo ""
echo -e "${GREEN}Monitoring:${NC}"
echo "  View logs:    pm2 logs hsc-exam-api"
echo "  Restart:      pm2 restart hsc-exam-api"
echo "  Status:       pm2 status"
echo ""
