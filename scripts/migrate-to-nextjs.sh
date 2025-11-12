#!/bin/bash

# React to Next.js Migration Script
# This script automates the migration from React Router to Next.js routing

set -e

echo "🚀 React to Next.js Migration Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Remove React Router
echo "📦 Step 1: Removing react-router-dom..."
if npm list react-router-dom &>/dev/null; then
    npm uninstall react-router-dom
    echo -e "${GREEN}✅ react-router-dom removed${NC}"
else
    echo -e "${YELLOW}⚠️  react-router-dom not found (already removed)${NC}"
fi
echo ""

# Step 2: Delete Route Guard Components
echo "🗑️  Step 2: Deleting route guard components..."
FILES_TO_DELETE=(
    "src/components/ProtectedRoute.tsx"
    "src/components/AdminRoute.tsx"
    "src/components/SalesRoute.tsx"
    "src/components/PublicRoute.tsx"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}✅ Deleted $file${NC}"
    else
        echo -e "${YELLOW}⚠️  $file not found (already deleted)${NC}"
    fi
done
echo ""

# Step 3: Clean up Vite config
echo "🧹 Step 3: Cleaning up Vite configuration..."
if [ -f "vite.config.ts" ]; then
    rm vite.config.ts
    echo -e "${GREEN}✅ Deleted vite.config.ts${NC}"
else
    echo -e "${YELLOW}⚠️  vite.config.ts not found${NC}"
fi

if [ -f "constructor/vite.config.ts" ]; then
    rm constructor/vite.config.ts
    echo -e "${GREEN}✅ Deleted constructor/vite.config.ts${NC}"
else
    echo -e "${YELLOW}⚠️  constructor/vite.config.ts not found${NC}"
fi
echo ""

# Step 4: Verify no React Router imports remain
echo "🔍 Step 4: Checking for remaining React Router imports..."
ROUTER_IMPORTS=$(grep -r "from ['\"]react-router-dom['\"]" src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v backup || true)

if [ -z "$ROUTER_IMPORTS" ]; then
    echo -e "${GREEN}✅ No React Router imports found${NC}"
else
    echo -e "${RED}❌ Found React Router imports:${NC}"
    echo "$ROUTER_IMPORTS"
    echo -e "${YELLOW}⚠️  Manual fix required${NC}"
fi
echo ""

# Step 5: Clean build cache
echo "🧹 Step 5: Cleaning build cache..."
rm -rf .next
echo -e "${GREEN}✅ Build cache cleaned${NC}"
echo ""

# Step 6: Test build
echo "🔨 Step 6: Testing build..."
echo "Running: npm run build"
echo ""

if npm run build; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${YELLOW}Please check the errors above${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review any remaining warnings in the build output"
echo "2. Test the application: npm run dev"
echo "3. Test all critical user flows"
echo "4. Deploy to staging for QA"
echo ""
