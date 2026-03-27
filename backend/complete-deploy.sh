#!/bin/bash
# COMPLETE DEPLOYMENT SCRIPT FOR HOSTINGER
# This script handles all deployment steps in one go

set -e

echo "=========================================="
echo "HSC Exam System - Hostinger Deployment"
echo "=========================================="
echo ""

#============================================================================
# BACKEND DEPLOYMENT
#============================================================================

DOMAIN="hsc-exam-form.hisofttechnology.com"
BACKEND_DIR="/home/u441114691/domains/${DOMAIN}/nodejs"
FRONTEND_DIR="/home/u441114691/domains/${DOMAIN}/public_html"

echo "Step 1: Navigate to backend directory..."
cd "$BACKEND_DIR"

echo "Step 2: Creating .env configuration..."
cat > .env << 'EOF'
NODE_ENV=production
API_PORT=5000
API_HOST=0.0.0.0
DATABASE_URL=${DATABASE_URL:-}
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:-}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
CORS_ORIGIN=https://hsc-exam-form.hisofttechnology.com
FRONTEND_URL=https://hsc-exam-form.hisofttechnology.com
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GOOGLE_REDIRECT_URI=https://hsc-exam-form.hisofttechnology.com/api/auth/google/callback
LOG_LEVEL=info
EOF
echo "[OK] .env created"

echo "Step 3: Installing dependencies..."
npm install --legacy-peer-deps

echo "Step 4: Building Prisma client..."
npm run build

echo "Step 5: Setting up database..."
npx prisma db push --skip-generate

echo "Step 6: Installing PM2..."
npm install -g pm2 || true

echo "Step 7: Stopping old process..."
pm2 delete "hsc-exam-api" || true

echo "Step 8: Starting application..."
pm2 start src/server.js --name "hsc-exam-api" --env production

echo "Step 9: Saving PM2 configuration..."
pm2 save || true
pm2 startup systemd -u u441114691 --hp /home/u441114691 || true

echo "Step 10: Verifying backend..."
sleep 3
pm2 list

echo ""
echo "=========================================="
echo "BACKEND DEPLOYMENT COMPLETED"
echo "=========================================="
echo ""
echo "Next: Upload frontend files to:"
echo "  $FRONTEND_DIR"
echo ""
echo "Then test API:"
echo "  curl https://hsc-exam-form.hisofttechnology.com/api/health"
echo ""
