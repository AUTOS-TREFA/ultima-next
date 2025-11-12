#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  Supabase Database Migration Script                                  ║
# ║  Safely migrate from source to target database                       ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

# Source Database (READ ONLY)
SOURCE_PROJECT_REF="jjepfehmuybpctdzipnu"
SOURCE_DB_HOST="db.${SOURCE_PROJECT_REF}.supabase.co"
SOURCE_DB_PORT="5432"
SOURCE_DB_NAME="postgres"
SOURCE_DB_USER="postgres"

# Target Database (WRITE)
TARGET_PROJECT_REF="wmtlzfodmrchgqdbxjln"
TARGET_DB_HOST="db.${TARGET_PROJECT_REF}.supabase.co"
TARGET_DB_PORT="5432"
TARGET_DB_NAME="postgres"
TARGET_DB_USER="postgres"

# Backup directory
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MIGRATION_LOG="${BACKUP_DIR}/migration_${TIMESTAMP}.log"

# ═══════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

log() {
    if [ -f "$MIGRATION_LOG" ]; then
        echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
    else
        echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    fi
}

log_success() {
    if [ -f "$MIGRATION_LOG" ]; then
        echo -e "${GREEN}✓${NC} $1" | tee -a "$MIGRATION_LOG"
    else
        echo -e "${GREEN}✓${NC} $1"
    fi
}

log_warning() {
    if [ -f "$MIGRATION_LOG" ]; then
        echo -e "${YELLOW}⚠${NC} $1" | tee -a "$MIGRATION_LOG"
    else
        echo -e "${YELLOW}⚠${NC} $1"
    fi
}

log_error() {
    if [ -f "$MIGRATION_LOG" ]; then
        echo -e "${RED}✗${NC} $1" | tee -a "$MIGRATION_LOG"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

log_step() {
    if [ -f "$MIGRATION_LOG" ]; then
        echo "" | tee -a "$MIGRATION_LOG"
        echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}" | tee -a "$MIGRATION_LOG"
        echo -e "${BLUE}$1${NC}" | tee -a "$MIGRATION_LOG"
        echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}" | tee -a "$MIGRATION_LOG"
        echo "" | tee -a "$MIGRATION_LOG"
    else
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}$1${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
        echo ""
    fi
}

# ═══════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════

clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║           SUPABASE DATABASE MIGRATION TOOL                           ║
║                                                                       ║
║  Source: jjepfehmuybpctdzipnu (READ ONLY)                           ║
║  Target: wmtlzfodmrchgqdbxjln (WRITE)                               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 0: Pre-Flight Checks"

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    echo ""
    echo "Installation instructions:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi
log_success "pg_dump found: $(pg_dump --version | head -1)"

# Check if pg_restore is installed
if ! command -v pg_restore &> /dev/null; then
    log_error "pg_restore not found. Please install PostgreSQL client tools."
    exit 1
fi
log_success "pg_restore found: $(pg_restore --version | head -1)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
log_success "Backup directory ready: $BACKUP_DIR"

# Initialize log file
echo "Migration started at $(date)" > "$MIGRATION_LOG"
log_success "Log file created: $MIGRATION_LOG"

# ═══════════════════════════════════════════════════════════════════════
# PASSWORD INPUT
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 1: Database Credentials"

echo -e "${YELLOW}Please provide database passwords:${NC}"
echo ""

# Source database password
echo -n "Source database password (jjepfehmuybpctdzipnu): "
read -s SOURCE_DB_PASSWORD
echo ""

if [ -z "$SOURCE_DB_PASSWORD" ]; then
    log_error "Source database password cannot be empty"
    exit 1
fi

# Target database password
echo -n "Target database password (wmtlzfodmrchgqdbxjln): "
read -s TARGET_DB_PASSWORD
echo ""

if [ -z "$TARGET_DB_PASSWORD" ]; then
    log_error "Target database password cannot be empty"
    exit 1
fi

log_success "Credentials received"

# Export passwords for pg_dump/pg_restore
export PGPASSWORD_SOURCE="$SOURCE_DB_PASSWORD"
export PGPASSWORD_TARGET="$TARGET_DB_PASSWORD"

