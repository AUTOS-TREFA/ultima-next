#!/bin/bash

# Next.js Migration Validation Script
# Checks if the migration from React Router to Next.js is complete

set -e

echo "🔍 Next.js Migration Validation"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check 1: React Router package
echo "📦 Checking dependencies..."
if npm list react-router-dom &>/dev/null; then
    echo -e "${RED}❌ react-router-dom is still installed${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ react-router-dom not found${NC}"
fi

# Check 2: React Router imports
echo ""
echo "🔍 Checking for React Router imports..."
ROUTER_IMPORTS=$(grep -r "from ['\"]react-router-dom['\"]" src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v -E '\.(backup|bak|old|disabled)' || true)

if [ -z "$ROUTER_IMPORTS" ]; then
    echo -e "${GREEN}✅ No React Router imports found${NC}"
else
    echo -e "${RED}❌ Found React Router imports:${NC}"
    echo "$ROUTER_IMPORTS"
    ((ERRORS++))
fi

# Check 3: Route guard components
echo ""
echo "🛡️  Checking route guard components..."
GUARD_FILES=(
    "src/components/ProtectedRoute.tsx"
    "src/components/AdminRoute.tsx"
    "src/components/SalesRoute.tsx"
    "src/components/PublicRoute.tsx"
)

for file in "${GUARD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}❌ $file still exists${NC}"
        ((ERRORS++))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All route guard components removed${NC}"
fi

# Check 4: Vite config
echo ""
echo "⚙️  Checking Vite configuration..."
if [ -f "vite.config.ts" ] || [ -f "constructor/vite.config.ts" ]; then
    echo -e "${YELLOW}⚠️  Vite config files still present${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ No Vite config files found${NC}"
fi

# Check 5: Next.js App directory
echo ""
echo "📁 Checking Next.js app directory..."
if [ -d "app" ]; then
    PAGE_COUNT=$(find app -name "page.tsx" | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ App directory exists with $PAGE_COUNT pages${NC}"
else
    echo -e "${RED}❌ App directory not found${NC}"
    ((ERRORS++))
fi

# Check 6: Middleware
echo ""
echo "🔐 Checking middleware..."
if [ -f "middleware.ts" ]; then
    echo -e "${GREEN}✅ middleware.ts exists${NC}"
else
    echo -e "${YELLOW}⚠️  middleware.ts not found${NC}"
    ((WARNINGS++))
fi

# Check 7: Next.js config
echo ""
echo "⚙️  Checking Next.js configuration..."
if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✅ next.config.js exists${NC}"
else
    echo -e "${RED}❌ next.config.js not found${NC}"
    ((ERRORS++))
fi

# Check 8: Link component usage
echo ""
echo "🔗 Checking Link component usage..."
REACT_ROUTER_LINKS=$(grep -r "<Link to=" src --include="*.tsx" 2>/dev/null | grep -v -E '\.(backup|bak|old|disabled)' | wc -l | tr -d ' ')
NEXTJS_LINKS=$(grep -r "<Link href=" src --include="*.tsx" 2>/dev/null | grep -v -E '\.(backup|bak|old|disabled)' | wc -l | tr -d ' ')

if [ "$REACT_ROUTER_LINKS" -gt 0 ]; then
    echo -e "${RED}❌ Found $REACT_ROUTER_LINKS React Router Link components (to=)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No React Router Link components found${NC}"
fi

if [ "$NEXTJS_LINKS" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $NEXTJS_LINKS Next.js Link components (href=)${NC}"
fi

# Summary
echo ""
echo "================================"
echo "📊 Validation Summary"
echo "================================"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Migration validation passed!${NC}"
    echo ""
    echo "You can now:"
    echo "1. Run: npm run build"
    echo "2. Run: npm run dev"
    echo "3. Test your application"
    exit 0
else
    echo -e "${RED}❌ Migration validation failed${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
