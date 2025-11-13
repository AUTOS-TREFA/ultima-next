#!/bin/bash

# Test if SQL Editor works when direct connections don't
# This splits the dump into manageable chunks for SQL Editor

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DUMP_FILE="database-backups/source_dump_.sql"
OUTPUT_DIR="database-backups/sql-editor-chunks"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Prepare SQL for Manual SQL Editor Import     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Analyzing dump file..."
LINES=$(wc -l < "$DUMP_FILE")
echo -e "${GREEN}✓${NC} Total lines: $LINES"
echo ""

# Split into chunks of 500 lines each (manageable for SQL Editor)
CHUNK_SIZE=500
echo "Splitting into chunks of $CHUNK_SIZE lines..."

split -l $CHUNK_SIZE "$DUMP_FILE" "$OUTPUT_DIR/chunk_"

CHUNK_COUNT=$(ls -1 "$OUTPUT_DIR"/chunk_* | wc -l)
echo -e "${GREEN}✓${NC} Created $CHUNK_COUNT chunks"
echo ""

# Rename chunks with numbers and .sql extension
cd "$OUTPUT_DIR"
counter=1
for file in chunk_*; do
    mv "$file" "$(printf 'chunk_%03d.sql' $counter)"
    counter=$((counter + 1))
done
cd ../..

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Chunks Ready for SQL Editor           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Files created in: $OUTPUT_DIR"
echo "Total chunks: $CHUNK_COUNT"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Go to SQL Editor:"
echo "   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/editor"
echo ""
echo "2. Test if SQL Editor works:"
echo "   SELECT current_database();"
echo ""
echo "3. If it works, import chunks IN ORDER:"
echo "   - Open chunk_001.sql"
echo "   - Copy contents"
echo "   - Paste into SQL Editor"
echo "   - Click 'Run'"
echo "   - Repeat for chunk_002.sql, chunk_003.sql, etc."
echo ""
echo "4. Progress tracking:"
echo "   Total chunks to import: $CHUNK_COUNT"
echo "   Estimated time: $((CHUNK_COUNT * 2)) minutes (assuming ~2 min per chunk)"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC} Import chunks in sequential order (001, 002, 003...)"
echo "   Some chunks may depend on previous chunks for foreign keys."
echo ""
