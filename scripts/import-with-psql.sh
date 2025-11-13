#!/bin/bash

# Import existing database dump to target using psql with SSL

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Import Database Dump with SSL                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

TARGET_REF="wmtlzfodmrchgqdbxjln"
DUMP_FILE="database-backups/source_dump_.sql"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    echo ""
    echo "Looking for any dump files..."
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

# Import using psql with SSL
echo -e "${YELLOW}Importing database...${NC}"
echo "This may take several minutes..."
echo ""

PGPASSWORD="$DB_PASSWORD" psql \
    "postgresql://postgres.${TARGET_REF}:${DB_PASSWORD}@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require" \
    -f "$DUMP_FILE" \
    2>&1 | tee "database-backups/import_log_$(date +"%Y%m%d_%H%M%S").log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Import complete"
else
    echo ""
    echo -e "${RED}✗${NC} Import had errors (check log file)"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Import Complete! ✓                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Next steps:"
echo "  1. Verify data:"
echo "     https://supabase.com/dashboard/project/$TARGET_REF/editor"
echo ""
echo "  2. Test application: npm run dev"
echo ""
