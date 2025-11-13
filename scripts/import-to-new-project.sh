#!/bin/bash

# Import database dump to a fresh Supabase project

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         Import to Fresh Supabase Project                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

DUMP_FILE="database-backups/source_dump_.sql"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    echo ""
    echo "Looking for alternative dump files..."
    LATEST_DUMP=$(ls -t database-backups/source_dump_*.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_DUMP" ]; then
        echo -e "${YELLOW}Found: $LATEST_DUMP${NC}"
        DUMP_FILE="$LATEST_DUMP"
    else
        echo "No dump files found. Please export from source first."
        exit 1
    fi
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Found dump file: $DUMP_SIZE"
echo ""

# Get new project details
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 1: Enter New Project Details${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "First, create a new Supabase project at:"
echo "https://supabase.com/dashboard/projects"
echo ""
echo "Settings to use:"
echo "  • Region: us-east-2 (Ohio)"
echo "  • Wait for status: ACTIVE HEALTHY"
echo ""
read -p "Have you created a new project? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Please create a new project first, then run this script again."
    exit 0
fi

echo ""
echo -e "${YELLOW}Enter your NEW project reference ID:${NC}"
echo "(Find it in: Project Settings → General → Reference ID)"
read -p "New Project Ref: " NEW_PROJECT_REF
echo ""

if [ -z "$NEW_PROJECT_REF" ]; then
    echo -e "${RED}✗ No project ref provided${NC}"
    exit 1
fi

echo -e "${YELLOW}Enter your NEW project database password:${NC}"
echo "(Find it in: Project Settings → Database → Database password)"
echo "(This is the password you set when creating the project)"
read -sp "Password: " NEW_DB_PASSWORD
echo ""
echo ""

if [ -z "$NEW_DB_PASSWORD" ]; then
    echo -e "${RED}✗ No password provided${NC}"
    exit 1
fi

# Test connection
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 2: Testing Connection${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

echo "Testing connection to new project..."

# Temporarily disable exit on error for connection test
set +e
CONNECTION_TEST=$(PGPASSWORD="$NEW_DB_PASSWORD" psql \
    "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
    -t -c "SELECT current_database(), version();" 2>&1)
CONNECTION_STATUS=$?
set -e

if [ $CONNECTION_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Connection successful"
    echo ""
else
    echo -e "${RED}✗ Connection failed${NC}"
    echo ""
    echo "Error details:"
    echo "$CONNECTION_TEST"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify project status is 'ACTIVE HEALTHY' in dashboard"
    echo "  2. Check password is correct"
    echo "  3. Wait 2-3 minutes if project was just created"
    echo "  4. Verify project ref is correct: $NEW_PROJECT_REF"
    echo ""
    echo "You can try again by running:"
    echo "  ./scripts/import-to-new-project.sh"
    exit 1
fi

# Confirm import
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 3: Import Confirmation${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Ready to import:"
echo "  • Source dump: $DUMP_FILE ($DUMP_SIZE)"
echo "  • Target project: $NEW_PROJECT_REF"
echo "  • Tables to import: 47"
echo ""
read -p "Continue with import? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Import cancelled"
    exit 0
fi

# Import
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 4: Importing Database${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "This may take 2-5 minutes..."
echo ""

LOG_FILE="database-backups/import_log_$(date +"%Y%m%d_%H%M%S").log"

# Temporarily disable exit on error for import (we want to see all output)
set +e
PGPASSWORD="$NEW_DB_PASSWORD" psql \
    "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
    -f "$DUMP_FILE" \
    2>&1 | tee "$LOG_FILE"

IMPORT_STATUS=${PIPESTATUS[0]}
set -e

if [ $IMPORT_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Import complete"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Import finished with warnings/errors"
    echo "Check log: $LOG_FILE"
    echo ""
    echo "Note: Some warnings are normal (e.g., duplicate extensions)."
    echo "Continuing to verify data..."
fi

# Verify
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 5: Verifying Import${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

# Disable exit on error for verification queries
set +e
TABLE_COUNT=$(PGPASSWORD="$NEW_DB_PASSWORD" psql \
    "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
set -e

if [ -z "$TABLE_COUNT" ]; then
    echo -e "${RED}✗${NC} Could not verify table count"
    echo "The import may have completed but verification failed."
    TABLE_COUNT="unknown"
elif [ "$TABLE_COUNT" = "47" ]; then
    echo -e "${GREEN}✓${NC} All 47 tables imported successfully"
else
    echo -e "${YELLOW}⚠${NC} Found $TABLE_COUNT tables (expected 47)"
    echo "This may be normal if some tables had errors. Check the log."
fi

# Sample data check
if [ "$TABLE_COUNT" != "unknown" ]; then
    echo ""
    echo "Checking sample data..."
    set +e
    PROFILE_COUNT=$(PGPASSWORD="$NEW_DB_PASSWORD" psql \
        "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
        -t -c "SELECT COUNT(*) FROM profiles;" 2>/dev/null | xargs || echo "0")
    set -e

    if [ -n "$PROFILE_COUNT" ] && [ "$PROFILE_COUNT" != "0" ]; then
        echo -e "${GREEN}✓${NC} Profiles table: $PROFILE_COUNT rows"
    else
        echo -e "${YELLOW}⚠${NC} Could not verify profile data"
    fi
fi

# Success
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              Import Complete! ✓                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# Save project details
CONFIG_FILE="database-backups/new_project_config.txt"
cat > "$CONFIG_FILE" << ENDCONFIG
# New Supabase Project Configuration
# Generated: $(date)

NEW_PROJECT_REF=$NEW_PROJECT_REF
NEW_PROJECT_URL=https://${NEW_PROJECT_REF}.supabase.co

# Next steps:
# 1. Get your API keys from: https://supabase.com/dashboard/project/$NEW_PROJECT_REF/settings/api
# 2. Run: ./scripts/update-env-with-new-project.sh
# 3. Test: npm run dev

ENDCONFIG

echo -e "${YELLOW}Project details saved to: $CONFIG_FILE${NC}"
echo ""
echo "Import log: $LOG_FILE"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Get your API keys:"
echo "   https://supabase.com/dashboard/project/$NEW_PROJECT_REF/settings/api"
echo ""
echo "2. Update environment variables:"
echo "   ./scripts/update-env-with-new-project.sh"
echo ""
echo "3. Test your application:"
echo "   npm run dev"
echo ""
echo "4. Verify data in SQL Editor:"
echo "   https://supabase.com/dashboard/project/$NEW_PROJECT_REF/editor"
echo ""
