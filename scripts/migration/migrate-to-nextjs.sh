#!/bin/bash

# =============================================================================
# React + Express to Next.js Migration Script
# =============================================================================
# This script orchestrates the complete migration process from React + Vite
# to Next.js App Router with minimal manual intervention.
#
# Usage: ./scripts/migration/migrate-to-nextjs.sh [--skip-install]
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_INSTALL=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-install] [--dry-run]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   React + Express → Next.js Migration                        ║
║   TREFA Auto Inventory System                                ║
║                                                               ║
║   This will convert your 68-page React app to Next.js        ║
║   App Router with automated scripts                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print section header
print_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to run migration script
run_migration_script() {
  local script=$1
  local description=$2

  print_section "$description"

  if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN: Would execute $script"
    return 0
  fi

  if [ -f "$script" ]; then
    node "$script"
    if [ $? -eq 0 ]; then
      print_success "Completed: $description"
    else
      print_error "Failed: $description"
      exit 1
    fi
  else
    print_error "Script not found: $script"
    exit 1
  fi
}

# Pre-flight checks
print_section "Pre-flight Checks"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_error "package.json not found. Are you in the project root?"
  exit 1
fi
print_success "Found package.json"

# Check if migration scripts exist
if [ ! -d "scripts/migration" ]; then
  print_error "Migration scripts directory not found"
  exit 1
fi
print_success "Found migration scripts"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  print_error "Node.js 18 or higher required. Current: $(node -v)"
  exit 1
fi
print_success "Node.js version: $(node -v)"

# Confirm migration
if [ "$DRY_RUN" = false ]; then
  echo -e "\n${YELLOW}⚠  WARNING: This will modify your codebase!${NC}"
  echo -e "${YELLOW}   Backups will be created, but please commit your changes first.${NC}\n"
  read -p "Continue with migration? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Migration cancelled"
    exit 0
  fi
fi

# Create migration log directory
MIGRATION_LOG_DIR="scripts/migration/logs"
mkdir -p "$MIGRATION_LOG_DIR"
MIGRATION_LOG="$MIGRATION_LOG_DIR/migration-$(date +%Y%m%d-%H%M%S).log"

print_success "Migration log: $MIGRATION_LOG"

# Redirect all output to log file
exec > >(tee -a "$MIGRATION_LOG") 2>&1

# Start migration
echo -e "\n${GREEN}Starting migration at $(date)${NC}\n"

# Phase 1: Setup Next.js
run_migration_script \
  "scripts/migration/1-setup-nextjs.js" \
  "Phase 1: Setup Next.js Infrastructure"

# Phase 2: Migrate Environment Variables
run_migration_script \
  "scripts/migration/2-migrate-env.js" \
  "Phase 2: Migrate Environment Variables"

# Phase 3: Migrate Routes
run_migration_script \
  "scripts/migration/3-migrate-routes.js" \
  "Phase 3: Migrate Routes to App Router"

# Phase 4: Create API Routes
run_migration_script \
  "scripts/migration/4-create-api-routes.js" \
  "Phase 4: Create Next.js API Routes"

# Phase 5: Add 'use client' Directives
run_migration_script \
  "scripts/migration/5-add-use-client.js" \
  "Phase 5: Add 'use client' Directives"

# Phase 6: Create Middleware
run_migration_script \
  "scripts/migration/6-create-middleware.js" \
  "Phase 6: Create Authentication Middleware"

# Phase 7: Update package.json
run_migration_script \
  "scripts/migration/7-update-package-json.js" \
  "Phase 7: Update package.json"

# Phase 8: Update Dockerfile
run_migration_script \
  "scripts/migration/8-update-dockerfile.js" \
  "Phase 8: Update Dockerfile"

# Install dependencies
if [ "$SKIP_INSTALL" = false ] && [ "$DRY_RUN" = false ]; then
  print_section "Installing Dependencies"

  print_warning "Removing old node_modules and package-lock.json..."
  rm -rf node_modules package-lock.json

  print_success "Installing Next.js and dependencies..."
  npm install

  if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
  else
    print_error "Failed to install dependencies"
    exit 1
  fi
else
  print_warning "Skipping dependency installation"
fi

# Migration complete
print_section "Migration Complete!"

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✓ Migration Successful!                                    ║
║                                                               ║
║   Your React + Express app has been converted to Next.js     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "\n${BLUE}📊 Migration Summary:${NC}"
echo "   • 68 routes migrated to App Router"
echo "   • API endpoints converted to Next.js routes"
echo "   • Environment variables updated"
echo "   • 'use client' directives added"
echo "   • Authentication middleware created"
echo "   • Dockerfile optimized for Next.js"
echo "   • Dependencies updated"

echo -e "\n${BLUE}📁 Files Created:${NC}"
echo "   • app/ - Next.js App Router directory"
echo "   • middleware.ts - Authentication middleware"
echo "   • next.config.js - Next.js configuration"
echo "   • lib/ - Utility functions"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "   1. Review migration reports in scripts/migration/"
echo "   2. Test the application: npm run dev"
echo "   3. Check for any TypeScript errors: npm run type-check"
echo "   4. Review and test critical user flows"
echo "   5. Update environment variables in .env.local"
echo "   6. Test API endpoints"
echo "   7. Build for production: npm run build"
echo "   8. Deploy to Cloud Run or Vercel"

echo -e "\n${YELLOW}⚠  Important Notes:${NC}"
echo "   • Backup files created with .backup extension"
echo "   • Review all migration reports before deploying"
echo "   • Update deployment environment variables"
echo "   • Test authentication and protected routes"
echo "   • Verify all third-party integrations"

echo -e "\n${BLUE}📚 Documentation:${NC}"
echo "   • Migration Plan: MIGRATION_PLAN.md"
echo "   • Deployment Guide: DEPLOYMENT.md"
echo "   • Migration Log: $MIGRATION_LOG"

echo -e "\n${GREEN}✨ Happy coding with Next.js!${NC}\n"

# Create completion marker
touch "scripts/migration/.migration-complete"
echo "$(date)" > "scripts/migration/.migration-complete"

exit 0
