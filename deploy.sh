#!/bin/bash

# TREFA Cloud Run Deployment Script
# This script builds and deploys the application to Google Cloud Run
# Usage: ./deploy.sh [staging|production] [--cloud-build]
#
# Options:
#   --cloud-build    Use Google Cloud Build instead of local Docker
#                    (recommended for ARM Macs to avoid QEMU issues)

set -e  # Exit on error

# === Parse Arguments ===
ENVIRONMENT="staging"
USE_CLOUD_BUILD=false

for arg in "$@"; do
    case $arg in
        staging|production)
            ENVIRONMENT="$arg"
            ;;
        --cloud-build)
            USE_CLOUD_BUILD=true
            ;;
    esac
done
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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === Helper Functions ===

# Read a value from cloud-build-vars.yaml
read_yaml_var() {
    local key=$1
    grep "^$key:" cloud-build-vars.yaml 2>/dev/null | cut -d'"' -f2
}

# Clean up old Docker images to free disk space
cleanup_docker() {
    echo -e "${BLUE}Cleaning up old Docker images...${NC}"
    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true
    # Remove old app images (keep last 3)
    docker images "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME" --format "{{.ID}} {{.CreatedAt}}" 2>/dev/null | \
        sort -k2 -r | tail -n +4 | awk '{print $1}' | xargs -r docker rmi -f > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ Docker cleanup completed${NC}"
}

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
BUILD_START_TIME=$(date +%s)

# Read build-time credentials from cloud-build-vars.yaml using helper function
NEXT_PUBLIC_SUPABASE_URL=$(read_yaml_var "NEXT_PUBLIC_SUPABASE_URL")
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(read_yaml_var "NEXT_PUBLIC_SUPABASE_ANON_KEY")
NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID=$(read_yaml_var "NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID")
NEXT_PUBLIC_INTELIMOTOR_API_KEY=$(read_yaml_var "NEXT_PUBLIC_INTELIMOTOR_API_KEY")
NEXT_PUBLIC_INTELIMOTOR_API_SECRET=$(read_yaml_var "NEXT_PUBLIC_INTELIMOTOR_API_SECRET")
NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY")
NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID")
NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID")
NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW")
NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID")
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY")
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID")
NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID=$(read_yaml_var "NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID")
NEXT_PUBLIC_IMAGE_CDN_URL=$(read_yaml_var "NEXT_PUBLIC_IMAGE_CDN_URL")
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=$(read_yaml_var "NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL")
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=$(read_yaml_var "NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID")
NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID=$(read_yaml_var "NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID")
NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY=$(read_yaml_var "NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY")

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
NEXT_PUBLIC_CAR_STUDIO_API_KEY=$(read_yaml_var "NEXT_PUBLIC_CAR_STUDIO_API_KEY")
NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL=$(read_yaml_var "NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL")
NEXT_PUBLIC_LANDING_WEBHOOK_URL=$(read_yaml_var "NEXT_PUBLIC_LANDING_WEBHOOK_URL")
NEXT_PUBLIC_APPLICATION_WEBHOOK_URL=$(read_yaml_var "NEXT_PUBLIC_APPLICATION_WEBHOOK_URL")
NEXT_PUBLIC_PROXY_URL=$(read_yaml_var "NEXT_PUBLIC_PROXY_URL")
NEXT_PUBLIC_CALENDLY_URL_MTY=$(read_yaml_var "NEXT_PUBLIC_CALENDLY_URL_MTY")
NEXT_PUBLIC_CALENDLY_URL_TMPS=$(read_yaml_var "NEXT_PUBLIC_CALENDLY_URL_TMPS")
NEXT_PUBLIC_CALENDLY_URL_COAH=$(read_yaml_var "NEXT_PUBLIC_CALENDLY_URL_COAH")
NEXT_PUBLIC_CALENDLY_URL_GPE=$(read_yaml_var "NEXT_PUBLIC_CALENDLY_URL_GPE")
NEXT_PUBLIC_CLOUD_RUN_URL=$(read_yaml_var "NEXT_PUBLIC_CLOUD_RUN_URL")

# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

