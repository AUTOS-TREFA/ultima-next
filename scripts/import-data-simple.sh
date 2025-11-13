#!/bin/bash

# Simple Data Import Script
# This script imports data from source_data_only.sql to the new project

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Data Import to New Project                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
NEW_PROJECT_REF="pemgwyymodlwabaexxrb"
DATA_FILE="database-backups/source_data_only.sql"
LOG_FILE="database-backups/data_import_final.log"
HOST="aws-1-us-east-2.pooler.supabase.com"
PORT="6543"
USER="postgres.${NEW_PROJECT_REF}"
DATABASE="postgres"

# Check if data file exists
if [ ! -f "$DATA_FILE" ]; then
    echo -e "${RED}✗ Data file not found: $DATA_FILE${NC}"
    exit 1
fi

echo -e "${CYAN}Data file: ${NC}$DATA_FILE"
echo -e "${CYAN}Size: ${NC}$(du -h "$DATA_FILE" | cut -f1)"
echo -e "${CYAN}COPY statements: ${NC}$(grep -c "^COPY " "$DATA_FILE")"
echo ""
echo -e "${CYAN}Target: ${NC}$NEW_PROJECT_REF"
echo -e "${CYAN}Host: ${NC}$HOST"
echo -e "${CYAN}Port: ${NC}$PORT"
echo -e "${CYAN}User: ${NC}$USER"
echo ""

# Prompt for password
echo -e "${YELLOW}Enter database password for $NEW_PROJECT_REF:${NC}"
read -s DB_PASSWORD
echo ""

echo -e "${CYAN}Starting import at: ${NC}$(date)"
echo ""

# Execute import
PGPASSWORD="$DB_PASSWORD" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -f "$DATA_FILE" 2>&1 | tee "$LOG_FILE"

EXIT_CODE=$?

echo ""
echo -e "${CYAN}Finished import at: ${NC}$(date)"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Data import completed successfully!${NC}"
    echo ""
    echo "Log file: $LOG_FILE"
    echo ""
    echo "Verify the import:"
    echo "  Check table counts in SQL Editor:"
    echo "  https://supabase.com/dashboard/project/$NEW_PROJECT_REF/editor"
else
    echo -e "${RED}✗ Data import failed with exit code $EXIT_CODE${NC}"
    echo "Check log file: $LOG_FILE"
    exit $EXIT_CODE
fi
