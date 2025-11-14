#!/bin/bash

# TREFA Cloud Run Deployment Script v2
# Implements a "build once, deploy many" strategy.
#
# WORKFLOW:
# 1. Deploy to staging:
#    ./deploy-v2.sh staging
#
# 2. Test the staging environment thoroughly.
#
# 3. Promote the tested version to production:
#    ./deploy-v2.sh promote <commit-hash>
#    (The script will provide the exact command to run after a successful staging deployment)

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
PROJECT_ID="trefa-web-apis-1731136641165"
REGION="us-central1"
REPOSITORY="marianomoralesr"
IMAGE_NAME="app"

# Service names in Cloud Run
STAGING_SERVICE_NAME="app-staging"
PRODUCTION_SERVICE_NAME="app"

# --- Cloudflare Configuration ---
# IMPORTANT: Set these variables securely, e.g., as environment variables
# or using a secret manager. For this script, we'll define them here.
# 1. Go to your domain in the Cloudflare dashboard.
# 2. Find your Zone ID on the "Overview" page (bottom-right).
# 3. Create an API Token: My Profile > API Tokens > Create Token
#    - Use the "Purge Cache" template.
#    - Zone Resources: Include -> Specific zone -> yourdomain.com
CLOUDFLARE_ZONE_ID="aacada2c4c8bca55be5a06fbcff2f5e8"
CLOUDFLARE_API_TOKEN="AfSpbCcRu6Fq629PjzEJxClKaXXA2zM9-pXZ1-c2"

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
function print_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   TREFA Cloud Run Deployment Script (v2)      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
}

function purge_cloudflare_cache() {
    echo -e "${YELLOW}Purging Cloudflare cache...${NC}"

    if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ "$CLOUDFLARE_ZONE_ID" == "YOUR_ZONE_ID" ]; then
        echo -e "${RED}✗ Error: CLOUDFLARE_ZONE_ID is not set.${NC}"
        echo "Please set it at the top of the script."
        exit 1
    fi

    if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ "$CLOUDFLARE_API_TOKEN" == "YOUR_API_TOKEN" ]; then
        echo -e "${RED}✗ Error: CLOUDFLARE_API_TOKEN is not set.${NC}"
        echo "Please set it at the top of the script."
        exit 1
    fi

    local response_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"purge_everything":true}')

    if [ "$response_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Cloudflare cache purged successfully.${NC}"
    else
        echo -e "${RED}✗ Error: Failed to purge Cloudflare cache.${NC}"
        echo "  - HTTP Status Code: $response_code"
        echo "  - Check your Zone ID and API Token."
        # Do not exit, as the deployment itself was successful.
        # This is a post-deployment step.
    fi
    echo ""
}

