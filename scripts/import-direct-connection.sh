#!/bin/bash

# Import using direct database connection instead of pooler

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Import via Direct Connection (Port 5432)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

TARGET_REF="wmtlzfodmrchgqdbxjln"
DUMP_FILE="database-backups/source_dump_.sql"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    ls -lh database-backups/source_dump_*.sql 2>/dev/null || echo "No dump files found"
    exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Found dump file: $DUMP_SIZE"
echo ""

# Get database password
echo -e "${YELLOW}Enter target database password:${NC}"
echo "Find it at: https://supabase.com/dashboard/project/$TARGET_REF/settings/database"
echo ""
read -sp "Password: " DB_PASSWORD
echo ""
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}✗ No password provided${NC}"
    exit 1
fi

# Test connection first
echo -e "${YELLOW}Testing direct connection...${NC}"
PGPASSWORD="$DB_PASSWORD" psql \
    "postgresql://postgres:${DB_PASSWORD}@db.${TARGET_REF}.supabase.co:5432/postgres?sslmode=require" \
    -c "SELECT current_database(), version();" \
    2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Connection test failed${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. Database is still recovering from RESTORING state"
    echo "  2. Password is incorrect"
    echo "  3. Network blocking direct connections (port 5432)"
    echo ""
    echo "Alternative: Try SQL Editor import method"
    echo "  Run: ./scripts/test-sql-editor-method.sh"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Connection successful"
echo ""

# Confirm import
echo -e "${RED}⚠️  WARNING: This will import data to target database${NC}"
echo "Target: $TARGET_REF"
echo ""
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Import cancelled"
    exit 0
fi

# Import using direct connection
echo -e "${YELLOW}Importing database...${NC}"
echo "This may take several minutes..."
echo ""

LOG_FILE="database-backups/import_log_$(date +"%Y%m%d_%H%M%S").log"

PGPASSWORD="$DB_PASSWORD" psql \
    "postgresql://postgres:${DB_PASSWORD}@db.${TARGET_REF}.supabase.co:5432/postgres?sslmode=require" \
    -f "$DUMP_FILE" \
    2>&1 | tee "$LOG_FILE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Import complete"

    # Verify table count
    echo ""
    echo -e "${YELLOW}Verifying import...${NC}"
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql \
        "postgresql://postgres:${DB_PASSWORD}@db.${TARGET_REF}.supabase.co:5432/postgres?sslmode=require" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

    if [ "$TABLE_COUNT" -eq 47 ]; then
        echo -e "${GREEN}✓${NC} All 47 tables imported successfully"
    else
        echo -e "${YELLOW}⚠${NC} Found $TABLE_COUNT tables (expected 47)"
    fi
else
    echo ""
    echo -e "${RED}✗${NC} Import had errors (check log: $LOG_FILE)"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Import Complete! ✓                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Import log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify data in SQL Editor:"
echo "     https://supabase.com/dashboard/project/$TARGET_REF/editor"
echo ""
echo "  2. Test application: npm run dev"
echo ""
