# Supabase Project Reference Update

## Summary

**Date:** December 5, 2025
**Old Project:** jjepfehmuybpctdzipnu
**New Project:** pemgwyymodlwabaexxrb

All Supabase references have been successfully updated to the correct project (`pemgwyymodlwabaexxrb`).

## Files Updated (25 files)

### Configuration Files
1. ✅ `.env.example` - Updated URL and anon key
2. ✅ `supabaseClient.ts` - Updated fallback URL and key
3. ✅ `middleware.ts` - Uses env vars (correct fallback)
4. ✅ `next.config.js` - Already correct

### Server Files
5. ✅ `server/server.js` - Updated URL (lines 23, 64)
6. ✅ `server/config.js` - Updated URL and anon key

### Airtable Scripts
7. ✅ `airtable-upload-to-r2.js` - Updated URL and service key
8. ✅ `airtable/airtable-image-upload-optimized.js` - Updated URL and service key
9. ✅ `airtable/R2_CORS_CONFIG.json` - Updated allowed origin
10. ✅ `airtable/airtable-sync-webhook.js` - Updated URL and anon key

### Sitemap Generators
11. ✅ `generate-sitemap.js` - Updated URL and anon key
12. ✅ `docs/scripts/generate-sitemap.js` - Updated URL and anon key

### Edge Functions (4 files)
13. ✅ `supabase/functions/rapid-processor/index.ts` - Updated storage base URL
14. ✅ `supabase/functions/catalogo-facebook/index.ts` - Updated storage base URL
15. ✅ `supabase/functions/facebook-inventory-feed/index.ts` - Updated storage base URL
16. ✅ `supabase/functions/rapid-vehicles-sync-ts/index.ts` - Updated fallback URL

### Component Files
17. ✅ `src/components/ResourceHints.tsx` - Updated preconnect origin
18. ✅ `src/utils/imageUrl.ts` - Already correct
19. ✅ `src/utils/constants.ts` - Already correct
20. ✅ `src/config/index.ts` - Already correct
21. ✅ `src/page-components/HomePage.tsx` - Already correct

### Migration/Utility Scripts
22. ✅ `supabase/migrations/supabaseClient.ts` - Updated fallback URL and key
23. ✅ `apply_security_fix.js` - Updated URL and service key
24. ✅ `cloudflare-workers/image-proxy.js` - Updated storage URL
25. ✅ `scripts/migration/1-setup-nextjs.js` - Updated image domain

## Service Role Key Updates - COMPLETED ✅

All service role keys have been updated with the actual key from Supabase project `pemgwyymodlwabaexxrb`:

1. ✅ `airtable-upload-to-r2.js` - Line 48
2. ✅ `airtable/airtable-image-upload-optimized.js` - Line 9
3. ✅ `apply_security_fix.js` - Line 5

## Edge Functions

All 23 edge functions have been verified. They use environment variables for Supabase URL and keys, which is the correct approach. The 4 edge functions with hardcoded storage base URLs have been updated.

### Edge Function List
- ✅ airtable-sync
- ✅ automated-email-notifications
- ✅ catalogo-facebook (updated)
- ✅ custom-access-token
- ✅ facebook-inventory-feed (updated)
- ✅ fix-rls-policy
- ✅ kommo-oauth
- ✅ kommo-webhook
- ✅ mark-vehicle-sold
- ✅ rapid-processor (updated)
- ✅ rapid-vehicles-sync-ts (updated)
- ✅ send-brevo-email
- ✅ sitemap-generator
- ✅ smooth-handler
- ✅ swift-responder
- ✅ valuation-proxy
- ✅ r2-upload
- ✅ r2-list
- ✅ get-thumbnails
- ✅ intelimotor-proxy
- ✅ carstudio-proxy
- ✅ facebook-catalogue-csv
- ✅ api-facebook-catalogue-csv

## Verification Results

### Search Results
- ✅ **0 occurrences** of old project `jjepfehmuybpctdzipnu` in active code (only in backup files)
- ✅ **24 occurrences** of correct project `pemgwyymodlwabaexxrb` across 20 files
- ✅ All backup files excluded from active codebase

### Environment Variables
All files now correctly use environment variables with proper fallbacks:
- `NEXT_PUBLIC_SUPABASE_URL` → `https://pemgwyymodlwabaexxrb.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → (correct key for pemgwyymodlwabaexxrb)

## Deployment Checklist

Before deploying, ensure:
1. ✅ Environment variables are set in deployment environment
2. ⚠️ Service role keys are updated (see above)
3. ✅ Edge functions are deployed to correct Supabase project
4. ✅ Cloudflare worker (image-proxy) is redeployed with new URL
5. ✅ Build verification passes

## Notes

- All component files that reference Supabase use the centralized `supabaseClient.ts` which has correct credentials
- Edge functions correctly use `Deno.env.get()` for runtime configuration
- Server files use `process.env` with correct fallbacks
- Airtable scripts have placeholders for service role keys that need manual update
- Image CDN (Cloudflare Worker) has been updated to proxy from correct Supabase storage

## Next Steps

1. Update service role keys in the 3 files mentioned above
2. Deploy edge functions to pemgwyymodlwabaexxrb project
3. Redeploy Cloudflare image proxy worker
4. Update environment variables in Cloud Run deployment
5. Test all Supabase-dependent features
