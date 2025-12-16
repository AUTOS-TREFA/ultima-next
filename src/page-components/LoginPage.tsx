'use client';

/**
 * LoginPage - Página de inicio de sesión
 *
 * Basado en shadcn-studio login-page-04 con integración completa de:
 * - Google OAuth con redirect URL dinámico
 * - OTP por email (magic link)
 * - Tracking de URL params (UTM, fbclid, rfdm, ordencompra)
 * - Redirección basada en rol
 * - Consistencia de marca TREFA
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/icons';
import { conversionTracking } from '@/services/ConversionTrackingService';
import { checkBasicProfileCompleteness } from '@/components/AuthHandler';
import { checkIsAdmin } from '@/constants/adminEmails';
import VehicleService from '@/services/VehicleService';
import type { WordPressVehicle } from '@/types/types';
import { formatPrice } from '@/utils/formatters';
import { getVehicleImage } from '@/utils/getVehicleImage';
import { proxyImage } from '@/utils/proxyImage';

// Avatares de clientes para social proof
const customerAvatars = [
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/men/44.jpg',
  'https://randomuser.me/api/portraits/women/33.jpg',
];

// Interface para datos de tracking
interface UrlTrackingData {
  ordencompra?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  fbclid?: string;
  rfdm?: string;
  source?: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, profile, loading: authLoading } = useAuth();
  const supabase = createBrowserSupabaseClient();

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [view, setView] = useState<'email' | 'otp'>('email');

  // Estados de vehículo y tracking
  const [vehicleToFinance, setVehicleToFinance] = useState<WordPressVehicle | null>(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [urlParamsString, setUrlParamsString] = useState('');
  const [urlTrackingData, setUrlTrackingData] = useState<UrlTrackingData>({});
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Capturar URL params al inicio
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    setUrlParamsString(params.toString());

    const trackingData: UrlTrackingData = {};
    const ordencompra = params.get('ordencompra');
    const utm_source = params.get('utm_source');
    const utm_medium = params.get('utm_medium');
    const utm_campaign = params.get('utm_campaign');
    const fbclid = params.get('fbclid');
    const rfdm = params.get('rfdm');
    const source = params.get('source');

    if (ordencompra) trackingData.ordencompra = ordencompra;
    if (utm_source) trackingData.utm_source = utm_source;
    if (utm_medium) trackingData.utm_medium = utm_medium;
    if (utm_campaign) trackingData.utm_campaign = utm_campaign;
    if (fbclid) trackingData.fbclid = fbclid;
    if (rfdm) trackingData.rfdm = rfdm;
    if (source) trackingData.source = source;

    setUrlTrackingData(trackingData);

    // Guardar en sessionStorage para LeadSourceHandler
    if (Object.keys(trackingData).length > 0) {
      sessionStorage.setItem('leadSourceData', JSON.stringify(trackingData));
    }
  }, [searchParams]);

  // Cargar vehículo si hay ordencompra
  useEffect(() => {
    const ordenCompra = searchParams?.get('ordencompra');
    if (ordenCompra) {
      setIsLoadingVehicle(true);
      sessionStorage.setItem('pendingOrdenCompra', ordenCompra);
      localStorage.setItem('loginRedirect', `/escritorio/aplicacion?ordencompra=${ordenCompra}`);

      VehicleService.getVehicleByOrdenCompra(ordenCompra)
        .then(vehicle => {
          if (vehicle) setVehicleToFinance(vehicle);
        })
        .catch(console.error)
        .finally(() => setIsLoadingVehicle(false));
    }
  }, [searchParams]);

  // Redirigir si ya está logueado
  useEffect(() => {
    if (session && profile) {
      const urlRedirect = searchParams?.get('redirect');
      let redirectPath = urlRedirect || localStorage.getItem('loginRedirect');

      // Verificar si perfil está incompleto
      if (profile.role === 'user' && !checkBasicProfileCompleteness(profile)) {
        localStorage.removeItem('loginRedirect');
        router.replace('/escritorio/profile');
        return;
      }

      // Determinar redirect basado en rol
      if (!redirectPath) {
        if (checkIsAdmin(session.user?.email)) {
          redirectPath = '/escritorio/admin/dashboard';
        } else if (profile?.role === 'admin' || profile?.role === 'sales') {
          redirectPath = '/escritorio/dashboard';
        } else {
          redirectPath = '/escritorio';
        }
      }

      localStorage.removeItem('loginRedirect');
      router.replace(redirectPath);
    }
  }, [session, profile, router, searchParams]);

  // Handler: Enviar OTP por email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Por favor, ingresa un correo electrónico válido');
      }

      // Configurar redirect si no está definido
      if (!localStorage.getItem('loginRedirect')) {
        localStorage.setItem('loginRedirect', '/escritorio');
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });

      if (otpError) {
        if (otpError.message.includes('rate limit')) {
          throw new Error('Has solicitado demasiados códigos. Espera 5 minutos.');
        } else if (otpError.message.includes('User not found') || otpError.message.includes('Signups not allowed')) {
          setError(
            <div className="text-left">
              <p className="font-semibold mb-2">Este correo no está registrado</p>
              <p className="text-sm mb-3"><strong>{email}</strong> no tiene cuenta todavía.</p>
              <Button
                onClick={() => router.push(`/registro${urlParamsString ? `?${urlParamsString}&email=${encodeURIComponent(email)}` : `?email=${encodeURIComponent(email)}`}`)}
                className="w-full bg-[#003161] hover:bg-[#002850]"
              >
                Crear mi cuenta
              </Button>
            </div>
          );
          setLoading(false);
          return;
        }
        throw otpError;
      }

      // Track OTP request
      conversionTracking.trackAuth.otpRequested(email, {
        source: urlTrackingData.source || 'direct',
        vehicleId: urlTrackingData.ordencompra
      });

      setView('otp');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código de verificación');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Verificar OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('El código debe tener 6 dígitos');
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          throw new Error('El código ha expirado. Solicita uno nuevo.');
        } else if (verifyError.message.includes('invalid')) {
          throw new Error('Código incorrecto. Verifica e intenta de nuevo.');
        }
        throw verifyError;
      }

      // Track si es usuario nuevo
      const isNewUser = data.user?.created_at &&
        new Date(data.user.created_at).getTime() > (Date.now() - 10000);

      if (isNewUser) {
        conversionTracking.trackAuth.otpVerified(data.user?.id || '', {
          email,
          vehicleId: urlTrackingData.ordencompra
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Determinar redirect
      let redirectPath = localStorage.getItem('loginRedirect');
      if (!redirectPath) {
        redirectPath = checkIsAdmin(data.user?.email) ? '/escritorio/admin/dashboard' : '/escritorio';
      }
      localStorage.removeItem('loginRedirect');
      router.replace(redirectPath);

    } catch (err: any) {
      setError(err.message || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Google OAuth - IMPORTANTE: usar window.location.origin siempre
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Limpiar cualquier sesión anterior para evitar conflictos
      await supabase.auth.signOut();

      // Construir redirect URL usando window.location.origin SIEMPRE
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=/escritorio`;

      console.log('[OAuth] Iniciando Google Sign In con redirect:', redirectUrl);

      conversionTracking.trackButtonClick('Google Sign In Initiated', {
        page: 'login',
        vehicleId: urlTrackingData.ordencompra
      });

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error('[OAuth] Error:', err);
      setError('No pudimos completar el inicio de sesión con Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || (session && profile)) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#003161]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Panel izquierdo - Video con contenedor Liquid Glass */}
      <div className="relative max-lg:hidden overflow-hidden">
        {/* Video de fondo - visible */}
        <video
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
          src={proxyImage("https://cufm.mx/wp-content/uploads/2025/04/testomimos-02.mp4")}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
        />
        {/* Overlay con gradiente sutil */}
        <div className="absolute inset-0 bg-[#003161]/50" />

        {/* Blob animado sutil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(0,49,97,0.2) 50%, transparent 70%)',
              top: '20%',
              left: '-10%',
              animation: 'blob-float 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,104,1,0.3) 0%, rgba(0,49,97,0.1) 50%, transparent 70%)',
              bottom: '10%',
              right: '-15%',
              animation: 'blob-float 25s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* Layout del contenido - alineado con el formulario derecho */}
        <div className="relative h-full flex flex-col justify-between p-8 xl:p-12">
          {/* Logo arriba */}
          <div>
            <Link href="/">
              <img src="/images/trefalogo.png" alt="TREFA" className="h-8 w-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Contenedor Liquid Glass - alineado verticalmente con formulario */}
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-md bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
                Bienvenido de vuelta 👋
              </h1>
              <p className="text-base mb-5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Accede a tu cuenta para continuar con tu solicitud de financiamiento.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Financiamiento 100% en línea</h3>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Aplica desde tu celular en minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Respuesta en 24 horas</h3>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Te contactamos con opciones reales</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'white' }}>+5,000 clientes satisfechos</h3>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>La agencia mejor calificada del país</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avatars abajo */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {customerAvatars.map((avatar, i) => (
                <img key={i} src={avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white/50 object-cover" />
              ))}
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Únete a miles de clientes</span>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex h-full flex-col items-center justify-center py-8 px-4 sm:px-6 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Logo móvil */}
          <Link href="/" className="lg:hidden block mb-6">
            <img src="/images/trefalogo.png" alt="TREFA" className="h-8 w-auto mx-auto" />
          </Link>

          {/* Vehículo a financiar */}
          {isLoadingVehicle ? (
            <div className="bg-gray-100 p-4 rounded-xl animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ) : vehicleToFinance && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Continúa tu solicitud por:</p>
              <div className="flex gap-4 items-center">
                <img src={getVehicleImage(vehicleToFinance)} alt="" className="w-20 h-14 object-cover rounded-lg" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{vehicleToFinance.title}</h3>
                  <p className="text-[#FF6801] font-bold">{formatPrice(vehicleToFinance.precio)}</p>
                </div>
              </div>
            </div>
          )}

          {view === 'email' ? (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Inicia sesión</h2>
                <p className="text-gray-600">Ingresa tu correo para recibir un código de acceso</p>
              </div>

              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium gap-3"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon className="w-5 h-5" />
                Continuar con Google
              </Button>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-gray-500">o</span>
                <Separator className="flex-1" />
              </div>

              {/* Error */}
              {error && (
                <div className={`p-4 rounded-lg ${typeof error === 'string' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  {typeof error === 'string' ? (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  ) : error}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-[#003161] hover:bg-[#002850]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Recibir código de acceso
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link
                  href={`/registro${urlParamsString ? `?${urlParamsString}` : ''}`}
                  className="text-[#003161] hover:underline font-medium"
                >
                  Regístrate aquí
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* OTP View */}
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900">Verifica tu correo</h2>
                <p className="text-gray-600">
                  Enviamos un código de 6 dígitos a <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-500">(Revisa tu carpeta de spam)</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm text-center">{String(error)}</p>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  maxLength={6}
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-[#003161] hover:bg-[#002850]"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verificar y continuar'
                  )}
                </Button>
              </form>

              <button
                onClick={() => { setView('email'); setError(null); setOtp(''); }}
                className="w-full text-sm text-gray-500 hover:text-[#003161]"
              >
                Cambiar correo electrónico
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
