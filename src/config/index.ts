'use client';

// Next.js uses process.env, not import.meta.env
const env: Record<string, string | undefined> = typeof window !== 'undefined' ? {} : process.env;

// For client-side, access process.env directly with NEXT_PUBLIC_ prefix
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ prefixed vars
    return (process.env as any)[`NEXT_PUBLIC_${key}`] || fallback;
  }
  // Server-side: use regular env vars (support both NEXT_PUBLIC_ and VITE_ prefixes)
  return env[`NEXT_PUBLIC_${key}`] || env[`VITE_${key}`] || fallback;
};

// --- Supabase Configuration ---
const SUPABASE_URL = getEnvVar('SUPABASE_URL', 'https://pemgwyymodlwabaexxrb.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok');

// --- Airtable Configuration ---
// Using environment variables with fallbacks for development
const AIRTABLE_VALUATION_API_KEY = getEnvVar('AIRTABLE_VALUATION_API_KEY', 'patgjhCDUrCQ915MV.8595dc00077c25d786992f793e5370e4a45af5b6929668beb47ff49511ddb414');
const AIRTABLE_VALUATION_BASE_ID = getEnvVar('AIRTABLE_VALUATION_BASE_ID', 'appbOPKYqQRW2HgyB');
const AIRTABLE_VALUATION_TABLE_ID = getEnvVar('AIRTABLE_VALUATION_TABLE_ID', 'tblGuvYLMnZXr6o8f');
const AIRTABLE_VALUATION_VIEW = getEnvVar('AIRTABLE_VALUATION_VIEW', 'viwEQ9YuMH4Y7XMs9');
const AIRTABLE_LEAD_CAPTURE_API_KEY = getEnvVar('AIRTABLE_LEAD_CAPTURE_API_KEY', 'patgjhCDUrCQ915MV.8595dc00077c25d786992f793e5370e4a45af5b6929668beb47ff49511ddb414');
const AIRTABLE_LEAD_CAPTURE_BASE_ID = getEnvVar('AIRTABLE_LEAD_CAPTURE_BASE_ID', 'appbOPKYqQRW2HgyB');
const AIRTABLE_LEAD_CAPTURE_TABLE_ID = getEnvVar('AIRTABLE_LEAD_CAPTURE_TABLE_ID', 'tblLFY58uCrcX7dPK');
const AIRTABLE_VALUATIONS_STORAGE_TABLE_ID = getEnvVar('AIRTABLE_VALUATIONS_STORAGE_TABLE_ID', 'tbl66UyGNcOfOxQUm');

// --- Intelimotor API Configuration ---
const INTELIMOTOR_BUSINESS_UNIT_ID = getEnvVar('INTELIMOTOR_BUSINESS_UNIT_ID', '629f91e85853b40012e58308');
const INTELIMOTOR_API_KEY = getEnvVar('INTELIMOTOR_API_KEY', '920b45727bb711069c950bbda204182f883d5bd1b17a6d0c6ccd0d673dace457');
const INTELIMOTOR_API_SECRET = getEnvVar('INTELIMOTOR_API_SECRET', 'ee4b975fb97eb1573624adfe45cb5c78ca53f3a002729e61b499dd182cb23a6a');

// --- Car Studio API Configuration ---
// For AI-powered image editing.
const CAR_STUDIO_API_KEY = getEnvVar('CAR_STUDIO_API_KEY', 'e3c31fe81d1345b9a91996043d452d91');

// --- Webhook Configuration ---
const LEAD_CONNECTOR_WEBHOOK_URL = getEnvVar('LEAD_CONNECTOR_WEBHOOK_URL', 'https://services.leadconnectorhq.com/hooks/LJhjk6eFZEHwptjuIF0a/webhook-trigger/eprKrEBZDa2DNegPGQ3T');
const LANDING_WEBHOOK_URL = getEnvVar('LANDING_WEBHOOK_URL', 'https://hooks.airtable.com/workflows/v1/genericWebhook/appbOPKYqQRW2HgyB/wflQkAdsDbWeyGSIm/wtrb8ZF0GxoaZk2bf');
const APPLICATION_WEBHOOK_URL = getEnvVar('APPLICATION_WEBHOOK_URL', 'https://services.leadconnectorhq.com/hooks/LJhjk6eFZEHwptjuIF0a/webhook-trigger/eprKrEBZDa2DNegPGQ3T');
const VALUATION_WEBHOOK_URL = getEnvVar('VALUATION_WEBHOOK_URL', 'https://api.intelimotor.com/valuations/');
const BREVO_WEBHOOK_URL = getEnvVar('BREVO_WEBHOOK_URL', 'YOUR_BREVO_WEBHOOK_URL_HERE');

// --- CORS Proxy Configuration ---
// Updated to use Supabase Edge Function for reliable CarStudio API proxying
// Note: Do not include ?url= at the end - it's added by CarStudioService
const CORS_PROXY_URL = getEnvVar('CORS_PROXY_URL', `${SUPABASE_URL}/functions/v1/carstudio-proxy`);

