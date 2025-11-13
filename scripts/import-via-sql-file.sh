#!/bin/bash

# Import database by uploading SQL file directly to Supabase
# This creates a single SQL statement you can paste into SQL Editor

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Prepare Full SQL for Dashboard Import                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

DUMP_FILE="database-backups/source_dump_.sql"
OUTPUT_FILE="database-backups/paste_into_sql_editor.sql"

if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Found dump file: $DUMP_SIZE"
echo ""

echo "Preparing SQL file for import..."

# Copy the dump and add some safety features
cat > "$OUTPUT_FILE" << 'SQLHEADER'
-- ============================================================================
-- IMPORTANT: Run this ENTIRE file at once in SQL Editor
-- ============================================================================

-- Disable triggers temporarily to speed up import
SET session_replication_role = 'replica';

-- Increase statement timeout for large imports
SET statement_timeout = '600s';

SQLHEADER

# Append the actual dump
cat "$DUMP_FILE" >> "$OUTPUT_FILE"

# Add footer to re-enable triggers
cat >> "$OUTPUT_FILE" << 'SQLFOOTER'

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify import
SELECT
    'Import Complete!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
SQLFOOTER

OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo -e "${GREEN}✓${NC} Created import file: $OUTPUT_SIZE"
echo ""

echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              SQL File Ready! ✓                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

echo -e "${CYAN}Method 1: Copy/Paste into SQL Editor (Recommended)${NC}"
echo ""
echo "1. Open the SQL file:"
echo "   cat $OUTPUT_FILE | pbcopy"
echo "   (This copies the entire file to your clipboard)"
echo ""
echo "2. Go to SQL Editor:"
echo "   https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/editor"
echo ""
echo "3. Paste the SQL (Cmd+V) and click 'Run'"
echo ""
echo "4. Wait 2-5 minutes for import to complete"
echo ""
echo ""

echo -e "${CYAN}Method 2: Import in Chunks (If Method 1 times out)${NC}"
echo ""
echo "If the SQL Editor times out with the full file, use the chunks:"
echo "  Files: database-backups/sql-editor-chunks/chunk_001.sql to chunk_024.sql"
echo "  Import them one by one in order"
echo ""
echo ""

echo -e "${CYAN}Method 3: Use Supabase Dashboard Upload (If available)${NC}"
echo ""
echo "Some Supabase plans allow SQL file upload:"
echo "1. Go to: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/database/migrations"
echo "2. Look for 'Upload SQL' or 'Import' button"
echo "3. Upload: $OUTPUT_FILE"
echo ""
echo ""

echo -e "${YELLOW}Quick Command to Copy File:${NC}"
echo "cat $OUTPUT_FILE | pbcopy"
echo ""
