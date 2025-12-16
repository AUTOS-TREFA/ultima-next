import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

export const supabaseUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) ? envUrl : FALLBACK_URL;
export const supabaseAnonKey = envKey || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined.');
}

/**
 * Supabase client SINGLETON for browser components using @supabase/auth-helpers-nextjs
 *
 * CRITICO: Usar UN SOLO cliente en toda la aplicacion para evitar problemas de sesion.
 * El auth-helpers-nextjs maneja automaticamente:
 * - Almacenamiento de sesion basado en cookies (requerido para SSR/middleware)
 * - Refresco automatico de tokens
 * - Deteccion de sesion desde URL (para OAuth callbacks)
 *
 * IMPORTANTE: Este singleton DEBE ser usado por:
 * - AuthContext.tsx
 * - LoginPage.tsx
 * - Cualquier componente que necesite autenticacion
 */
let _supabaseClient: ReturnType<typeof createClientComponentClient> | null = null;

/**
 * Obtiene el cliente singleton de Supabase.
 * En el navegador, siempre devuelve la misma instancia.
 * En el servidor (SSR/build), devuelve un cliente basico sin sesion.
 */
export const getSupabaseClient = (): ReturnType<typeof createClientComponentClient> => {
    // Solo crear el cliente en el navegador
    if (typeof window !== 'undefined') {
        if (!_supabaseClient) {
            console.log('[Supabase] Creando cliente singleton para browser');
            _supabaseClient = createClientComponentClient({
                supabaseUrl,
                supabaseKey: supabaseAnonKey,
            });
        }
        return _supabaseClient;
    }

    // Para SSR/build time, crear un cliente basico sin sesion persistente
    // Esto previene errores de build mientras asegura que el cliente real solo se crea en el browser
    console.log('[Supabase] Creando cliente temporal para SSR');
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }) as ReturnType<typeof createClientComponentClient>;
};

// Export del cliente singleton - USAR ESTE EN TODA LA APP
export const supabase = getSupabaseClient();

// Funcion helper para crear cliente de browser (usa el singleton)
// DEPRECATED: Usar 'supabase' directamente o 'getSupabaseClient()'
export const createBrowserSupabaseClient = getSupabaseClient;

// Para compatibilidad con codigo server-side explicito
export const createServerClient = () => createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});