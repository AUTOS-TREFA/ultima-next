'use client';

/**
 * AutometricaValuationForm
 *
 * Formulario de valuación de vehículos usando la API de Autométrica.
 * Requisitos:
 * - Usuario debe estar logueado
 * - Usuario debe tener teléfono verificado
 * - Selección en cascada: marca → modelo → año → versión (según guía Autométrica)
 * - Una consulta a la vez (rate limiting)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  Lock,
  Phone,
  LogIn,
  ChevronDown,
  DollarSign,
  Shield,
  Clock,
  Gauge,
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
import { PhoneVerification } from '@/components/PhoneVerification';

// ============================================================================
// PROPS
// ============================================================================

interface AutometricaValuationFormProps {
  initialSearchQuery?: string | null;
  onComplete?: () => void;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AutometricaValuationForm({
  onComplete,
  compact = false,
}: AutometricaValuationFormProps) {
  const router = useRouter();
  const { user, profile, loading: authLoading, reloadProfile } = useAuth();

  // State
  const [step, setStep] = useState<'auth' | 'phone' | 'vehicle' | 'valuating' | 'success'>('vehicle');
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

  // UI state
  const [copied, setCopied] = useState(false);
  const [phoneForVerification, setPhoneForVerification] = useState(profile?.phone || '');

  // Currency formatter
  const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Check authentication and phone verification status
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStep('auth');
    } else if (!profile?.phone_verified) {
      setStep('phone');
      setPhoneForVerification(profile?.phone || '');
    } else {
      setStep('vehicle');
    }
  }, [user, profile, authLoading]);

  // Load catalog on mount
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

    if (user && profile?.phone_verified) {
      loadCatalog();
    }
  }, [user, profile?.phone_verified]);

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
    ].sort((a, b) => b - a); // Most recent first

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

    // Pre-fill estimated mileage based on vehicle age
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
    // Validate all fields
    if (!selectedBrand || !selectedSubbrand || !selectedYear || !selectedVersion) {
      setError('Por favor, completa todos los campos del vehículo');
      return;
    }

    const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
    if (isNaN(kmValue) || kmValue < 0) {
      setError('Por favor, ingresa un kilometraje válido');
      return;
    }

    // Prevent multiple simultaneous queries
    if (isQueryInProgress) {
      return;
    }

    setIsQueryInProgress(true);
    setStep('valuating');
    setError(null);

    try {
      // Get valuation from Autométrica
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

      // Save to Supabase
      if (user) {
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

      setStep('success');

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

  const handleReset = () => {
    setStep('vehicle');
    setError(null);
    setSelectedBrand('');
    setSelectedSubbrand('');
    setSelectedYear('');
    setSelectedVersion('');
    setKilometraje('');
    setValuation(null);
  };

  const handleCopy = () => {
    if (!valuation) return;
    const text = `TREFA me ofreció ${currencyFormatter.format(valuation.purchasePrice)} por mi ${selectedBrand} ${selectedSubbrand} ${selectedYear}. ¡Valúa tu auto también! ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleContinueToSellForm = () => {
    const valuationData = {
      vehicle: {
        year: parseInt(selectedYear),
        brand: selectedBrand,
        subbrand: selectedSubbrand,
        version: selectedVersion,
      },
      valuation,
    };

    localStorage.setItem('pendingValuationData', JSON.stringify(valuationData));
    router.push('/escritorio/vende-tu-auto');
  };

  const handlePhoneVerified = async () => {
    await reloadProfile();
    setStep('vehicle');
  };

  const handleLogin = () => {
    localStorage.setItem('redirectAfterLogin', '/vender-mi-auto');
    router.push('/auth');
  };

  // WhatsApp URL
  const offer = valuation?.purchasePrice || 0;
  const whatsappText = `Me interesa vender mi ${selectedBrand} ${selectedSubbrand} ${selectedYear} por la cantidad de ${currencyFormatter.format(offer)}, y quisiera concretar una cita de inspección.`;
  const whatsappUrl = `https://wa.me/528187049079?text=${encodeURIComponent(whatsappText)}`;

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================

  if (authLoading) {
    return (
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary-600 mb-4" />
            <p className="text-gray-500">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - AUTH REQUIRED
  // ============================================================================

  if (step === 'auth') {
    return (
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Inicia sesión para continuar</h2>
            <p className="text-primary-100 mt-2">
              Para cotizar tu vehículo necesitas tener una cuenta en TREFA
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3">¿Por qué necesito una cuenta?</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-600">Guardamos tu cotización para seguimiento</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-600">Te contactamos con la mejor oferta</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-600">Proceso de venta más rápido y seguro</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25"
            >
              <LogIn className="w-5 h-5" />
              Iniciar sesión o registrarse
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - PHONE VERIFICATION REQUIRED
  // ============================================================================

  if (step === 'phone') {
    return (
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verifica tu teléfono</h2>
            <p className="text-primary-100 mt-2">
              Para cotizar tu vehículo necesitas verificar tu número de celular
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <PhoneVerification
              phone={phoneForVerification}
              onPhoneChange={setPhoneForVerification}
              onVerified={handlePhoneVerified}
              userId={user?.id || ''}
            />
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
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto animate-in fade-in-50 duration-300`}>
        <Confetti />
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
              <p className="text-sm text-primary-700 font-medium mb-1">Oferta de Compra Estimada</p>
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
                onClick={handleContinueToSellForm}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25"
              >
                Continuar con la venta en línea
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/25"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Continuar por WhatsApp
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
                {copied ? 'Copiado' : 'Copiar'}
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
  // RENDER - VALUATING
  // ============================================================================

  if (step === 'valuating') {
    return (
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="py-12 text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25"></div>
              <div className="relative w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
              </div>
            </div>
            <p className="font-bold text-xl text-gray-900">Calculando tu oferta...</p>
            <p className="text-gray-500 mt-2">
              Consultando datos del mercado mexicano
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - VEHICLE SELECTION FORM
  // ============================================================================

  const isFormComplete = selectedBrand && selectedSubbrand && selectedYear && selectedVersion && kilometraje;

  return (
    <div className={`w-full ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Cotiza el valor de tu auto</h2>
          <p className="text-primary-100 mt-2">
            Selecciona los datos de tu vehículo para recibir una oferta de compra
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <DollarSign className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">Mejor Precio</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Clock className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">Pago Rápido</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Shield className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">100% Seguro</span>
            </div>
          </div>

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
                  1. Marca
                </label>
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300"
                  >
                    <option value="">Selecciona la marca</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Subbrand/Model Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  2. Modelo
                </label>
                <div className="relative">
                  <select
                    value={selectedSubbrand}
                    onChange={(e) => setSelectedSubbrand(e.target.value)}
                    disabled={!selectedBrand}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <option value="">{selectedBrand ? 'Selecciona el modelo' : 'Primero selecciona la marca'}</option>
                    {subbrands.map((subbrand) => (
                      <option key={subbrand} value={subbrand}>
                        {subbrand}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Year Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  3. Año
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={!selectedSubbrand}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <option value="">{selectedSubbrand ? 'Selecciona el año' : 'Primero selecciona el modelo'}</option>
                    {years.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Version Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  4. Versión
                </label>
                <div className="relative">
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    disabled={!selectedYear}
                    className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <option value="">{selectedYear ? 'Selecciona la versión' : 'Primero selecciona el año'}</option>
                    {versions.map((version) => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Kilometraje Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  5. Kilometraje
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
                <p className="text-xs text-gray-500">
                  Ingresa el kilometraje actual de tu vehículo
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGetValuation}
                disabled={!isFormComplete || isQueryInProgress}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none mt-6"
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
          <p className="text-center text-xs text-gray-400 pt-2">
            Sin costo • Sin compromiso • Datos de Guía Autométrica
          </p>
        </div>
      </div>
    </div>
  );
}

export default AutometricaValuationForm;
