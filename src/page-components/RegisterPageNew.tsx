'use client';

/**
 * RegisterPageNew - Página de registro
 *
 * Basado en shadcn-studio register-04 con integración completa de:
 * - Google OAuth con redirect URL dinámico
 * - Verificación SMS via Twilio
 * - Tracking de URL params (UTM, fbclid, rfdm, ordencompra)
 * - Creación de perfil con datos completos
 * - Consistencia de marca TREFA
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Phone, Mail, User, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { supabase } from '../../supabaseClient';
import { GoogleIcon } from '@/components/icons';
import { conversionTracking } from '@/services/ConversionTrackingService';
import { getSiteUrl } from '@/config';
import { proxyImage } from '@/utils/proxyImage';

type RegisterStep = 'form' | 'verify_sms' | 'complete';

// Interface para datos de tracking
interface UrlTrackingData {
  ordencompra?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  rfdm?: string;
  source?: string;
  referrer?: string;
  landing_page?: string;
}

// Parsear nombre completo
const parseFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '', motherLastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '', motherLastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1], motherLastName: '' };
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 2],
    motherLastName: parts[parts.length - 1]
  };
};

// Avatares de clientes
const customerAvatars = [
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/men/44.jpg',
  'https://randomuser.me/api/portraits/women/33.jpg',
];

const RegisterPageNew: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados del formulario
  const [step, setStep] = useState<RegisterStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos del formulario
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // OTP SMS
  const [smsOtp, setSmsOtp] = useState('');

  // Tracking
  const [urlTrackingData, setUrlTrackingData] = useState<UrlTrackingData>({});
  const [urlParamsString, setUrlParamsString] = useState('');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Capturar URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    setUrlParamsString(params.toString());

    // Pre-llenar email si viene en params
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    const trackingData: UrlTrackingData = {};
    if (params.get('ordencompra')) trackingData.ordencompra = params.get('ordencompra')!;
    if (params.get('utm_source')) trackingData.utm_source = params.get('utm_source')!;
    if (params.get('utm_medium')) trackingData.utm_medium = params.get('utm_medium')!;
    if (params.get('utm_campaign')) trackingData.utm_campaign = params.get('utm_campaign')!;
    if (params.get('utm_term')) trackingData.utm_term = params.get('utm_term')!;
    if (params.get('utm_content')) trackingData.utm_content = params.get('utm_content')!;
    if (params.get('fbclid')) trackingData.fbclid = params.get('fbclid')!;
    if (params.get('rfdm')) trackingData.rfdm = params.get('rfdm')!;
    if (params.get('source')) trackingData.source = params.get('source')!;

    trackingData.referrer = document.referrer || undefined;
    trackingData.landing_page = window.location.href;

    setUrlTrackingData(trackingData);

    if (Object.keys(trackingData).length > 0) {
      sessionStorage.setItem('leadSourceData', JSON.stringify({
        ...trackingData,
        first_visit_at: new Date().toISOString()
      }));
    }
  }, [searchParams]);

  // Enviar SMS OTP
  const sendSmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar si email ya existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        setError('account_exists_email');
        setLoading(false);
        return;
      }

      // Verificar si teléfono ya existe
      const cleanPhone = phone.replace(/\D/g, '');
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .single();

      if (existingPhone) {
        setError('account_exists_phone');
        setLoading(false);
        return;
      }

      // Formatear teléfono
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10) {
        formattedPhone = `+52${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Enviar SMS via Edge Function
      const { data, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: formattedPhone, email }
      });

      if (data?.error === 'email_exists') {
        setError('account_exists_email');
        setLoading(false);
        return;
      }

      // Handle phone_already_verified error from Edge Function
      if (data?.error === 'phone_already_verified') {
        setError('account_exists_phone');
        setLoading(false);
        return;
      }

      if (smsError || !data?.success) {
        const errMsg = data?.error || 'Error al enviar SMS';
        if (errMsg.includes('phone number') || errMsg.includes('Invalid')) {
          throw new Error('Número de teléfono inválido. Verifica que sea de 10 dígitos.');
        } else if (errMsg.includes('rate limit') || errMsg.includes('Max send')) {
          throw new Error('Demasiados intentos. Espera unos minutos.');
        }
        throw new Error('No se pudo enviar el código. Intenta de nuevo.');
      }

      setStep('verify_sms');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar SMS OTP
  const verifySmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      const cleanPhone = phone.replace(/\D/g, '');
      let formattedPhone = cleanPhone.length === 10 ? `+52${cleanPhone}` : `+${cleanPhone}`;

      const { data, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: { phone: formattedPhone, code: smsOtp }
      });

      if (verifyError || !data?.success) {
        const errMsg = data?.error || '';
        if (errMsg.includes('expired')) {
          throw new Error('El código expiró. Solicita uno nuevo.');
        }
        throw new Error('Código incorrecto. Verifica e intenta de nuevo.');
      }

      // Crear cuenta
      await createUserAccount();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear cuenta de usuario
  const createUserAccount = async () => {
    try {
      const { firstName, lastName, motherLastName } = parseFullName(fullName);
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-16),
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            mother_last_name: motherLastName,
            phone: cleanPhone,
            source: 'registro-directo'
          },
          emailRedirectTo: `${getSiteUrl()}/auth/callback?redirect=/escritorio`,
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este correo ya está registrado. Inicia sesión.');
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta');
      }

      // Esperar sesión
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determinar lead source
      let leadSource = 'registro-directo';
      if (urlTrackingData.utm_source) {
        leadSource = `registro-${urlTrackingData.utm_source}`;
        if (urlTrackingData.utm_medium) leadSource += `-${urlTrackingData.utm_medium}`;
      } else if (urlTrackingData.fbclid) {
        leadSource = 'registro-facebook';
      } else if (urlTrackingData.rfdm) {
        leadSource = `registro-rfdm-${urlTrackingData.rfdm}`;
      }

      // Actualizar perfil
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        mother_last_name: motherLastName,
        phone: cleanPhone,
        phone_verified: true,
        email,
        ordencompra: urlTrackingData.ordencompra || null,
        utm_source: urlTrackingData.utm_source || null,
        utm_medium: urlTrackingData.utm_medium || null,
        utm_campaign: urlTrackingData.utm_campaign || null,
        utm_term: urlTrackingData.utm_term || null,
        utm_content: urlTrackingData.utm_content || null,
        fbclid: urlTrackingData.fbclid || null,
        rfdm: urlTrackingData.rfdm || null,
        referrer: urlTrackingData.referrer || null,
        landing_page: urlTrackingData.landing_page || null,
        lead_source: leadSource,
        source: urlTrackingData.source || leadSource,
        first_visit_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Track conversion
      conversionTracking.trackAuth.otpVerified(authData.user.id, {
        email,
        source: leadSource,
        vehicleId: urlTrackingData.ordencompra
      });

      setStep('complete');

      // Redirigir después de 1.5s usando window.location para full page reload
      // Esto asegura que las cookies de sesión se inicialicen correctamente
      setTimeout(() => {
        window.location.href = `/escritorio/profile${urlParamsString ? `?${urlParamsString}` : ''}`;
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handler: Google OAuth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await supabase.auth.signOut();
      // Usar getSiteUrl() para garantizar URL correcta (nunca 0.0.0.0)
      const redirectUrl = `${getSiteUrl()}/auth/callback?redirect=/escritorio/profile`;

      conversionTracking.trackButtonClick('Google Sign Up Initiated', {
        page: 'register',
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

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError('Error al conectar con Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // Handler: Submit formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Completa todos los campos');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Correo electrónico inválido');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('El teléfono debe tener 10 dígitos');
      return;
    }

    await sendSmsOtp();
  };

  // Render: Formulario inicial
  const renderFormStep = () => (
    <>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h2>
        <p className="text-gray-600">Regístrate gratis en segundos</p>
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full h-12 text-base font-medium gap-3"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <GoogleIcon className="w-5 h-5" />
        Registrarme con Google
      </Button>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-gray-500">o</span>
        <Separator className="flex-1" />
      </div>

      {/* Error */}
      {error && (
        <div className={`p-4 rounded-lg ${error.includes('account_exists') ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
          {error === 'account_exists_email' ? (
            <p className="text-blue-700 text-sm text-center">
              Este correo ya está registrado.{' '}
              <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="underline font-semibold">
                Inicia sesión aquí
              </Link>
            </p>
          ) : error === 'account_exists_phone' ? (
            <p className="text-blue-700 text-sm text-center">
              Este teléfono ya está registrado.{' '}
              <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="underline font-semibold">
                Inicia sesión aquí
              </Link>
            </p>
          ) : (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10 h-12 text-base"
            required
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="tel"
            placeholder="Teléfono (10 dígitos)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="pl-10 h-12 text-base"
            maxLength={10}
            required
          />
        </div>
        <p className="text-xs text-gray-500 -mt-2 ml-1">Te enviaremos un código de verificación por SMS</p>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 text-base"
            required
          />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-tight">
            Acepto los{' '}
            <Link href="/terminos" className="text-[#003161] hover:underline">Términos y Condiciones</Link>{' '}
            y la{' '}
            <Link href="/politica-de-privacidad" className="text-[#003161] hover:underline">Política de Privacidad</Link>
          </Label>
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
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="text-[#003161] hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </>
  );

  // Render: Verificar SMS
  const renderVerifySmsStep = () => (
    <>
      <button
        onClick={() => { setStep('form'); setError(null); setSmsOtp(''); }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="text-center space-y-2">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Verifica tu teléfono</h2>
        <p className="text-gray-600">
          Enviamos un código de 6 dígitos a <strong>{phone}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="------"
          value={smsOtp}
          onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="text-center text-2xl tracking-[0.5em] font-mono h-14"
          maxLength={6}
          required
        />

        <Button
          onClick={verifySmsOtp}
          className="w-full h-12 text-base bg-[#003161] hover:bg-[#002850]"
          disabled={loading || smsOtp.length !== 6}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Verificar y crear cuenta'
          )}
        </Button>

        <button
          onClick={sendSmsOtp}
          disabled={loading}
          className="w-full text-sm text-gray-500 hover:text-[#003161] underline"
        >
          Reenviar código
        </button>
      </div>
    </>
  );

  // Render: Completado
  const renderCompleteStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">¡Cuenta creada!</h2>
      <p className="text-gray-600">Redirigiendo a tu perfil...</p>
      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#003161]" />
    </div>
  );

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
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-[#003161]/50" />

        {/* Blobs animados sutiles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(0,49,97,0.2) 50%, transparent 70%)',
              top: '10%',
              left: '-15%',
              animation: 'blob-float 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,104,1,0.3) 0%, rgba(255,104,1,0.1) 50%, transparent 70%)',
              bottom: '5%',
              right: '-10%',
              animation: 'blob-float 25s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%)',
              top: '50%',
              left: '30%',
              animation: 'blob-float 22s ease-in-out infinite',
              animationDelay: '-8s',
            }}
          />
        </div>

        {/* Layout del contenido - alineado con el lado derecho */}
        <div className="relative h-full flex flex-col p-8 xl:p-12">
          {/* Logo arriba */}
          <div className="flex-shrink-0">
            <Link href="/">
              <img src="/images/trefalogo.png" alt="TREFA" className="h-8 w-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Contenido principal centrado - alineado con el formulario */}
          <div className="flex-1 flex flex-col justify-center py-8">
            <div className="w-full max-w-md mx-auto">
              {/* Contenedor Liquid Glass */}
              <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
                      Crea tu cuenta <span className="text-[#FF6801]">gratis</span>
                    </h1>
                    <p className="text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Al registrarte podrás:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Guardar tus autos favoritos</h3>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>No pierdas de vista los autos que te interesan</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Aplicar a financiamiento en línea</h3>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Inicia tu solicitud 100% digital</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Recibir notificaciones de precios</h3>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Te avisamos si el precio baja</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'white' }}>Agendar visitas y pruebas de manejo</h3>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Coordina tu visita de forma fácil</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avatares al fondo del panel */}
          <div className="flex-shrink-0 mt-auto">
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
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex h-full flex-col items-center justify-center py-8 px-4 sm:px-6 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Logo móvil */}
          <Link href="/" className="lg:hidden block mb-6">
            <img src="/images/trefalogo.png" alt="TREFA" className="h-8 w-auto mx-auto" />
          </Link>

          {step === 'form' && renderFormStep()}
          {step === 'verify_sms' && renderVerifySmsStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default RegisterPageNew;
