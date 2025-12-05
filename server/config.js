// server/config.js

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || "https://pemgwyymodlwabaexxrb.supabase.co",
    anonKey: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok",
  },
  airtable: {
    valuation: {
      apiKey: process.env.AIRTABLE_VALUATION_API_KEY,
      baseId: process.env.AIRTABLE_VALUATION_BASE_ID,
      tableId: process.env.AIRTABLE_VALUATION_TABLE_ID,
      view: process.env.AIRTABLE_VALUATION_VIEW,
      storageTableId: process.env.AIRTABLE_VALUATIONS_STORAGE_TABLE_ID,
    },
    leadCapture: {
      apiKey: process.env.AIRTABLE_LEAD_CAPTURE_API_KEY,
      baseId: process.env.AIRTABLE_LEAD_CAPTURE_BASE_ID,
      tableId: process.env.AIRTABLE_LEAD_CAPTURE_TABLE_ID,
    },
  },
  intelimotor: {
    businessUnitId: process.env.INTELIMOTOR_BUSINESS_UNIT_ID,
    apiKey: process.env.INTELIMOTOR_API_KEY,
    apiSecret: process.env.INTELIMOTOR_API_SECRET,
  },
  carStudio: {
    apiKey: process.env.CAR_STUDIO_API_KEY,
  },
  webhooks: {
    leadConnector: process.env.LEAD_CONNECTOR_WEBHOOK_URL,
    landing: process.env.LANDING_WEBHOOK_URL,
    application: process.env.APPLICATION_WEBHOOK_URL,
    valuation: process.env.VALUATION_WEBHOOK_URL,
    brevo: process.env.BREVO_WEBHOOK_URL,
  },
  proxy: {
    url: process.env.CORS_PROXY_URL || "https://proxy.cors.sh/",
  },
  calendly: {
    MTY: process.env.CALENDLY_URL_MTY || "https://calendly.com/trefa-monterrey/cita-monterrey?month=2025-09",
    TMPS: process.env.CALENDLY_URL_TMPS || "https://calendly.com/trefa-reynosa/cita-reynosa?month=2025-09",
    COAH: process.env.CALENDLY_URL_COAH || "https://calendly.com/trefa-saltillo/cita-saltillo?month=2025-09",
    GPE: process.env.CALENDLY_URL_GPE || "https://calendly.com/trefa-guadalupe/cita-guadalupe?month=2025-09",
  },
};