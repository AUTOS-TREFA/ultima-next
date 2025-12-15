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

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
} from 'lucide-react';

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
  // RENDER - AUTH REQUIRED
  // ============================================================================

  if (authLoading) {
    return (
      <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'auth') {
    return (
      <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Inicia sesión para continuar</CardTitle>
          <CardDescription>
            Para cotizar tu vehículo necesitas tener una cuenta en TREFA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">¿Por qué necesito una cuenta?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Guardamos tu cotización para seguimiento</li>
              <li>• Te contactamos con la mejor oferta</li>
              <li>• Proceso de venta más rápido y seguro</li>
            </ul>
          </div>
          <Button onClick={handleLogin} className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión o registrarse
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - PHONE VERIFICATION REQUIRED
  // ============================================================================

  if (step === 'phone') {
    return (
      <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifica tu teléfono</CardTitle>
          <CardDescription>
            Para cotizar tu vehículo necesitas verificar tu número de celular
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhoneVerification
            phone={phoneForVerification}
            onPhoneChange={setPhoneForVerification}
            onVerified={handlePhoneVerified}
            userId={user?.id || ''}
          />
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS
  // ============================================================================

  if (step === 'success' && valuation) {
    return (
      <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto animate-in fade-in-50 duration-300`}>
        <Confetti />
        <CardHeader className="text-center pb-2">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">¡Tenemos una oferta para ti!</CardTitle>
          <CardDescription>Basada en datos reales del mercado mexicano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Offer Display */}
          <div className="p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Oferta de Compra Estimada</p>
            <p className="text-4xl font-bold text-primary">
              <AnimatedNumber value={offer} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              para tu {selectedBrand} {selectedSubbrand} {selectedYear}
            </p>
          </div>

          {/* Market Value Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <p className="text-muted-foreground">Valor de Mercado</p>
              <p className="font-semibold text-blue-600">
                {currencyFormatter.format(valuation.salePrice)}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <p className="text-muted-foreground">Tu Oferta</p>
              <p className="font-semibold text-green-600">
                {currencyFormatter.format(valuation.purchasePrice)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleContinueToSellForm}
              className="w-full"
              size="lg"
            >
              Continuar con la venta en línea
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
              size="lg"
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Continuar por WhatsApp
              </a>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

          {/* Reset */}
          <Button
            variant="link"
            className="w-full text-muted-foreground"
            onClick={handleReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Cotizar otro auto
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - VALUATING
  // ============================================================================

  if (step === 'valuating') {
    return (
      <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-lg'} mx-auto`}>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="font-semibold text-lg">Calculando tu oferta...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Consultando datos del mercado mexicano
          </p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER - VEHICLE SELECTION FORM
  // ============================================================================

  return (
    <Card className={`w-full ${compact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Car className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Cotiza el valor de tu auto</CardTitle>
        <CardDescription>
          Selecciona los datos de tu vehículo para recibir una oferta de compra
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {catalogLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Cargando catálogo de vehículos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Brand Select */}
            <div className="space-y-2">
              <Label htmlFor="brand">1. Marca</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Selecciona la marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subbrand/Model Select */}
            <div className="space-y-2">
              <Label htmlFor="subbrand">2. Modelo</Label>
              <Select
                value={selectedSubbrand}
                onValueChange={setSelectedSubbrand}
                disabled={!selectedBrand}
              >
                <SelectTrigger id="subbrand">
                  <SelectValue placeholder={selectedBrand ? 'Selecciona el modelo' : 'Primero selecciona la marca'} />
                </SelectTrigger>
                <SelectContent>
                  {subbrands.map((subbrand) => (
                    <SelectItem key={subbrand} value={subbrand}>
                      {subbrand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <Label htmlFor="year">3. Año</Label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
                disabled={!selectedSubbrand}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder={selectedSubbrand ? 'Selecciona el año' : 'Primero selecciona el modelo'} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Version Select */}
            <div className="space-y-2">
              <Label htmlFor="version">4. Versión</Label>
              <Select
                value={selectedVersion}
                onValueChange={setSelectedVersion}
                disabled={!selectedYear}
              >
                <SelectTrigger id="version">
                  <SelectValue placeholder={selectedYear ? 'Selecciona la versión' : 'Primero selecciona el año'} />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kilometraje Input */}
            <div className="space-y-2">
              <Label htmlFor="kilometraje">5. Kilometraje</Label>
              <Input
                id="kilometraje"
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
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el kilometraje actual de tu vehículo
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleGetValuation}
              className="w-full"
              size="lg"
              disabled={
                !selectedBrand ||
                !selectedSubbrand ||
                !selectedYear ||
                !selectedVersion ||
                !kilometraje ||
                isQueryInProgress
              }
            >
              {isQueryInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  Obtener Cotización
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Sin costo • Sin compromiso • Datos de Guía Autométrica
        </p>
      </CardContent>
    </Card>
  );
}

export default AutometricaValuationForm;
