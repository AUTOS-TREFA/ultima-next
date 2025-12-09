import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Your Supabase project's URL and Anon Key should be stored in environment variables.
// Next.js uses process.env, with NEXT_PUBLIC_ prefix for client-side access.
// For example:
// NEXT_PUBLIC_SUPABASE_URL="https://pemgwyymodlwabaexxrb.supabase.co"
// ...
const FALLBACK_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

// Next.js environment variables - direct reference for static replacement
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) ? envUrl : FALLBACK_URL;

/**
 * Validates if the Supabase key is a valid JWT for the specific project.
 * This prevents using keys from other projects or malformed keys.
 * @param key The Supabase anon key to validate.
 * @returns True if the key is valid for this project, false otherwise.
 */
const isKeyValidForProject = (key: string): boolean => {
    if (typeof key !== 'string' || !key.startsWith('ey')) {
        return false;
    }
    try {
        const payloadBase64 = key.split('.')[1];
        if (!payloadBase64) return false;
        // Supabase uses URL-safe Base64, so we need to replace characters before decoding.
        const decodedPayload = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedPayload);
        // The 'ref' in the JWT payload should match the project ID from the URL.
        const projectId = (new URL(supabaseUrl)).hostname.split('.')[0];
        return payload.ref === projectId;
    } catch (e) {
        console.warn("Could not validate Supabase key from environment, it might be malformed. Using fallback.", e);
        return false;
    }
};

const supabaseAnonKey = (envKey && isKeyValidForProject(envKey)) ? envKey : FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined.');
}

// Create the Supabase client without a custom fetch wrapper.
// The Supabase client will use the default fetch implementation.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);