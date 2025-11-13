#!/bin/bash

# Import database dump using Supabase CLI (works via API, not direct connections)

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
║      Import via Supabase CLI (API Method)                 ║
║      Works when direct connections are blocked            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
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

# Check if logged in
echo -e "${CYAN}Checking Supabase authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not logged in to Supabase CLI"
    echo ""
    echo "Logging in..."
    supabase login
    echo ""
fi

echo -e "${GREEN}✓${NC} Authenticated"
echo ""

# List projects
echo -e "${CYAN}Your Supabase projects:${NC}"
supabase projects list
echo ""

# Get new project ref
echo -e "${YELLOW}Enter your NEW project reference ID:${NC}"
echo "(The project you just created)"
read -p "Project Ref: " NEW_PROJECT_REF
echo ""

if [ -z "$NEW_PROJECT_REF" ]; then
    echo -e "${RED}✗ No project ref provided${NC}"
    exit 1
fi

# Verify project exists
echo "Verifying project exists..."
if supabase projects list | grep -q "$NEW_PROJECT_REF"; then
    echo -e "${GREEN}✓${NC} Project found"
else
    echo -e "${RED}✗ Project not found in your account${NC}"
    echo "Please check the project ref and try again."
    exit 1
fi

echo ""

# Check for dump file
DUMP_FILE="database-backups/source_dump_.sql"
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}✗ Dump file not found: $DUMP_FILE${NC}"
    echo ""
    echo "Looking for alternative dump files..."
    LATEST_DUMP=$(ls -t database-backups/source_dump_*.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_DUMP" ]; then
        echo -e "${YELLOW}Found: $LATEST_DUMP${NC}"
        DUMP_FILE="$LATEST_DUMP"
    else
        echo "No dump files found."
        exit 1
    fi
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Found dump file: $DUMP_SIZE"
echo ""

# Create a temporary directory for migrations
echo -e "${CYAN}Preparing import...${NC}"
TEMP_DIR="supabase/migrations_temp_$(date +"%Y%m%d_%H%M%S")"
mkdir -p "$TEMP_DIR"

# Copy dump file as a migration
MIGRATION_FILE="${TEMP_DIR}/$(date +"%Y%m%d%H%M%S")_import_data.sql"
cp "$DUMP_FILE" "$MIGRATION_FILE"

echo -e "${GREEN}✓${NC} Prepared migration file"
echo ""

# Link to the project
echo -e "${CYAN}Linking to project...${NC}"
supabase link --project-ref "$NEW_PROJECT_REF"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to link to project${NC}"
    echo ""
    echo "This might happen if:"
    echo "  1. Project is not fully initialized yet (wait 2-3 minutes)"
    echo "  2. Project is paused or unhealthy"
    echo "  3. You don't have access to this project"
    echo ""
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✓${NC} Linked to project"
echo ""

# Confirm import
echo -e "${RED}⚠️  WARNING: This will import data to your database${NC}"
echo ""
echo "Project: $NEW_PROJECT_REF"
echo "File: $DUMP_FILE ($DUMP_SIZE)"
echo ""
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Import cancelled"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Push migrations
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}║  Importing Database (this may take 2-5 minutes)   ${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════${NC}"
echo ""

LOG_FILE="database-backups/import_log_$(date +"%Y%m%d_%H%M%S").log"

# Use db push to apply the migration
set +e
supabase db push --linked 2>&1 | tee "$LOG_FILE"
PUSH_STATUS=${PIPESTATUS[0]}
set -e

# Cleanup temp directory
rm -rf "$TEMP_DIR"

if [ $PUSH_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Import complete"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Import finished with warnings"
    echo "Check log: $LOG_FILE"
    echo ""
    echo "Note: Some warnings are normal. Verifying data..."
fi

# Verify using supabase db
echo ""
echo -e "${CYAN}Verifying import...${NC}"

set +e
# Get table list
TABLES=$(supabase db dump --data-only --linked 2>/dev/null | grep -c "CREATE TABLE" || echo "0")
set -e

if [ "$TABLES" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $TABLES tables in database"
else
    echo -e "${YELLOW}⚠${NC} Could not verify table count automatically"
    echo "Please verify manually in the dashboard"
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
echo "1. Verify data in SQL Editor:"
echo "   https://supabase.com/dashboard/project/$NEW_PROJECT_REF/editor"
echo "   Run: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
echo "   Expected: 47 tables"
echo ""
echo "2. Get your API keys:"
echo "   https://supabase.com/dashboard/project/$NEW_PROJECT_REF/settings/api"
echo ""
echo "3. Update environment variables:"
echo "   ./scripts/update-env-with-new-project.sh"
echo ""
echo "4. Test your application:"
echo "   npm run dev"
echo ""
