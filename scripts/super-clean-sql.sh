#!/bin/bash

# Super clean SQL dump - removes ALL ownership and role statements

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Creating super-cleaned SQL dump...${NC}"
echo ""

DUMP_FILE="database-backups/source_dump_.sql"
CLEAN_FILE="database-backups/super_clean_import.sql"

if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    exit 1
fi

# Create header
cat > "$CLEAN_FILE" << 'SQLHEADER'
-- ============================================================================
-- Super Clean Database Import (All ownership/role statements removed)
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';
SET statement_timeout = '600s';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

SQLHEADER

# Filter out ALL problematic statements
cat "$DUMP_FILE" | \
grep -v "pgsodium" | \
grep -v "SELECT pg_catalog.set_config" | \
grep -v "SET default_table_access_method" | \
grep -v "ALTER DEFAULT PRIVILEGES" | \
grep -v "REVOKE ALL" | \
grep -v "GRANT ALL" | \
grep -v "GRANT USAGE" | \
grep -v "GRANT SELECT" | \
grep -v "GRANT INSERT" | \
grep -v "GRANT UPDATE" | \
grep -v "GRANT DELETE" | \
grep -v "ALTER TABLE.*OWNER TO" | \
grep -v "ALTER FUNCTION.*OWNER TO" | \
grep -v "ALTER SEQUENCE.*OWNER TO" | \
grep -v "ALTER VIEW.*OWNER TO" | \
grep -v "ALTER SCHEMA.*OWNER TO" | \
grep -v "supabase_functions_admin" | \
grep -v "supabase_admin" | \
grep -v "supabase_auth_admin" | \
grep -v "supabase_storage_admin" >> "$CLEAN_FILE"

# Add footer
cat >> "$CLEAN_FILE" << 'SQLFOOTER'

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify import
SELECT
    'Import Complete!' as status,
    COUNT(*) as table_count,
    string_agg(tablename, ', ' ORDER BY tablename) as tables
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY 1;
SQLFOOTER

CLEAN_SIZE=$(du -h "$CLEAN_FILE" | cut -f1)
ORIGINAL_SIZE=$(du -h "$DUMP_FILE" | cut -f1)

echo -e "${GREEN}✓${NC} Original: $ORIGINAL_SIZE → Cleaned: $CLEAN_SIZE"
echo ""

# Show what was removed
ORIGINAL_LINES=$(wc -l < "$DUMP_FILE")
CLEAN_LINES=$(wc -l < "$CLEAN_FILE")
REMOVED=$((ORIGINAL_LINES - CLEAN_LINES))

echo "Removed $REMOVED problematic lines:"
echo "  • Owner/role statements"
echo "  • Permission grants"
echo "  • Supabase system role references"
echo "  • pgsodium dependencies"
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
echo "2. Paste the SQL and click 'Run'"
echo ""
echo "3. This cleaned version should import without role errors"
echo ""
