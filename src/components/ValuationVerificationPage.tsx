'use client';

/**
 * ValuationVerificationPage
 *
 * Página de verificación de teléfono para desbloquear oferta de valuación.
 * Diseño inspirado en AuthPage con pantalla dividida.
 * - Izquierda: Formulario de verificación (amigable y simple)
 * - Derecha: Teaser de la oferta con precio difuminado
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import { useAuth } from '@/context/AuthContext';
import {
  Phone,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Car,
  DollarSign,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { AutometricaValuation } from '@/services/AutometricaService';

interface ValuationVerificationPageProps {
  valuation: AutometricaValuation;
  vehicleInfo: {
    brand: string;
    subbrand: string;
    year: string;
    version: string;
    kilometraje: number;
  };
  onVerified: () => void;
  onBack: () => void;
}

type VerificationStep = 'phone_input' | 'otp_verify' | 'verifying' | 'success';

const COUNTRY_CODES = [
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'EE.UU./Canadá', flag: '🇺🇸' },
];

const ValuationVerificationPage: React.FC<ValuationVerificationPageProps> = ({
  valuation,
  vehicleInfo,
  onVerified,
  onBack,
}) => {
  const { user, profile, reloadProfile } = useAuth();

  const [step, setStep] = useState<VerificationStep>('phone_input');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });

  // If user is already logged in with verified phone, skip verification
  useEffect(() => {
    if (user && profile?.phone_verified && profile?.phone) {
      onVerified();
    }
  }, [user, profile, onVerified]);

  // Pre-fill phone if available
  useEffect(() => {
    if (profile?.phone) {
      const cleanPhone = profile.phone.replace(/\D/g, '').slice(-10);
      setPhone(cleanPhone);
    }
  }, [profile]);

  const formatPhone = (phoneNumber: string): string => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `${countryCode}${cleanPhone}`;
    }
    return `+${cleanPhone}`;
  };

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setError('Por favor, ingresa un número de teléfono válido de 10 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhone(phone);

      // Use Twilio via Edge Function
      const { data, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: formattedPhone },
      });

      if (smsError) {
        const errorMsg = (smsError as any).message || 'Error al enviar código';
        if (errorMsg.includes('phone number')) {
          throw new Error('El número de teléfono ingresado no es válido.');
        }
        throw new Error('Error al enviar el mensaje SMS. Intenta de nuevo.');
      }

      if (!data?.success) {
        throw new Error('No se pudo enviar el código de verificación.');
      }

      toast.success('Código enviado por SMS');
      setStep('otp_verify');
    } catch (err: any) {
      setError(err.message || 'Error al enviar código SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('verifying');

    try {
      const formattedPhone = formatPhone(phone);
      const cleanPhone = phone.replace(/\D/g, '');

      // Verify OTP via Edge Function
      const { data, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: {
          phone: formattedPhone,
          code: otp,
        },
      });

      if (verifyError) {
        const errorMsg = (verifyError as any).message || 'Error al verificar';
        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          throw new Error('El código ha expirado. Solicita uno nuevo.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('Incorrect')) {
          throw new Error('El código es incorrecto. Verifica e intenta de nuevo.');
        }
        throw new Error('Error al verificar el código.');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'El código es incorrecto.');
      }

      // If user exists, update their profile
      if (user) {
        await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            phone_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        // Create new user via phone auth
        const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (authError) {
          console.error('Auth error:', authError);
        }

        // The profile will be created automatically by the trigger
        // We just need to mark it as phone_verified after sign in
      }

      await reloadProfile();

      setStep('success');
      toast.success('¡Teléfono verificado correctamente!');

      // Wait for animation then proceed
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Código inválido');
      setStep('otp_verify');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp_verify') {
      setStep('phone_input');
      setOtp('');
      setError(null);
    } else {
      onBack();
    }
  };

  // Input styles
  const inputClasses =
    'block w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 px-4 text-base text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all';
  const buttonClasses =
    'flex w-full justify-center items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="text-center">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-25"></div>
            <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Verificado!</h2>
          <p className="text-gray-600">Preparando tu oferta...</p>
        </div>
      </div>
    );
  }

  // Verifying screen
  if (step === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25"></div>
            <div className="relative w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          </div>
          <p className="font-bold text-xl text-gray-900">Verificando...</p>
          <p className="text-gray-500 mt-2">Un momento por favor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-[3fr_2fr]">
        {/* Left Column - Form */}
        <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'otp_verify' ? 'Cambiar número' : 'Volver'}
          </button>

          {/* Logo */}
          <Link href="/" className="inline-block mb-5">
            <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-8 w-auto" />
          </Link>

          {step === 'phone_input' ? (
            <>
              {/* Header */}
              <div className="mb-5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  ¡Un último paso! 🎉
                </h1>
                <p className="text-base text-gray-600">
                  Por favor ingresa tu número celular para ver tu oferta.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Phone Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de celular
                  </label>
                  <div className="flex">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="flex-shrink-0 px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-600 font-medium focus:ring-2 focus:ring-primary-500"
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="10 dígitos"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`${inputClasses} rounded-l-none flex-1`}
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Te enviaremos un código de verificación por SMS
                  </p>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, '').length !== 10}
                  className={buttonClasses}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Ver mi oferta
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-5 flex justify-center gap-6">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Shield className="w-4 h-4 text-primary-600" />
                  <span className="text-xs">Seguro</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs">Sin costo</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs">30 seg</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* OTP Verify Step */}
              <div className="mb-5 text-center">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Verifica tu número</h1>
                <p className="text-sm text-gray-600">
                  Enviamos un código de 6 dígitos a{' '}
                  <span className="font-semibold text-gray-900">{countryCode} {phone}</span>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${inputClasses} text-center tracking-[0.4em] font-mono text-xl`}
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className={buttonClasses}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar y ver oferta
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-center text-sm text-gray-500 hover:text-primary-600 underline"
                >
                  Reenviar código
                </button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            Al continuar, aceptas nuestros{' '}
            <Link href="/politica-de-privacidad" className="underline">
              términos y condiciones
            </Link>
          </p>
        </div>

        {/* Right Column - Image with Offer Overlay */}
        <div className="hidden lg:flex flex-col relative overflow-hidden">
          {/* Background Image */}
          <img
            src="/images/landing-asset-4.png"
            alt="Vende tu auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

          {/* Content Overlay */}
          <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
            {/* Vehicle Info Card */}
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Tu vehículo</p>
                  <p className="font-bold text-sm">
                    {vehicleInfo.brand} {vehicleInfo.subbrand} {vehicleInfo.year}
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/70">
                {vehicleInfo.version} • {vehicleInfo.kilometraje.toLocaleString()} km
              </p>
            </div>

            {/* Blurred Price */}
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4">
              <p className="text-xs text-white/70 mb-1">Oferta estimada</p>
              <p className="text-3xl font-bold blur-md select-none">
                {currencyFormatter.format(valuation.purchasePrice)}
              </p>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Verifica para desbloquear
              </p>
            </div>

            {/* Compact Benefits */}
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex items-center gap-1.5 text-white/80">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Pago 24h</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/80">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Sin compromiso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationVerificationPage;
