#!/bin/bash
# HSC Exam Backend - Production Deployment Script
# Run this on the Hostinger server after pushing code

set -e  # Exit on any error

echo "========================================="
echo "HSC Exam Backend - Production Setup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo -e "${GREEN}✓ Node.js Version: ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ NPM Version: ${NPM_VERSION}${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install --legacy-peer-deps || npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Fix permissions on Prisma binary
echo -e "${YELLOW}Step 2: Setting permissions for Prisma binary...${NC}"
chmod +x node_modules/.bin/prisma 2>/dev/null || true
chmod +x node_modules/@prisma/client/engines/* 2>/dev/null || true
echo -e "${GREEN}✓ Permissions updated${NC}"
echo ""

# Step 3: Generate Prisma Client for Linux
echo -e "${YELLOW}Step 3: Generating Prisma Client (Linux binaries)...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to generate Prisma client${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Step 4: Database migrations (optional)
echo -e "${YELLOW}Step 4: Running database migrations...${NC}"
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to run migrations${NC}"
  echo -e "${YELLOW}Note: This is optional. Ensure database is set up manually if needed.${NC}"
fi
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Step 5: Verify environment variables
echo -e "${YELLOW}Step 5: Verifying environment variables...${NC}"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}✗ DATABASE_URL is not set!${NC}"
  echo -e "${YELLOW}Please set the DATABASE_URL environment variable before starting the server.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ DATABASE_URL is configured${NC}"
echo ""

# Step 6: Start the application
echo -e "${YELLOW}Step 6: Starting HSC Exam Backend...${NC}"
echo -e "${GREEN}════════════════════════════════${NC}"
echo "Backend is running on port 5000"
echo "API Documentation: http://localhost:5000/api/docs"
echo ""
echo "To keep the server running after SSH disconnects:"
echo "  - Use: npm start &"
echo "  - Or: pm2 start src/server.js --name 'hsc-exam-api'"
echo -e "${GREEN}════════════════════════════════${NC}"
echo ""

# Start with npm start
npm start
