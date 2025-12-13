#!/bin/bash

# TREFA Cloud Run Deployment Script
# This script builds and deploys the application to Google Cloud Run
# Usage: ./deploy.sh [staging|production]

set -e  # Exit on error

# === Configuration ===
ENVIRONMENT=${1:-staging}  # Default to staging if not specified
PROJECT_ID="trefa-web-apis-1731136641165"
REGION="us-central1"
REPOSITORY="marianomoralesr"
IMAGE_NAME="app"

# Staging domain (set this to your custom domain or leave empty for Cloud Run URL)
STAGING_DOMAIN="${STAGING_DOMAIN:-}"  # e.g., "https://staging.trefa.mx"

# Set service name and image tag based on environment
SERVICE_NAME="next-js-trefa"  # Single Cloud Run service name
if [ "$ENVIRONMENT" = "production" ]; then
    IMAGE_TAG="production"
    FRONTEND_URL_OVERRIDE="https://autostrefa.mx"
else
    IMAGE_TAG="staging"
    FRONTEND_URL_OVERRIDE="$STAGING_DOMAIN"  # Use custom staging domain if set
fi

IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$IMAGE_TAG"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   TREFA Cloud Run Deployment Script          ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Environment: ${NC}${GREEN}$ENVIRONMENT${NC}"
echo -e "${YELLOW}Service Name: ${NC}${GREEN}$SERVICE_NAME${NC}"
echo -e "${YELLOW}Image Tag: ${NC}${GREEN}$IMAGE_TAG${NC}"
if [ ! -z "$FRONTEND_URL_OVERRIDE" ]; then
    echo -e "${YELLOW}Frontend URL: ${NC}${GREEN}$FRONTEND_URL_OVERRIDE${NC}"
else
    echo -e "${YELLOW}Frontend URL: ${NC}${GREEN}[Will use Cloud Run URL]${NC}"
fi
echo ""

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
    echo -e "${YELLOW}This will update the live site at https://trefa.mx${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi

    # === Database Backup Before Production Deployment ===
    echo ""
    echo -e "${YELLOW}📦 Creating pre-deployment database backup...${NC}"
    if [ -f "./scripts/backup-database.sh" ]; then
        ./scripts/backup-database.sh
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database backup completed${NC}"
        else
            echo -e "${RED}✗ Database backup failed!${NC}"
            read -p "Continue deployment anyway? (yes/no): " -r
            echo
            if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
                echo "Deployment cancelled for safety."
                exit 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Backup script not found. Skipping backup.${NC}"
    fi
fi
echo ""

# === Step 0: Git Safety Check ===
echo -e "${YELLOW}[0/6] Verificando seguridad de Git...${NC}"
if [ -f "./scripts/git-safety-check.sh" ]; then
    ./scripts/git-safety-check.sh
    GIT_CHECK_EXIT=$?

    if [ $GIT_CHECK_EXIT -ne 0 ]; then
        echo ""
        echo -e "${RED}✗ Git safety check falló${NC}"
        echo -e "${RED}  Resuelve los problemas antes de continuar con el deployment${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Git safety check completado${NC}"
else
    echo -e "${YELLOW}⚠️  Git safety check script no encontrado. Continuando...${NC}"
fi
echo ""

# === Step 0.5: Git Commit ===
echo -e "${YELLOW}[0.5/7] Committing all changes...${NC}"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Uncommitted changes detected. Staging all changes..."

    # Stage all changes
    git add -A

    # Get current git commit for commit message
    PREV_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    # Create commit with deployment message
    git commit -m "$(cat <<EOF
chore: Pre-deployment commit for Cloud Run

Automated commit before deploying to $SERVICE_NAME ($ENVIRONMENT environment).
Previous commit: $PREV_COMMIT

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" || {
        echo -e "${YELLOW}⚠️  No changes to commit or commit failed${NC}"
    }

    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi
echo ""

# === Step 1: Verify Prerequisites ===
echo -e "${YELLOW}[1/7] Verifying prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites verified${NC}"
echo ""

# === Step 2: Set GCloud Project ===
echo -e "${YELLOW}[2/7] Setting GCloud project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to: $PROJECT_ID${NC}"
echo ""

# === Step 3: Build Docker Image ===
echo -e "${YELLOW}[3/7] Building Docker image...${NC}"

