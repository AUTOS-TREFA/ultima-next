'use client';

/**
 * AutometricaValuationForm
 *
 * Formulario PÚBLICO de valuación de vehículos usando la API de Autométrica.
 * Flujo:
 * 1. Usuario selecciona vehículo (público, sin login)
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
        setTimeout(() => brandRef.current?.focus(), 100);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Error al cargar el catálogo de vehículos');
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
      setTimeout(() => modelRef.current?.focus(), 50);
    }
  }, [selectedBrand]);

  // Reset downstream selections when subbrand changes
  useEffect(() => {
    if (selectedSubbrand) {
      setSelectedYear('');
      setSelectedVersion('');
      setTimeout(() => yearRef.current?.focus(), 50);
    }
  }, [selectedSubbrand]);

  // Reset version and pre-fill mileage when year changes
  useEffect(() => {
    if (selectedYear) {
      setSelectedVersion('');
      setTimeout(() => versionRef.current?.focus(), 50);

      // Pre-fill estimated mileage (capped at MAX_KILOMETRAJE)
      const currentYear = new Date().getFullYear();
      const carAge = Math.max(0, currentYear - parseInt(selectedYear));
      const estimatedMileage = Math.min(carAge * 15000, MAX_KILOMETRAJE);
      const roundedMileage = Math.round(estimatedMileage / 1000) * 1000;
      if (roundedMileage > 0 && !kilometraje) {
        setKilometraje(roundedMileage.toLocaleString('es-MX'));
      }
    }
  }, [selectedYear, kilometraje]);

  // Auto-focus on km field when version is selected
  useEffect(() => {
    if (selectedVersion) {
      setTimeout(() => kmRef.current?.focus(), 50);
    }
  }, [selectedVersion]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGetValuation = async () => {
    if (!selectedBrand || !selectedSubbrand || !selectedYear || !selectedVersion) {
      setError('Por favor, completa todos los campos del vehículo');
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
      // Format phone for Mexico
      const formattedPhone = phoneInput.startsWith('+52')
        ? phoneInput
        : `+52${phoneInput.replace(/\D/g, '').slice(-10)}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

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
      const formattedPhone = phoneInput.startsWith('+52')
        ? phoneInput
        : `+52${phoneInput.replace(/\D/g, '').slice(-10)}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      // Update profile with email and phone_verified
      if (data.user) {
        // Use RPC to create/update profile
        await supabase.rpc('create_profile_for_user', {
          p_user_id: data.user.id,
          p_phone: formattedPhone,
          p_email: emailInput,
        });

        // Update email if different
        if (emailInput && data.user.email !== emailInput) {
          await supabase.auth.updateUser({ email: emailInput });
        }

        // Mark phone as verified
        await supabase
          .from('profiles')
          .update({
            phone: formattedPhone,
            phone_verified: true,
            email: emailInput,
          })
          .eq('id', data.user.id);
      }

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
  // RENDER - VALUATING
  // ============================================================================

  if (step === 'valuating' || step === 'verifying') {
    return (
      <div className={containerClass}>
        <div className={embedded ? 'py-12 text-center' : `${cardClass} p-8`}>
          <div className="py-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25"></div>
              <div className="relative w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
              </div>
            </div>
            <p className="font-bold text-xl text-gray-900">
              {step === 'verifying' ? 'Verificando...' : 'Calculando tu oferta...'}
            </p>
            <p className="text-gray-500 mt-2">
              {step === 'verifying' ? 'Creando tu cuenta' : 'Consultando datos del mercado mexicano'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - VERIFY TO REVEAL
  // ============================================================================

  if (step === 'verify_to_reveal' && valuation) {
    return (
      <div className={containerClass}>
        <div className={embedded ? '' : cardClass}>
          {/* Blurred Offer Preview */}
          <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-8 text-center overflow-hidden">
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/30" />
            <Sparkles className="absolute bottom-4 left-4 w-5 h-5 text-white/20" />

            <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Eye className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Tu oferta está lista!</h2>
            <p className="text-primary-100 mt-2 mb-4">
              Verifica tu número para ver el monto
            </p>

            {/* Blurred price */}
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4">
              <p className="text-sm text-white/70 mb-1">Oferta estimada</p>
              <p className="text-4xl font-bold text-white blur-md select-none">
                {currencyFormatter.format(valuation.purchasePrice)}
              </p>
            </div>

            <p className="text-xs text-white/60 mt-4">
              {selectedBrand} {selectedSubbrand} {selectedYear}
            </p>
          </div>

          {/* Verification Form */}
          <div className="p-6 space-y-5">
            <div className="text-center">
              <Lock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-gray-900">Desbloquea tu oferta</h3>
              <p className="text-sm text-gray-500">Ingresa tus datos para ver el monto exacto</p>
            </div>

            {verificationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{verificationError}</p>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pl-12 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Número de celular
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="10 dígitos"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pl-12 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Te enviaremos un código de verificación por SMS</p>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={verificationLoading || !phoneInput || !emailInput}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {verificationLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Ver mi oferta
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-4 px-6 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enviamos un código de 6 dígitos a {phoneInput}
                  </p>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={verificationLoading || otpCode.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {verificationLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verificar y ver oferta
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setOtpSent(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Cambiar número
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400">
              Al continuar, aceptas nuestros términos y condiciones
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS
  // ============================================================================

  if (step === 'success' && valuation) {
    return (
      <div className={containerClass}>
        <Confetti />
        <div className={embedded ? '' : cardClass}>
          {/* Header */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">¡Tenemos una oferta para ti!</h2>
            <p className="text-green-100 mt-2">Basada en datos reales del mercado mexicano</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Offer Display */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 text-center border border-primary-200">
              <p className="text-sm text-primary-700 font-medium mb-1">Oferta de Compra</p>
              <p className="text-4xl font-bold text-primary-600">
                <AnimatedNumber value={offer} />
              </p>
              <p className="text-sm text-primary-600/70 mt-2">
                para tu {selectedBrand} {selectedSubbrand} {selectedYear}
              </p>
            </div>

            {/* Market Value Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl text-center border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Valor de Mercado</p>
                <p className="font-bold text-blue-700 text-lg">
                  {currencyFormatter.format(valuation.salePrice)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-1">Tu Oferta</p>
                <p className="font-bold text-green-700 text-lg">
                  {currencyFormatter.format(valuation.purchasePrice)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25"
              >
                Continuar con la venta
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/25"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Agendar por WhatsApp
              </a>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Imprimir
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Compartir'}
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Cotizar otro auto
            </button>
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
              <div className={`grid grid-cols-3 ${gap}`}>
                <div className="space-y-1.5">
                  <label className={`block ${labelText}`}>Marca</label>
                  <div className={`relative ${showPulse && !selectedBrand ? 'animate-pulse-border' : ''}`}>
                    <select
                      ref={brandRef}
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setShowPulse(false);
                      }}
                      className={`w-full appearance-none bg-white border-2 rounded-lg ${inputPy} px-3 pr-8 ${inputText} text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 ${showPulse && !selectedBrand ? 'border-primary-400 ring-2 ring-primary-200 ring-opacity-50' : 'border-gray-200'}`}
                    >
                      <option value="">Seleccionar</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconSize} ${showPulse && !selectedBrand ? 'text-primary-500' : 'text-gray-400'} pointer-events-none`} />
                    {showPulse && !selectedBrand && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedBrand ? 'opacity-40' : ''}`}>Modelo</label>
                  <div className="relative">
                    <select
                      ref={modelRef}
                      value={selectedSubbrand}
                      onChange={(e) => setSelectedSubbrand(e.target.value)}
                      disabled={!selectedBrand}
                      className={`w-full appearance-none border rounded-lg ${inputPy} px-3 pr-8 ${inputText} font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${!selectedBrand ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-900 cursor-pointer hover:border-gray-300'}`}
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
                  <div className="relative">
                    <select
                      ref={yearRef}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={!selectedSubbrand}
                      className={`w-full appearance-none border rounded-lg ${inputPy} px-3 pr-7 ${inputText} font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${!selectedSubbrand ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-900 cursor-pointer hover:border-gray-300'}`}
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
              <div className={`grid grid-cols-3 ${gap} items-end`}>
                <div className="space-y-1.5">
                  <label className={`block ${labelText} ${!selectedYear ? 'opacity-40' : ''}`}>Versión</label>
                  <div className="relative">
                    <select
                      ref={versionRef}
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      disabled={!selectedYear}
                      className={`w-full appearance-none border rounded-lg ${inputPy} px-3 pr-7 ${inputText} font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${!selectedYear ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-900 cursor-pointer hover:border-gray-300'}`}
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
                  <div className="relative">
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
                      className={`w-full border rounded-lg ${inputPy} px-3 pr-8 ${inputText} font-medium placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${!selectedVersion ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'}`}
                    />
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${!selectedVersion ? 'text-gray-300' : 'text-gray-400'}`}>km</span>
                  </div>
                </div>

                {/* Inline Button */}
                <div className="space-y-1.5">
                  <label className={`block ${labelText} opacity-0`}>Acción</label>
                  <button
                    onClick={handleGetValuation}
                    disabled={!isFormComplete || isQueryInProgress}
                    className={`w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold ${inputPy} px-4 rounded-lg hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm`}
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