function run_git_checks() {
    echo -e "${YELLOW}[1/6] Running Git pre-deployment checks...${NC}"

    # Check for uncommitted changes
    if ! git diff --quiet HEAD; then
        echo -e "${RED}✗ Error: Your working directory has uncommitted changes.${NC}"
        echo "Please commit or stash your changes before deploying."
        git status --short
        exit 1
    fi

    # Check if on main branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        echo -e "${RED}✗ Error: You must be on the 'main' branch to deploy.${NC}"
        echo "Your current branch is '$current_branch'."
        exit 1
    fi

    # Check if remote tracking branch exists
    if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
        echo -e "${RED}✗ Error: Your 'main' branch is not tracking a remote branch.${NC}"
        echo "Please set up remote tracking with: git branch --set-upstream-to=origin/main main"
        exit 1
    fi

    echo "Fetching latest changes from remote..."
    git fetch origin

    local_commit=$(git rev-parse HEAD)
    remote_commit=$(git rev-parse @{u})

    if [ "$local_commit" != "$remote_commit" ]; then
        # Check if local is ahead, behind, or diverged
        local commits_behind=$(git rev-list HEAD..@{u} --count)
        local commits_ahead=$(git rev-list @{u}..HEAD --count)

        if [ "$commits_behind" -gt 0 ] && [ "$commits_ahead" -eq 0 ]; then
            echo -e "${RED}✗ Error: Your local 'main' branch is BEHIND the remote by $commits_behind commit(s).${NC}"
            echo "Please run 'git pull' to sync your branch."
            exit 1
        elif [ "$commits_ahead" -gt 0 ] && [ "$commits_behind" -eq 0 ]; then
            echo -e "${RED}✗ Error: Your local 'main' branch is AHEAD of the remote by $commits_ahead commit(s).${NC}"
            echo "Please run 'git push' to sync your branch."
            exit 1
        else
            echo -e "${RED}✗ Error: Your local 'main' branch has DIVERGED from the remote.${NC}"
            echo "Behind: $commits_behind commits | Ahead: $commits_ahead commits"
            echo "Please resolve this with rebase or merge."
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ Git checks passed. You are on the latest version of 'main'.${NC}"
    echo -e "  Current commit: ${YELLOW}$(git rev-parse --short HEAD)${NC}"
    echo -e "  Commit message: ${BLUE}$(git log -1 --pretty=%B | head -n 1)${NC}"
    echo -e "  Author: $(git log -1 --pretty=%an)"
    echo -e "  Date: $(git log -1 --pretty=%ar)"
    echo ""
}

function parse_env_vars() {
    # Parse cloud-build-vars.yaml into Cloud Run env var format
    # Handles quoted values, comments, and proper escaping
    local env_string=""

    while IFS=': ' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue

        # Remove quotes and whitespace from value
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | xargs)

        # Skip if value is empty
        [[ -z "$value" ]] && continue

        # Append to env string
        if [ -z "$env_string" ]; then
            env_string="$key=$value"
        else
            env_string="$env_string,$key=$value"
        fi
    done < cloud-build-vars.yaml

    echo "$env_string"
}

