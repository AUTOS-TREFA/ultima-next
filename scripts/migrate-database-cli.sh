#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  Supabase Database Migration Script (Using Supabase CLI)             ║
# ║  Alternative method when direct psql connections don't work          ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SOURCE_PROJECT_REF="jjepfehmuybpctdzipnu"
TARGET_PROJECT_REF="wmtlzfodmrchgqdbxjln"
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║           SUPABASE DATABASE MIGRATION (CLI METHOD)                   ║
║                                                                       ║
║  Source: jjepfehmuybpctdzipnu                                        ║
║  Target: wmtlzfodmrchgqdbxjln                                        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${YELLOW}This script uses Supabase CLI to migrate your database${NC}"
echo -e "${YELLOW}It works through Supabase's API instead of direct connections${NC}"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo ""
    echo "Please install it with:"
    echo "  npm install -g supabase"
    echo "or"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found: $(supabase --version)"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if user is logged in
echo -e "${CYAN}Checking Supabase authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not logged in to Supabase CLI"
    echo ""
    echo "Please log in:"
    supabase login
    echo ""
fi

echo -e "${GREEN}✓${NC} Authenticated"
echo ""

# List projects to verify access
echo -e "${CYAN}Listing your Supabase projects...${NC}"
supabase projects list
echo ""

# Confirm migration
echo -e "${RED}⚠️  WARNING: THIS WILL OVERWRITE THE TARGET DATABASE${NC}"
echo ""
echo -e "Source: ${GREEN}$SOURCE_PROJECT_REF${NC} (47 tables)"
echo -e "Target: ${RED}$TARGET_PROJECT_REF${NC} (will be overwritten)"
echo ""
read -p "Type 'MIGRATE' to confirm: " -r
echo

if [[ ! $REPLY == "MIGRATE" ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Dumping Source Database via Supabase API${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

DUMP_FILE="${BACKUP_DIR}/source_dump_${TIMESTAMP}.sql"

echo "Requesting database dump from Supabase..."
echo "This may take several minutes for large databases..."
echo ""

# Use supabase db dump command
supabase db dump \
    --project-ref "$SOURCE_PROJECT_REF" \
    --db-url "postgresql://postgres:[PASSWORD]@db.${SOURCE_PROJECT_REF}.supabase.co:5432/postgres" \
    > "$DUMP_FILE" 2>&1 || {
    echo -e "${RED}✗ Failed to dump database${NC}"
    echo ""
    echo "Alternative: Manual export method"
    echo "1. Go to: https://supabase.com/dashboard/project/${SOURCE_PROJECT_REF}/database/backups"
    echo "2. Create a backup"
    echo "3. Download the backup file"
    echo "4. Place it in: ${BACKUP_DIR}/"
    echo "5. Run this script again"
    exit 1
}

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Database dumped: $DUMP_SIZE"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Restoring to Target Database${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo "Importing data to target database..."
echo "This may take several minutes..."
echo ""

# Import to target using psql through connection pooler
PGPASSWORD="[TARGET_PASSWORD]" psql \
    "postgresql://postgres:[TARGET_PASSWORD]@db.${TARGET_PROJECT_REF}.supabase.co:5432/postgres" \
    -f "$DUMP_FILE" 2>&1 | tee "${BACKUP_DIR}/restore_log_${TIMESTAMP}.log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Database restored successfully"
else
    echo ""
    echo -e "${RED}✗${NC} Restore had errors (check log file)"
    echo "Log: ${BACKUP_DIR}/restore_log_${TIMESTAMP}.log"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    MIGRATION PROCESS COMPLETE                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Files created:"
echo "  • Source dump: $DUMP_FILE ($DUMP_SIZE)"
echo "  • Restore log: ${BACKUP_DIR}/restore_log_${TIMESTAMP}.log"
echo ""

echo "Next steps:"
echo "  1. Test your application"
echo "  2. Verify data integrity"
echo "  3. Check application logs"
echo ""
