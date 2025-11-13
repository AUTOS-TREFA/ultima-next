#!/bin/bash

# Generate SQL export script for manual database migration
# This creates SQL commands you can run in Supabase SQL Editor

OUTPUT_FILE="database-backups/export_commands.sql"
mkdir -p database-backups

cat > "$OUTPUT_FILE" << 'EOFEXPORT'
-- ============================================================================
-- DATABASE EXPORT SCRIPT
-- Run these commands in Source Database SQL Editor
-- Project: jjepfehmuybpctdzipnu
-- ============================================================================

-- Step 1: Export Schema (DDL)
-- Copy the output and save to: database-backups/schema.sql
-- ============================================================================

-- Get all table creation statements
SELECT
    'CREATE TABLE IF NOT EXISTS ' ||
    schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY schemaname, tablename;

-- Get all indexes
SELECT indexdef || ';'
FROM pg_indexes
WHERE schemaname = 'public';

-- Get all foreign keys
SELECT
    'ALTER TABLE ' || tc.table_name ||
    ' ADD CONSTRAINT ' || tc.constraint_name ||
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ');'
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';


-- ============================================================================
-- Step 2: Export Data for Each Table
-- For each table below, copy data and save to separate CSV files
-- ============================================================================

-- First, get list of all tables
SELECT 'Table: ' || table_name || ' (' ||
    (SELECT COUNT(*) FROM information_schema.columns c
     WHERE c.table_name = t.table_name AND c.table_schema = 'public') || ' columns)'
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

EOFEXPORT

echo "✓ Export commands generated: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Open the source database SQL Editor:"
echo "   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/editor"
echo ""
echo "2. Run the queries in: $OUTPUT_FILE"
echo ""
echo "3. Copy and save the results"
echo ""
