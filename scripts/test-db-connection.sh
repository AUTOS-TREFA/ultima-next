#!/bin/bash

# Quick test script to diagnose database connection issues

echo "Testing Source Database Connection"
echo "==================================="
echo ""

# Ask for password
echo -n "Enter source database password (jjepfehmuybpctdzipnu): "
read -s SOURCE_PASSWORD
echo ""
echo ""

# Test connection
echo "Attempting to connect..."
echo ""

PGPASSWORD="$SOURCE_PASSWORD" psql \
    -h db.jjepfehmuybpctdzipnu.supabase.co \
    -p 5432 \
    -U postgres \
    -d postgres \
    -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" \
    2>&1

EXIT_CODE=$?

echo ""
echo "Exit code: $EXIT_CODE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ Connection successful!"
else
    echo "✗ Connection failed"
    echo ""
    echo "Common issues:"
    echo "  1. Incorrect password"
    echo "  2. Database is paused (check Supabase dashboard)"
    echo "  3. Network/firewall blocking connection"
    echo "  4. Project doesn't exist or was deleted"
fi

# Clear password
unset PGPASSWORD
