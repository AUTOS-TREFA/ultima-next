#!/bin/bash

# Update Next.js environment configuration with new Supabase project

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Update Next.js with New Supabase Project             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# Check if new project config exists
CONFIG_FILE="database-backups/new_project_config.txt"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Found new project configuration"
    source "$CONFIG_FILE"
    echo "  Project Ref: $NEW_PROJECT_REF"
    echo "  Project URL: $NEW_PROJECT_URL"
    echo ""
fi

# Get project details if not in config
if [ -z "$NEW_PROJECT_REF" ]; then
    echo -e "${YELLOW}Enter your NEW project reference ID:${NC}"
    read -p "Project Ref: " NEW_PROJECT_REF
    NEW_PROJECT_URL="https://${NEW_PROJECT_REF}.supabase.co"
fi

if [ -z "$NEW_PROJECT_REF" ]; then
    echo -e "${RED}✗ No project ref provided${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Get your API keys from:${NC}"
echo "https://supabase.com/dashboard/project/$NEW_PROJECT_REF/settings/api"
echo ""

echo -e "${YELLOW}Enter your NEW anon (public) key:${NC}"
read -p "Anon Key: " NEW_ANON_KEY
echo ""

if [ -z "$NEW_ANON_KEY" ]; then
    echo -e "${RED}✗ No anon key provided${NC}"
    exit 1
fi

echo -e "${YELLOW}Enter your NEW service_role key:${NC}"
read -sp "Service Role Key: " NEW_SERVICE_ROLE_KEY
echo ""
echo ""

if [ -z "$NEW_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}✗ No service role key provided${NC}"
    exit 1
fi

echo -e "${YELLOW}Enter your database password:${NC}"
read -sp "DB Password: " NEW_DB_PASSWORD
echo ""
echo ""

if [ -z "$NEW_DB_PASSWORD" ]; then
    echo -e "${RED}✗ No database password provided${NC}"
    exit 1
fi

# Backup existing .env.local
if [ -f ".env.local" ]; then
    BACKUP_FILE=".env.local.backup.$(date +"%Y%m%d_%H%M%S")"
    cp .env.local "$BACKUP_FILE"
    echo -e "${GREEN}✓${NC} Backed up .env.local to: $BACKUP_FILE"
fi

# Create new .env.local
echo ""
echo -e "${CYAN}Updating .env.local...${NC}"

cat > .env.local << ENDENV
# Supabase Configuration (Updated $(date))
NEXT_PUBLIC_SUPABASE_URL=$NEW_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$NEW_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD=$NEW_DB_PASSWORD

# Google OAuth (if you use it - get from Google Cloud Console)
GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET:-}

# Add any other environment variables your app needs below:

ENDENV

echo -e "${GREEN}✓${NC} Updated .env.local"

# Update .env if it exists
if [ -f ".env" ]; then
    echo ""
    echo -e "${CYAN}Updating .env...${NC}"
    BACKUP_ENV=".env.backup.$(date +"%Y%m%d_%H%M%S")"
    cp .env "$BACKUP_ENV"

    # Update .env with new values
    sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$NEW_PROJECT_URL|g" .env
    sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEW_ANON_KEY|g" .env
    sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$NEW_SERVICE_ROLE_KEY|g" .env
    sed -i.bak "s|SUPABASE_DB_PASSWORD=.*|SUPABASE_DB_PASSWORD=$NEW_DB_PASSWORD|g" .env
    rm .env.bak

    echo -e "${GREEN}✓${NC} Updated .env (backup: $BACKUP_ENV)"
fi

# Search for hardcoded references
echo ""
echo -e "${CYAN}Searching for hardcoded project references...${NC}"
echo ""

SEARCH_PATTERNS=(
    "wmtlzfodmrchgqdbxjln"
    "jjepfehmuybpctdzipnu"
)

for pattern in "${SEARCH_PATTERNS[@]}"; do
    echo "Searching for: $pattern"
    MATCHES=$(grep -r "$pattern" src/ --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo -e "${YELLOW}⚠ Found references:${NC}"
        echo "$MATCHES"
        echo ""
    else
        echo -e "${GREEN}✓${NC} No references found"
    fi
done

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Configuration Updated! ✓                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

echo "Files updated:"
echo "  ✓ .env.local"
[ -f ".env" ] && echo "  ✓ .env"
echo ""

echo "Backups created:"
ls -lh .env*.backup.* 2>/dev/null | awk '{print "  •", $9, "("$5")"}'
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Review the updated environment files:"
echo "   cat .env.local"
echo ""
echo "2. If you found hardcoded references above, update them manually"
echo ""
echo "3. Test the application:"
echo "   npm run dev"
echo ""
echo "4. Test authentication and data loading"
echo ""
echo "5. Once verified, update Cloud Run (if deploying):"
echo "   gcloud run services update next-js-trefa \\"
echo "     --region us-central1 \\"
echo "     --update-env-vars \\"
echo "NEXT_PUBLIC_SUPABASE_URL=$NEW_PROJECT_URL,\\"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEW_ANON_KEY,\\"
echo "SUPABASE_SERVICE_ROLE_KEY=$NEW_SERVICE_ROLE_KEY"
echo ""
