#!/bin/bash

# Simple Supabase Migration using CLI (works through API)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Supabase Database Migration via CLI          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

SOURCE_REF="jjepfehmuybpctdzipnu"
TARGET_REF="wmtlzfodmrchgqdbxjln"
BACKUP_DIR="database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="${BACKUP_DIR}/source_dump_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

# Step 1: Login
echo -e "${YELLOW}Step 1: Login to Supabase${NC}"
echo "This will open your browser for authentication..."
echo ""

if ! supabase projects list &> /dev/null; then
    supabase login
else
    echo -e "${GREEN}✓${NC} Already logged in"
fi
echo ""

# Step 2: Export from source
echo -e "${YELLOW}Step 2: Exporting from source database${NC}"
echo "Project: $SOURCE_REF"
echo ""

supabase db dump --project-ref "$SOURCE_REF" -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    echo -e "${GREEN}✓${NC} Export complete: $DUMP_SIZE"
else
    echo "✗ Export failed"
    exit 1
fi
echo ""

# Step 3: Confirm import
echo -e "${YELLOW}Step 3: Ready to import to target${NC}"
echo "Target project: $TARGET_REF"
echo "This will OVERWRITE the target database!"
echo ""
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Step 4: Import to target
echo -e "${YELLOW}Step 4: Importing to target database${NC}"
echo "This may take several minutes..."
echo ""

supabase db push --project-ref "$TARGET_REF" --include-seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Import complete"
else
    echo "✗ Import had errors"
    echo "Check the SQL file: $DUMP_FILE"
    exit 1
fi
echo ""

# Done
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Migration Complete! ✓                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Files created:"
echo "  • Database dump: $DUMP_FILE ($DUMP_SIZE)"
echo ""

echo "Next steps:"
echo "  1. Test application: npm run dev"
echo "  2. Verify data in target database"
echo "  3. Check application logs"
echo ""
