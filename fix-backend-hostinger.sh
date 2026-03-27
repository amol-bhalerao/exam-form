#!/bin/bash
# Run this on Hostinger after uploading backend files
# This fixes the Prisma Query Engine issue

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Hostinger Backend Setup & Prisma Fix"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd ~/app || { echo "❌ ~/app directory not found"; exit 1; }

echo "✓ In app directory: $(pwd)"
echo ""

# Step 1: Clean node_modules
echo "[1/4] Cleaning node_modules..."
rm -rf node_modules
echo "✓ Cleaned"
echo ""

# Step 2: Install dependencies
echo "[2/4] Installing dependencies..."
npm install --production=false
if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi
echo "✓ Dependencies installed"
echo ""

# Step 3: Generate Prisma binaries for Linux (CRITICAL)
echo "[3/4] Generating Prisma binaries for Linux (this is critical)..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Prisma generation failed"
  exit 1
fi
echo "✓ Prisma binaries generated"
echo ""

# Step 4: Restart PM2 app
echo "[4/4] Restarting application..."
pm2 restart app
if [ $? -ne 0 ]; then
  echo "⚠ PM2 restart warning (app might still start)"
fi
sleep 2
echo "✓ Application restarted"
echo ""

# Verify
echo "═══════════════════════════════════════════════════════════════"
echo "  Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Testing health endpoint in 3 seconds..."
sleep 3

HEALTH=$(curl -s https://hsc-exam-form.hisofttechnology.com/api/health | jq '.ok' 2>/dev/null)
EXAMS=$(curl -s https://hsc-exam-form.hisofttechnology.com/api/public/exams -w "\n%{http_code}" | tail -1)

echo "API Health: $(if [ "$HEALTH" = "true" ]; then echo "✓ OK"; else echo "✗ FAILED"; fi)"
echo "Exams Endpoint: $(if [ "$EXAMS" = "200" ]; then echo "✓ OK"; else echo "✗ Status $EXAMS"; fi)"
echo ""

if [ "$HEALTH" = "true" ] && [ "$EXAMS" = "200" ]; then
  echo "✓ ALL SYSTEMS READY"
  exit 0
else
  echo "⚠ Some issues remain - check logs:"
  echo "  pm2 logs app"
  exit 1
fi