# ═══════════════════════════════════════════════════════════════════════
# CONFIRMATION
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 2: Migration Confirmation"

echo -e "${RED}⚠️  WARNING: THIS OPERATION WILL OVERWRITE THE TARGET DATABASE${NC}"
echo ""
echo -e "Source: ${GREEN}$SOURCE_PROJECT_REF${NC} (READ ONLY)"
echo -e "Target: ${RED}$TARGET_PROJECT_REF${NC} (WILL BE OVERWRITTEN)"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  1. Export ALL schema and data from source database"
echo "  2. Create a backup of target database"
echo "  3. Drop and recreate target database schema"
echo "  4. Import all data into target database"
echo ""
echo -e "${RED}All existing data in target database will be REPLACED!${NC}"
echo ""

read -p "Type 'MIGRATE' to confirm you want to proceed: " -r
echo

if [[ ! $REPLY == "MIGRATE" ]]; then
    log_warning "Migration cancelled by user"
    exit 0
fi

log_success "User confirmed migration"

# ═══════════════════════════════════════════════════════════════════════
# STEP 3: ANALYZE SOURCE DATABASE
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 3: Analyzing Source Database"

log "Connecting to source database..."

# Test connection and get table count
SOURCE_TABLE_COUNT=$(PGPASSWORD="$SOURCE_DB_PASSWORD" psql \
    -h "$SOURCE_DB_HOST" \
    -p "$SOURCE_DB_PORT" \
    -U "$SOURCE_DB_USER" \
    -d "$SOURCE_DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)

if [ $? -ne 0 ]; then
    log_error "Failed to connect to source database"
    log_error "$SOURCE_TABLE_COUNT"
    exit 1
fi

SOURCE_TABLE_COUNT=$(echo $SOURCE_TABLE_COUNT | xargs)
log_success "Connected to source database"
log "Tables in public schema: $SOURCE_TABLE_COUNT"

# Get database size
SOURCE_DB_SIZE=$(PGPASSWORD="$SOURCE_DB_PASSWORD" psql \
    -h "$SOURCE_DB_HOST" \
    -p "$SOURCE_DB_PORT" \
    -U "$SOURCE_DB_USER" \
    -d "$SOURCE_DB_NAME" \
    -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" 2>&1)

SOURCE_DB_SIZE=$(echo $SOURCE_DB_SIZE | xargs)
log "Source database size: $SOURCE_DB_SIZE"

# ═══════════════════════════════════════════════════════════════════════
# STEP 4: BACKUP TARGET DATABASE
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 4: Creating Backup of Target Database"

TARGET_BACKUP_FILE="${BACKUP_DIR}/target_backup_${TIMESTAMP}.sql"

log "Creating backup: $TARGET_BACKUP_FILE"

PGPASSWORD="$TARGET_DB_PASSWORD" pg_dump \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --file="$TARGET_BACKUP_FILE" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$TARGET_BACKUP_FILE" | cut -f1)
    log_success "Target database backup created: $BACKUP_SIZE"
else
    log_error "Failed to create target database backup"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 5: EXPORT SOURCE SCHEMA
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 5: Exporting Source Database Schema"

SCHEMA_FILE="${BACKUP_DIR}/source_schema_${TIMESTAMP}.sql"

log "Exporting schema (DDL only)..."

PGPASSWORD="$SOURCE_DB_PASSWORD" pg_dump \
    -h "$SOURCE_DB_HOST" \
    -p "$SOURCE_DB_PORT" \
    -U "$SOURCE_DB_USER" \
    -d "$SOURCE_DB_NAME" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --file="$SCHEMA_FILE" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    SCHEMA_SIZE=$(du -h "$SCHEMA_FILE" | cut -f1)
    log_success "Schema exported: $SCHEMA_SIZE"
else
    log_error "Failed to export schema"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 6: EXPORT SOURCE DATA
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 6: Exporting Source Database Data"

DATA_FILE="${BACKUP_DIR}/source_data_${TIMESTAMP}.sql"

log "Exporting data (this may take several minutes for large databases)..."

PGPASSWORD="$SOURCE_DB_PASSWORD" pg_dump \
    -h "$SOURCE_DB_HOST" \
    -p "$SOURCE_DB_PORT" \
    -U "$SOURCE_DB_USER" \
    -d "$SOURCE_DB_NAME" \
    --data-only \
    --no-owner \
    --no-privileges \
    --disable-triggers \
    --file="$DATA_FILE" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    DATA_SIZE=$(du -h "$DATA_FILE" | cut -f1)
    log_success "Data exported: $DATA_SIZE"
else
    log_error "Failed to export data"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 7: CLEAN TARGET DATABASE
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 7: Cleaning Target Database"

log_warning "Dropping all tables in target database..."

# Drop all tables in public schema
PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    log_success "Target database cleaned"
else
    log_error "Failed to clean target database"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 8: IMPORT SCHEMA TO TARGET
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 8: Importing Schema to Target Database"

log "Applying schema..."

PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -f "$SCHEMA_FILE" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    log_success "Schema imported successfully"
else
    log_error "Failed to import schema"
    log_warning "You can restore target database from: $TARGET_BACKUP_FILE"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 9: IMPORT DATA TO TARGET
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 9: Importing Data to Target Database"

log "Importing data (this may take several minutes)..."

PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -f "$DATA_FILE" 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    log_success "Data imported successfully"
else
    log_error "Failed to import data"
    log_warning "You can restore target database from: $TARGET_BACKUP_FILE"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 10: VERIFY MIGRATION
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 10: Verifying Migration"

# Get target table count
TARGET_TABLE_COUNT=$(PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)

TARGET_TABLE_COUNT=$(echo $TARGET_TABLE_COUNT | xargs)

log "Source tables: $SOURCE_TABLE_COUNT"
log "Target tables: $TARGET_TABLE_COUNT"

if [ "$SOURCE_TABLE_COUNT" -eq "$TARGET_TABLE_COUNT" ]; then
    log_success "Table count matches!"
else
    log_warning "Table count mismatch - review migration log"
fi

# Get target database size
TARGET_DB_SIZE=$(PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" 2>&1)

TARGET_DB_SIZE=$(echo $TARGET_DB_SIZE | xargs)

log "Source database size: $SOURCE_DB_SIZE"
log "Target database size: $TARGET_DB_SIZE"

# ═══════════════════════════════════════════════════════════════════════
# STEP 11: UPDATE SEQUENCES
# ═══════════════════════════════════════════════════════════════════════

log_step "STEP 11: Updating Sequences"

log "Resetting sequences to prevent ID conflicts..."

PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" \
    -p "$TARGET_DB_PORT" \
    -U "$TARGET_DB_USER" \
    -d "$TARGET_DB_NAME" \
    -c "
    DO \$\$
    DECLARE
        seq_record RECORD;
    BEGIN
        FOR seq_record IN
            SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
        LOOP
            EXECUTE 'SELECT setval(''' || seq_record.sequence_name || ''', COALESCE((SELECT MAX(id) FROM ' ||
                    regexp_replace(seq_record.sequence_name, '_id_seq$', '') || '), 1))';
        END LOOP;
    END \$\$;
    " 2>&1 | tee -a "$MIGRATION_LOG"

if [ $? -eq 0 ]; then
    log_success "Sequences updated"
else
    log_warning "Some sequences may not have been updated - review manually"
fi

# ═══════════════════════════════════════════════════════════════════════
# COMPLETION
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    MIGRATION COMPLETED SUCCESSFULLY! ✓                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_success "Migration completed at $(date)"

echo -e "${CYAN}Files created:${NC}"
echo "  • Migration log:        $MIGRATION_LOG"
echo "  • Target backup:        $TARGET_BACKUP_FILE (restore if needed)"
echo "  • Source schema export: $SCHEMA_FILE"
echo "  • Source data export:   $DATA_FILE"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test your application with the migrated database"
echo "  2. Verify critical data exists and is correct"
echo "  3. Test user authentication"
echo "  4. Run application tests if available"
echo "  5. Keep backup files until you confirm everything works"
echo ""

echo -e "${CYAN}To restore target database from backup if needed:${NC}"
echo "  psql -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER -d $TARGET_DB_NAME -f $TARGET_BACKUP_FILE"
echo ""

# Clean up password exports
unset PGPASSWORD_SOURCE
unset PGPASSWORD_TARGET

log_success "Database migration script completed successfully"
