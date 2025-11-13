#!/bin/bash

# Import existing database dump to a fresh Supabase project
# Use this if the target database is stuck in RESTORING state

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Import to Fresh Supabase Project             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if dump file exists
DUMP_FILE="database-backups/source_dump_.sql"
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    echo ""
    echo "Please run the export first:"
    echo "  ./scripts/migrate-via-cli.sh"
    exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Found dump file: $DUMP_SIZE"
echo ""

# Get target project ref
echo -e "${YELLOW}Enter the NEW target project ref:${NC}"
echo "(This should be a fresh, healthy Supabase project)"
read -p "Project ref: " TARGET_REF

if [ -z "$TARGET_REF" ]; then
    echo "No project ref provided. Exiting."
    exit 0
fi

echo ""
echo -e "${YELLOW}Target project: ${GREEN}$TARGET_REF${NC}"
echo ""

# Verify user is logged in
echo "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not logged in to Supabase CLI"
    supabase login
else
    echo -e "${GREEN}✓${NC} Already logged in"
fi
echo ""

# List projects to verify
echo "Your Supabase projects:"
supabase projects list | grep -E "(ID|$TARGET_REF)" || supabase projects list
echo ""

# Confirm import
echo -e "${RED}⚠️  WARNING: This will import data to the target database${NC}"
echo ""
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Import cancelled"
    exit 0
fi

# Link to the project
echo -e "${YELLOW}Linking to target project...${NC}"
supabase link --project-ref "$TARGET_REF"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to link to project${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if project exists: https://supabase.com/dashboard/project/$TARGET_REF"
    echo "2. Verify project is not paused"
    echo "3. Check project status is 'ACTIVE HEALTHY'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Linked to project"
echo ""

# Import using db push
echo -e "${YELLOW}Importing database...${NC}"
echo "This may take several minutes..."
echo ""

# Note: db push expects migrations, so we'll use psql directly
echo "Getting database connection string..."

# Try to push the dump
supabase db push --project-ref "$TARGET_REF" --include-seed 2>&1 | tee import.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Import complete"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} db push may not work with raw SQL dumps"
    echo ""
    echo "Alternative method: Use psql directly"
    echo ""
    echo "1. Get your database password from:"
    echo "   https://supabase.com/dashboard/project/$TARGET_REF/settings/database"
    echo ""
    echo "2. Then run:"
    echo "   PGPASSWORD='your_password' psql \\"
    echo "     -h aws-1-us-east-2.pooler.supabase.com \\"
    echo "     -p 6543 \\"
    echo "     -U postgres.$TARGET_REF \\"
    echo "     -d postgres \\"
    echo "     -f $DUMP_FILE"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Import Process Complete               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Next steps:"
echo "  1. Verify data in dashboard:"
echo "     https://supabase.com/dashboard/project/$TARGET_REF/editor"
echo ""
echo "  2. Update your .env file with new credentials"
echo ""
echo "  3. Test application: npm run dev"
echo ""
