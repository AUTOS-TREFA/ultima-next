import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '../hooks/useSEO';
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Sparkles,
  Zap,
  Star,
  ShieldCheck,
  TrendingUp,
  Award,
  Car,
  DollarSign,
  FileText,
  Wrench,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useVehicles } from '../context/VehicleContext';
import type { Vehicle } from '../types/types';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import LazyImage from '../components/LazyImage';
import { formatPrice } from '../utils/formatters';
import { conversionTracking } from '../services/ConversionTrackingService';

// Form validation schema - checkboxes validate but don't save to database
const formSchema = z.object({
  fullName: z.string().min(2, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  monthlyIncome: z.string().min(1, 'Ingreso mensual requerido'),
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  isOver21: z.boolean().refine(val => val === true, 'Debes ser mayor de 21 años')
});

type FormData = z.infer<typeof formSchema>;

// Data type for profile - only fields to save
type ProfileData = {
  nombre: string;
  email: string;
  telefono: string;
  ingreso_mensual: number;
};

// Vehicle Card Component
const MasonryVehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);
  const isPopular = vehicle.view_count >= 1000;

  return (
    <Link to={`/autos/${vehicle.slug}`} className="group block relative z-10">
      <div className={`relative ${!isPopular ? 'overflow-hidden' : ''} rounded-lg shadow-md hover:shadow-xl transition-shadow ${isPopular ? 'popular-card' : ''}`}>
        <div className={`aspect-[4/3] bg-gray-100 ${isPopular ? 'overflow-hidden rounded-t-lg' : ''}`}>
          <LazyImage
            src={imageSrc}
            alt={vehicle.titulo}
            className="w-full h-full"
            objectFit="cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
          <h4 className="text-white font-bold text-sm truncate drop-shadow-md" title={vehicle.titulo}>
            {vehicle.titulo}
          </h4>
          <p className="text-white font-black text-base drop-shadow-md">
            {formatPrice(vehicle.precio)}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Horizontal Slider Component
const HorizontalSlider: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      const newPosition = direction === 'left'
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (vehicles.length === 0) return null;

  return (
    <div className="relative">
      {vehicles.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="flex-shrink-0 w-48 snap-start">
            <MasonryVehicleCard vehicle={vehicle} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FinanciamientosPage: React.FC = () => {
  useSEO({
    title: 'Financiamiento Ideal para tu Auto en 24 Horas | TREFA',
    description: 'Conectamos tu perfil con el banco que ofrece la mejor tasa de interés. Financiamiento digital rápido, seguro y sin complicaciones. Respuesta en 24 horas o menos.',
    keywords: 'financiamiento automotriz, crédito para auto, préstamo para coche, TREFA, financiamiento en 24 horas, mejor tasa de interés'
  });

  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'otp'>('idle');
  const { vehicles: allVehicles } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);
  const [otp, setOtp] = useState('');
  const [formDataCache, setFormDataCache] = useState<FormData | null>(null);
  const [urlParams, setUrlParams] = useState('');
  const [leadSource, setLeadSource] = useState<string>('direct');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      const available = allVehicles.filter(v =>
        !v.separado &&
        !v.vendido &&
        getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
      );
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      setDisplayVehicles(shuffled);
    }
  }, [allVehicles]);

  // Capture URL parameters and determine lead source
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramString = params.toString();
    setUrlParams(paramString);

    // Determine lead source from URL parameters
    let source = 'financiamientos-landing-direct';

    if (params.get('utm_source')) {
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');
      source = `financiamientos-${utmSource}${utmMedium ? `-${utmMedium}` : ''}${utmCampaign ? `-${utmCampaign}` : ''}`;
    } else if (params.get('fbclid')) {
      source = 'financiamientos-facebook';
    } else if (params.get('gclid')) {
      source = 'financiamientos-google';
    } else if (params.get('source')) {
      source = `financiamientos-${params.get('source')}`;
    } else if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerDomain = referrerUrl.hostname.replace('www.', '');
        source = `financiamientos-referrer-${referrerDomain}`;
      } catch (e) {
        // Invalid referrer URL
      }
    }

    setLeadSource(source);

    // Track with Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: 'Financiamientos Landing Page',
        content_category: 'Financial Services',
        content_type: 'product',
        source: source
      });
    }

    // Track with Google Tag Manager
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'page_view',
        pageType: 'financing_landing',
        pageName: 'Financiamientos',
        pageCategory: 'Lead Generation',
        source: source,
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        referrer: document.referrer || undefined
      });
    }
  }, []);

  // Filter vehicles by body type
  const suvVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('suv');
    }).slice(0, 10),
    [displayVehicles]
  );

  const sedanVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('sedan') || type.includes('sedán');
    }),
    [displayVehicles]
  );

  const hatchbackVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('hatch') || type.includes('compacto') || type.includes('compact');
    }),
    [displayVehicles]
  );

  const pickupVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('pick') || type.includes('pickup') || type.includes('camioneta');
    }).slice(0, 15),
    [displayVehicles]
  );

  // Combined vehicles for unified masonry grid - mix all categories
  const allVehiclesMixed = useMemo(() => {
    const all = [
      ...suvVehicles.slice(0, 8),
      ...sedanVehicles.slice(0, 6),
      ...hatchbackVehicles.slice(0, 6),
      ...pickupVehicles.slice(0, 4)
    ];
    // Shuffle for better visual distribution
    return all.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [suvVehicles, sedanVehicles, hatchbackVehicles, pickupVehicles]);

  // Step 1: Send OTP to user's email
  const onSubmit = async (data: FormData) => {
    setSubmissionStatus('submitting');
    setFormDataCache(data); // Cache form data for after OTP verification

    try {
      console.log('📧 Sending OTP to:', data.email);

      // Send OTP via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            monthly_income: parseInt(data.monthlyIncome),
            source: 'financiamientos-landing'
          }
        }
      });

      if (otpError) {
        console.error('❌ OTP Error:', otpError);
        setSubmissionStatus('error');
        return;
      }

      console.log('✅ OTP sent successfully');
      setSubmissionStatus('otp'); // Show OTP verification form

    } catch (error) {
      console.error('Error sending OTP:', error);
      setSubmissionStatus('error');
    }
  };

  // Step 2: Verify OTP and create/update profile
  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataCache) return;

    setSubmissionStatus('submitting');

    try {
      console.log('🔐 Verifying OTP...');

      // Verify OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: formDataCache.email,
        token: otp,
        type: 'email'
      });

      if (verifyError) {
        console.error('❌ OTP Verification Error:', verifyError);
        setSubmissionStatus('error');
        return;
      }

      console.log('✅ OTP verified successfully, user authenticated');

      // Now update/create the user's profile
      const profileData: ProfileData = {
        nombre: formDataCache.fullName,
        email: formDataCache.email,
        telefono: formDataCache.phone,
        ingreso_mensual: parseInt(formDataCache.monthlyIncome)
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
      } else {
        console.log('✅ Profile updated successfully');
      }

      // Also save to leads table for tracking
      const { data: leadData } = await supabase
        .from('leads')
        .insert([
          {
            user_id: authData.user?.id,
            nombre: formDataCache.fullName,
            email: formDataCache.email,
            telefono: formDataCache.phone,
            ingreso_mensual: parseInt(formDataCache.monthlyIncome),
            source: leadSource,
            metadata: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              referrer: document.referrer || window.location.href,
              urlParams: urlParams,
              utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
              utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
              utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined
            }
          }
        ])
        .select()
        .single();

      // Track ConversionLandingPage event - user completed registration
      conversionTracking.trackConversionLandingPage({
        userId: authData.user?.id,
        email: formDataCache.email,
        monthlyIncome: parseInt(formDataCache.monthlyIncome),
        source: leadSource,
        leadId: leadData?.id
      });

      // Track successful lead creation with Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Financing Request Lead',
          content_category: 'Financial Services',
          value: parseFloat(formDataCache.monthlyIncome) * 0.1,
          currency: 'MXN',
          lead_id: leadData?.id
        });
      }

      // Track successful lead creation with GTM
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'financing_form_success',
          leadId: leadData?.id,
          formType: 'financing_request',
          monthlyIncome: formDataCache.monthlyIncome,
          source: 'financiamientos-landing'
        });
      }

      // Send webhook notification
      try {
        await fetch('https://services.leadconnectorhq.com/hooks/LJhjk6eFZEHwptjuIF0a/webhook-trigger/eprKrEBZDa2DNegPGQ3T', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Source': 'TREFA-Financiamientos-Landing'
          },
          body: JSON.stringify({
            ...profileData,
            leadId: leadData?.id,
            userId: authData.user?.id,
            source: 'financiamientos-landing',
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.warn('⚠️ Webhook notification failed (non-critical):', webhookError);
      }

      setSubmissionStatus('success');
      reset();
      setFormDataCache(null);

      // Redirect to application page after 2 seconds
      setTimeout(() => {
        window.location.href = '/escritorio/aplicacion';
      }, 2000);

    } catch (error) {
      console.error('Error verifying OTP:', error);

      // Track general error with Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'CustomizeProduct', {
          content_name: 'Form Error',
          status: 'failed'
        });
      }

      // Track general error with GTM
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'financing_form_error',
          errorType: 'otp_verification_error',
          formType: 'financing_request'
        });
      }

      setSubmissionStatus('error');
    }
  };

  // OTP Verification View
  if (submissionStatus === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50/30 relative overflow-hidden flex items-center justify-center py-12 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-heading text-2xl font-black text-gray-900 mb-2">
              Verifica tu correo
            </h2>
            <p className="text-gray-600 text-sm">
              Hemos enviado un código de 6 dígitos a <strong>{formDataCache?.email}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">(Revisa tu buzón de correo no deseado)</p>
          </div>

          <form onSubmit={handleOtpVerification} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="------"
                maxLength={6}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl text-center tracking-[0.5em] font-mono text-2xl focus:ring-2 focus:ring-primary focus:border-primary shadow-md"
                required
              />
            </div>

            {submissionStatus === 'error' && (
              <div className="p-3 bg-red-100 border-2 border-red-400 rounded-lg text-center">
                <p className="text-red-800 font-bold text-sm">
                  Código inválido o expirado. Inténtalo de nuevo.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={otp.length < 6 || submissionStatus === 'submitting'}
              className="w-full bg-gradient-to-r from-primary via-orange-500 to-yellow-500 text-white py-4 px-6 rounded-xl font-black text-base hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {submissionStatus === 'submitting' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Verificar y Continuar'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmissionStatus('idle');
                setFormDataCache(null);
                setOtp('');
              }}
              className="w-full text-sm text-gray-500 hover:text-primary font-medium"
            >
              Cambiar correo electrónico
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Success State
  if (submissionStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-green-200/40 to-emerald-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-primary/40 to-orange-200/40 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative text-center px-4 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            ¡Cuenta Creada y Solicitud Recibida!
          </h1>

          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Te contactaremos en las próximas 24 horas con las mejores opciones de financiamiento para tu auto.
          </p>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo a tu panel de cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-['Be_Vietnam_Pro']">
      <style>{`
        .financiamientos-page h3,
        .financiamientos-page h4,
        .financiamientos-page h5,
        .financiamientos-page h6 {
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: -0.025em !important;
        }
        .financiamientos-page h1 {
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 900 !important;
        }
        .financiamientos-page h2 {
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 800 !important;
          letter-spacing: -0.035em !important;
        }
      `}</style>
      <div className="financiamientos-page">
      {/* Hero Section with Form */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50/30 py-12 sm:py-16 lg:py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Logo with Animation - Optimized for Mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-6 sm:mb-8"
          >
            <img
              src="/images/trefalogo.png"
              alt="TREFA Logo"
              className="h-14 sm:h-16 md:h-20 w-auto"
            />
          </motion.div>

          {/* Massive Headline - Optimized for Mobile */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-heading text-[24px] sm:text-[34px] md:text-[46px] lg:text-[54px] xl:text-[66px] font-black mb-6 sm:mb-8 px-4"
              style={{ letterSpacing: '-0.05em', lineHeight: '1.1', WebkitTextStroke: '0.5px currentColor' }}
            >
              <span className="block text-gray-900 drop-shadow-lg xl:whitespace-nowrap">
                Estrena un auto seminuevo en 24 horas
              </span>
              <span className="block text-gray-900 drop-shadow-lg mt-1 sm:mt-2">
                Desde aquí{' '}
                <span className="bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] whitespace-nowrap">
                  es posible
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mt-6"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: 'normal' }}
            >
              Conectamos tu perfil con el banco que te ofrece{' '}
              <span className="text-primary font-black">la mejor tasa de interés</span>{' '}
              y la mayor probabilidad de aprobar tu crédito automotriz.
            </motion.p>
          </div>

          {/* Main Content Grid - 3/5 Video, 2/5 Form */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-8 xl:gap-10 items-start max-w-[95%] mx-auto">
            {/* Video Player with Animated Gradient Border */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="relative"
            >
              {/* Animated Gradient Border Container */}
              <div className="relative p-[3px] rounded-xl bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-[length:200%_200%] animate-shimmer shadow-2xl">
                <div className="relative bg-white rounded-xl p-2">
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/p-nMlle-xfw?rel=0"
                    title="TREFA - Proceso de Financiamiento"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
              className="relative"
            >
              <div className="backdrop-blur-xl bg-white/90 border-2 border-white/60 rounded-2xl p-8 sm:p-10 md:p-12 shadow-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="registration-form">
                  <div className="text-center mb-6">
                    <h2 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 mb-2">
                      Regístrate en 1 minuto
                    </h2>
                    <p className="text-primary font-bold text-sm">
                      Sin compromiso de compra ni pagos por adelantado
                    </p>
                  </div>

                  <div>
                    <input
                      {...register('fullName')}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/90 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary shadow-md font-medium"
                    />
                    {errors.fullName && (
                      <p className="text-red-600 text-xs mt-2 ml-2 font-medium">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/90 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary shadow-md font-medium"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-2 ml-2 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register('phone')}
                      placeholder="Teléfono (10 dígitos)"
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/90 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary shadow-md font-medium"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-xs mt-2 ml-2 font-medium">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <select
                      {...register('monthlyIncome')}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/90 border-2 border-gray-200 text-gray-900 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary shadow-md font-medium"
                    >
                      <option value="">Selecciona tu ingreso mensual</option>
                      <option value="10000">Menos de $15,000</option>
                      <option value="17500">$15,000 - $20,000</option>
                      <option value="22500">$20,000 - $25,000</option>
                      <option value="30000">$25,000 y más</option>
                    </select>
                    {errors.monthlyIncome && (
                      <p className="text-red-600 text-xs mt-2 ml-2 font-medium">{errors.monthlyIncome.message}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        {...register('isOver21')}
                        type="checkbox"
                        id="isOver21"
                        className="mt-1 w-6 h-6 text-primary rounded-md focus:ring-primary focus:ring-2 bg-white/90 border-2 border-gray-300 shadow-md"
                      />
                      <label htmlFor="isOver21" className="text-gray-900 font-bold text-sm leading-relaxed">
                        Soy mayor de 21 años <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {errors.isOver21 && (
                      <p className="text-red-600 text-xs ml-9 font-medium">{errors.isOver21.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <input
                        {...register('acceptTerms')}
                        type="checkbox"
                        id="acceptTerms"
                        className="mt-1 w-6 h-6 text-primary rounded-md focus:ring-primary focus:ring-2 bg-white/90 border-2 border-gray-300 shadow-md"
                      />
                      <label htmlFor="acceptTerms" className="text-gray-900 font-bold text-sm leading-relaxed">
                        Acepto los{' '}
                        <a
                          href="/politica-de-privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-black underline"
                        >
                          términos y condiciones
                        </a>
                        {' '}y{' '}
                        <a
                          href="/politica-de-privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-black underline"
                        >
                          política de privacidad
                        </a>
                        <span className="text-red-500"> *</span>
                      </label>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-red-600 text-xs ml-9 font-medium">{errors.acceptTerms.message}</p>
                    )}
                  </div>

                  {submissionStatus === 'error' && (
                    <div className="p-4 bg-red-100 border-2 border-red-400 rounded-lg text-center">
                      <p className="text-red-800 font-bold text-sm mb-2">
                        Error al enviar la información
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus('idle')}
                        className="text-xs text-red-700 hover:text-red-900 font-bold underline"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submissionStatus === 'submitting'}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-primary via-orange-500 to-yellow-500 text-white py-4 px-6 rounded-xl font-black text-base hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative flex items-center justify-center space-x-2">
                      {submissionStatus === 'submitting' ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Solicitar Financiamiento</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>

                  <div className="text-center pt-3">
                    <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm font-medium">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-bold">Respuesta en tan solo 1 hora</span>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="relative py-16 bg-gradient-to-r from-orange-50/80 to-yellow-50/80 border-t border-orange-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Tus marcas favoritas están aquí
            </h3>
            <p className="text-primary font-bold text-lg max-w-2xl mx-auto">
              Trabajamos con las marcas más confiables del mercado automotriz
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 items-center justify-items-center">
            {[
              { name: 'Nissan', logo: 'https://www.carlogos.org/car-logos/nissan-logo.png' },
              { name: 'Toyota', logo: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
              { name: 'Honda', logo: 'https://www.carlogos.org/car-logos/honda-logo.png' },
              { name: 'Volkswagen', logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png' },
              { name: 'Chevrolet', logo: 'https://www.carlogos.org/car-logos/chevrolet-logo.png' },
              { name: 'Mazda', logo: 'https://www.carlogos.org/car-logos/mazda-logo.png' },
              { name: 'KIA', logo: 'https://www.carlogos.org/car-logos/kia-logo.png' },
              { name: 'Hyundai', logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png' },
              { name: 'Ford', logo: 'https://www.carlogos.org/car-logos/ford-logo.png' },
              { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' }
            ].map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="w-full h-12 sm:h-14 object-contain grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Vehicle Showcase - All Categories Masonry Grid */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">
              Todos Nuestros Autos Incluyen el Kit
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-bold">
              SUVs, Sedanes, Hatchbacks y Pick Ups certificados con el Kit de Seguridad TREFA de $123,500 MXN incluido
            </p>
          </motion.div>

          {allVehiclesMixed.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
              {allVehiclesMixed.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <MasonryVehicleCard vehicle={vehicle} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-12 font-medium">Cargando selección de vehículos...</p>
          )}

          <div className="text-center mt-8">
            <Link
              to={`/acceder${urlParams ? `?${urlParams}` : ''}`}
              className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-8 py-4 rounded-lg font-black text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Crear mi cuenta
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h3>
            <p className="text-gray-700 font-bold text-lg max-w-2xl mx-auto">
              Más de 2,000 personas ya obtuvieron su financiamiento y hoy manejan un auto TREFA
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                vehicle: 'Honda CR-V 2021',
                text: 'Excelente servicio desde el primer contacto. Mi Honda CR-V 2021 llegó en perfectas condiciones y el financiamiento fue muy accesible. El Kit de Seguridad TREFA me da mucha tranquilidad.',
                location: 'Guadalupe, NL',
                image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Carlos Ramírez',
                vehicle: 'Nissan Frontier 2020',
                text: 'El proceso de intercambio fue muy transparente. Recibí un precio justo por mi auto anterior y encontré la pick-up perfecta para mi negocio. La garantía blindada es excelente.',
                location: 'Monterrey, NL',
                image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Ana López',
                vehicle: 'Mazda CX-5 2022',
                text: 'Como madre soltera, necesitaba un auto confiable y económico. El equipo de TREFA me ayudó a encontrar el financiamiento perfecto y saber que tengo el certificado de procedencia me da mucha paz.',
                location: 'Saltillo, COAH',
                image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-primary/30 shadow-md">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-black">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm font-medium">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">
                    "{testimonial.text}"
                  </p>
                  <div className="text-xs text-primary font-bold">
                    {testimonial.vehicle}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16">
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-black text-primary mb-2">2,000+</div>
              <div className="text-gray-600 font-bold">Clientes Satisfechos</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-black text-primary mb-2">6.5h</div>
              <div className="text-gray-600 font-bold">Tiempo Promedio</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-black text-primary mb-2">85%</div>
              <div className="text-gray-600 font-bold">Tasa de Aprobación</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-lg">
              <div className="text-4xl font-black text-primary mb-2">7</div>
              <div className="text-gray-600 font-bold">Bancos Asociados</div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees Section - "LLÉVATE TRANQUILIDAD" */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8 lg:pr-8"
            >
              <div className="space-y-6 mb-12">
                <h3 className="text-xl md:text-2xl font-black text-orange-600 tracking-wider uppercase mt-8">
                  LLÉVATE TRANQUILIDAD.
                </h3>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  Garantías de defensa a defensa a donde vayas.
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    Autos inspeccionados, verificados por REPUVE y con{' '}
                    <span className="font-black text-gray-900">garantías por escrito</span>
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    Ante cualquier falla mecánica recibe un descuento{' '}
                    <span className="font-black text-gray-900">en el pago de tu mensualidad</span>{' '}
                    por cada día que tu auto esté en el taller
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    Cubrimos tus traslados de Uber y Didi (hasta por $250 por día) por cada día que tu auto esté en reparación.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-xl font-black text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  REGISTRARME
                  <ArrowRight className="w-6 h-6 ml-3" />
                </button>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative lg:pl-8"
            >
              <img
                src="https://r2.trefa.mx/TREFA%20-%20Cuadradas%2010.png"
                alt="Garantías TREFA"
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Financial Commitment Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-blue-50 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative lg:pr-8"
            >
              <img
                src="https://r2.trefa.mx/WEB9.png"
                alt="TREFA - Tu auto ideal"
                className="w-full h-auto object-contain"
              />
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8 lg:pl-8"
            >
              <div className="space-y-6 mb-12">
                <h3 className="text-xl md:text-2xl font-black text-orange-600 tracking-wider uppercase mt-8">
                  NUESTRO COMPROMISO
                </h3>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  Te garantizamos el respaldo financiero que mereces
                </h2>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed font-medium mb-8">
                Elimina los riesgos de comprar tu auto a un particular o un lote convencional con nuestros programas de financiamiento digital respaldados por los bancos que tú ya conoces:
              </p>

              {/* Bank logos */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { name: 'BBVA', logo: 'https://www.carlogos.org/logo/BBVA-logo-2019-640x480.png' },
                  { name: 'Scotiabank', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Scotiabank_logo.svg/320px-Scotiabank_logo.svg.png' },
                  { name: 'AFIRME', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_Banco_Afirme.svg/320px-Logo_Banco_Afirme.svg.png' },
                  { name: 'BANORTE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Banorte_logo.svg/320px-Banorte_logo.svg.png' },
                  { name: 'Banregio', logo: 'https://www.banregio.com/img/logo-banregio.svg' },
                  { name: 'Hey Banco', logo: 'https://heybanco.com/assets/images/logo.svg' }
                ].map((bank, index) => (
                  <div
                    key={bank.name}
                    className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4 shadow-lg flex items-center justify-center hover:shadow-xl hover:border-orange-300 transition-all"
                  >
                    <img
                      src={bank.logo}
                      alt={`${bank.name} logo`}
                      className="h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.currentTarget.style.display = 'none';
                        const span = document.createElement('span');
                        span.className = 'font-black text-sm text-gray-700';
                        span.textContent = bank.name;
                        e.currentTarget.parentElement?.appendChild(span);
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-xl font-black text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                REGISTRARME
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Digital Financing Benefits */}
      <section className="relative py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 mt-8">
              ¿Por qué elegir nuestro financiamiento digital?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  Llena tu solicitud desde tu celular en pocos minutos y recibe una respuesta en 24 horas o menos.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  Financia tu auto con BBVA, Banregio, BANORTE, AFIRME, Scotiabank, y Hey Banco, nuestros bancos asociados.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  Perfilamiento bancario inteligente: enviamos tu solicitud al banco con la mayor probabilidad de aprobación
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  Sin anticipos ni cobros sorpresa: paga tu enganche solo al finalizar tu trámite de financiamiento.
                </p>
              </div>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative lg:pl-8"
            >
              <img
                src="https://r2.trefa.mx/Banner%20127.png"
                alt="TREFA - Financiamiento digital"
                className="w-full h-auto object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kit TREFA Benefits Section */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">
              El Kit de Seguridad TREFA Incluido
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-bold">
              Cada auto TREFA incluye el Kit de Seguridad valorado en $123,500 MXN sin costo adicional
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {[
              {
                icon: Award,
                title: 'Compromiso de Calidad TREFA',
                description: 'Si tu auto presenta una falla mecánica en los primeros 30 días o 500 km, te devolvemos el 100% de tu dinero o lo reparamos sin costo.',
                value: 'Tranquilidad Absoluta'
              },
              {
                icon: FileText,
                title: 'Certificado de Procedencia Segura',
                description: 'Validación en REPUVE, SAT, Totalcheck y TransUnion. Inspección física forense de números de serie en chasis y motor.',
                value: '$3,500 MXN'
              },
              {
                icon: ShieldCheck,
                title: 'Garantía Blindada con Cobertura de $100,000',
                description: 'Tu auto está cubierto en motor y transmisión con una bolsa de protección de hasta $100,000 pesos durante un año completo.',
                value: '$100,000 MXN'
              },
              {
                icon: TrendingUp,
                title: 'Programa de Recompra Garantizada',
                description: 'Te garantizamos por escrito la recompra de tu auto por el 80% de su valor el primer año y el 70% el segundo.',
                value: 'Protección Invaluable'
              },
              {
                icon: Wrench,
                title: 'Check-up de Confianza TREFA',
                description: 'A los 6 meses o 10,000 km, inspección multipunto de seguridad sin costo para asegurar que sigue en perfectas condiciones.',
                value: '$4,000 MXN'
              },
              {
                icon: Car,
                title: 'Bono de Movilidad Garantizada',
                description: 'Si tu auto ingresa a nuestro taller por garantía, te damos $250 pesos diarios para tus traslados.',
                value: '$7,500 MXN'
              },
              {
                icon: DollarSign,
                title: 'Bono de Tranquilidad Financiera',
                description: 'Si tu auto está financiado, cubrimos el equivalente a tu mensualidad promedio mientras está en nuestro taller.',
                value: '$8,500 MXN'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl shadow-lg border border-primary/10 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <benefit.icon className="w-8 h-8" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-black">
                            {index + 1}
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <h3 className="font-heading text-xl md:text-2xl font-black text-gray-900">
                            {benefit.title}
                          </h3>
                          <div className="flex-shrink-0">
                            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black">
                              {benefit.value}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed text-base font-medium">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/70 group-hover:to-primary/40 transition-all duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-600 to-yellow-600 opacity-90"></div>
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight"
            >
              Tu Próximo Auto te Espera con Todo Incluido
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-white/95 leading-relaxed font-bold"
            >
              No dejes tu inversión al azar. Elige la certeza y la tranquilidad que solo TREFA te puede ofrecer.
              Cada auto incluye el Kit de Seguridad valorado en $123,500 MXN sin costo adicional.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <button
                onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-white/95 px-8 py-4 rounded-xl font-black shadow-2xl transition-all hover:scale-105 text-lg"
              >
                Solicitar Financiamiento Ahora
                <ArrowRight className="w-5 h-5" />
              </button>

              <Link
                to={`/acceder${urlParams ? `?${urlParams}` : ''}`}
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 border-2 border-white text-white px-8 py-4 rounded-xl font-black transition-all hover:scale-105 text-lg"
              >
                Crear mi cuenta
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <p className="text-sm text-white/90 pt-4 font-bold">
              Financiamiento disponible • Garantía incluida • Inspección de 150 puntos • Respuesta en 24 horas
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-white/10 w-[80%] translate-y-1/2 h-64"></div>
      </section>
      </div>
    </div>
  );
};

export default FinanciamientosPage;
