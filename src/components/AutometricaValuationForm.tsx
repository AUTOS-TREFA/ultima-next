'use client';

/**
 * AutometricaValuationForm
 *
 * Formulario PÚBLICO de valuación de autos usando la API de Autométrica.
 * Flujo:
 * 1. Usuario selecciona auto (público, sin login)
 * 2. Se calcula la valuación
 * 3. Se muestra oferta con valor oculto/difuminado
 * 4. Usuario verifica teléfono/email para ver oferta completa (crea cuenta)
 * 5. Redirige al dashboard de compras
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../../supabaseClient';

// Icons
import {
  Car,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  Gauge,
  Phone,
  Mail,
  Eye,
  Lock,
  Sparkles,
} from 'lucide-react';
import { WhatsAppIcon } from './icons';

// Services
import { AutometricaService, AutometricaCatalogVehicle, AutometricaValuation } from '@/services/AutometricaService';
import { SellCarService } from '@/services/SellCarService';
import { BrevoEmailService } from '@/services/BrevoEmailService';

// Types
import type { UserVehicleForSale } from '@/types/types';

// Custom components
import Confetti from '@/Valuation/components/Confetti';
import AnimatedNumber from '@/Valuation/components/AnimatedNumber';

// UI components - Dialog removed, using inline verification flow

// ============================================================================
// BRAND FILTER CONFIGURATION
// ============================================================================
// Add brands to exclude from the form (we don't buy these)
// The API will still work - this just filters what users can select
const EXCLUDED_BRANDS: string[] = [
  // Uncomment or add brands you don't want to show:
  // 'BAIC',
  // 'JAC',
  // 'Zotye',
  // 'Landwind',
  // 'Lifan',
  // 'Brilliance',
  // 'Foton',
  // 'Great Wall',
  // 'Haval',
  // 'Haima',
];

// Alternatively, use INCLUDED_BRANDS to only show specific brands (leave empty to show all minus excluded)
const INCLUDED_BRANDS: string[] = [
  'Audi',
  'BMW',
  'Chevrolet',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Mazda',
  'Mercedes Benz',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Peugeot',
  'RAM',
  'Renault',
  'Seat',
  'SEAT',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
];

// Year and mileage limits
const MIN_YEAR = 2016;
const MAX_KILOMETRAJE = 120000;

// ============================================================================
// PROPS
// ============================================================================

interface AutometricaValuationFormProps {
  initialSearchQuery?: string | null;
  onComplete?: () => void;
  compact?: boolean;
  embedded?: boolean; // New: for seamless page integration
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AutometricaValuationForm({
  onComplete,
  compact = false,
  embedded = false,
}: AutometricaValuationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, reloadProfile } = useAuth();

  // Refs for auto-focus
  const brandRef = useRef<HTMLSelectElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const yearRef = useRef<HTMLSelectElement>(null);
  const versionRef = useRef<HTMLSelectElement>(null);
  const kmRef = useRef<HTMLInputElement>(null);

  // State - PUBLIC FORM, no auth check on mount
  const [step, setStep] = useState<'vehicle' | 'valuating' | 'verify_to_reveal' | 'verifying' | 'success'>('vehicle');
  const [error, setError] = useState<string | null>(null);
  const [isQueryInProgress, setIsQueryInProgress] = useState(false);
  const [showPulse, setShowPulse] = useState(true); // Animation for first field

  // Catalog state - pre-filtered and indexed for speed
  const [catalog, setCatalog] = useState<AutometricaCatalogVehicle[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Cascading selection state
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSubbrand, setSelectedSubbrand] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [kilometraje, setKilometraje] = useState<string>('');

  // ============================================================================
  // INDEXED LOOKUPS - O(1) access instead of filtering arrays
  // ============================================================================
  const catalogIndex = useMemo(() => {
    if (catalog.length === 0) return null;

    const brandToSubbrands = new Map<string, Set<string>>();
    const brandSubbrandToYears = new Map<string, Set<number>>();
    const brandSubbrandYearToVersions = new Map<string, string[]>();
    const brands = new Set<string>();

    for (const v of catalog) {
      brands.add(v.brand);

      // Brand -> Subbrands
      if (!brandToSubbrands.has(v.brand)) {
        brandToSubbrands.set(v.brand, new Set());
      }
      brandToSubbrands.get(v.brand)!.add(v.subbrand);

      // Brand+Subbrand -> Years
      const bsKey = `${v.brand}|${v.subbrand}`;
      if (!brandSubbrandToYears.has(bsKey)) {
        brandSubbrandToYears.set(bsKey, new Set());
      }
      brandSubbrandToYears.get(bsKey)!.add(v.year);

      // Brand+Subbrand+Year -> Versions
      const bsyKey = `${v.brand}|${v.subbrand}|${v.year}`;
      if (!brandSubbrandYearToVersions.has(bsyKey)) {
        brandSubbrandYearToVersions.set(bsyKey, []);
      }
      brandSubbrandYearToVersions.get(bsyKey)!.push(v.version);
    }

    return { brands, brandToSubbrands, brandSubbrandToYears, brandSubbrandYearToVersions };
  }, [catalog]);

  // Derived options using indexed lookups (instant, no filtering)
  const brands = useMemo(() => {
    if (!catalogIndex) return [];
    return [...catalogIndex.brands].sort();
  }, [catalogIndex]);

  const subbrands = useMemo(() => {
    if (!catalogIndex || !selectedBrand) return [];
    const subs = catalogIndex.brandToSubbrands.get(selectedBrand);
    return subs ? [...subs].sort() : [];
  }, [catalogIndex, selectedBrand]);

  const years = useMemo(() => {
    if (!catalogIndex || !selectedBrand || !selectedSubbrand) return [];
    const key = `${selectedBrand}|${selectedSubbrand}`;
    const yrs = catalogIndex.brandSubbrandToYears.get(key);
    return yrs ? [...yrs].filter(y => y >= MIN_YEAR).sort((a, b) => b - a) : [];
  }, [catalogIndex, selectedBrand, selectedSubbrand]);

  const versions = useMemo(() => {
    if (!catalogIndex || !selectedBrand || !selectedSubbrand || !selectedYear) return [];
    const key = `${selectedBrand}|${selectedSubbrand}|${selectedYear}`;
    const vers = catalogIndex.brandSubbrandYearToVersions.get(key);
    return vers ? [...vers].sort() : [];
  }, [catalogIndex, selectedBrand, selectedSubbrand, selectedYear]);

  // Valuation state
  const [valuation, setValuation] = useState<AutometricaValuation | null>(null);

  // Verification state (for reveal step)
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false); // Toggle between login and register
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [copied, setCopied] = useState(false);

  // Currency formatter
  const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Store URL parameters for redirect after verification
  useEffect(() => {
    const redirect = searchParams?.get('redirect');
    const ordencompra = searchParams?.get('ordencompra');
    if (redirect) {
      localStorage.setItem('valuationRedirect', redirect);
    }
    if (ordencompra) {
      localStorage.setItem('ordencompra', ordencompra);
    }
  }, [searchParams]);

  // Load catalog on mount - PRE-FILTER for speed (PUBLIC - no auth required)
  useEffect(() => {
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const rawData = await AutometricaService.getCatalog();

        // PRE-FILTER: Remove excluded brands and old years ONCE at load time
        // This reduces the dataset size significantly and speeds up all subsequent operations
        const filteredData = rawData.filter((v) => {
          // Filter by year
          if (v.year < MIN_YEAR) return false;

          // Filter by brand
          if (INCLUDED_BRANDS.length > 0) {
            return INCLUDED_BRANDS.some(
              (included) => v.brand.toLowerCase() === included.toLowerCase()
            );
          } else if (EXCLUDED_BRANDS.length > 0) {
            return !EXCLUDED_BRANDS.some(
              (excluded) => v.brand.toLowerCase() === excluded.toLowerCase()
            );
          }
          return true;
        });

        setCatalog(filteredData);

        // Auto-focus on brand select after catalog loads
        setTimeout(() => brandRef.current?.focus({ preventScroll: true }), 100);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Error al cargar el catálogo de autos');
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, []);

  // If user is already logged in and verified, skip verification step
  useEffect(() => {
    if (step === 'verify_to_reveal' && user && profile?.phone_verified) {
      setStep('success');
    }
  }, [step, user, profile]);

  // Reset downstream selections when brand changes
  useEffect(() => {
    if (selectedBrand) {
      setSelectedSubbrand('');
      setSelectedYear('');
      setSelectedVersion('');
      setTimeout(() => modelRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [selectedBrand]);

  // Reset downstream selections when subbrand changes
  useEffect(() => {
    if (selectedSubbrand) {
      setSelectedYear('');
      setSelectedVersion('');
      setTimeout(() => yearRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [selectedSubbrand]);

  // Reset version and pre-fill mileage when year changes
  useEffect(() => {
    if (selectedYear) {
      setSelectedVersion('');
      setTimeout(() => versionRef.current?.focus({ preventScroll: true }), 50);

      // Pre-fill estimated mileage (capped at MAX_KILOMETRAJE)
      const currentYear = new Date().getFullYear();
      const carAge = Math.max(0, currentYear - parseInt(selectedYear));
      const estimatedMileage = Math.min(carAge * 15000, MAX_KILOMETRAJE);
      const roundedMileage = Math.round(estimatedMileage / 1000) * 1000;
      if (roundedMileage > 0) {
        setKilometraje(roundedMileage.toLocaleString('es-MX'));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Auto-focus on km field when version is selected
  useEffect(() => {
    if (selectedVersion) {
      setTimeout(() => kmRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [selectedVersion]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGetValuation = async () => {
    if (!selectedBrand || !selectedSubbrand || !selectedYear || !selectedVersion) {
      setError('Por favor, completa todos los campos del auto');
      return;
    }

    const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
    if (isNaN(kmValue) || kmValue < 0) {
      setError('Por favor, ingresa un kilometraje válido');
      return;
    }

    if (isQueryInProgress) return;

    setIsQueryInProgress(true);
    setStep('valuating');
    setError(null);

    try {
      const valuationResult = await AutometricaService.getValuation(
        {
          year: parseInt(selectedYear),
          brand: selectedBrand,
          subbrand: selectedSubbrand,
          version: selectedVersion,
        },
        kmValue
      );

      setValuation(valuationResult);

      // If user is already logged in and verified, go directly to success
      if (user && profile?.phone_verified) {
        await saveValuationData(valuationResult, kmValue);
        setStep('success');
      } else {
        // Show verification step to reveal offer
        setStep('verify_to_reveal');
      }

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (err: any) {
      console.error('Valuation error:', err);
      setError(err.message || 'No pudimos generar una oferta. Intenta de nuevo.');
      setStep('vehicle');
    } finally {
      setIsQueryInProgress(false);
    }
  };

  const saveValuationData = async (valuationResult: AutometricaValuation, kmValue: number) => {
    if (!user) return;

    try {
      const listingData: Partial<UserVehicleForSale> = {
        user_id: user.id,
        status: 'draft',
        valuation_data: {
          source: 'autometrica',
          vehicle: {
            year: parseInt(selectedYear),
            brand: selectedBrand,
            subbrand: selectedSubbrand,
            version: selectedVersion,
          },
          kilometraje: kmValue,
          purchasePrice: valuationResult.purchasePrice,
          salePrice: valuationResult.salePrice,
          kmAdjustment: valuationResult.kmAdjustment,
          clientName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          clientEmail: profile?.email,
          clientPhone: profile?.phone,
          createdAt: new Date().toISOString(),
        },
      };

      await SellCarService.createOrUpdateSellListing(listingData);
    } catch (saveError) {
      console.error('Error saving listing:', saveError);
    }

    // Send email notification
    try {
      await BrevoEmailService.notifyAdminsNewValuation(
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario',
        profile?.email || '',
        profile?.phone || '',
        `${selectedBrand} ${selectedSubbrand} ${selectedVersion} ${selectedYear}`,
        kmValue,
        valuationResult.purchasePrice,
        valuationResult.salePrice,
        valuationResult.salePrice
      );
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      setVerificationError('Ingresa un número de celular válido');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      setVerificationError('Ingresa un correo electrónico válido');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // Clean phone number
      const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailInput)
        .single();

      if (existingEmail) {
        setVerificationError('Este correo ya está registrado. Inicia sesión en lugar de registrarte.');
        setVerificationLoading(false);
        return;
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .single();

      if (existingPhone) {
        setVerificationError('Este teléfono ya está registrado. Inicia sesión en lugar de registrarte.');
        setVerificationLoading(false);
        return;
      }

      // Format phone for Mexico
      const formattedPhone = `+52${cleanPhone}`;

      // Call Twilio Verify edge function (same as RegisterPage)
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: formattedPhone, email: emailInput }
      });

      if (data?.error === 'email_exists') {
        setVerificationError('Este correo ya está registrado. Inicia sesión en lugar de registrarte.');
        setVerificationLoading(false);
        return;
      }

      if (error || !data?.success) {
        const errorMsg = data?.error || error?.message || 'Error al enviar código';
        if (errorMsg.includes('rate limit') || errorMsg.includes('Max send attempts')) {
          throw new Error('Has solicitado demasiados códigos. Espera unos minutos.');
        }
        throw new Error('No se pudo enviar el código. Intenta de nuevo.');
      }

      console.log('SMS enviado exitosamente via Twilio');
      setOtpSent(true);
    } catch (err: any) {
      console.error('OTP error:', err);
      setVerificationError(err.message || 'Error al enviar el código');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setVerificationError('Ingresa el código de 6 dígitos');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);
    setStep('verifying');

    try {
      const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+52${cleanPhone}`;

      // Verify OTP via Twilio edge function (same as RegisterPage)
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: { phone: formattedPhone, code: otpCode }
      });

      if (verifyError || !verifyData?.success) {
        const errorMsg = verifyData?.error || verifyError?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          throw new Error('El código ha expirado. Solicita uno nuevo.');
        }
        throw new Error('El código es incorrecto. Verifica e intenta de nuevo.');
      }

      console.log('✅ Código SMS verificado via Twilio');

      // Create user account (same pattern as RegisterPage)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailInput,
        password: Math.random().toString(36).slice(-16), // Random temporary password
        options: {
          data: {
            phone: cleanPhone,
            source: 'vender-mi-auto'
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?redirect=/vender-mi-auto`,
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

      console.log('✅ Usuario creado:', authData.user.id);

      // Wait for session
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile with phone_verified and valuation source
      await supabase
        .from('profiles')
        .update({
          phone: cleanPhone,
          phone_verified: true,
          email: emailInput,
          lead_source: 'vender-mi-auto',
        })
        .eq('id', authData.user.id);

      // Reload profile and save valuation
      await reloadProfile();

      const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
      if (valuation) {
        await saveValuationData(valuation, kmValue);
      }

      setStep('success');
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerificationError(err.message || 'Código incorrecto');
      setStep('verify_to_reveal');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Handle login for existing users
  const handleLogin = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setVerificationError('Ingresa un correo electrónico válido');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // Sign in with email magic link (passwordless)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?redirect=/vender-mi-auto`,
        }
      });

      if (signInError) {
        throw signInError;
      }

      setVerificationError(null);
      // Show success message
      alert('Te enviamos un enlace de acceso a tu correo. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      console.error('Login error:', err);
      setVerificationError(err.message || 'Error al iniciar sesión');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleReset = () => {
    setStep('vehicle');
    setError(null);
    setSelectedBrand('');
    setSelectedSubbrand('');
    setSelectedYear('');
    setSelectedVersion('');
    setKilometraje('');
    setValuation(null);
    setOtpSent(false);
    setOtpCode('');
    setPhoneInput('');
    setEmailInput('');
    setIsLoginMode(false);
    setLoginPassword('');
  };

  const handleCopy = () => {
    if (!valuation) return;
    const text = `TREFA me ofreció ${currencyFormatter.format(valuation.purchasePrice)} por mi ${selectedBrand} ${selectedSubbrand} ${selectedYear}. ¡Valúa tu auto también! ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGoToDashboard = () => {
    router.push('/escritorio/admin/compras');
  };

  // WhatsApp URL
  const offer = valuation?.purchasePrice || 0;
  const whatsappText = `Me interesa vender mi ${selectedBrand} ${selectedSubbrand} ${selectedYear} por la cantidad de ${currencyFormatter.format(offer)}, y quisiera concretar una cita de inspección.`;
  const whatsappUrl = `https://wa.me/528187049079?text=${encodeURIComponent(whatsappText)}`;

  // Styles for embedded vs standalone
  const containerClass = embedded
    ? 'w-full'
    : `w-full ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`;

  const cardClass = embedded
    ? ''
    : 'bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden';

  // ============================================================================
  // RENDER - VALUATING (compact inline loader)
  // ============================================================================

  if (step === 'valuating' || step === 'verifying') {
    return (
      <div className={containerClass}>
        <div className={embedded ? '' : cardClass}>
          <div className={embedded ? 'py-6' : 'p-6'}>
            <div className="flex items-center gap-4 justify-center">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25"></div>
                <div className="relative w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {step === 'verifying' ? 'Verificando...' : 'Calculando tu oferta...'}
                </p>
                <p className="text-gray-500 text-xs">
                  {step === 'verifying' ? 'Creando tu cuenta' : 'Consultando datos del mercado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - VERIFY TO REVEAL (inline flow, modern design)
  // ============================================================================

  if (step === 'verify_to_reveal' && valuation) {
    return (
      <div className={containerClass}>
        <div className={embedded ? '' : cardClass}>
          <div className={embedded ? 'space-y-4' : 'p-6 space-y-4'}>
            {/* Modern Offer Card - Glass morphism style */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/20 to-transparent rounded-full blur-2xl" />

              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-green-400 font-semibold text-sm">¡Oferta lista!</span>
                </div>

                {/* Vehicle info */}
                <p className="text-white/60 text-sm mb-1">Tu auto</p>
                <h3 className="text-white font-bold text-lg mb-4">
                  {selectedBrand} {selectedSubbrand} {selectedYear}
                </h3>

                {/* Blurred offer value - more prominent */}
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Oferta TREFA</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-black text-white blur-md select-none">
                      {currencyFormatter.format(valuation.purchasePrice)}
                    </p>
                    <Lock className="w-5 h-5 text-white/40" />
                  </div>
                </div>

                {/* Unlock hint */}
                <p className="text-white/40 text-xs mt-3 text-center">
                  Verifica tu identidad para desbloquear tu oferta
                </p>
              </div>
            </div>

            {/* Inline Verification Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              {/* Tab toggle - only show if OTP not sent */}
              {!otpSent && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setIsLoginMode(false); setVerificationError(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLoginMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Nuevo usuario
                  </button>
                  <button
                    onClick={() => { setIsLoginMode(true); setVerificationError(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLoginMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              )}

              {/* Error message */}
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{verificationError}</p>
                </div>
              )}

              {isLoginMode ? (
                /* LOGIN MODE - Existing users */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={verificationLoading || !emailInput}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar enlace de acceso <Mail className="w-4 h-4" /></>}
                  </button>
                  <p className="text-xs text-gray-500 text-center">Te enviaremos un enlace mágico a tu correo</p>
                </div>
              ) : !otpSent ? (
                /* REGISTER MODE - New users - phone + email */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Correo</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="tu@email.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Celular</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="10 dígitos"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={verificationLoading || !phoneInput || !emailInput}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar código SMS <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-xs text-gray-500 text-center">Recibirás un código de 6 dígitos por SMS</p>
                </div>
              ) : (
                /* OTP VERIFICATION - inline 6-digit input */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900">Código enviado</p>
                    <p className="text-sm text-gray-500">Ingresa el código de 6 dígitos enviado a <span className="font-medium">{phoneInput}</span></p>
                  </div>

                  {/* 6-digit OTP input boxes */}
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCode[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const newOtp = otpCode.split('');
                          newOtp[index] = value;
                          setOtpCode(newOtp.join('').slice(0, 6));
                          // Auto-focus next input
                          if (value && index < 5) {
                            const nextInput = e.target.nextElementSibling as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace to go to previous input
                          if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                            const prevInput = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            prevInput?.focus();
                          }
                        }}
                        className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={verificationLoading || otpCode.length < 6}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verificar y ver oferta <Eye className="w-4 h-4" /></>}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    <button onClick={() => setOtpSent(false)} className="text-gray-500 hover:text-gray-700">
                      Cambiar número
                    </button>
                    <span className="text-gray-300">|</span>
                    <button onClick={handleSendOtp} disabled={verificationLoading} className="text-primary-600 hover:text-primary-700 font-medium">
                      Reenviar código
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-400">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </div>

            {/* Reset link */}
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Cotizar otro auto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS (compact inline)
  // ============================================================================

  if (step === 'success' && valuation) {
    return (
      <div className={containerClass}>
        <Confetti />
        <div className={embedded ? '' : cardClass}>
          <div className={embedded ? 'space-y-4' : 'p-6 space-y-4'}>
            {/* Compact success header + offer */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">¡Tenemos una oferta!</p>
                  <p className="text-green-100 text-xs">{selectedBrand} {selectedSubbrand} {selectedYear}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">Oferta</p>
                  <p className="text-xl font-bold text-white">
                    <AnimatedNumber value={offer} />
                  </p>
                </div>
              </div>
            </div>

            {/* Compact market values */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                <p className="text-[10px] text-blue-600 font-medium">Valor Mercado</p>
                <p className="font-bold text-blue-700 text-sm">{currencyFormatter.format(valuation.salePrice)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center border border-green-100">
                <p className="text-[10px] text-green-600 font-medium">Tu Oferta</p>
                <p className="font-bold text-green-700 text-sm">{currencyFormatter.format(valuation.purchasePrice)}</p>
              </div>
            </div>

            {/* Compact actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGoToDashboard}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all text-sm"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-all text-sm"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-3 px-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-3 px-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - VEHICLE SELECTION FORM (PUBLIC)
  // ============================================================================

  const isFormComplete = selectedBrand && selectedSubbrand && selectedYear && selectedVersion && kilometraje;

  // Compact styles
  const inputPy = compact ? 'py-2.5' : 'py-3.5';
  const inputText = compact ? 'text-sm' : 'text-base';
  const labelText = compact ? 'text-[11px] font-medium text-slate-500 uppercase tracking-wide' : 'text-xs font-medium text-gray-500 uppercase tracking-wide';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const spaceY = compact ? 'space-y-3' : 'space-y-4';
  const gap = compact ? 'gap-3' : 'gap-4';

  return (
    <div className={containerClass}>
      <div className={embedded ? '' : cardClass}>
        {/* Content */}
        <div className={embedded ? spaceY : `p-6 ${spaceY}`}>
          {/* Error Alert */}
          {error && (
            <div className={`${compact ? 'p-3' : 'p-4'} bg-red-50 border border-red-200 rounded-xl flex items-start gap-2`}>
              <AlertTriangle className={`${iconSize} text-red-500 flex-shrink-0 mt-0.5`} />
              <p className={`${labelText} text-red-700`}>{error}</p>
            </div>
          )}

          {catalogLoading ? (
            <div className={`${compact ? 'py-8' : 'py-12'} text-center`}>
              <Loader2 className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} mx-auto animate-spin text-primary-600 mb-3`} />
              <p className="text-gray-500 text-sm">Cargando catálogo...</p>
            </div>
          ) : (
            <div className={spaceY}>
              {/* Row 1: Brand, Model, Year */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 ${gap}`}>
                <div className="space-y-1.5">
                  <label className={`block ${labelText}`}>Marca</label>
                  <div className={`relative animated-border-wrapper ${showPulse && !selectedBrand ? 'animate-subtle-pulse' : ''}`}>
                    <select
                      ref={brandRef}
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setShowPulse(false);
                      }}
                      className={`w-full appearance-none form-select-animated rounded-lg ${inputPy} px-3 pr-8 ${inputText} text-gray-900 font-medium cursor-pointer ${showPulse && !selectedBrand ? 'border-[#003161]/30' : ''}`}
                    >
                      <option value="">Seleccionar</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconSize} ${showPulse && !selectedBrand ? 'text-[#003161]' : 'text-gray-400'} pointer-events-none`} />
                    {showPulse && !selectedBrand && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#003161] opacity-50"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#003161]"></span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedBrand ? 'opacity-40' : ''}`}>Modelo</label>
                  <div className="relative animated-border-wrapper">
                    <select
                      ref={modelRef}
                      value={selectedSubbrand}
                      onChange={(e) => setSelectedSubbrand(e.target.value)}
                      disabled={!selectedBrand}
                      className={`w-full appearance-none form-select-animated rounded-lg ${inputPy} px-3 pr-8 ${inputText} font-medium ${!selectedBrand ? 'cursor-not-allowed' : 'cursor-pointer'} ${selectedBrand ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      <option value="">{selectedBrand ? 'Seleccionar' : '—'}</option>
                      {subbrands.map((subbrand) => (
                        <option key={subbrand} value={subbrand}>{subbrand}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconSize} ${!selectedBrand ? 'text-gray-300' : 'text-gray-400'} pointer-events-none`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedSubbrand ? 'opacity-40' : ''}`}>Año</label>
                  <div className="relative animated-border-wrapper">
                    <select
                      ref={yearRef}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={!selectedSubbrand}
                      className={`w-full appearance-none form-select-animated rounded-lg ${inputPy} px-3 pr-7 ${inputText} font-medium ${!selectedSubbrand ? 'cursor-not-allowed' : 'cursor-pointer'} ${selectedSubbrand ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      <option value="">{selectedSubbrand ? 'Seleccionar' : '—'}</option>
                      {years.map((year) => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconSize} ${!selectedSubbrand ? 'text-gray-300' : 'text-gray-400'} pointer-events-none`} />
                  </div>
                </div>
              </div>

              {/* Row 2: Version, Kilometraje, Button */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 ${gap} items-end`}>
                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedYear ? 'opacity-40' : ''}`}>Versión</label>
                  <div className="relative animated-border-wrapper">
                    <select
                      ref={versionRef}
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      disabled={!selectedYear}
                      className={`w-full appearance-none form-select-animated rounded-lg ${inputPy} px-3 pr-7 ${inputText} font-medium ${!selectedYear ? 'cursor-not-allowed' : 'cursor-pointer'} ${selectedYear ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      <option value="">{selectedYear ? 'Seleccionar' : '—'}</option>
                      {versions.map((version) => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconSize} ${!selectedYear ? 'text-gray-300' : 'text-gray-400'} pointer-events-none`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedVersion ? 'opacity-40' : ''}`}>Kilometraje</label>
                  <div className="relative animated-border-wrapper">
                    <input
                      ref={kmRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="45,000"
                      disabled={!selectedVersion}
                      value={kilometraje}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value) {
                          const numValue = parseInt(value);
                          // Cap at MAX_KILOMETRAJE
                          const cappedValue = Math.min(numValue, MAX_KILOMETRAJE);
                          setKilometraje(cappedValue.toLocaleString('es-MX'));
                        } else {
                          setKilometraje('');
                        }
                      }}
                      className={`w-full form-input-glow rounded-lg ${inputPy} px-3 pr-8 ${inputText} font-medium placeholder-gray-300 ${!selectedVersion ? 'cursor-not-allowed !bg-gray-50 !border-gray-100' : ''} ${selectedVersion ? 'text-gray-900' : 'text-gray-300'}`}
                    />
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${!selectedVersion ? 'text-gray-300' : 'text-gray-400'}`}>km</span>
                  </div>
                </div>

                {/* Inline Button - CTA Blue */}
                <div className="space-y-1.5">
                  <label className={`block ${labelText} opacity-0`}>Acción</label>
                  <button
                    onClick={handleGetValuation}
                    disabled={!isFormComplete || isQueryInProgress}
                    className={`w-full flex items-center justify-center gap-2 bg-[#003161] text-white font-semibold ${inputPy} px-4 rounded-lg hover:bg-[#002850] shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none text-sm`}
                  >
                    {isQueryInProgress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Cotizar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {!embedded && (
            <p className="text-center text-xs text-gray-400 pt-2">
              Sin costo • Sin compromiso • Datos de Guía Autométrica
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutometricaValuationForm;
