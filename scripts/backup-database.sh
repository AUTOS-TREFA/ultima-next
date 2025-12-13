#!/bin/bash

# Database Backup Script for Supabase
# This script creates a complete backup of your Supabase database

set -e  # Exit on any error

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Configuration
PROJECT_REF="jjepfehmuybpctdzipnu"
DB_PASSWORD="Lifeintechnicolor2!"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Get database connection details (using pooler connection)
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo -e "${YELLOW}📦 Creating backup file: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}📍 Connecting to: ${DB_HOST}${NC}"

# Create the backup using pg_dump
# Note: Excluding tracking_events table due to large size causing SSL timeout
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --schema=public \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --exclude-table=tracking_events \
  -f "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    LINE_COUNT=$(wc -l < "${BACKUP_FILE}")

    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}   File: ${BACKUP_FILE}${NC}"
    echo -e "${GREEN}   Size: ${FILESIZE}${NC}"
    echo -e "${GREEN}   Lines: ${LINE_COUNT}${NC}"
    echo -e "${GREEN}   Timestamp: ${TIMESTAMP}${NC}"

    # Keep only last 10 backups
    echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 10)...${NC}"
    ls -t "${BACKUP_DIR}"/backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    echo -e "${GREEN}✅ Backup process completed!${NC}"
    echo -e "${YELLOW}💡 To restore this backup, run: ./scripts/restore-database.sh ${BACKUP_FILE}${NC}"

    # Save the backup filename for easy reference
    echo "${BACKUP_FILE}" > "${BACKUP_DIR}/latest_backup.txt"

    # Return success
    exit 0
else
    echo -e "${RED}❌ Backup failed!${NC}"
    echo -e "${RED}   Please check your database credentials and connection.${NC}"
    exit 1
fi
