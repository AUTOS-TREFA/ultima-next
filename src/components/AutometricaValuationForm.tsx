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
import Link from 'next/link';
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
  Download,
  Share2,
  Scale,
  ExternalLink,
  Calendar,
  MapPin,
} from 'lucide-react';
import { WhatsAppIcon } from './icons';

// Services
import { AutometricaService, AutometricaCatalogVehicle, AutometricaValuation } from '@/services/AutometricaService';
import { SellCarService } from '@/services/SellCarService';
import { BrevoEmailService } from '@/services/BrevoEmailService';
import { conversionTracking } from '@/services/ConversionTrackingService';
import { getSiteUrl } from '@/config';

// Types
import type { UserVehicleForSale } from '@/types/types';

// Custom components
import Confetti from '@/Valuation/components/Confetti';
import AnimatedNumber from '@/Valuation/components/AnimatedNumber';

// UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [emailOtpSent, setEmailOtpSent] = useState(false); // For email OTP (login mode)
  const [otpCode, setOtpCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false); // Toggle between login and register
  const [loginPassword, setLoginPassword] = useState('');

  // URL Tracking data (UTM, fbclid, etc.)
  const [urlTrackingData, setUrlTrackingData] = useState<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    fbclid?: string;
    rfdm?: string;
    referrer?: string;
    landing_page?: string;
    source?: string;
  }>({});

  // UI state
  const [copied, setCopied] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Duplicate quote prevention state
  const [existingQuote, setExistingQuote] = useState<{ id: string; created_at: string; price: number } | null>(null);

  // Currency formatter
  const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Store URL parameters for redirect after verification and capture tracking data
  useEffect(() => {
    const redirect = searchParams?.get('redirect');
    const ordencompra = searchParams?.get('ordencompra');
    if (redirect) {
      localStorage.setItem('valuationRedirect', redirect);
    }
    if (ordencompra) {
      localStorage.setItem('ordencompra', ordencompra);
    }

    // Capture URL tracking parameters (like RegisterPageNew)
    const params = new URLSearchParams(searchParams?.toString() || '');
    const trackingData: typeof urlTrackingData = {};

    if (params.get('utm_source')) trackingData.utm_source = params.get('utm_source')!;
    if (params.get('utm_medium')) trackingData.utm_medium = params.get('utm_medium')!;
    if (params.get('utm_campaign')) trackingData.utm_campaign = params.get('utm_campaign')!;
    if (params.get('utm_term')) trackingData.utm_term = params.get('utm_term')!;
    if (params.get('utm_content')) trackingData.utm_content = params.get('utm_content')!;
    if (params.get('fbclid')) trackingData.fbclid = params.get('fbclid')!;
    if (params.get('rfdm')) trackingData.rfdm = params.get('rfdm')!;
    if (params.get('source')) trackingData.source = params.get('source')!;

    trackingData.referrer = typeof document !== 'undefined' ? document.referrer : undefined;
    trackingData.landing_page = typeof window !== 'undefined' ? window.location.href : undefined;

    setUrlTrackingData(trackingData);

    // Store in sessionStorage for later use
    if (Object.keys(trackingData).length > 0) {
      sessionStorage.setItem('leadSourceData', JSON.stringify({
        ...trackingData,
        first_visit_at: new Date().toISOString()
      }));
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

  // If user is already logged in AND has verified phone, skip verification step
  useEffect(() => {
    if (step === 'verify_to_reveal' && user && profile?.phone_verified === true) {
      setStep('success');
    }
  }, [step, user, profile?.phone_verified]);

  // Reset downstream selections when brand changes
  useEffect(() => {
    if (selectedBrand) {
      setSelectedSubbrand('');
      setSelectedYear('');
      setSelectedVersion('');
      setExistingQuote(null); // Clear any existing quote warning
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

  // Check for existing quote for same vehicle within 30 days
  const checkExistingQuote = async () => {
    if (!user) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('user_vehicles_for_sale')
      .select('id, created_at, valuation_data')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    // Find a quote for the same brand+subbrand+year
    for (const quote of data) {
      const valData = quote.valuation_data as any;
      if (
        valData?.vehicle?.brand?.toLowerCase() === selectedBrand.toLowerCase() &&
        valData?.vehicle?.subbrand?.toLowerCase() === selectedSubbrand.toLowerCase() &&
        valData?.vehicle?.year?.toString() === selectedYear
      ) {
        return {
          id: quote.id,
          created_at: quote.created_at,
          price: valData?.purchasePrice || 0
        };
      }
    }

    return null;
  };

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
      // Check for duplicate quote if user is logged in
      if (user) {
        const existing = await checkExistingQuote();
        if (existing) {
          setExistingQuote(existing);
          setStep('vehicle');
          setIsQueryInProgress(false);
          return;
        }
      }

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

      // If user is already logged in AND has phone verified, go directly to success
      // Otherwise, require phone verification (even for logged-in users without phone_verified)
      if (user && profile?.phone_verified === true) {
        await saveValuationData(valuationResult, kmValue);
        setStep('success');
      } else {
        // Show verification modal to reveal offer
        // - For unauthenticated users: will create account + verify phone
        // - For authenticated users without phone_verified: will verify phone only
        setShowVerificationModal(true);
        setStep('verify_to_reveal');

        // Pre-fill phone/email for logged-in users without verification
        if (user && profile) {
          if (profile.phone && !phoneInput) {
            setPhoneInput(profile.phone);
          }
          if (profile.email && !emailInput) {
            setEmailInput(profile.email);
          }
        }
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

    // Email is only required for new users (not logged in)
    if (!user && (!emailInput || !emailInput.includes('@'))) {
      setVerificationError('Ingresa un correo electrónico válido');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // Clean phone number
      const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);

      // If user is already logged in, skip email/phone existence checks
      // They're just verifying their own phone number
      if (!user) {
        // Check if email already exists (only for new users)
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

        // Check if phone already exists AND is verified (optimization to avoid unnecessary SMS)
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id, phone_verified, email')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          if (existingPhone.phone_verified) {
            // Phone is already verified - suggest login instead
            const maskedEmail = existingPhone.email
              ? existingPhone.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
              : '';
            setVerificationError(
              `Este teléfono ya está verificado${maskedEmail ? ` con ${maskedEmail}` : ''}. Inicia sesión en lugar de registrarte.`
            );
          } else {
            // Phone exists but not verified - still suggest login
            setVerificationError('Este teléfono ya está registrado. Inicia sesión en lugar de registrarte.');
          }
          setVerificationLoading(false);
          return;
        }
      } else {
        // Logged-in user: check if phone is used by ANOTHER account
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id, phone_verified, email')
          .eq('phone', cleanPhone)
          .neq('id', user.id)
          .maybeSingle();

        if (existingPhone?.phone_verified) {
          const maskedEmail = existingPhone.email
            ? existingPhone.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : '';
          setVerificationError(
            `Este teléfono ya está verificado con otra cuenta${maskedEmail ? ` (${maskedEmail})` : ''}.`
          );
          setVerificationLoading(false);
          return;
        }
      }

      // Format phone for Mexico
      const formattedPhone = `+52${cleanPhone}`;

      // Call Twilio Verify edge function
      // Pass userId if logged in to allow re-verification
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          phone: formattedPhone,
          email: user ? undefined : emailInput, // Only send email for new users
          userId: user?.id || undefined, // Pass userId to skip "already verified" check for same user
        }
      });

      if (data?.error === 'email_exists') {
        setVerificationError('Este correo ya está registrado. Inicia sesión en lugar de registrarte.');
        setVerificationLoading(false);
        return;
      }

      // Handle phone_already_verified error from Edge Function (backup check)
      if (data?.error === 'phone_already_verified') {
        const maskedEmail = data?.existingEmail || '';
        setVerificationError(
          `Este teléfono ya está verificado${maskedEmail ? ` con ${maskedEmail}` : ''}. Inicia sesión en lugar de registrarte.`
        );
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

      // Different flow for logged-in users vs new users
      if (user) {
        // =====================================================================
        // LOGGED-IN USER: Just update their profile with phone_verified
        // =====================================================================
        console.log('✅ Usuario existente verificando teléfono:', user.id);

        await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            phone_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Track phone verification for existing user
        conversionTracking.trackAuth.otpVerified(user.id, {
          email: profile?.email || user.email,
          source: 'vender-mi-auto-phone-verification',
          vehicleId: `${selectedBrand}-${selectedSubbrand}-${selectedYear}`
        });

        // Reload profile and save valuation
        await reloadProfile();

        const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
        if (valuation) {
          await saveValuationData(valuation, kmValue);
        }

      } else {
        // =====================================================================
        // NEW USER: Create account (same pattern as RegisterPage)
        // =====================================================================
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: emailInput,
          password: Math.random().toString(36).slice(-16), // Random temporary password
          options: {
            data: {
              phone: cleanPhone,
              source: 'vender-mi-auto'
            },
            emailRedirectTo: `${getSiteUrl()}/auth/callback?redirect=/vender-mi-auto`,
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

        // Determine lead source (same logic as RegisterPageNew)
        let leadSource = 'vender-mi-auto';
        if (urlTrackingData.utm_source) {
          leadSource = `vender-mi-auto-${urlTrackingData.utm_source}`;
          if (urlTrackingData.utm_medium) leadSource += `-${urlTrackingData.utm_medium}`;
        } else if (urlTrackingData.fbclid) {
          leadSource = 'vender-mi-auto-facebook';
        } else if (urlTrackingData.rfdm) {
          leadSource = `vender-mi-auto-rfdm-${urlTrackingData.rfdm}`;
        }

        // Update profile with phone_verified, valuation source, AND tracking data
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            phone: cleanPhone,
            phone_verified: true,
            email: emailInput,
            lead_source: leadSource,
            source: urlTrackingData.source || leadSource,
            // URL tracking params
            utm_source: urlTrackingData.utm_source || null,
            utm_medium: urlTrackingData.utm_medium || null,
            utm_campaign: urlTrackingData.utm_campaign || null,
            utm_term: urlTrackingData.utm_term || null,
            utm_content: urlTrackingData.utm_content || null,
            fbclid: urlTrackingData.fbclid || null,
            rfdm: urlTrackingData.rfdm || null,
            referrer: urlTrackingData.referrer || null,
            landing_page: urlTrackingData.landing_page || null,
            first_visit_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // Track conversion event (same as RegisterPageNew)
        conversionTracking.trackAuth.otpVerified(authData.user.id, {
          email: emailInput,
          source: leadSource,
          vehicleId: `${selectedBrand}-${selectedSubbrand}-${selectedYear}`
        });

        // Reload profile and save valuation
        await reloadProfile();

        const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
        if (valuation) {
          await saveValuationData(valuation, kmValue);
        }
      }

      setShowVerificationModal(false);
      setStep('success');
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerificationError(err.message || 'Código incorrecto');
      setStep('verify_to_reveal');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Handle login for existing users - send email OTP
  const handleLogin = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setVerificationError('Ingresa un correo electrónico válido');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // Check if email exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailInput)
        .single();

      if (!existingProfile) {
        setVerificationError('Este correo no está registrado. Usa "Nuevo usuario" para crear una cuenta.');
        setVerificationLoading(false);
        return;
      }

      // Sign in with email OTP (6-digit code)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          shouldCreateUser: false, // Don't create new user, only login existing
        }
      });

      if (signInError) {
        throw signInError;
      }

      console.log('Email OTP enviado exitosamente');
      setEmailOtpSent(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setVerificationError(err.message || 'Error al enviar el código');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Verify email OTP for existing users
  const handleVerifyEmailOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setVerificationError('Ingresa el código de 6 dígitos');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);
    setStep('verifying');

    try {
      // Verify email OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: emailInput,
        token: otpCode,
        type: 'email',
      });

      if (verifyError) {
        const errorMsg = verifyError.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          throw new Error('El código ha expirado. Solicita uno nuevo.');
        }
        throw new Error('El código es incorrecto. Verifica e intenta de nuevo.');
      }

      if (!authData.user) {
        throw new Error('No se pudo verificar la sesión');
      }

      console.log('✅ Email OTP verificado:', authData.user.id);

      // Track login event
      conversionTracking.trackAuth.otpVerified(authData.user.id, {
        email: emailInput,
        source: 'vender-mi-auto-login',
        vehicleId: `${selectedBrand}-${selectedSubbrand}-${selectedYear}`
      });

      // Reload profile and save valuation
      await reloadProfile();

      const kmValue = parseInt(kilometraje.replace(/[^0-9]/g, ''), 10);
      if (valuation) {
        await saveValuationData(valuation, kmValue);
      }

      setShowVerificationModal(false);
      setStep('success');
    } catch (err: any) {
      console.error('Email OTP verification error:', err);
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
    setEmailOtpSent(false);
    setOtpCode('');
    setPhoneInput('');
    setEmailInput('');
    setIsLoginMode(false);
    setLoginPassword('');
    setShowVerificationModal(false);
    setExistingQuote(null);
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
    router.push('/escritorio/vende-tu-auto');
  };

  // Handle send email with offer
  const handleSendEmail = async () => {
    if (!user?.email || !valuation) return;

    try {
      // Create a simple email with the offer details
      const vehicleLabel = `${selectedBrand} ${selectedSubbrand} ${selectedYear}`;
      const offerAmount = currencyFormatter.format(valuation.purchasePrice);
      const marketValue = currencyFormatter.format(valuation.salePrice);

      // Use mailto as fallback
      const subject = encodeURIComponent(`Tu oferta TREFA: ${vehicleLabel}`);
      const body = encodeURIComponent(
        `¡Hola!\n\nAquí está tu oferta de TREFA para tu ${vehicleLabel}:\n\n` +
        `💰 Oferta: ${offerAmount}\n` +
        `📊 Valor de mercado: ${marketValue}\n` +
        `🚗 Kilometraje: ${kilometraje} km\n\n` +
        `Para continuar con la venta, visita:\n${getSiteUrl()}/escritorio/vende-tu-auto\n\n` +
        `¡Gracias por confiar en TREFA!`
      );

      window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
    } catch (error) {
      console.error('Error sending email:', error);
    }
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
  // RENDER - VERIFICATION MODAL (modern modal design)
  // ============================================================================

  const renderVerificationModal = () => (
    <Dialog open={showVerificationModal} onOpenChange={(open) => {
      if (!open) {
        setShowVerificationModal(false);
        // Reset verification state but keep valuation
        setOtpSent(false);
        setEmailOtpSent(false);
        setOtpCode('');
        setVerificationError(null);
      }
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            ¡Tu oferta está lista!
          </DialogTitle>
          <DialogDescription>
            {selectedBrand} {selectedSubbrand} {selectedYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Blurred offer preview */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Oferta TREFA</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-white blur-md select-none">
                {valuation ? currencyFormatter.format(valuation.purchasePrice) : '$---,---'}
              </p>
              <Lock className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/40 text-xs mt-2">
              Verifica tu identidad para ver tu oferta completa
            </p>
          </div>

          {/* Tab toggle - only show if OTP not sent */}
          {!otpSent && !emailOtpSent && (
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

          {isLoginMode && !emailOtpSent ? (
            /* LOGIN MODE - Existing users - email input */
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
                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={verificationLoading || !emailInput}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar código <Mail className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-gray-500 text-center">Te enviaremos un código de 6 dígitos a tu correo</p>
            </div>
          ) : isLoginMode && emailOtpSent ? (
            /* LOGIN MODE - Email OTP verification */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">Código enviado por email</p>
                <p className="text-sm text-gray-500">
                  Ingresa el código enviado a <span className="font-medium">{emailInput}</span>
                </p>
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
                    className="w-10 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyEmailOtp}
                disabled={verificationLoading || otpCode.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verificar y ver oferta <Eye className="w-4 h-4" /></>}
              </button>

              <div className="flex items-center justify-center gap-4 text-sm">
                <button onClick={() => { setEmailOtpSent(false); setOtpCode(''); }} className="text-gray-500 hover:text-gray-700">
                  Cambiar correo
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={handleLogin} disabled={verificationLoading} className="text-primary-600 hover:text-primary-700 font-medium">
                  Reenviar código
                </button>
              </div>
            </div>
          ) : !otpSent ? (
            /* REGISTER MODE - New users - phone + email */
            <div className="space-y-3">
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
                      className="w-full bg-white border border-gray-200 rounded-lg py-3 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Celular (10 dígitos)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="8112345678"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-gray-200 rounded-lg py-3 px-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={verificationLoading || !phoneInput || phoneInput.length < 10 || !emailInput}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar código SMS <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-gray-500 text-center">Recibirás un código de 6 dígitos por SMS</p>
            </div>
          ) : (
            /* OTP VERIFICATION - 6-digit input */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">Código enviado</p>
                <p className="text-sm text-gray-500">
                  Ingresa el código enviado a <span className="font-medium">{phoneInput}</span>
                </p>
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
                    className="w-10 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
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
      </DialogContent>
    </Dialog>
  );

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

            {/* Primary CTA - Continue online */}
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 bg-[#003161] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#002850] transition-all text-sm shadow-md"
            >
              <ArrowRight className="w-4 h-4" />
              Continuar con la venta en línea
            </button>

            {/* Secondary CTA - Schedule inspection */}
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#003161] font-semibold py-3 px-4 rounded-xl border-2 border-[#003161] hover:bg-[#003161]/5 transition-all text-sm"
            >
              <Calendar className="w-4 h-4" />
              Programar cita de inspección
            </button>

            {/* Branches info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-600">Sucursales disponibles:</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Las Américas', 'Saltillo', 'Monterrey', 'Guadalupe', 'Reynosa'].map((branch) => (
                  <span key={branch} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            {/* Share & Email actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 text-gray-700 font-medium py-2.5 px-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Compartir'}
              </button>
              <button
                onClick={handleSendEmail}
                className="flex items-center justify-center gap-2 text-gray-700 font-medium py-2.5 px-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm"
              >
                <Mail className="w-4 h-4" />
                Enviar por correo
              </button>
            </div>

            {/* WhatsApp contact */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-medium py-2.5 px-3 rounded-lg hover:bg-green-700 transition-all text-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Contactar por WhatsApp
            </a>

            {/* Tertiary action - New quote */}
            <div className="pt-1 text-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 px-3 transition-all text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cotizar otro vehículo
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

          {/* Existing Quote Alert */}
          {existingQuote && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <p className="font-medium mb-1">Ya tienes una oferta para este auto</p>
                <p className="text-sm mb-2">
                  Cotizaste tu {selectedBrand} {selectedSubbrand} {selectedYear} el{' '}
                  {new Date(existingQuote.created_at).toLocaleDateString('es-MX')} por{' '}
                  <span className="font-semibold">{currencyFormatter.format(existingQuote.price)}</span>
                </p>
                <Link
                  href="/escritorio/vende-tu-auto"
                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium text-sm underline"
                >
                  Ver mis cotizaciones <ArrowRight className="w-3 h-3" />
                </Link>
              </AlertDescription>
            </Alert>
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

      {/* Verification Modal */}
      {renderVerificationModal()}
    </div>
  );
}

export default AutometricaValuationForm;
