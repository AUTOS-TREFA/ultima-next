# Next.js Deployment Guide

## Docker Deployment

### Building the Image

```bash
docker build -t trefa-auto-inventory:latest .
```

### Running Locally

```bash
docker run -p 3000:8080 \
  --env-file .env.local \
  trefa-auto-inventory:latest
```

### Using Docker Compose

```bash
docker-compose up -d
```

## Google Cloud Run Deployment

### Prerequisites
- Google Cloud SDK installed
- Project configured: `gcloud config set project YOUR_PROJECT_ID`
- Container Registry enabled

### Build and Deploy

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/trefa-auto-inventory

# Deploy to Cloud Run
gcloud run deploy trefa-auto-inventory \
  --image gcr.io/YOUR_PROJECT_ID/trefa-auto-inventory \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production
```

### Set Environment Variables

```bash
gcloud run services update trefa-auto-inventory \
  --update-env-vars NEXT_PUBLIC_SUPABASE_URL=your_url,\
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Vercel Deployment (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
INTELIMOTOR_API_KEY=
INTELIMOTOR_API_SECRET=
```

## Performance Optimizations

1. **Image Optimization**: Automatic with Next.js Image component
2. **Static Generation**: Pages pre-rendered at build time
3. **Incremental Static Regeneration**: Updates static pages on-demand
4. **Edge Runtime**: Middleware runs on Edge for faster auth checks
5. **Caching**: Automatic caching of static assets

## Monitoring

- Health check endpoint: `/api/health`
- Healthz endpoint: `/healthz`
- Logs: `gcloud run logs read trefa-auto-inventory`

## Rollback

```bash
# List revisions
gcloud run revisions list --service trefa-auto-inventory

# Rollback to previous revision
gcloud run services update-traffic trefa-auto-inventory \
  --to-revisions REVISION_NAME=100
```
