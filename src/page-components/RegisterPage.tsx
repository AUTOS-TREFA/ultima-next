'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import { CheckCircleIcon, ArrowLeftIcon } from '../components/icons';
import { proxyImage } from '../utils/proxyImage';
import { conversionTracking } from '../services/ConversionTrackingService';

type RegisterStep = 'form' | 'verify_sms' | 'complete';

// Interface para datos de tracking de URL
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

// Helper function to parse full name into first, last, and mother's last name
// Returns: { firstName, lastName, motherLastName }
const parseFullName = (fullName: string): { firstName: string; lastName: string; motherLastName: string } => {
  const parts = fullName.trim().split(/\s+/); // Split by whitespace

  if (parts.length === 0) {
    return { firstName: '', lastName: '', motherLastName: '' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '', motherLastName: '' };
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1], motherLastName: '' };
  } else {
    // 3 or more parts: first part is firstName, last two are lastNames
    return {
      firstName: parts[0],
      lastName: parts[parts.length - 2],
      motherLastName: parts[parts.length - 1]
    };
  }
};

const allCustomerAvatars = [
    'https://randomuser.me/api/portraits/women/18.jpg',
    'https://randomuser.me/api/portraits/men/44.jpg',
    'https://randomuser.me/api/portraits/women/33.jpg',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/35.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'https://randomuser.me/api/portraits/women/88.jpg',
    'https://randomuser.me/api/portraits/men/11.jpg',
    'https://randomuser.me/api/portraits/women/22.jpg',
    'https://randomuser.me/api/portraits/men/55.jpg',
];

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<RegisterStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Datos del formulario
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // OTP de SMS
  const [smsOtp, setSmsOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // URL tracking data
  const [urlTrackingData, setUrlTrackingData] = useState<UrlTrackingData>({});
  const [urlParamsString, setUrlParamsString] = useState('');

  // Customer avatars
  const [customerAvatars, setCustomerAvatars] = useState(allCustomerAvatars.slice(0, 3));
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Capturar URL params al inicio
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const paramString = params.toString();
    setUrlParamsString(paramString);

    // Pre-llenar email si viene en los params (desde AuthPage)
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      console.log('📧 Email pre-llenado desde URL:', emailParam);
    }

    const trackingData: UrlTrackingData = {};

    // Capturar todos los parametros de tracking
    const ordencompra = params.get('ordencompra');
    const utm_source = params.get('utm_source');
    const utm_medium = params.get('utm_medium');
    const utm_campaign = params.get('utm_campaign');
    const utm_term = params.get('utm_term');
    const utm_content = params.get('utm_content');
    const fbclid = params.get('fbclid');
    const rfdm = params.get('rfdm');
    const source = params.get('source');

    if (ordencompra) trackingData.ordencompra = ordencompra;
    if (utm_source) trackingData.utm_source = utm_source;
    if (utm_medium) trackingData.utm_medium = utm_medium;
    if (utm_campaign) trackingData.utm_campaign = utm_campaign;
    if (utm_term) trackingData.utm_term = utm_term;
    if (utm_content) trackingData.utm_content = utm_content;
    if (fbclid) trackingData.fbclid = fbclid;
    if (rfdm) trackingData.rfdm = rfdm;
    if (source) trackingData.source = source;

    // Capturar referrer y landing page
    trackingData.referrer = document.referrer || undefined;
    trackingData.landing_page = window.location.href;

    setUrlTrackingData(trackingData);

    // Guardar en sessionStorage para LeadSourceHandler
    if (Object.keys(trackingData).length > 0) {
      sessionStorage.setItem('leadSourceData', JSON.stringify({
        ...trackingData,
        first_visit_at: new Date().toISOString()
      }));
    }

    console.log('URL Tracking Data capturado:', trackingData);
  }, [searchParams]);

  useEffect(() => {
    // Shuffle avatars on mount
    const shuffled = [...allCustomerAvatars].sort(() => 0.5 - Math.random());
    setCustomerAvatars(shuffled.slice(0, 3));
  }, []);

  // Enviar código SMS usando Twilio Verify
  const sendSmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      // PRIMERO: Verificar si el email ya existe (validación anticipada)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (existingProfile && !profileError) {
        console.log('⚠️ Correo ya registrado:', email);
        setError('account_exists_email');
        setLoading(false);
        return; // NO enviar SMS si el correo ya existe
      }

      console.log('✅ Correo disponible, procediendo con validación de teléfono...');

      // SEGUNDO: Verificar si el teléfono ya existe
      const cleanPhone = phone.replace(/\D/g, '');
      const { data: existingPhoneProfile, error: phoneError} = await supabase
        .from('profiles')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .single();

      if (existingPhoneProfile && !phoneError) {
        console.log('⚠️ Teléfono ya registrado:', cleanPhone);
        setError('account_exists_phone');
        setLoading(false);
        return; // NO enviar SMS si el teléfono ya existe
      }

      console.log('✅ Teléfono disponible, procediendo con envío de SMS...');

      // Formatear teléfono
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10) {
        formattedPhone = `+52${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Llamar a la Edge Function de Twilio Verify
      // Pasamos el email para verificar si ya existe en auth.users antes de enviar el SMS
      let data, smsError;
      try {
        const response = await supabase.functions.invoke('send-sms-otp', {
          body: { phone: formattedPhone, email: email }
        });
        data = response.data;
        smsError = response.error;
      } catch (invokeError: unknown) {
        console.error('Error invocando edge function:', invokeError);
        throw new Error('No se pudo conectar con el servicio de SMS. Por favor intenta de nuevo más tarde.');
      }

      // Check if the edge function returned email_exists error (can be in data even with error)
      if (data?.error === 'email_exists') {
        console.log('⚠️ Email ya existe en auth.users (detectado por edge function)');
        setError('account_exists_email');
        setLoading(false);
        return;
      }

      if (smsError) {
        console.error('Error enviando SMS:', smsError);

        // Try to extract error message from response data first
        const dataErrorMsg = data?.error || data?.message || data?.details;
        const errorMsg = dataErrorMsg || (smsError as Error).message || 'Error al enviar código';

        console.log('Error details:', { dataErrorMsg, errorMsg, data });

        if (errorMsg.includes('phone number') || errorMsg.includes('Invalid parameter')) {
          throw new Error('El número de teléfono ingresado no es válido. Verifica que sea un número de 10 dígitos.');
        } else if (errorMsg.includes('Twilio') || errorMsg.includes('Configuración de SMS')) {
          throw new Error('El servicio de SMS no está disponible temporalmente. Por favor intenta de nuevo más tarde.');
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('Max send attempts')) {
          throw new Error('Has solicitado demasiados códigos. Por favor espera unos minutos antes de intentar de nuevo.');
        } else if (errorMsg.includes('non-2xx')) {
          // Generic edge function error - show user-friendly message
          throw new Error('Hubo un problema al enviar el código SMS. Por favor intenta de nuevo.');
        } else {
          throw new Error('No se pudo enviar el código de verificación. Por favor intenta de nuevo.');
        }
      }

      if (!data?.success) {
        const errorMsg = data?.message || data?.error || 'Error desconocido';
        console.error('Edge function returned failure:', data);
        throw new Error('No se pudo enviar el código de verificación. Por favor intenta de nuevo.');
      }

      console.log('SMS enviado exitosamente:', data);
      setOtpSent(true);
      setStep('verify_sms');
    } catch (err: any) {
      console.error('Error en sendSmsOtp:', err);
      setError(err.message || 'Error al enviar código SMS');
    } finally {
      setLoading(false);
    }
  };

  // Verificar código SMS usando Twilio Verify
  const verifySmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Formatear teléfono
      const cleanPhone = phone.replace(/\D/g, '');
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10) {
        formattedPhone = `+52${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Verificar el código OTP usando la Edge Function
      const { data, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: {
          phone: formattedPhone,
          code: smsOtp
        }
      });

      if (verifyError) {
        console.error('Error verificando OTP:', verifyError);
        const errorMsg = (verifyError as any).message || 'Error al verificar código';

        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          throw new Error('El código ha expirado. Por favor solicita un nuevo código.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('inválido') || errorMsg.includes('Incorrect')) {
          throw new Error('El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.');
        } else {
          throw new Error('Error al verificar el código. Por favor intenta de nuevo.');
        }
      }

      if (!data?.success) {
        throw new Error(data?.error || 'El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.');
      }

      console.log('✅ Código SMS verificado exitosamente');

      // Ahora crear el usuario en Supabase Auth
      await createUserAccount();

    } catch (err: any) {
      console.error('Error en verifySmsOtp:', err);
      setError(err.message || 'Código inválido. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Crear cuenta de usuario
  const createUserAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse full name
      const { firstName, lastName, motherLastName } = parseFullName(fullName);

      // Limpiar telefono - solo 10 digitos
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // Crear usuario con email OTP (sin contraseña)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-16), // Contraseña temporal aleatoria
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            mother_last_name: motherLastName,
            phone: cleanPhone,
            source: 'registro-directo'
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?redirect=/escritorio`,
        }
      });

      if (signUpError) {
        console.error('Error al crear cuenta:', signUpError);

        // Si el usuario ya existe, redirigir al login
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
        }

        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta');
      }

      console.log('✅ Usuario creado exitosamente:', authData.user.id);

      // Esperar a que se establezca la sesion
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

      // Actualizar el perfil con los datos completos incluyendo telefono y URL params
      const profileUpdateData = {
        first_name: firstName,
        last_name: lastName,
        mother_last_name: motherLastName,
        phone: cleanPhone,
        phone_verified: true, // Phone was verified via SMS OTP during registration
        email: email,
        // Datos de tracking
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
      };

      console.log('📝 Actualizando perfil con datos:', profileUpdateData);

      const { data: upsertData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          ...profileUpdateData
        })
        .select();

      if (updateError) {
        console.error('⚠️ Error actualizando perfil:', updateError);
        // No fallar si no se puede actualizar el perfil
      } else {
        console.log('✅ Perfil actualizado exitosamente:', upsertData);
      }

      // Verificar que los datos se guardaron
      const { data: verifyProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, email')
        .eq('id', authData.user.id)
        .single();

      console.log('🔍 Verificacion de perfil guardado:', verifyProfile);

      // Track conversion
      conversionTracking.trackAuth.otpVerified(authData.user.id, {
        email: email,
        source: leadSource,
        vehicleId: urlTrackingData.ordencompra
      });

      setStep('complete');

      // Redirigir a /escritorio/profile despues de 1.5 segundos (es nuevo usuario)
      setTimeout(() => {
        const redirectPath = `/escritorio/profile${urlParamsString ? `?${urlParamsString}` : ''}`;
        router.push(redirectPath);
      }, 1500);

    } catch (err: any) {
      console.error('Error creando cuenta:', err);
      setError(err.message || 'Error al crear la cuenta');
      setLoading(false);
    }
  };

  // Manejar envío del formulario inicial
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    // Validar teléfono (10 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Por favor, ingresa un número de teléfono válido de 10 dígitos');
      return;
    }

    await sendSmsOtp();
  };

  // CSS classes (same as AuthPage)
  const formInputClasses = "block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 sm:py-4 px-4 text-base sm:text-lg text-gray-900 shadow-sm placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500 min-h-[48px] sm:min-h-[52px]";
  const submitButtonClasses = "flex w-full justify-center rounded-lg bg-primary-600 px-4 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-h-[52px] sm:min-h-[56px] touch-manipulation";

  // Formulario de registro inicial
  const renderFormStep = () => (
    <div className="space-y-8">
      <div className="text-left lg:text-center">
        <Link href="/" className="inline-block mb-8 lg:hidden">
          <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10 sm:h-12 w-auto mx-auto" />
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight lg:tracking-normal">Crea tu cuenta</h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600">
          Completa tus datos para empezar tu experiencia TREFA
        </p>
      </div>

      {error && (
        <div className={`p-3 rounded-md ${error === 'account_exists_email' || error === 'account_exists_phone' ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
          {error === 'account_exists_email' ? (
            <p className="text-blue-700 text-sm text-center">
              Este correo electrónico ya está registrado. Por favor,{' '}
              <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="underline font-semibold hover:text-blue-900">
                inicia sesión aquí
              </Link>.
            </p>
          ) : error === 'account_exists_phone' ? (
            <p className="text-blue-700 text-sm text-center">
              Este número de teléfono ya está registrado. Por favor,{' '}
              <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="underline font-semibold hover:text-blue-900">
                inicia sesión aquí
              </Link>.
            </p>
          ) : (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="fullName"
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={formInputClasses}
          />
        </div>

        <div>
          <input
            id="phone"
            type="tel"
            placeholder="Teléfono celular (10 dígitos)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className={formInputClasses}
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-2">
            Te enviaremos un código de verificación por SMS
          </p>
        </div>

        <div>
          <input
            id="email"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={formInputClasses}
          />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
            Acepto los{' '}
            <Link href="/terminos" className="text-primary-600 hover:underline font-medium">
              Términos y Condiciones
            </Link>{' '}
            y la{' '}
            <Link href="/politica-de-privacidad" className="text-primary-600 hover:underline font-medium">
              Política de Privacidad
            </Link>
          </label>
        </div>

        <button
          type="submit"
          className={submitButtonClasses}
          disabled={loading}
        >
          {loading ? 'Enviando código...' : 'Continuar'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href={`/acceder${urlParamsString ? `?${urlParamsString}` : ''}`} className="text-primary-600 hover:underline font-medium">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );

  // Pantalla de verificación SMS
  const renderVerifySmsStep = () => (
    <div className="space-y-6 text-center">
      <button
        onClick={() => {
          setStep('form');
          setError(null);
          setSmsOtp('');
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 mx-auto"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </button>

      <CheckCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 text-green-500 mx-auto" />
      <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Verifica tu teléfono</h2>
      <p className="text-base sm:text-lg text-gray-600">
        Hemos enviado un código de 6 dígitos al número
      </p>
      <p className="font-semibold text-gray-900 text-lg">{phone}</p>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            id="smsOtp"
            type="text"
            inputMode="numeric"
            placeholder="------"
            value={smsOtp}
            onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`${formInputClasses} text-center tracking-[0.5em] font-mono text-2xl sm:text-3xl`}
            maxLength={6}
            required
          />
        </div>

        <button
          onClick={verifySmsOtp}
          className={submitButtonClasses}
          disabled={loading || smsOtp.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar y crear cuenta'}
        </button>

        <button
          onClick={sendSmsOtp}
          disabled={loading}
          className="w-full text-center text-sm text-gray-600 hover:text-primary-600 underline min-h-[44px] touch-manipulation"
        >
          Reenviar código
        </button>
      </div>
    </div>
  );

  // Pantalla de cuenta creada
  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
      <div>
        <h2 className="text-2xl font-bold text-gray-900">¡Cuenta creada exitosamente!</h2>
        <p className="mt-2 text-gray-600">
          Redirigiendo a tu perfil para completar tus datos...
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mt-4"></div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black">
      {/* Fullscreen Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
          src={proxyImage("https://cufm.mx/wp-content/uploads/2025/04/testomimos-02.mp4")}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative w-full max-w-5xl mx-auto bg-transparent rounded-2xl shadow-xl overflow-hidden grid lg:grid-cols-2">
        {/* Left Panel - Benefits (Hidden on mobile) */}
        <div className="relative hidden lg:flex flex-col justify-between h-full p-10 bg-white/60 backdrop-blur-sm text-gray-800 border-r border-white/20">
          <Link href="/" className="transition-transform hover:scale-105">
            <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-8 mb-2 w-auto" />
          </Link>

          <div className="flex-1 flex flex-col justify-center py-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              Crea tu cuenta <span className="text-primary-600">gratis</span> y sin compromisos
            </h2>
            <p className="mt-3 text-base lg:text-lg text-gray-600">Al registrarte podrás:</p>
            <ul className="mt-6 space-y-4">
              <li>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Guardar tus autos favoritos ❤️</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5">No pierdas de vista los autos que te interesan.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Aplicar a financiamiento en línea 📄</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Inicia tu solicitud 100% digital.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Recibir notificaciones de precios 🔔</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Te avisaremos si el precio baja.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Agendar visitas y pruebas de manejo 🗓️</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Coordina tu visita de forma fácil.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-200 pt-6">
            <div className="flex -space-x-2">
              {customerAvatars.map((avatar, index) => (
                <img
                  key={index}
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  src={avatar}
                  alt={`Cliente satisfecho ${index + 1}`}
                />
              ))}
            </div>
            <span className="font-medium text-gray-700 text-xs">Únete a cientos de clientes satisfechos</span>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          {step === 'form' && renderFormStep()}
          {step === 'verify_sms' && renderVerifySmsStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
