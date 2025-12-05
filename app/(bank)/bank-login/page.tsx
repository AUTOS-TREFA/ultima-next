'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { BANKS, type BankName } from '@/types/bank';
import { BankService } from '@/services/BankService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, FileText, MessageSquare } from 'lucide-react';

// Bank Logo Component
const BankLogo: React.FC<{ bankId: BankName }> = ({ bankId }) => {
  const logos: Record<BankName, string> = {
    scotiabank: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Scotiabank_Logo.svg/2560px-Scotiabank_Logo.svg.png',
    bbva: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/BBVA_2019.svg/2560px-BBVA_2019.svg.png',
    banorte: 'https://seeklogo.com/images/B/banorte-logo-72FE0FC46E-seeklogo.com.png',
    banregio: 'https://seeklogo.com/images/B/banregio-logo-43F87EE6B8-seeklogo.com.png',
    afirme: 'https://seeklogo.com/images/B/banca-afirme-logo-4C8E1EC3B9-seeklogo.com.png',
    hey_banco: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Hey_Banco_logo.svg/2560px-Hey_Banco_logo.svg.png',
    ban_bajio: 'https://seeklogo.com/images/B/banbajio-logo-05E2144F16-seeklogo.com.png',
    santander: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
    hsbc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/2560px-HSBC_logo_%282018%29.svg.png'
  };

  const logoUrl = logos[bankId];

  return (
    <div className="w-20 h-12 flex items-center justify-center">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={BANKS[bankId].name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // Fallback to initial letter if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center';
            fallback.innerHTML = `<span class="text-xl font-bold text-gray-600">${BANKS[bankId].name.charAt(0)}</span>`;
            target.parentNode?.appendChild(fallback);
          }}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-600">
            {BANKS[bankId].name.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
};

const BankLoginPage: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState<BankName | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'selectBank' | 'enterEmail' | 'verifyOtp'>('selectBank');
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Check if already logged in as bank rep
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const profile = await BankService.getBankRepProfile();
          if (profile && profile.is_approved) {
            router.push('/bank-dashboard');
          } else if (profile && !profile.is_approved) {
            setError('Tu cuenta está pendiente de aprobación por un administrador.');
          }
        } catch (err) {
          // Not a bank rep, continue with login
        }
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleBankSelect = (bank: BankName) => {
    setSelectedBank(bank);
    setView('enterEmail');
    setError(null);
  };

  const validateBusinessEmail = (email: string): boolean => {
    const publicDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es',
      'live.com', 'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
      'gmx.com', 'yandex.com', 'zoho.com'
    ];

    const emailDomain = email.toLowerCase().split('@')[1];

    // Allow autostrefa.mx emails
    if (emailDomain === 'autostrefa.mx') {
      return true;
    }

    // Reject public email domains
    if (publicDomains.includes(emailDomain)) {
      return false;
    }

    // Accept all other domains (business emails)
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedBank) return;

    setLoading(true);
    setError(null);

    try {
      // Validate business email
      // COMMENTED OUT FOR TESTING - Re-enable for production
      // if (!validateBusinessEmail(email)) {
      //   setError('Solo se permiten correos corporativos. No se aceptan correos de Gmail, Hotmail, Outlook, Yahoo u otros servicios públicos.');
      //   setLoading(false);
      //   return;
      // }

      // Check if email exists in bank_representative_profiles
      const { data: existingProfile } = await supabase
        .from('bank_representative_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingProfile && existingProfile.bank_affiliation !== selectedBank) {
        setError(`Este correo está registrado con ${BANKS[existingProfile.bank_affiliation].name}. Por favor, selecciona el banco correcto.`);
        setLoading(false);
        return;
      }

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true
        }
      });

      if (otpError) {
        throw otpError;
      }

      setView('verifyOtp');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar código de verificación';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !selectedBank) return;

    setLoading(true);
    setError(null);

    try {
      // Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.user) {
        throw new Error('Error al verificar código');
      }

      // Check if bank rep profile exists
      const { data: existingProfile } = await supabase
        .from('bank_representative_profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create new bank rep profile
        try {
          await BankService.createBankRepProfile({
            email: email.toLowerCase().trim(),
            first_name: '',
            last_name: '',
            bank_affiliation: selectedBank
          });
        } catch (createError) {
          console.error('Error creating bank rep profile:', createError);
        }
        // Redirect to dashboard regardless - user will see pending approval message there
        router.push('/bank-dashboard');
      } else {
        // Profile exists, redirect to dashboard
        // Approval check will happen in middleware
        await BankService.updateLoginTracking();
        router.push('/bank-dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Código incorrecto. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'verifyOtp') {
      setView('enterEmail');
      setOtp('');
    } else if (view === 'enterEmail') {
      setView('selectBank');
      setEmail('');
      setSelectedBank(null);
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Branding */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Portal Bancario</h1>
                <p className="text-blue-100 text-lg">
                  Acceso exclusivo para representantes bancarios
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Gestión de solicitudes</h3>
                    <p className="text-blue-100 text-sm">Revisa y aprueba solicitudes de financiamiento en tiempo real</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Documentación completa</h3>
                    <p className="text-blue-100 text-sm">Accede a todos los documentos y perfiles bancarios</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Comunicación directa</h3>
                    <p className="text-blue-100 text-sm">Proporciona retroalimentación al equipo de ventas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="p-12">
              {view === 'selectBank' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona tu banco</h2>
                  <p className="text-gray-600 mb-8">Elige el banco al que perteneces para continuar</p>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(BANKS).map((bank) => (
                      <Card
                        key={bank.id}
                        onClick={() => handleBankSelect(bank.id)}
                        className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center justify-center h-full">
                            <BankLogo bankId={bank.id} />
                            <span className="text-xs font-semibold text-foreground text-center mt-2">
                              {bank.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {view === 'enterEmail' && selectedBank && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-6 pl-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>

                  <div className="mb-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">
                          {BANKS[selectedBank].name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{BANKS[selectedBank].name}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu correo</h2>
                  <p className="text-gray-600 mb-8">Te enviaremos un código de verificación</p>

                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Correo electrónico corporativo
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu.nombre@banco.com"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? 'Enviando...' : 'Enviar código'}
                    </Button>
                  </form>
                </div>
              )}

              {view === 'verifyOtp' && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-6 pl-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu código</h2>
                  <p className="text-gray-600 mb-8">
                    Ingresa el código de 6 dígitos enviado a <span className="font-semibold">{email}</span>
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp">
                        Código de verificación
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? 'Verificando...' : 'Verificar'}
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setView('enterEmail');
                        setOtp('');
                        setError(null);
                      }}
                      className="w-full"
                    >
                      Reenviar código
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  );
};

export default BankLoginPage;