// --- Calendly Configuration ---
const CALENDLY_URL_MTY = getEnvVar('CALENDLY_URL_MTY', 'https://calendly.com/trefa-monterrey/cita-monterrey?month=2025-09');
const CALENDLY_URL_TMPS = getEnvVar('CALENDLY_URL_TMPS', 'https://calendly.com/trefa-reynosa/cita-reynosa?month=2025-09');
const CALENDLY_URL_COAH = getEnvVar('CALENDLY_URL_COAH', 'https://calendly.com/trefa-saltillo/cita-saltillo?month=2025-09');
const CALENDLY_URL_GPE = getEnvVar('CALENDLY_URL_GPE', 'https://calendly.com/trefa-guadalupe/cita-guadalupe?month=2025-09');

// --- Site URL Configuration ---
// For production, set NEXT_PUBLIC_SITE_URL in .env (e.g., https://autostrefa.mx)
const SITE_URL = getEnvVar('SITE_URL', 'https://autostrefa.mx');

// --- Kommo CRM Configuration ---
const KOMMO_INTEGRATION_ID = getEnvVar('KOMMO_INTEGRATION_ID', '');
const KOMMO_SECRET_KEY = getEnvVar('KOMMO_SECRET_KEY', '');
const KOMMO_SUBDOMAIN = getEnvVar('KOMMO_SUBDOMAIN', '');
const KOMMO_ACCESS_TOKEN = getEnvVar('KOMMO_ACCESS_TOKEN', '');
const KOMMO_REFRESH_TOKEN = getEnvVar('KOMMO_REFRESH_TOKEN', '');
const KOMMO_REDIRECT_URI = getEnvVar('KOMMO_REDIRECT_URI', `${typeof window !== 'undefined' ? window.location.origin : ''}/oauth/kommo/callback`);

export const config = {
    siteUrl: SITE_URL,
    supabase: {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY,
    },
    airtable: {
        valuation: {
            apiKey: AIRTABLE_VALUATION_API_KEY,
            baseId: AIRTABLE_VALUATION_BASE_ID,
            tableId: AIRTABLE_VALUATION_TABLE_ID,
            view: AIRTABLE_VALUATION_VIEW,
            storageTableId: AIRTABLE_VALUATIONS_STORAGE_TABLE_ID,
        },
        leadCapture: {
            apiKey: AIRTABLE_LEAD_CAPTURE_API_KEY,
            baseId: AIRTABLE_LEAD_CAPTURE_BASE_ID,
            tableId: AIRTABLE_LEAD_CAPTURE_TABLE_ID,
        },
    },
    intelimotor: {
        businessUnitId: INTELIMOTOR_BUSINESS_UNIT_ID,
        apiKey: INTELIMOTOR_API_KEY,
        apiSecret: INTELIMOTOR_API_SECRET,
    },
    carStudio: {
        apiKey: CAR_STUDIO_API_KEY,
    },
    webhooks: {
        leadConnector: LEAD_CONNECTOR_WEBHOOK_URL,
        landing: LANDING_WEBHOOK_URL,
        application: APPLICATION_WEBHOOK_URL,
        valuation: VALUATION_WEBHOOK_URL,
        brevo: BREVO_WEBHOOK_URL,
    },
    proxy: {
        url: CORS_PROXY_URL,
    },
    calendly: {
        MTY: CALENDLY_URL_MTY,
        TMPS: CALENDLY_URL_TMPS,
        COAH: CALENDLY_URL_COAH,
        GPE: CALENDLY_URL_GPE,
    },
    kommo: {
        integrationId: KOMMO_INTEGRATION_ID,
        secretKey: KOMMO_SECRET_KEY,
        subdomain: KOMMO_SUBDOMAIN,
        accessToken: KOMMO_ACCESS_TOKEN,
        refreshToken: KOMMO_REFRESH_TOKEN,
        redirectUri: KOMMO_REDIRECT_URI,
    }
};

/**
 * Obtiene la URL base del sitio de forma dinámica
 * SIEMPRE usa NEXT_PUBLIC_SITE_URL para OAuth redirects
 * Fallback a window.location.origin solo si no está definido (dev local)
 */
export const getSiteUrl = (): string => {
  // ALWAYS prioritize NEXT_PUBLIC_SITE_URL for production consistency
  if (SITE_URL && SITE_URL !== '') {
    return SITE_URL;
  }
  // Fallback to window.location.origin only if SITE_URL is not set
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://autostrefa.mx'; // Final fallback
};

/**
 * Obtiene la URL de redireccion para callbacks de OAuth/Email
 * La redireccion final a admin dashboard se maneja en AuthContext/middleware
 */
export const getEmailRedirectUrl = (): string => {
  // Use auth callback route which handles code exchange and redirect
  return `${getSiteUrl()}/auth/callback?redirect=/escritorio`;
};

/**
 * Obtiene la URL de callback para Google OAuth
 * Esta URL debe estar configurada en la consola de Google Cloud y Supabase
 * SIEMPRE usa getSiteUrl() para consistencia
 */
export const getGoogleOAuthCallbackUrl = (): string => {
  return `${getSiteUrl()}/auth/callback?redirect=/escritorio`;
};
