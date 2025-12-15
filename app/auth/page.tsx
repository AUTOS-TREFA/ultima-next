'use client';

/**
 * Auth Callback Page
 *
 * Handles authentication callbacks from:
 * - Magic link emails (signInWithOtp)
 * - Email verification (signUp email confirmation)
 * - Password reset
 *
 * URL patterns:
 * - /auth?code=xxx&redirect=/vender-mi-auto
 * - /auth?token_hash=xxx&type=signup
 * - /auth?error=xxx&error_description=xxx
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu acceso...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in URL params
        const error = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Error de autenticación');
          return;
        }

        // Get code from URL (magic link flow)
        const code = searchParams?.get('code');
        const redirectTo = searchParams?.get('redirect') || '/escritorio';

        if (code) {
          setMessage('Iniciando sesión...');

          // Exchange code for session
          const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

          if (authError) {
            console.error('Auth error:', authError);
            setStatus('error');
            setErrorMessage(authError.message || 'Error al verificar el enlace');
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('¡Acceso verificado!');

            // Small delay for UX, then redirect
            setTimeout(() => {
              router.push(redirectTo);
            }, 1500);
            return;
          }
        }

        // Check for token_hash (email verification flow from signUp)
        const tokenHash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');

        if (tokenHash && type) {
          setMessage('Verificando tu cuenta...');

          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (verifyError) {
            console.error('Verify error:', verifyError);
            setStatus('error');
            setErrorMessage(verifyError.message || 'Error al verificar tu cuenta');
            return;
          }

          setStatus('success');
          setMessage('¡Cuenta verificada!');

          setTimeout(() => {
            router.push('/escritorio');
          }, 1500);
          return;
        }

        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setStatus('success');
          setMessage('Ya tienes sesión activa');

          setTimeout(() => {
            router.push('/escritorio');
          }, 1500);
          return;
        }

        // No valid auth params found
        setStatus('error');
        setErrorMessage('Enlace de verificación inválido o expirado');

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Error inesperado');
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <img
            src="https://trefa.mx/images/trefalogo.png"
            alt="TREFA"
            className="h-8 mx-auto mb-6"
          />

          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Message */}
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Verificando...'}
            {status === 'success' && '¡Listo!'}
            {status === 'error' && 'Error'}
          </h1>

          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {status === 'error' ? errorMessage : message}
          </p>

          {/* Error actions */}
          {status === 'error' && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/acceder')}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all"
              >
                Ir a iniciar sesión
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Volver al inicio
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {status === 'loading' && (
            <div className="mt-4">
              <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Success - auto redirect notice */}
          {status === 'success' && (
            <p className="mt-4 text-xs text-gray-400">
              Redirigiendo automáticamente...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
