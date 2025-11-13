#!/bin/bash

# Clean SQL dump and prepare for import into fresh database

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Cleaning SQL dump for fresh database import...${NC}"
echo ""

DUMP_FILE="database-backups/source_dump_.sql"
CLEAN_FILE="database-backups/cleaned_import.sql"

if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    exit 1
fi

# Create cleaned version
cat > "$CLEAN_FILE" << 'SQLHEADER'
-- ============================================================================
-- Cleaned Database Import for Fresh Supabase Project
-- ============================================================================

-- Disable triggers temporarily to speed up import
SET session_replication_role = 'replica';

-- Increase timeouts
SET statement_timeout = '600s';
SET lock_timeout = '60s';

-- Create necessary extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

SQLHEADER

# Filter out problematic lines and add to clean file
grep -v "pgsodium" "$DUMP_FILE" | \
grep -v "SELECT pg_catalog.set_config" | \
grep -v "SET default_table_access_method" | \
grep -v "ALTER DEFAULT PRIVILEGES" | \
grep -v "REVOKE ALL" | \
grep -v "GRANT ALL" >> "$CLEAN_FILE"

# Add footer
cat >> "$CLEAN_FILE" << 'SQLFOOTER'

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify import
SELECT
    'Import Complete!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';

-- List all tables
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
SQLFOOTER

CLEAN_SIZE=$(du -h "$CLEAN_FILE" | cut -f1)

echo -e "${GREEN}✓${NC} Created cleaned SQL file: $CLEAN_SIZE"
echo ""

# Copy to clipboard
cat "$CLEAN_FILE" | pbcopy

echo -e "${GREEN}✓${NC} Copied to clipboard!"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Go to SQL Editor:"
echo "   https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/editor"
echo ""
echo "2. Paste the SQL (already in clipboard) and click 'Run'"
echo ""
echo "3. Wait for import to complete (2-5 minutes)"
echo ""
echo "The cleaned file removes:"
echo "  • pgsodium dependencies (not needed in new database)"
echo "  • Permission/privilege statements (handled by Supabase)"
echo "  • Config statements (not needed)"
echo ""
