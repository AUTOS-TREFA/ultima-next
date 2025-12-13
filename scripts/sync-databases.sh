#!/bin/bash

# Database Sync Script
# Syncs data from source (jjepfehmuybpctdzipnu) to destination (pemgwyymodlwabaexxrb)
# Only syncs data, does NOT modify schemas

set -e

# Database URLs
SOURCE_DB="postgresql://postgres.jjepfehmuybpctdzipnu:Lifeintechnicolor2!@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
DEST_DB="postgresql://postgres.pemgwyymodlwabaexxrb:Lifeintechnicolor2!@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Tables to sync
TABLES=("profiles" "financing_applications" "bank_profiles" "uploaded_documents" "inventario_cache")

echo "=== Database Sync Script ==="
echo "Source: jjepfehmuybpctdzipnu (Backend completo de TREFA)"
echo "Destination: pemgwyymodlwabaexxrb (TREFA Next.js)"
echo ""

# Create temp directory for exports
TEMP_DIR=$(mktemp -d)
echo "Temp directory: $TEMP_DIR"

for TABLE in "${TABLES[@]}"; do
    echo ""
    echo "--- Syncing table: $TABLE ---"

    # Export data from source
    echo "Exporting from source..."
    psql "$SOURCE_DB" -c "\COPY (SELECT * FROM $TABLE) TO '$TEMP_DIR/${TABLE}.csv' WITH CSV HEADER"

    ROW_COUNT=$(wc -l < "$TEMP_DIR/${TABLE}.csv")
    echo "Exported $((ROW_COUNT - 1)) rows"

    # Get columns from destination table (to ensure we only import matching columns)
    DEST_COLUMNS=$(psql "$DEST_DB" -t -c "SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name = '$TABLE' AND table_schema = 'public'")

    echo "Destination columns: $DEST_COLUMNS"

    # Import to destination using temp table approach to handle conflicts
    echo "Importing to destination..."

    # For inventario_cache, use ordencompra as unique key
    # For other tables, use id as unique key
    if [ "$TABLE" = "inventario_cache" ]; then
        psql "$DEST_DB" <<EOF
-- Create temp table
CREATE TEMP TABLE temp_${TABLE} (LIKE $TABLE INCLUDING ALL);

-- Import CSV to temp table
\COPY temp_${TABLE} FROM '$TEMP_DIR/${TABLE}.csv' WITH CSV HEADER;

-- Upsert from temp table to main table
INSERT INTO $TABLE
SELECT * FROM temp_${TABLE}
ON CONFLICT (ordencompra) DO UPDATE SET
  $(psql "$DEST_DB" -t -c "SELECT string_agg(column_name || ' = EXCLUDED.' || column_name, ', ') FROM information_schema.columns WHERE table_name = '$TABLE' AND table_schema = 'public' AND column_name != 'ordencompra'");

-- Drop temp table
DROP TABLE temp_${TABLE};
EOF
    else
        psql "$DEST_DB" <<EOF
-- Create temp table
CREATE TEMP TABLE temp_${TABLE} (LIKE $TABLE INCLUDING ALL);

-- Import CSV to temp table
\COPY temp_${TABLE} FROM '$TEMP_DIR/${TABLE}.csv' WITH CSV HEADER;

-- Upsert from temp table to main table
INSERT INTO $TABLE
SELECT * FROM temp_${TABLE}
ON CONFLICT (id) DO UPDATE SET
  $(psql "$DEST_DB" -t -c "SELECT string_agg(column_name || ' = EXCLUDED.' || column_name, ', ') FROM information_schema.columns WHERE table_name = '$TABLE' AND table_schema = 'public' AND column_name != 'id'");

-- Drop temp table
DROP TABLE temp_${TABLE};
EOF
    fi

    echo "✓ Table $TABLE synced successfully"
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=== Sync Complete ==="