if [ "$USE_CLOUD_BUILD" = true ]; then
    # === Cloud Build (recommended for ARM Macs) ===
    echo -e "${BLUE}Using Google Cloud Build (remote)...${NC}"

    # Create a temporary cloudbuild.yaml with build args
    cat > /tmp/cloudbuild-temp.yaml << CLOUDBUILD_EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--platform=linux/amd64'
      - '--build-arg=NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL'
      - '--build-arg=NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY'
      - '--build-arg=NEXT_PUBLIC_GIT_COMMIT=$NEXT_PUBLIC_GIT_COMMIT'
      - '--build-arg=NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE'
      - '--build-arg=NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT'
      - '--build-arg=NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID=$NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID'
      - '--build-arg=NEXT_PUBLIC_INTELIMOTOR_API_KEY=$NEXT_PUBLIC_INTELIMOTOR_API_KEY'
      - '--build-arg=NEXT_PUBLIC_INTELIMOTOR_API_SECRET=$NEXT_PUBLIC_INTELIMOTOR_API_SECRET'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY=$NEXT_PUBLIC_AIRTABLE_VALUATION_API_KEY'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID=$NEXT_PUBLIC_AIRTABLE_VALUATION_BASE_ID'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID=$NEXT_PUBLIC_AIRTABLE_VALUATION_TABLE_ID'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW=$NEXT_PUBLIC_AIRTABLE_VALUATION_VIEW'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID=$NEXT_PUBLIC_AIRTABLE_VALUATIONS_STORAGE_TABLE_ID'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY=$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_API_KEY'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID=$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_BASE_ID'
      - '--build-arg=NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID=$NEXT_PUBLIC_AIRTABLE_LEAD_CAPTURE_TABLE_ID'
      - '--build-arg=NEXT_PUBLIC_IMAGE_CDN_URL=$NEXT_PUBLIC_IMAGE_CDN_URL'
      - '--build-arg=NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=$NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL'
      - '--build-arg=NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=$NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID'
      - '--build-arg=NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID=$NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID'
      - '--build-arg=NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY=$NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY'
      - '--build-arg=NEXT_PUBLIC_CAR_STUDIO_API_KEY=$NEXT_PUBLIC_CAR_STUDIO_API_KEY'
      - '--build-arg=NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL=$NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL'
      - '--build-arg=NEXT_PUBLIC_LANDING_WEBHOOK_URL=$NEXT_PUBLIC_LANDING_WEBHOOK_URL'
      - '--build-arg=NEXT_PUBLIC_APPLICATION_WEBHOOK_URL=$NEXT_PUBLIC_APPLICATION_WEBHOOK_URL'
      - '--build-arg=NEXT_PUBLIC_PROXY_URL=$NEXT_PUBLIC_PROXY_URL'
      - '--build-arg=NEXT_PUBLIC_CALENDLY_URL_MTY=$NEXT_PUBLIC_CALENDLY_URL_MTY'
      - '--build-arg=NEXT_PUBLIC_CALENDLY_URL_TMPS=$NEXT_PUBLIC_CALENDLY_URL_TMPS'
      - '--build-arg=NEXT_PUBLIC_CALENDLY_URL_COAH=$NEXT_PUBLIC_CALENDLY_URL_COAH'
      - '--build-arg=NEXT_PUBLIC_CALENDLY_URL_GPE=$NEXT_PUBLIC_CALENDLY_URL_GPE'
      - '--build-arg=NEXT_PUBLIC_CLOUD_RUN_URL=$NEXT_PUBLIC_CLOUD_RUN_URL'
      - '--build-arg=NEXT_PUBLIC_FRONTEND_URL=$FRONTEND_URL_OVERRIDE'
      - '-t'
      - '$IMAGE_URL'
      - '.'
images:
  - '$IMAGE_URL'
options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
timeout: '1800s'
CLOUDBUILD_EOF

    # Submit build to Cloud Build
    gcloud builds submit \
        --config=/tmp/cloudbuild-temp.yaml \
        --substitutions="_IMAGE_URL=$IMAGE_URL" \
        .

    rm -f /tmp/cloudbuild-temp.yaml

else
    # === Local Docker Build ===
    echo -e "${BLUE}Using local Docker build...${NC}"

    # Build with Docker layer caching enabled (removes --no-cache to prevent QEMU segfaults)
    docker build \
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
  --build-arg NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID="$NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID" \
  --build-arg NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID="$NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID" \
  --build-arg NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY="$NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY" \
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

    BUILD_END_TIME=$(date +%s)
    BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Docker image built successfully in ${BUILD_DURATION}s${NC}"
    else
        echo -e "${RED}✗ Docker build failed after ${BUILD_DURATION}s${NC}"
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
fi

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
  --memory=1536Mi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="$ENV_VARS" \
  --tag=latest

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          DEPLOYMENT SUCCESSFUL! 🎉            ║${NC}"
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo ""

    # Get service URL and latest revision
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    LATEST_REVISION=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.latestReadyRevisionName)')
    echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
    echo -e "Latest Revision: ${GREEN}$LATEST_REVISION${NC}"
    echo ""

    # Ensure 100% traffic goes to the latest revision
    echo -e "${YELLOW}Routing 100% traffic to latest revision...${NC}"
    gcloud run services update-traffic $SERVICE_NAME \
        --region=$REGION \
        --to-latest \
        --quiet 2>/dev/null || true
    echo -e "${GREEN}✓ Traffic routed to latest revision${NC}"
    echo ""

    # === Health Check Verification ===
    echo -e "${YELLOW}Verifying deployment health...${NC}"
    HEALTH_URL="$SERVICE_URL/api/health"
    HEALTH_RETRIES=3
    HEALTH_OK=false

    for i in $(seq 1 $HEALTH_RETRIES); do
        echo -n "  Health check attempt $i/$HEALTH_RETRIES... "
        HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

        if [ "$HEALTH_RESPONSE" = "200" ]; then
            echo -e "${GREEN}OK${NC}"
            HEALTH_OK=true
            break
        else
            echo -e "${YELLOW}HTTP $HEALTH_RESPONSE${NC}"
            sleep 3
        fi
    done

    if [ "$HEALTH_OK" = true ]; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${RED}⚠️  Health check failed after $HEALTH_RETRIES attempts${NC}"
        echo -e "${YELLOW}   Service may still be starting. Check logs:${NC}"
        echo -e "${YELLOW}   gcloud run logs tail $SERVICE_NAME --region=$REGION${NC}"
    fi
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

    # === Step 7: Cleanup ===
    echo ""
    echo -e "${YELLOW}[7/7] Cleaning up...${NC}"
    cleanup_docker

    # Show total deployment time
    DEPLOY_END_TIME=$(date +%s)
    TOTAL_DURATION=$((DEPLOY_END_TIME - BUILD_START_TIME))
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Total deployment time: ${TOTAL_DURATION}s (~$((TOTAL_DURATION / 60))m $((TOTAL_DURATION % 60))s)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
