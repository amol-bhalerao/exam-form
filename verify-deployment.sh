#!/bin/bash
# HSC Exam - Pre-Deployment Verification Script
# Run this on your local machine to verify everything is ready

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HSC Exam - Pre-Deployment Verification Script          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check and report
check() {
  local name=$1
  local command=$2
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $name"
    ((FAILED++))
  fi
}

check_file() {
  local name=$1
  local path=$2
  
  if [ -f "$path" ]; then
    echo -e "${GREEN}✓${NC} $name"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $name"
    ((FAILED++))
  fi
}

# ============================
# System Requirements
# ============================
echo -e "${YELLOW}System Requirements:${NC}"

check "Node.js installed" "command -v node"
check "npm installed" "command -v npm"

if command -v node &> /dev/null; then
  echo "  Node version: $(node -v)"
fi

if command -v npm &> /dev/null; then
  echo "  npm version: $(npm -v)"
fi

echo ""

# ============================
# Backend Configuration
# ============================
echo -e "${YELLOW}Backend Configuration:${NC}"

# Check if backend directory exists
if [ -d "backend" ]; then
  check_file "package.json exists" "backend/package.json"
  check_file "prisma schema exists" "backend/prisma/schema.prisma"
  check_file "prisma.js exists" "backend/src/prisma.js"
  
  # Check package.json for postinstall script (should NOT exist)
  if grep -q '"postinstall"' backend/package.json; then
    echo -e "${RED}✗${NC} postinstall script should be removed"
    ((FAILED++))
  else
    echo -e "${GREEN}✓${NC} postinstall script removed"
    ((PASSED++))
  fi
  
  # Check if prisma.config.ts exists (should NOT)
  if [ -f "backend/prisma.config.ts" ]; then
    echo -e "${RED}✗${NC} prisma.config.ts should be deleted"
    ((FAILED++))
  else
    echo -e "${GREEN}✓${NC} prisma.config.ts deleted"
    ((PASSED++))
  fi
  
  # Check if schema has DATABASE_URL
  if grep -q 'url.*env("DATABASE_URL")' backend/prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configured in schema"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} DATABASE_URL not found in schema"
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}ⓘ${NC} backend directory not found (okay if deploying pre-built)"
fi

echo ""

# ============================
# Frontend Build
# ============================
echo -e "${YELLOW}Frontend Build:${NC}"

if [ -f "hsc-exam-frontend-build.zip" ]; then
  echo -e "${GREEN}✓${NC} Frontend build zip exists"
  ((PASSED++))
  
  # Check zip size
  ZIPSIZE=$(du -h "hsc-exam-frontend-build.zip" | cut -f1)
  echo "  Size: $ZIPSIZE"
else
  echo -e "${RED}✗${NC} hsc-exam-frontend-build.zip not found"
  ((FAILED++))
fi

if [ -d "frontend/dist/exam-form/browser" ]; then
  echo -e "${GREEN}✓${NC} Frontend dist directory exists"
  ((PASSED++))
  
  # Check key files in dist
  check_file "  - index.html" "frontend/dist/exam-form/browser/index.html"
  check_file "  - main-*.js" "frontend/dist/exam-form/browser/main-*.js"
  check_file "  - styles CSS" "frontend/dist/exam-form/browser/styles-*.css"
else
  echo -e "${RED}✗${NC} Frontend dist directory not found"
  ((FAILED++))
fi

echo ""

# ============================
# Documentation
# ============================
echo -e "${YELLOW}Documentation:${NC}"

check_file "START_HERE.md" "START_HERE.md"
check_file "QUICK_DEPLOY.md" "QUICK_DEPLOY.md"
check_file "HOSTINGER_BACKEND_DEPLOYMENT.md" "HOSTINGER_BACKEND_DEPLOYMENT.md"
check_file "DEPLOYMENT_ARCHITECTURE.md" "DEPLOYMENT_ARCHITECTURE.md"
check_file "PRE_DEPLOYMENT_CHECKLIST.md" "PRE_DEPLOYMENT_CHECKLIST.md"

echo ""

# ============================
# Environment Setup (if checking for .env)
# ============================
echo -e "${YELLOW}Environment Setup:${NC}"

if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} .env file exists locally"
  ((PASSED++))
  
  if grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configured"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set (will need to set on server)"
  fi
else
  echo -e "${YELLOW}ⓘ${NC} .env file not found (okay, set on production server)"
fi

if [ -f "backend/.env" ]; then
  echo -e "${GREEN}✓${NC} backend/.env exists"
  ((PASSED++))
else
  echo -e "${YELLOW}ⓘ${NC} backend/.env not found (okay, set on production server)"
fi

echo ""

# ============================
# File Integrity Checks
# ============================
echo -e "${YELLOW}File Integrity:${NC}"

if [ -d "backend/node_modules" ]; then
  echo -e "${GREEN}✓${NC} Dependencies installed"
  ((PASSED++))
else
  echo -e "${YELLOW}ⓘ${NC} node_modules not found (will be installed on server)"
fi

if [ -d "frontend/node_modules" ]; then
  echo -e "${GREEN}✓${NC} Frontend dependencies installed"
  ((PASSED++))
else
  echo -e "${YELLOW}ⓘ${NC} frontend/node_modules not found (okay, cleanup before deploy)"
fi

echo ""

# ============================
# Summary
# ============================
TOTAL=$((PASSED + FAILED))

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Verification Summary                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Checks: ${PASSED} passed, ${FAILED} failed"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
  echo ""
  echo -e "${GREEN}Your deployment is ready! Next steps:${NC}"
  echo "1. Read: START_HERE.md"
  echo "2. SSH into Hostinger server"
  echo "3. Follow: QUICK_DEPLOY.md or HOSTINGER_BACKEND_DEPLOYMENT.md"
  echo "4. Upload frontend build via FTP"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  SOME CHECKS FAILED!${NC}"
  echo ""
  echo "Please fix the issues above before deploying."
  echo ""
  exit 1
fi
