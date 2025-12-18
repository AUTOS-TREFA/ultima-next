'use client';

import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckCircle, Loader2, Phone, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface PhoneVerificationProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onVerified: () => void;
  onSkip?: () => void;
  userId: string;
  showSkip?: boolean;
}

type VerificationStep = 'input' | 'verify' | 'success';

const COUNTRY_CODES = [
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'EE.UU./Canadá', flag: '🇺🇸' },
];

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phone,
  onPhoneChange,
  onVerified,
  onSkip,
  userId,
  showSkip = false,
}) => {
  const [step, setStep] = useState<VerificationStep>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [countryCode, setCountryCode] = useState('+52');

  const formatPhone = (phoneNumber: string): string => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `${countryCode}${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      return `+${cleanPhone}`;
    }
    return cleanPhone;
  };

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setError('Por favor, ingresa un número de teléfono válido de 10 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if phone is already used by another user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .neq('id', userId)
        .single();

      if (existingProfile) {
        setError('Este número de teléfono ya está registrado con otra cuenta.');
        setLoading(false);
        return;
      }

      const formattedPhone = formatPhone(phone);

      // Pass userId to allow re-verification for the same user
      const { data, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          phone: formattedPhone,
          userId: userId // Pass userId to skip "already verified" check for same user
        }
      });

      // Handle phone_already_verified error (phone verified with different account)
      if (data?.error === 'phone_already_verified') {
        const maskedEmail = data?.existingEmail || '';
        throw new Error(
          `Este teléfono ya está verificado con otra cuenta${maskedEmail ? ` (${maskedEmail})` : ''}.`
        );
      }

      if (smsError) {
        const errorMsg = (smsError as any).message || 'Error al enviar código';
        if (errorMsg.includes('phone number')) {
          throw new Error('El número de teléfono ingresado no es válido.');
        } else {
          throw new Error('Error al enviar el mensaje SMS. Intenta de nuevo.');
        }
      }

      if (!data?.success) {
        throw new Error('No se pudo enviar el código de verificación.');
      }

      toast.success('Código enviado por SMS');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Error al enviar código SMS');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhone(phone);
      const cleanPhone = phone.replace(/\D/g, '');

      const { data, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: {
          phone: formattedPhone,
          code: otp
        }
      });

      if (verifyError) {
        const errorMsg = (verifyError as any).message || 'Error al verificar';
        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          throw new Error('El código ha expirado. Solicita uno nuevo.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('Incorrect')) {
          throw new Error('El código es incorrecto. Verifica e intenta de nuevo.');
        } else {
          throw new Error('Error al verificar el código.');
        }
      }

      if (!data?.success) {
        throw new Error(data?.error || 'El código es incorrecto.');
      }

      // Update profile with verified phone
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: cleanPhone,
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Error al guardar la verificación.');
      }

      setStep('success');
      toast.success('¡Teléfono verificado correctamente!');

      // Call onVerified after a brief delay to show success state
      setTimeout(() => {
        onVerified();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setOtp('');
    setError(null);
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Teléfono verificado!</h3>
        <p className="text-gray-600">Tu número ha sido verificado correctamente.</p>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Cambiar número
        </button>

        <div className="text-center">
          <Phone className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Verifica tu teléfono</h3>
          <p className="text-gray-600 text-sm">
            Enviamos un código de 6 dígitos al número
          </p>
          <p className="font-semibold text-gray-900">{countryCode} {phone}</p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="otp">Código de verificación</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center tracking-[0.5em] font-mono text-2xl mt-2"
              maxLength={6}
            />
          </div>

          <Button
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full"
            style={{ backgroundColor: '#FF6801' }}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? 'Verificando...' : 'Verificar código'}
          </Button>

          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full text-center text-sm text-gray-600 hover:text-primary-600 underline"
          >
            Reenviar código
          </button>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Verifica tu teléfono</h3>
        <p className="text-gray-600 text-sm">
          Para tu seguridad, necesitamos verificar tu número de celular.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="phone">Número de celular</Label>
          <div className="flex mt-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <Input
              id="phone"
              type="tel"
              placeholder="10 dígitos"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="rounded-l-none"
              maxLength={10}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Te enviaremos un código de verificación por SMS
          </p>
        </div>

        <Button
          onClick={sendOtp}
          disabled={loading || phone.replace(/\D/g, '').length !== 10}
          className="w-full"
          style={{ backgroundColor: '#FF6801' }}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {loading ? 'Enviando...' : 'Enviar código de verificación'}
        </Button>

        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Verificar después
          </button>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification;
