#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# HSC Exam System - Production Deployment & Cleanup Script
# Run this on Hostinger before deployment
# ════════════════════════════════════════════════════════════════════════════

set -e

echo "================================"
echo "HSC Exam System - Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════════════════
# Step 1: Clean up previous builds
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 1] Cleaning up previous builds...${NC}"

cd frontend
echo "  Removing frontend build artifacts..."
rm -rf dist node_modules .angular

cd ../backend
echo "  Removing backend artifacts..."
rm -rf .prisma

cd ..

echo -e "${GREEN}✓ Cleanup complete${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 2: Install dependencies
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 2] Installing dependencies...${NC}"

echo "  Installing backend dependencies..."
cd backend
npm install --production
npm run build  # Critical: Generate Prisma engine for Linux
cd ..

echo "  Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 3: Build frontend
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 3] Building frontend...${NC}"

cd frontend
npm run build
cd ..

echo -e "${GREEN}✓ Frontend build complete${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 4: Database migrations (optional - comment out if not needed)
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 4] Running database setup...${NC}"

cd backend

# Uncomment if you need to run migrations:
# echo "  Running migrations..."
# npx prisma migrate deploy

echo "  Verifying database connection..."
node << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    console.log("✓ Database connection successful");
    process.exit(0);
  } catch (e) {
    console.error("✗ Database connection failed:", e.message);
    process.exit(1);
  }
})();
EOF

cd ..

echo -e "${GREEN}✓ Database setup complete${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 5: Verify installation
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 5] Verifying installation...${NC}"

echo "  Frontend bundle size:"
du -sh frontend/dist 2>/dev/null || echo "  Build not completed yet"

echo "  Node version:"
node --version

echo "  NPM version:"
npm --version

echo -e "${GREEN}✓ Verification complete${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 6: Create ecosystem config for PM2
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 6] Creating PM2 ecosystem config...${NC}"

cat > ecosystem.config.cjs << 'ECOSYSTEM_CONFIG'
module.exports = {
  apps: [
    {
      name: 'hsc-exam-api',
      script: './backend/src/server.js',
      env: {
        NODE_ENV: 'production'
      },
      instances: 2,
      exec_mode: 'cluster',
      error_file: 'logs/api-error.log',
      out_file: 'logs/api.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
ECOSYSTEM_CONFIG

echo -e "${GREEN}✓ PM2 config created${NC}"

# ════════════════════════════════════════════════════════════════════════════
# Step 7: Ready for PM2 startup
# ════════════════════════════════════════════════════════════════════════════

echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment setup complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Ensure .env.production exists in backend/ with correct values"
echo "2. Install PM2 globally: npm install -g pm2"
echo "3. Start application: pm2 start ecosystem.config.cjs"
echo "4. Check status: pm2 status"
echo "5. View logs: pm2 logs"
echo "6. Setup auto-restart: pm2 startup && pm2 save"

echo -e "\n✓ Ready for deployment!"
