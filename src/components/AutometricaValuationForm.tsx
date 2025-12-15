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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, profile, reloadProfile } = useAuth();

  // State - PUBLIC FORM, no auth check on mount
  const [step, setStep] = useState<'vehicle' | 'valuating' | 'verify_to_reveal' | 'verifying' | 'success'>('vehicle');
  const [error, setError] = useState<string | null>(null);
  const [isQueryInProgress, setIsQueryInProgress] = useState(false);

  // Catalog state
  const [catalog, setCatalog] = useState<AutometricaCatalogVehicle[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Cascading selection state
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSubbrand, setSelectedSubbrand] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [kilometraje, setKilometraje] = useState<string>('');

  // Derived options for cascading selects
  const [brands, setBrands] = useState<string[]>([]);
  const [subbrands, setSubbrands] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [versions, setVersions] = useState<string[]>([]);

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

  // Load catalog on mount (PUBLIC - no auth required)
  useEffect(() => {
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const data = await AutometricaService.getCatalog();
        setCatalog(data);

        // Extract unique brands
        const uniqueBrands = [...new Set(data.map((v) => v.brand))].sort();
        setBrands(uniqueBrands);
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

  // Update subbrands when brand changes
  useEffect(() => {
    if (!selectedBrand || catalog.length === 0) {
      setSubbrands([]);
      setSelectedSubbrand('');
      return;
    }

    const filteredSubbrands = [
      ...new Set(
        catalog
          .filter((v) => v.brand === selectedBrand)
          .map((v) => v.subbrand)
      ),
    ].sort();

    setSubbrands(filteredSubbrands);
    setSelectedSubbrand('');
    setSelectedYear('');
    setSelectedVersion('');
  }, [selectedBrand, catalog]);

  // Update years when subbrand changes
  useEffect(() => {
    if (!selectedBrand || !selectedSubbrand || catalog.length === 0) {
      setYears([]);
      setSelectedYear('');
      return;
    }

    const filteredYears = [
      ...new Set(
        catalog
          .filter((v) => v.brand === selectedBrand && v.subbrand === selectedSubbrand)
          .map((v) => v.year)
      ),
    ].sort((a, b) => b - a);

    setYears(filteredYears);
    setSelectedYear('');
    setSelectedVersion('');
  }, [selectedBrand, selectedSubbrand, catalog]);

  // Update versions when year changes
  useEffect(() => {
    if (!selectedBrand || !selectedSubbrand || !selectedYear || catalog.length === 0) {
      setVersions([]);
      setSelectedVersion('');
      return;
    }

    const filteredVersions = catalog
      .filter(
        (v) =>
          v.brand === selectedBrand &&
          v.subbrand === selectedSubbrand &&
          v.year === parseInt(selectedYear)
      )
      .map((v) => v.version)
      .sort();

    setVersions(filteredVersions);
    setSelectedVersion('');

    // Pre-fill estimated mileage
    const currentYear = new Date().getFullYear();
    const carAge = Math.max(0, currentYear - parseInt(selectedYear));
    const estimatedMileage = Math.min(carAge * 15000, 150000);
    const roundedMileage = Math.round(estimatedMileage / 1000) * 1000;
    if (roundedMileage > 0 && !kilometraje) {
      setKilometraje(roundedMileage.toLocaleString('es-MX'));
    }
  }, [selectedBrand, selectedSubbrand, selectedYear, catalog, kilometraje]);

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

  return (
    <div className={containerClass}>
      <div className={embedded ? '' : cardClass}>
        {/* Content */}
        <div className={embedded ? 'space-y-4' : 'p-6 space-y-4'}>
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {catalogLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary-600 mb-3" />
              <p className="text-gray-500">Cargando catálogo de vehículos...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Brand Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Marca
                </label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pl-12 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300"
                  >
                    <option value="">Selecciona la marca</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Subbrand/Model Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Modelo
                </label>
                <div className="relative">
                  <select
                    value={selectedSubbrand}
                    onChange={(e) => setSelectedSubbrand(e.target.value)}
                    disabled={!selectedBrand}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <option value="">{selectedBrand ? 'Selecciona el modelo' : 'Primero selecciona la marca'}</option>
                    {subbrands.map((subbrand) => (
                      <option key={subbrand} value={subbrand}>{subbrand}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Year and Version in a row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Año</label>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={!selectedSubbrand}
                      className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">{selectedSubbrand ? 'Año' : '—'}</option>
                      {years.map((year) => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Versión</label>
                  <div className="relative">
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      disabled={!selectedYear}
                      className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">{selectedYear ? 'Versión' : '—'}</option>
                      {versions.map((version) => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Kilometraje Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Kilometraje
                </label>
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 45,000"
                    value={kilometraje}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value) {
                        setKilometraje(parseInt(value).toLocaleString('es-MX'));
                      } else {
                        setKilometraje('');
                      }
                    }}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pl-12 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-gray-300"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGetValuation}
                disabled={!isFormComplete || isQueryInProgress}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                {isQueryInProgress ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    Obtener Cotización Gratis
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
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
