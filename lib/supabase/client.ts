/**
 * Cliente de Supabase para componentes del browser.
 *
 * IMPORTANTE: Este archivo re-exporta el singleton de supabaseClient.ts
 * para mantener UNA SOLA instancia del cliente en toda la aplicacion.
 *
 * Esto es CRITICO para que la sesion sea consistente entre:
 * - AuthContext (detecta cambios de sesion)
 * - LoginPage (hace login)
 * - Cualquier otro componente que use Supabase
 */
export { getSupabaseClient as createBrowserSupabaseClient, supabase } from '../../supabaseClient';