function deploy_staging() {
    local git_commit_short=$(git rev-parse --short HEAD)
    local git_commit_full=$(git rev-parse HEAD)
    local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local image_url="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$git_commit_short"

    echo -e "${BLUE}Starting STAGING deployment for commit ${YELLOW}$git_commit_short${NC}"
    echo -e "Full commit: ${BLUE}$git_commit_full${NC}"
    echo -e "Image URL: ${BLUE}$image_url${NC}"
    echo ""

    # --- Step 2: Build Docker Image ---
    echo -e "${YELLOW}[2/6] Building Docker image with version info...${NC}"

    # Read build-time credentials from cloud-build-vars.yaml
    # Next.js requires NEXT_PUBLIC_ prefix for client-side environment variables
    NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID=$(grep "^NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_INTELIMOTOR_API_KEY=$(grep "^NEXT_PUBLIC_INTELIMOTOR_API_KEY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_INTELIMOTOR_API_SECRET=$(grep "^NEXT_PUBLIC_INTELIMOTOR_API_SECRET:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY=$(grep "^NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID=$(grep "^NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID=$(grep "^NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW=$(grep "^NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID=$(grep "^NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY=$(grep "^NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID=$(grep "^NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID=$(grep "^NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_IMAGE_CDN_URL=$(grep "^NEXT_PUBLIC_IMAGE_CDN_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=$(grep "^NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CAR_STUDIO_API_KEY=$(grep "^NEXT_PUBLIC_CAR_STUDIO_API_KEY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL=$(grep "^NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_LANDING_WEBHOOK_URL=$(grep "^NEXT_PUBLIC_LANDING_WEBHOOK_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_APPLICATION_WEBHOOK_URL=$(grep "^NEXT_PUBLIC_APPLICATION_WEBHOOK_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_PROXY_URL=$(grep "^NEXT_PUBLIC_PROXY_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CALENDLY_URL_MTY=$(grep "^NEXT_PUBLIC_CALENDLY_URL_MTY:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CALENDLY_URL_TMPS=$(grep "^NEXT_PUBLIC_CALENDLY_URL_TMPS:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CALENDLY_URL_COAH=$(grep "^NEXT_PUBLIC_CALENDLY_URL_COAH:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CALENDLY_URL_GPE=$(grep "^NEXT_PUBLIC_CALENDLY_URL_GPE:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)
    NEXT_PUBLIC_CLOUD_RUN_URL=$(grep "^NEXT_PUBLIC_CLOUD_RUN_URL:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\?\(.*\)"\?$/\1/' | xargs)

    echo "Building with:"
    echo "  • Git Commit: $git_commit_short"
    echo "  • Build Date: $build_date"
    echo "  • Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
    echo "  • Intelimotor Business Unit: $NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID"
    echo ""

    docker build \
      --platform linux/amd64 \
      --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
      --build-arg NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID="$NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID" \
      --build-arg NEXT_PUBLIC_INTELIMOTOR_API_KEY="$NEXT_PUBLIC_INTELIMOTOR_API_KEY" \
      --build-arg NEXT_PUBLIC_INTELIMOTOR_API_SECRET="$NEXT_PUBLIC_INTELIMOTOR_API_SECRET" \
      --build-arg NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY="$NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY" \
      --build-arg NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID="$NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID" \
      --build-arg NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID="$NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID" \
      --build-arg NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW="$NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW" \
      --build-arg NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID="$NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID" \
      --build-arg NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY="$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY" \
      --build-arg NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID="$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID" \
      --build-arg NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID="$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID" \
      --build-arg NEXT_PUBLIC_IMAGE_CDN_URL="$NEXT_PUBLIC_IMAGE_CDN_URL" \
      --build-arg NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL="$NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL" \
      --build-arg NEXT_PUBLIC_CAR_STUDIO_API_KEY="$NEXT_PUBLIC_CAR_STUDIO_API_KEY" \
      --build-arg NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL="$NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL" \
      --build-arg NEXT_PUBLIC_LANDING_WEBHOOK_URL="$NEXT_PUBLIC_LANDING_WEBHOOK_URL" \
      --build-arg NEXT_PUBLIC_APPLICATION_WEBHOOK_URL="$NEXT_PUBLIC_APPLICATION_WEBHOOK_URL" \
      --build-arg NEXT_PUBLIC_PROXY_URL="$NEXT_PUBLIC_PROXY_URL" \
      --build-arg NEXT_PUBLIC_CALENDLY_URL_MTY="$NEXT_PUBLIC_CALENDLY_URL_MTY" \
      --build-arg NEXT_PUBLIC_CALENDLY_URL_TMPS="$NEXT_PUBLIC_CALENDLY_URL_TMPS" \
      --build-arg NEXT_PUBLIC_CALENDLY_URL_COAH="$NEXT_PUBLIC_CALENDLY_URL_COAH" \
      --build-arg NEXT_PUBLIC_CALENDLY_URL_GPE="$NEXT_PUBLIC_CALENDLY_URL_GPE" \
      --build-arg NEXT_PUBLIC_CLOUD_RUN_URL="$NEXT_PUBLIC_CLOUD_RUN_URL" \
      --build-arg NEXT_PUBLIC_GIT_COMMIT="$git_commit_short" \
      --build-arg NEXT_PUBLIC_BUILD_DATE="$build_date" \
      --build-arg NEXT_PUBLIC_ENVIRONMENT="staging" \
      -t "$image_url" \
      .
    echo -e "${GREEN}✓ Docker image built successfully.${NC}"
    echo ""

    # --- Step 3: Push to Artifact Registry ---
    echo -e "${YELLOW}[3/6] Pushing image to Artifact Registry...${NC}"
    gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
    docker push "$image_url"
    echo -e "${GREEN}✓ Image pushed successfully.${NC}"
    echo ""

    # --- Step 4: Deploy to Cloud Run (Staging) ---
    echo -e "${YELLOW}[4/6] Deploying to Cloud Run (Staging)...${NC}"

    if [ ! -f "cloud-build-vars.yaml" ]; then
        echo -e "${RED}✗ Error: cloud-build-vars.yaml not found.${NC}"
        exit 1
    fi

    # Parse environment variables properly
    local env_vars=$(parse_env_vars)

    # Add version metadata (Next.js environment variables)
    env_vars="$env_vars,NEXT_PUBLIC_GIT_COMMIT=$git_commit_short,NEXT_PUBLIC_BUILD_DATE=$build_date,NEXT_PUBLIC_ENVIRONMENT=staging"

    gcloud run deploy "$STAGING_SERVICE_NAME" \
      --image="$image_url" \
      --platform=managed \
      --region="$REGION" \
      --allow-unauthenticated \
      --port=8080 \
      --memory=512Mi \
      --cpu=1 \
      --min-instances=0 \
      --max-instances=10 \
      --timeout=300 \
      --set-env-vars="$env_vars" \
      --quiet

    local service_url=$(gcloud run services describe "$STAGING_SERVICE_NAME" --region="$REGION" --format='value(status.url)')

    echo -e "${YELLOW}[5/6] Updating staging environment with its own URL...${NC}"
    gcloud run services update "$STAGING_SERVICE_NAME" \
        --region="$REGION" \
        --update-env-vars="NEXT_PUBLIC_FRONTEND_URL=$service_url" \
        --quiet
    echo -e "${GREEN}✓ Staging service updated.${NC}"
    echo ""

    # --- Step 6: Verify deployment ---
    echo -e "${YELLOW}[6/6] Verifying deployment...${NC}"
    local deployed_version=$(gcloud run services describe "$STAGING_SERVICE_NAME" --region="$REGION" --format='value(spec.template.metadata.annotations.client.knative.dev/user-image)')
    echo -e "Deployed image: ${BLUE}$deployed_version${NC}"
    echo -e "${GREEN}✓ Deployment verified.${NC}"
    echo ""

    # --- Success ---
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      STAGING DEPLOYMENT SUCCESSFUL! 🎉        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Service URL: ${BLUE}$service_url${NC}"
    echo -e "Version: ${YELLOW}$git_commit_short${NC}"
    echo -e "Build Date: ${BLUE}$build_date${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Test thoroughly on staging:"
    echo -e "   ${BLUE}$service_url${NC}"
    echo ""
    echo "2. Check version in footer (should show: v$git_commit_short)"
    echo ""
    echo "3. Verify all features work as expected"
    echo ""
    echo "4. When ready to go live, promote to production:"
    echo -e "   ${GREEN}./deploy-v2.sh promote $git_commit_short${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

function promote_to_production() {
    local git_commit_short=$1
    if [ -z "$git_commit_short" ]; then
        echo -e "${RED}✗ Error: You must specify the commit hash of the version to promote.${NC}"
        echo "Example: ./deploy-v2.sh promote a1b2c3d"
        exit 1
    fi

    local image_url="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$git_commit_short"

    # Verify the image exists in the registry
    echo -e "${YELLOW}Verifying image exists in Artifact Registry...${NC}"
    if ! gcloud artifacts docker images describe "$image_url" > /dev/null 2>&1; then
        echo -e "${RED}✗ Error: Image not found in Artifact Registry!${NC}"
        echo -e "Image URL: ${BLUE}$image_url${NC}"
        echo ""
        echo "This version may not have been deployed to staging yet."
        echo "Please deploy to staging first: ./deploy-v2.sh staging"
        exit 1
    fi
    echo -e "${GREEN}✓ Image found in registry.${NC}"
    echo ""

    # Get build metadata from the image
    local build_date=$(gcloud artifacts docker images describe "$image_url" --format='value(image_summary.digest)' 2>/dev/null || echo "unknown")

    echo -e "${RED}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️        ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "You are about to deploy to PRODUCTION:"
    echo ""
    echo -e "  Service:     ${BLUE}$PRODUCTION_SERVICE_NAME${NC}"
    echo -e "  Version:     ${YELLOW}$git_commit_short${NC}"
    echo -e "  Image URL:   ${BLUE}$image_url${NC}"
    echo -e "  Production:  ${GREEN}https://trefa.mx${NC}"
    echo ""
    read -p "Type 'yes' to confirm deployment to production: " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo -e "${YELLOW}Promotion cancelled.${NC}"
        exit 0
    fi
    echo ""

    echo -e "${YELLOW}[1/4] Parsing environment variables...${NC}"
    if [ ! -f "cloud-build-vars.yaml" ]; then
        echo -e "${RED}✗ Error: cloud-build-vars.yaml not found.${NC}"
        exit 1
    fi

    # Parse environment variables properly
    local env_vars=$(parse_env_vars)

    # Get the build date from the environment or use current date
    local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Add production-specific environment variables (Next.js)
    env_vars="NEXT_PUBLIC_FRONTEND_URL=https://trefa.mx,$env_vars,NEXT_PUBLIC_GIT_COMMIT=$git_commit_short,NEXT_PUBLIC_BUILD_DATE=$build_date,NEXT_PUBLIC_ENVIRONMENT=production"

    echo -e "${GREEN}✓ Environment variables parsed.${NC}"
    echo ""

    echo -e "${YELLOW}[2/4] Deploying to Cloud Run (Production)...${NC}"
    gcloud run deploy "$PRODUCTION_SERVICE_NAME" \
      --image="$image_url" \
      --platform=managed \
      --region="$REGION" \
      --allow-unauthenticated \
      --port=8080 \
      --memory=512Mi \
      --cpu=1 \
      --min-instances=0 \
      --max-instances=10 \
      --timeout=300 \
      --set-env-vars="$env_vars" \
      --quiet

    echo -e "${GREEN}✓ Production deployment complete.${NC}"
    echo ""

    # --- Verify deployment ---
    echo -e "${YELLOW}[3/4] Verifying production deployment...${NC}"
    local deployed_version=$(gcloud run services describe "$PRODUCTION_SERVICE_NAME" --region="$REGION" --format='value(spec.template.metadata.annotations.client.knative.dev/user-image)')
    echo -e "Deployed image: ${BLUE}$deployed_version${NC}"
    echo -e "${GREEN}✓ Deployment verified.${NC}"
    echo ""

    # --- Step 4: Purge Cloudflare Cache ---
    echo -e "${YELLOW}[4/4] Purging Cloudflare cache...${NC}"
    purge_cloudflare_cache

    # --- Success ---
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     PRODUCTION DEPLOYMENT SUCCESSFUL! 🎉      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Production URL: ${GREEN}https://trefa.mx${NC}"
    echo -e "Version: ${YELLOW}$git_commit_short${NC}"
    echo -e "Build Date: ${BLUE}$build_date${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  POST-DEPLOYMENT CHECKLIST:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Clear browser cache or test in incognito mode"
    echo ""
    echo "2. Verify version in footer shows: v$git_commit_short"
    echo ""
    echo "3. Test critical user flows:"
    echo "   • Homepage load"
    echo "   • Vehicle listings & filters"
    echo "   • Vehicle detail pages"
    echo "   • Application form"
    echo ""
    echo "4. Monitor for errors:"
    echo -e "   ${BLUE}gcloud run logs tail $PRODUCTION_SERVICE_NAME --region=$REGION${NC}"
    echo ""
    echo "5. Check health endpoint:"
    echo -e "   ${BLUE}curl https://trefa.mx/healthz${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}


# --- Main Script Logic ---
print_header
COMMAND=$1

case $COMMAND in
    staging)
        run_git_checks
        deploy_staging
        ;;
    promote)
        promote_to_production "$2"
        ;;
    *)
        echo -e "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  staging          Builds the current state of 'main' and deploys it to the staging environment."
        echo "  promote [hash]   Promotes a previously deployed staging version to production."
        echo ""
        exit 1
        ;;
esac