# Read build-time credentials from cloud-build-vars.yaml
NEXT_PUBLIC_SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID=$(grep "NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_INTELIMOTOR_API_KEY=$(grep "NEXT_PUBLIC_INTELIMOTOR_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_INTELIMOTOR_API_SECRET=$(grep "NEXT_PUBLIC_INTELIMOTOR_API_SECRET:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY=$(grep "NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID=$(grep "NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID=$(grep "NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW=$(grep "NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID=$(grep "NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY=$(grep "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID=$(grep "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID=$(grep "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_IMAGE_CDN_URL=$(grep "NEXT_PUBLIC_IMAGE_CDN_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=$(grep "NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL:" cloud-build-vars.yaml | cut -d'"' -f2)

# Get git commit hash and build date
NEXT_PUBLIC_GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
NEXT_PUBLIC_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Building with:"
echo "  - NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID: $NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID"
echo "  - NEXT_PUBLIC_IMAGE_CDN_URL: $NEXT_PUBLIC_IMAGE_CDN_URL"
echo "  - NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL: $NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL"
echo "  - NEXT_PUBLIC_GIT_COMMIT: $NEXT_PUBLIC_GIT_COMMIT"
echo "  - NEXT_PUBLIC_BUILD_DATE: $NEXT_PUBLIC_BUILD_DATE"
echo "  - Image URL: $IMAGE_URL"

# Read additional build args from cloud-build-vars.yaml
NEXT_PUBLIC_CAR_STUDIO_API_KEY=$(grep "NEXT_PUBLIC_CAR_STUDIO_API_KEY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL=$(grep "NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_LANDING_WEBHOOK_URL=$(grep "NEXT_PUBLIC_LANDING_WEBHOOK_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_APPLICATION_WEBHOOK_URL=$(grep "NEXT_PUBLIC_APPLICATION_WEBHOOK_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_PROXY_URL=$(grep "NEXT_PUBLIC_PROXY_URL:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CALENDLY_URL_MTY=$(grep "NEXT_PUBLIC_CALENDLY_URL_MTY:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CALENDLY_URL_TMPS=$(grep "NEXT_PUBLIC_CALENDLY_URL_TMPS:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CALENDLY_URL_COAH=$(grep "NEXT_PUBLIC_CALENDLY_URL_COAH:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CALENDLY_URL_GPE=$(grep "NEXT_PUBLIC_CALENDLY_URL_GPE:" cloud-build-vars.yaml | cut -d'"' -f2)
NEXT_PUBLIC_CLOUD_RUN_URL=$(grep "NEXT_PUBLIC_CLOUD_RUN_URL:" cloud-build-vars.yaml | cut -d'"' -f2)

docker build \
  --no-cache \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_GIT_COMMIT="$NEXT_PUBLIC_GIT_COMMIT" \
  --build-arg NEXT_PUBLIC_BUILD_DATE="$NEXT_PUBLIC_BUILD_DATE" \
  --build-arg NEXT_PUBLIC_ENVIRONMENT="$ENVIRONMENT" \
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
  --build-arg NEXT_PUBLIC_FRONTEND_URL="$FRONTEND_URL_OVERRIDE" \
  -t $IMAGE_URL \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi
echo ""

# === Step 4: Push to Artifact Registry ===
echo -e "${YELLOW}[4/7] Pushing image to Artifact Registry...${NC}"

# Configure Docker auth for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

echo "Pushing image to: $IMAGE_URL"
docker push $IMAGE_URL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image pushed successfully${NC}"
else
    echo -e "${RED}✗ Image push failed${NC}"
    exit 1
fi
echo ""

# === Step 5: Deploy to Cloud Run ===
echo -e "${YELLOW}[5/7] Deploying to Cloud Run...${NC}"

# Read all environment variables from cloud-build-vars.yaml
ENV_VARS=""

# Function to add env var from YAML
add_env_var() {
    local key=$1
    local value=$(grep "^$key:" cloud-build-vars.yaml | sed 's/^[^:]*: *"\(.*\)"$/\1/')
    if [ ! -z "$value" ]; then
        if [ -z "$ENV_VARS" ]; then
            ENV_VARS="$key=$value"
        else
            ENV_VARS="$ENV_VARS,$key=$value"
        fi
    fi
}

# Override FRONTEND_URL for staging to use Cloud Run URL
if [ "$ENVIRONMENT" = "staging" ]; then
    # We'll set this after deployment when we get the URL
    FRONTEND_URL_OVERRIDE=""
else
    FRONTEND_URL_OVERRIDE="https://autostrefa.mx"
fi

# Add runtime environment variables (for server-side use only)
# Note: NEXT_PUBLIC_ variables are already baked into the build, no need to set them at runtime
if [ ! -z "$FRONTEND_URL_OVERRIDE" ]; then
    # Production: Use custom domain
    ENV_VARS="NEXT_PUBLIC_FRONTEND_URL=$FRONTEND_URL_OVERRIDE"
else
    # Staging: Will use Cloud Run URL (set after deployment)
    ENV_VARS=""
fi

# Add version information for runtime
if [ -z "$ENV_VARS" ]; then
    ENV_VARS="NEXT_PUBLIC_GIT_COMMIT=$NEXT_PUBLIC_GIT_COMMIT,NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE,NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT"
else
    ENV_VARS="$ENV_VARS,NEXT_PUBLIC_GIT_COMMIT=$NEXT_PUBLIC_GIT_COMMIT,NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE,NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT"
fi

echo "Deploying service: $SERVICE_NAME"
echo "Region: $REGION"

gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_URL \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=4 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="$ENV_VARS"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          DEPLOYMENT SUCCESSFUL! 🎉            ║${NC}"
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo ""

    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
    echo ""

    # Update FRONTEND_URL for staging if needed
    if [ "$ENVIRONMENT" = "staging" ] && [ -z "$FRONTEND_URL_OVERRIDE" ]; then
        echo -e "${YELLOW}Updating staging NEXT_PUBLIC_FRONTEND_URL to Cloud Run URL...${NC}"
        gcloud run services update $SERVICE_NAME \
            --region=$REGION \
            --update-env-vars="NEXT_PUBLIC_FRONTEND_URL=$SERVICE_URL" \
            --quiet
        echo -e "${GREEN}✓ NEXT_PUBLIC_FRONTEND_URL updated${NC}"
        echo ""
    fi

    # === Step 6: Push Git Commits ===
    echo -e "${YELLOW}[6/7] Pushing commits to remote repository...${NC}"

    # Get current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

    # Push to remote
    if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
        echo -e "${GREEN}✓ Commits pushed to origin/$CURRENT_BRANCH${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not push to remote (might be already up to date or no remote configured)${NC}"
    fi
    echo ""

    # Environment-specific next steps
    if [ "$ENVIRONMENT" = "staging" ]; then
        echo "✨ STAGING DEPLOYMENT COMPLETE"
        echo ""
        echo "Test the fixes:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "1. Health check:"
        echo "   curl $SERVICE_URL/healthz"
        echo ""
        echo "2. Test CORS headers:"
        echo "   curl -I $SERVICE_URL"
        echo ""
        echo "3. Test Explorar page (mobile):"
        echo "   ${GREEN}$SERVICE_URL/explorar${NC}"
        echo ""
        echo "4. Test Application flow:"
        echo "   ${GREEN}$SERVICE_URL/escritorio/aplicacion${NC}"
        echo ""
        echo "5. Monitor logs:"
        echo "   gcloud run logs tail $SERVICE_NAME --region=$REGION"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo -e "${GREEN}If everything looks good, deploy to production:${NC}"
        echo -e "${YELLOW}./deploy.sh production${NC}"
    else
        echo "✨ PRODUCTION DEPLOYMENT COMPLETE"
        echo ""
        echo "Verify the deployment:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "1. Health check:"
        echo "   curl https://autostrefa.mx/healthz"
        echo ""
        echo "2. Visit main site:"
        echo "   ${GREEN}https://autostrefa.mx${NC}"
        echo ""
        echo "3. Test Explorar page on mobile:"
        echo "   ${GREEN}https://autostrefa.mx/explorar${NC}"
        echo ""
        echo "4. Test Application flow:"
        echo "   ${GREEN}https://autostrefa.mx/escritorio/aplicacion${NC}"
        echo ""
        echo "5. Monitor logs:"
        echo "   gcloud run logs tail $SERVICE_NAME --region=$REGION"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo -e "${YELLOW}⚠️  Remember to:${NC}"
        echo "- Clear browser cache (Cmd+Shift+Delete)"
        echo "- Test in incognito mode"
        echo "- Hard refresh (Cmd+Shift+R) if needed"
    fi
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
