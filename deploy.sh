#!/bin/bash

################################################################################
# HSC Exam Portal - Automated Deployment Script for Hostinger
#
# Usage: bash deploy.sh
#
# This script:
# 1. Pulls latest code from GitHub
# 2. Installs dependencies
# 3. Runs database migrations
# 4. Starts the backend with PM2
# 5. Confirms deployment
#
################################################################################

set -e  # Exit on any error

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🚀 HSC Exam Portal - Hostinger Deployment Script"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install git.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo -e "${RED}❌ Missing backend/.env file${NC}"
    echo ""
    echo "Please create backend/.env with required variables:"
    echo "  - DATABASE_URL (required)"
    echo "  - JWT_ACCESS_SECRET (required)"
    echo "  - JWT_REFRESH_SECRET (required)"
    echo "  - CORS_ORIGIN (required)"
    echo ""
    echo "See .env.example for template."
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Option to pull latest code
read -p "📥 Pull latest code from GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pulling latest code..."
    git pull origin convert-into-js || git fetch && git checkout convert-into-js
fi

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
# Load production environment if available
if [ -f .env.production ]; then
    echo "🔐 Loading environment from backend/.env.production"
    set -a
    . ./.env.production
    set +a
fi
# Check Prisma
echo ""
echo "🗄️  Checking database migrations..."
if npx prisma migrate status; then
    echo "Running production database migrations..."
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma migration history is out of sync. Falling back to schema sync...${NC}"
    npx prisma db push
    echo -e "${GREEN}✅ Database schema synced with prisma db push${NC}"
fi

# Go back to root
cd ..

# Build frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

echo ""
echo "🏗️  Building frontend..."
npm run build
echo -e "${GREEN}✅ Frontend build completed${NC}"
cd ..

# Check if PM2 is installed
echo ""
echo "🔧 Setting up PM2..."
if ! npm list -g pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Stop existing PM2 apps if any
echo ""
echo "Stopping existing apps (if any)..."
pm2 stop hsc-api 2>/dev/null || true
pm2 delete hsc-api 2>/dev/null || true

# Start new app
echo ""
echo "Starting backend with PM2..."
pm2 start ecosystem.config.js

# Setup auto-restart
echo ""
echo "🔄 Setting up auto-restart on reboot..."
pm2 save
pm2 startup > /dev/null 2>&1 || echo "Run: pm2 startup (may need sudo)"

# Display status
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📋 Recent Logs:"
pm2 logs hsc-api --nostream --lines 20
echo ""
echo "🧪 Test the API:"
echo "  curl https://hsc-api.hisofttechnology.com/api/health"
echo ""
echo "🌐 Frontend build output:"
echo "  frontend/dist/exam-form/browser"
echo ""
echo "📝 View logs:"
echo "  pm2 logs hsc-api"
echo ""
echo "🛑 Stop backend:"
echo "  pm2 stop hsc-api"
echo ""
echo "🔄 Restart backend:"
echo "  pm2 restart hsc-api"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
