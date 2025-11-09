#!/usr/bin/env node
/**
 * Migration Script 8: Update Dockerfile
 *
 * This script:
 * 1. Updates Dockerfile for Next.js deployment
 * 2. Optimizes for Cloud Run
 * 3. Uses multi-stage build
 * 4. Creates backup of original Dockerfile
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 8: Update Dockerfile');
console.log('═'.repeat(60));

const dockerfilePath = path.join(rootDir, 'Dockerfile');

// Create backup if Dockerfile exists
if (fs.existsSync(dockerfilePath)) {
  const backupPath = dockerfilePath + '.backup';
  fs.copyFileSync(dockerfilePath, backupPath);
  console.log('\n💾 Created backup: Dockerfile.backup');
}

// New Dockerfile content optimized for Next.js
const dockerfileContent = `# Multi-stage build for Next.js on Cloud Run
# Optimized for production deployment

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \\
    npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
`;

fs.writeFileSync(dockerfilePath, dockerfileContent);
console.log('\n✅ Created optimized Dockerfile for Next.js');

// Create .dockerignore
console.log('\n📋 Creating .dockerignore...');
const dockerignorePath = path.join(rootDir, '.dockerignore');
const dockerignoreContent = `# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next
out
.vercel

# Build
dist
build

# Environment files
.env.local
.env.*.local
.env

# Development
*.backup
.vscode
.idea

# Git
.git
.gitignore

# Testing
coverage
.nyc_output

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local development
*.swp
*.swo
*~

# Documentation
README.md
MIGRATION_PLAN.md
CHANGELOG.md

# Scripts
scripts/migration
`;

fs.writeFileSync(dockerignorePath, dockerignoreContent);
console.log('  ✓ Created .dockerignore');

// Create docker-compose.yml for local development
console.log('\n🐳 Creating docker-compose.yml...');
const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
const dockerComposeContent = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
`;

if (!fs.existsSync(dockerComposePath)) {
  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log('  ✓ Created docker-compose.yml');
} else {
  console.log('  - docker-compose.yml already exists');
}

// Create deployment documentation
console.log('\n📚 Creating deployment documentation...');
const deploymentDocsPath = path.join(rootDir, 'DEPLOYMENT.md');
const deploymentDocsContent = `# Next.js Deployment Guide

## Docker Deployment

### Building the Image

\`\`\`bash
docker build -t trefa-auto-inventory:latest .
\`\`\`

### Running Locally

\`\`\`bash
docker run -p 3000:8080 \\
  --env-file .env.local \\
  trefa-auto-inventory:latest
\`\`\`

### Using Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

## Google Cloud Run Deployment

### Prerequisites
- Google Cloud SDK installed
- Project configured: \`gcloud config set project YOUR_PROJECT_ID\`
- Container Registry enabled

### Build and Deploy

\`\`\`bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/trefa-auto-inventory

# Deploy to Cloud Run
gcloud run deploy trefa-auto-inventory \\
  --image gcr.io/YOUR_PROJECT_ID/trefa-auto-inventory \\
  --platform managed \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --port 8080 \\
  --memory 1Gi \\
  --cpu 1 \\
  --min-instances 0 \\
  --max-instances 10 \\
  --set-env-vars NODE_ENV=production
\`\`\`

### Set Environment Variables

\`\`\`bash
gcloud run services update trefa-auto-inventory \\
  --update-env-vars NEXT_PUBLIC_SUPABASE_URL=your_url,\\
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
\`\`\`

## Vercel Deployment (Alternative)

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

## Environment Variables

Required environment variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
INTELIMOTOR_API_KEY=
INTELIMOTOR_API_SECRET=
\`\`\`

## Performance Optimizations

1. **Image Optimization**: Automatic with Next.js Image component
2. **Static Generation**: Pages pre-rendered at build time
3. **Incremental Static Regeneration**: Updates static pages on-demand
4. **Edge Runtime**: Middleware runs on Edge for faster auth checks
5. **Caching**: Automatic caching of static assets

## Monitoring

- Health check endpoint: \`/api/health\`
- Healthz endpoint: \`/healthz\`
- Logs: \`gcloud run logs read trefa-auto-inventory\`

## Rollback

\`\`\`bash
# List revisions
gcloud run revisions list --service trefa-auto-inventory

# Rollback to previous revision
gcloud run services update-traffic trefa-auto-inventory \\
  --to-revisions REVISION_NAME=100
\`\`\`
`;

fs.writeFileSync(deploymentDocsPath, deploymentDocsContent);
console.log('  ✓ Created DEPLOYMENT.md');

// Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  filesCreated: [
    'Dockerfile',
    '.dockerignore',
    'docker-compose.yml',
    'DEPLOYMENT.md',
  ],
  features: [
    'Multi-stage Docker build',
    'Production optimizations',
    'Non-root user for security',
    'Health checks',
    'Cloud Run compatible',
    'Minimal image size',
  ],
  improvements: [
    'Reduced image size with multi-stage build',
    'Better caching with layer optimization',
    'Security with non-root user',
    'Automatic health checks',
    'Standalone output mode enabled',
  ],
};

const reportPath = path.join(__dirname, 'dockerfile-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: dockerfile-migration-report.json`);

console.log('\n✅ Phase 8 Complete: Dockerfile updated');
console.log('\n  📊 Summary:');
console.log('     Dockerfile: Multi-stage build with optimizations');
console.log('     .dockerignore: Created');
console.log('     docker-compose.yml: Created for local dev');
console.log('     DEPLOYMENT.md: Created with instructions');
console.log('\n  💡 Notes:');
console.log('     - Image runs as non-root user (security)');
console.log('     - Health checks enabled');
console.log('     - Optimized for Cloud Run');
console.log('     - Standalone output mode used');
console.log('\n' + '═'.repeat(60));
