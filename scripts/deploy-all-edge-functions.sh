#!/bin/bash

# Deploy all Edge Functions to new Supabase project

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
║         Deploy Edge Functions to New Project              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

NEW_PROJECT_REF="pemgwyymodlwabaexxrb"

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}✗ Not logged in to Supabase CLI${NC}"
    echo "Please run: supabase login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Authenticated to Supabase"
echo ""

# Link to new project
echo -e "${CYAN}Linking to new project...${NC}"
supabase link --project-ref "$NEW_PROJECT_REF"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to link to project${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Linked to project: $NEW_PROJECT_REF"
echo ""

# Get list of functions
FUNCTIONS_DIR="supabase/functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
    echo -e "${RED}✗ Functions directory not found: $FUNCTIONS_DIR${NC}"
    exit 1
fi

# Count functions
FUNCTION_COUNT=$(ls -1 "$FUNCTIONS_DIR" | wc -l | xargs)
echo -e "${CYAN}Found $FUNCTION_COUNT functions to deploy${NC}"
echo ""

# Deploy each function
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_FUNCTIONS=()

for func_dir in "$FUNCTIONS_DIR"/*; do
    if [ -d "$func_dir" ]; then
        FUNC_NAME=$(basename "$func_dir")

        # Skip if not a real function directory
        if [ ! -f "$func_dir/index.ts" ] && [ ! -f "$func_dir/index.js" ]; then
            echo -e "${YELLOW}⚠${NC} Skipping $FUNC_NAME (no index file)"
            continue
        fi

        echo -e "${BLUE}Deploying: $FUNC_NAME${NC}"

        set +e
        supabase functions deploy "$FUNC_NAME" --project-ref "$NEW_PROJECT_REF" 2>&1 | grep -v "Warning"
        DEPLOY_STATUS=$?
        set -e

        if [ $DEPLOY_STATUS -eq 0 ]; then
            echo -e "${GREEN}✓${NC} $FUNC_NAME deployed successfully"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}✗${NC} $FUNC_NAME failed to deploy"
            FAILED_FUNCTIONS+=("$FUNC_NAME")
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
        echo ""
    fi
done

# Summary
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              Edge Functions Deployment Complete            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

echo "Deployment Summary:"
echo -e "  ${GREEN}✓${NC} Successful: $SUCCESS_COUNT"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "  ${RED}✗${NC} Failed: $FAIL_COUNT"
    echo ""
    echo "Failed functions:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "    • $func"
    done
    echo ""
    echo "You can manually deploy failed functions with:"
    echo "  supabase functions deploy FUNCTION_NAME --project-ref $NEW_PROJECT_REF"
fi

echo ""
echo "Verify deployed functions:"
echo "  supabase functions list --project-ref $NEW_PROJECT_REF"
echo ""
echo "Or in dashboard:"
echo "  https://supabase.com/dashboard/project/$NEW_PROJECT_REF/functions"
echo ""
