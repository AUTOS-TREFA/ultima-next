'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import WallOfLove from '../components/WallOfLove';

// Form validation schema - checkboxes validate but don't save to database
const formSchema = z.object({
  fullName: z.string().min(2, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  isOver21: z.boolean().refine(val => val === true, 'Debes ser mayor de 21 años')
});

type FormData = z.infer<typeof formSchema>;

// Helper function to parse full name into first, last, and mother's last name
// Returns: { firstName, lastName, motherLastName }
const parseFullName = (fullName: string): { firstName: string; lastName: string; motherLastName: string } => {
  const parts = fullName.trim().split(/\s+/); // Split by whitespace

  if (parts.length === 0) {
    return { firstName: '', lastName: '', motherLastName: '' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '', motherLastName: '' };
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1], motherLastName: '' };
  } else {
    // 3 or more parts: first part is firstName, last two are lastNames
    return {
      firstName: parts.slice(0, -2).join(' '),
      lastName: parts[parts.length - 2],
      motherLastName: parts[parts.length - 1]
    };
  }
};

// Data type for profile - only fields to save
type ProfileData = {
  nombre: string;
  email: string;
  telefono: string;
  phone: string; // Add phone field to be saved
};

// Vehicle Card Component
const MasonryVehicleCard: React.FC<{ vehicle: Vehicle; urlParams?: string }> = ({ vehicle, urlParams }) => {
  const imageSrc = getVehicleImage(vehicle);
  const isPopular = vehicle.view_count >= 1000;

  const handleClick = () => {
    // Track vehicle click with Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: vehicle.title,
        content_ids: [vehicle.id],
        content_type: 'product',
        value: vehicle.precio,
        currency: 'MXN'
      });
    }

    // Track with GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'vehicle_click',
        vehicleId: vehicle.id,
        vehicleName: vehicle.title,
        vehiclePrice: vehicle.precio,
        source: 'financiamientos_inventory'
      });
    }
  };

  return (
    <Link
      href={`/autos/${vehicle.slug}${urlParams ? `?${urlParams}` : ''}`}
      className="group block relative z-10"
      onClick={handleClick}
    >
      <div className={`relative ${!isPopular ? 'overflow-hidden' : ''} rounded-lg shadow-md hover:shadow-xl transition-shadow ${isPopular ? 'popular-card' : ''}`}>
        <div className={`aspect-[4/3] bg-gray-100 ${isPopular ? 'overflow-hidden rounded-t-lg' : ''}`}>
          <LazyImage
            src={imageSrc}
            alt={vehicle.title}
            className="w-full h-full"
            objectFit="cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
          <h4 className="text-white font-bold text-sm truncate drop-shadow-md" title={vehicle.title}>
            {vehicle.title}
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
const HorizontalSlider: React.FC<{ vehicles: Vehicle[]; urlParams?: string }> = ({ vehicles, urlParams }) => {
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
            <MasonryVehicleCard vehicle={vehicle} urlParams={urlParams} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FinanciamientosPage: React.FC = () => {
  // SEO metadata is handled in the page.tsx file in Next.js

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'otp' | 'otp_error'>('idle');
  const { vehicles: allVehicles } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);
  const [otp, setOtp] = useState('');
  const [formDataCache, setFormDataCache] = useState<FormData | null>(null);
  const [urlParams, setUrlParams] = useState('');
  const [leadSource, setLeadSource] = useState<string>('direct');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<string>(''); // Track error type for styling

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

    // Track pageview with ConversionTrackingService (includes GTM, Facebook Pixel, and Supabase)
    conversionTracking.trackPageView('Financiamientos Landing Page', {
      source: source,
      pageType: 'financing_landing',
      pageCategory: 'Lead Generation',
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      referrer: document.referrer || undefined
    });
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

  // Combined vehicles for unified masonry grid - mix all categories (reduced by 2)
  const allVehiclesMixed = useMemo(() => {
    const all = [
      ...suvVehicles.slice(0, 7),
      ...sedanVehicles.slice(0, 5),
      ...hatchbackVehicles.slice(0, 4),
      ...pickupVehicles.slice(0, 2)
    ];
    // Shuffle for better visual distribution
    return all.sort(() => Math.random() - 0.5).slice(0, 18);
  }, [suvVehicles, sedanVehicles, hatchbackVehicles, pickupVehicles]);

  // Track form field interactions
  const trackFieldInteraction = (fieldName: string, action: 'focus' | 'blur' | 'change') => {
    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'FormFieldInteraction', {
        field: fieldName,
        action: action,
        page: 'financiamientos',
        source: leadSource
      });
    }

    // GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'form_field_interaction',
        fieldName: fieldName,
        action: action,
        formType: 'financing_request',
        source: leadSource
      });
    }
  };

  // Track CTA clicks
  const trackCTAClick = (ctaName: string, ctaLocation: string) => {
    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: ctaName,
        content_category: ctaLocation,
        source: leadSource
      });
    }

    // GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        ctaName: ctaName,
        ctaLocation: ctaLocation,
        source: leadSource,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Track scroll depth
  useEffect(() => {
    let maxScrollDepth = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set<number>();

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;

      if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
      }

      scrollThresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !trackedThresholds.has(threshold)) {
          trackedThresholds.add(threshold);

          // Facebook Pixel
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('trackCustom', 'ScrollDepth', {
              depth: threshold,
              page: 'financiamientos',
              source: leadSource
            });
          }

          // GTM
          if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
              event: 'scroll_depth',
              scrollDepth: threshold,
              page: 'financiamientos',
              source: leadSource
            });
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [leadSource]);

  // Step 1: Send OTP to user's email
  const onSubmit = async (data: FormData) => {
    setSubmissionStatus('submitting');
    setFormDataCache(data); // Cache form data for after OTP verification

    try {
      console.log('📱 Procesando solicitud para:', data.email);

      // PRIMERO: Verificar si el usuario ya existe con este email
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq('email', data.email)
        .single();

      if (existingProfile && !profileError) {
        console.log('⚠️ Usuario ya existe con este email:', existingProfile);
        setErrorType('account_exists_email'); // Set error type for blue styling
        setErrorMessage('Este correo ya está en uso, por favor inicia sesión aquí.');
        setSubmissionStatus('error');
        // Navigate to /acceder after showing message, preserving URL params
        const redirectUrl = `/acceder${urlParams ? `?${urlParams}` : ''}`;
        setTimeout(() => router.push(redirectUrl), 2500);
        return;
      }

      console.log('✅ Usuario nuevo confirmado, procediendo con SMS...');

      // SEGUNDO: Verificar si el teléfono ya está registrado Y verificado
      // Optimización: No enviar SMS si el teléfono ya está verificado con otra cuenta
      const cleanPhone = data.phone.replace(/\D/g, '');
      const { data: existingPhoneProfile, error: phoneError } = await supabase
        .from('profiles')
        .select('id, email, phone, phone_verified')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingPhoneProfile && !phoneError) {
        console.log('⚠️ Usuario ya existe con este teléfono:', existingPhoneProfile);
        setErrorType('account_exists_phone'); // Set error type for blue styling

        // Si el teléfono ya está verificado, mostrar email parcial
        if (existingPhoneProfile.phone_verified) {
          const maskedEmail = existingPhoneProfile.email
            ? existingPhoneProfile.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : '';
          setErrorMessage(`Este número ya está verificado${maskedEmail ? ` con ${maskedEmail}` : ''}. Por favor inicia sesión.`);
        } else {
          setErrorMessage('Este número de celular ya está en uso, por favor inicia sesión aquí.');
        }

        setSubmissionStatus('error');
        // Navigate to /acceder after showing message, preserving URL params
        const redirectUrl = `/acceder${urlParams ? `?${urlParams}` : ''}`;
        setTimeout(() => router.push(redirectUrl), 2500);
        return;
      }

      // Format phone number (ensure +52 prefix for Mexico)
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10) {
        formattedPhone = `+52${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      console.log('📤 Enviando código de verificación a:', formattedPhone);

      // Send SMS OTP via Twilio Verify (no otp parameter needed)
      const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          phone: formattedPhone
        }
      });

      // Handle phone_already_verified error from Edge Function (backup check)
      if (smsData?.error === 'phone_already_verified') {
        console.log('⚠️ Teléfono ya verificado (desde Edge Function)');
        setErrorType('account_exists_phone');
        const maskedEmail = smsData?.existingEmail || '';
        setErrorMessage(`Este número ya está verificado${maskedEmail ? ` con ${maskedEmail}` : ''}. Por favor inicia sesión.`);
        setSubmissionStatus('error');
        const redirectUrl = `/acceder${urlParams ? `?${urlParams}` : ''}`;
        setTimeout(() => router.push(redirectUrl), 2500);
        return;
      }

      if (smsError) {
        console.error('❌ Error al enviar SMS:', smsError);
        const errorMsg = (smsError as any).message || 'Error al enviar código de verificación';

        // Mostrar mensaje específico según el error
        if (errorMsg.includes('phone number')) {
          setErrorMessage('El número de teléfono ingresado no es válido. Por favor verifica que sea un número de 10 dígitos.');
        } else if (errorMsg.includes('Twilio')) {
          setErrorMessage('Error al enviar el mensaje SMS. Por favor intenta de nuevo en unos momentos.');
        } else {
          setErrorMessage(`Error: ${errorMsg}`);
        }

        setSubmissionStatus('error');
        return;
      }

      if (!smsData?.success) {
        console.error('❌ SMS no se envió correctamente:', smsData);
        setErrorMessage('No se pudo enviar el código de verificación. Por favor intenta de nuevo.');
        setSubmissionStatus('error');
        return;
      }

      console.log('✅ SMS OTP sent successfully:', smsData);
      console.log('💾 Código enviado al teléfono:', formattedPhone);

      // Track form submission with Facebook Pixel and GTM
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Financing Request - Form Submitted',
          content_category: 'Financial Services',
          source: leadSource
        });
      }

      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'financing_form_submitted',
          formType: 'financing_request',
          source: leadSource
        });
      }

      setSubmissionStatus('otp'); // Show OTP verification form

    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setErrorMessage(error.message || 'Error inesperado al enviar el código. Por favor intenta de nuevo.');
      setSubmissionStatus('error');
    }
  };

  // Step 2: Verify SMS OTP and create/update profile
  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataCache) return;

    setSubmissionStatus('submitting');

    try {
      console.log('🔐 Verifying SMS OTP...');

      // Format phone number
      let formattedPhone = formDataCache.phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `+52${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      console.log('📞 Teléfono formateado:', formattedPhone);
      console.log('🔢 Código OTP ingresado:', otp);

      // Verify SMS OTP using Edge Function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-sms-otp', {
        body: {
          phone: formattedPhone,
          code: otp
        }
      });

      console.log('📊 Respuesta de verify-sms-otp:', { verifyData, verifyError });

      if (verifyError) {
        console.error('❌ Error al verificar código:', verifyError);
        const errorMsg = (verifyError as any).message || 'Error al verificar código';

        if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
          setErrorMessage('El código ha expirado. Por favor solicita un nuevo código.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('inválido') || errorMsg.includes('Incorrect')) {
          setErrorMessage('El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.');
        } else {
          setErrorMessage('Error al verificar el código. Por favor intenta de nuevo.');
        }

        setSubmissionStatus('otp_error');
        return;
      }

      if (!verifyData?.success) {
        console.error('❌ Código no verificado:', verifyData);
        setErrorMessage(verifyData?.error || 'El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.');
        setSubmissionStatus('otp_error');
        return;
      }

      console.log('✅ SMS OTP verified successfully');

      // Check if user already exists
      const { data: { user: existingUser } } = await supabase.auth.getUser();

      let userId = existingUser?.id;
      let newUserCreated = false;

      // If no existing user, create one
      if (!existingUser) {
        console.log('📝 Creating new user account...');

        // Create user with signUp (using a random password since we verified via SMS)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formDataCache.email,
          password: Math.random().toString(36).slice(-16), // Random password
          options: {
            data: {
              full_name: formDataCache.fullName,
              phone: formattedPhone,
              source: 'financiamientos-landing'
            }
          }
        });

        if (signUpError) {
          console.error('❌ SignUp Error:', signUpError);

          // If user already exists, try to sign them in
          if (signUpError.message?.includes('already registered')) {
            const redirectUrl = `/acceder${urlParams ? `?${urlParams}` : ''}`;
            setErrorMessage(`Este correo ya está registrado. Por favor, inicia sesión.`);
            setSubmissionStatus('error');
            setTimeout(() => router.push(redirectUrl), 2000);
            return;
          }

          throw signUpError;
        }

        if (!signUpData.user) {
          throw new Error('No se pudo crear la cuenta de usuario');
        }

        userId = signUpData.user.id;
        newUserCreated = true;
        console.log('✅ User created successfully with ID:', userId);

        // Wait a moment for Supabase Auth to establish the session
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify the session was established
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('⚠️ Session not established after signUp, attempting to get user again');
          const { data: { user: verifiedUser } } = await supabase.auth.getUser();
          if (!verifiedUser) {
            throw new Error('No se pudo establecer la sesión del usuario');
          }
        }
      }

      console.log('✅ User process completed, userId:', userId);

      // Ensure we have a valid userId before proceeding
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      // Now update/create the user's profile
      // Parse full name into first_name, last_name, mother_last_name
      console.log('📝 Nombre completo recibido:', formDataCache.fullName);
      const { firstName, lastName, motherLastName } = parseFullName(formDataCache.fullName);
      console.log('📝 Nombre parseado:', { firstName, lastName, motherLastName });

      // Get URL parameters for tracking
      const params = new URLSearchParams(window.location.search);
      const ordencompra = params.get('ordencompra') || params.get('orden_compra') || undefined;
      const utmSource = params.get('utm_source') || undefined;
      const utmMedium = params.get('utm_medium') || undefined;
      const utmCampaign = params.get('utm_campaign') || undefined;
      const utmTerm = params.get('utm_term') || undefined;
      const utmContent = params.get('utm_content') || undefined;
      const referrerUrl = document.referrer || undefined;
      const landingPage = window.location.href;

      // Clean phone number - extract only digits and take last 10
      const cleanPhone = formDataCache.phone.replace(/\D/g, '').slice(-10);

      console.log('📝 Preparando datos de perfil:', {
        firstName,
        lastName,
        motherLastName,
        cleanPhone,
        email: formDataCache.email
      });

      const profileData = {
        first_name: firstName,
        last_name: lastName,
        mother_last_name: motherLastName,
        email: formDataCache.email,
        phone: cleanPhone, // Only save 10 digits without country code
        phone_verified: true, // Phone verified via SMS OTP
        // Tracking data
        ordencompra: ordencompra,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        referrer: referrerUrl,
        landing_page: landingPage,
        lead_source: leadSource,
        first_visit_at: new Date().toISOString()
      };

      console.log('🔄 Ejecutando upsert con estos datos:', {
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      });

      const { data: upsertData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
      } else {
        console.log('✅ Profile updated successfully');
        console.log('📊 Datos guardados en la base de datos:', upsertData);
      }

      // Verificar inmediatamente que los datos se guardaron
      const { data: verifyProfile, error: profileVerifyError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, mother_last_name, phone, email')
        .eq('id', userId)
        .single();

      console.log('🔍 Verificación de perfil guardado:', { verifyProfile, profileVerifyError });

      // Also save to leads table for tracking
      const { data: leadData } = await supabase
        .from('leads')
        .insert([
          {
            user_id: userId,
            nombre: formDataCache.fullName,
            email: formDataCache.email,
            telefono: formDataCache.phone,
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
        userId: userId,
        email: formDataCache.email,
        source: leadSource,
        leadId: leadData?.id
      });

      // Track successful lead creation with Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Financing Request Lead',
          content_category: 'Financial Services',
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
            userId: userId,
            source: 'financiamientos-landing',
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.warn('⚠️ Webhook notification failed (non-critical):', webhookError);
      }

      reset();
      setFormDataCache(null);

      // Clear cached profile so AuthContext fetches fresh data with the new profile info
      sessionStorage.removeItem('userProfile');

      // Redirect to profile page immediately with URL parameters preserved
      const redirectPath = `/escritorio/profile${urlParams ? `?${urlParams}` : ''}`;
      router.push(redirectPath);

      // Set success status AFTER navigation starts (for any loading state feedback)
      setSubmissionStatus('success');

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

      setSubmissionStatus('otp_error');
    }
  };

  // OTP Verification View
  if (submissionStatus === 'otp' || submissionStatus === 'otp_error') {
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
              Verifica tu teléfono
            </h2>
            <p className="text-gray-600 text-sm">
              Hemos enviado un código de 6 dígitos por SMS a <strong>{formDataCache?.phone}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">(El mensaje puede tardar unos segundos en llegar)</p>
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

            {submissionStatus === 'otp_error' && (
              <div className="p-3 bg-red-100 border-2 border-red-400 rounded-lg text-center">
                <p className="text-red-800 font-bold text-sm">
                  {errorMessage || 'Código inválido o expirado. Inténtalo de nuevo.'}
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
                setErrorMessage('');
              }}
              className="w-full text-sm text-gray-500 hover:text-primary font-medium"
            >
              Modificar o cambiar número celular
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
            Te contactaremos en las próximas 24h con las mejores opciones de financiamiento para tu auto.
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
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: -0.01em !important;
        }
        .financiamientos-page h1 {
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-weight: 900 !important;
        }
        .financiamientos-page h2 {
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
        }
      `}</style>
      <div className="financiamientos-page" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Hero Section with Form */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50/30 py-12 sm:py-16 lg:py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Logo with Animation - Extra Small Size */}
          <motion.div
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-6 sm:mb-8"
          >
            <img
              src="/images/trefalogo.png"
              alt="TREFA Logo"
              className="h-6 sm:h-10 md:h-12 w-auto"
            />
          </motion.div>

          {/* Massive Headline - Two lines only */}
          <div className="text-center mb-3 sm:mb-4 lg:mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 px-4 tracking-tight leading-[0.95]"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' }}
            >
              <span className="inline text-gray-900">
                Estrena un auto seminuevo en{' '}
              </span>
              <span className="inline">
                <span className="bg-gradient-to-r from-primary via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  menos de 24h
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="text-base md:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mt-2 mb-8 sm:mb-10 font-normal px-4"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif", letterSpacing: 'normal' }}
            >
              Enviamos tu solicitud al banco con la mayor probabilidad de aprobar tu crédito automotriz.
            </motion.p>
          </div>

          {/* Main Content Grid - 3/5 Video, 2/5 Form */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-8 xl:gap-10 items-start max-w-[95%] mx-auto mt-6">
            {/* Video Player with Animated Gradient Border */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="relative"
            >
              {/* Paso 1 Label */}
              <div className="mb-4 text-center lg:text-left">
                <div className="inline-block bg-gradient-to-r from-primary/10 via-orange-500/10 to-yellow-500/10 border-2 border-primary/20 rounded-xl px-6 py-3 shadow-md">
                  <h3 className="text-xl md:text-2xl font-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    <span className="bg-gradient-to-r from-primary via-orange-500 to-orange-600 bg-clip-text text-transparent">
                      Paso 1:
                    </span>
                    <span className="text-gray-900"> Mira este corto video</span>
                  </h3>
                </div>
              </div>

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
              {/* Paso 2 Label */}
              <div className="mb-4 text-center lg:text-left">
                <div className="inline-block bg-gradient-to-r from-primary/10 via-orange-500/10 to-yellow-500/10 border-2 border-primary/20 rounded-xl px-6 py-3 shadow-md">
                  <h3 className="text-xl md:text-2xl font-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    <span className="bg-gradient-to-r from-primary via-orange-500 to-orange-600 bg-clip-text text-transparent">
                      Paso 2:
                    </span>
                    <span className="text-gray-900"> Regístrate sin costo</span>
                  </h3>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/90 border-2 border-white/60 rounded-2xl p-5 sm:p-8 md:p-10 shadow-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4" id="registration-form">
                  <div className="text-center mb-6">
                    <p className="text-primary font-normal text-sm sm:text-base">
                      Sin compromiso de compra ni pagos por adelantado
                    </p>
                  </div>

                  <div>
                    <input
                      {...register('fullName')}
                      placeholder="Nombre completo"
                      onFocus={() => trackFieldInteraction('fullName', 'focus')}
                      onBlur={() => trackFieldInteraction('fullName', 'blur')}
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
                      onFocus={() => trackFieldInteraction('email', 'focus')}
                      onBlur={() => trackFieldInteraction('email', 'blur')}
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
                      onFocus={() => trackFieldInteraction('phone', 'focus')}
                      onBlur={() => trackFieldInteraction('phone', 'blur')}
                      className="w-full px-4 py-3 backdrop-blur-md bg-white/90 border-2 border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary shadow-md font-medium"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-xs mt-2 ml-2 font-medium">{errors.phone.message}</p>
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
                        <Link
                          href="/terminos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-black underline"
                        >
                          términos y condiciones
                        </Link>
                        {' '}y{' '}
                        <Link
                          href="/politica-de-privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-black underline"
                        >
                          política de privacidad
                        </Link>
                        <span className="text-red-500"> *</span>
                      </label>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-red-600 text-xs ml-9 font-medium">{errors.acceptTerms.message}</p>
                    )}
                  </div>

                  {submissionStatus === 'error' && (
                    <div className={`p-4 rounded-lg text-center ${
                      errorType === 'account_exists_email' || errorType === 'account_exists_phone'
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-red-100 border-2 border-red-400'
                    }`}>
                      {errorType === 'account_exists_email' || errorType === 'account_exists_phone' ? (
                        <p className="text-blue-700 font-bold text-sm mb-2">
                          {errorMessage}{' '}
                          <Link
                            href={`/acceder${urlParams ? `?${urlParams}` : ''}`}
                            className="underline hover:text-blue-900"
                          >
                            Ir ahora
                          </Link>
                        </p>
                      ) : (
                        <p className="text-red-800 font-bold text-sm mb-2">
                          {errorMessage || 'Error al enviar la información'}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionStatus('idle');
                          setErrorMessage('');
                          setErrorType('');
                        }}
                        className={`text-xs font-bold underline ${
                          errorType === 'account_exists_email' || errorType === 'account_exists_phone'
                            ? 'text-blue-700 hover:text-blue-900'
                            : 'text-red-700 hover:text-red-900'
                        }`}
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submissionStatus === 'submitting'}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-primary to-orange-600 text-white py-4 sm:py-5 px-6 rounded-xl font-black text-base sm:text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg min-h-[48px] touch-manipulation"
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
                          <span>Solicitar financiamiento</span>
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

      {/* Unified Vehicle Showcase - All Categories Masonry Grid */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Inventario de Autos con Entrega Inmediata
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-normal">
              Todos nuestros autos incluyen el{' '}
              <a
                href="#kit-trefa"
                className="text-primary hover:text-orange-600 underline decoration-2 underline-offset-4 transition-colors"
              >
                Kit de Seguridad TREFA
              </a>
              , con un valor real de $123,500 MXN.
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
                  <MasonryVehicleCard vehicle={vehicle} urlParams={urlParams} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-12 font-medium">Cargando selección de autos...</p>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => {
                trackCTAClick('Ver todo el inventario', 'inventory_section');
                document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-r from-primary to-orange-600 text-white hover:shadow-2xl px-8 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">Ver todo el inventario</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Digital Financing Benefits */}
      <section className="relative py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
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
                <p className="text-lg text-gray-700 leading-relaxed font-normal">
                  Llena tu solicitud desde tu celular en pocos minutos y recibe una respuesta en 24h o menos.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-normal">
                  Financia tu auto con BBVA, Banregio, BANORTE, AFIRME, Scotiabank, y Hey Banco, nuestros bancos asociados.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-normal">
                  Perfilamiento bancario inteligente: enviamos tu solicitud al banco con la mayor probabilidad de aprobación
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-normal">
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
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brands Section - Sliding Carousel */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="w-full">
          <div className="text-center mb-10 px-4">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Tus marcas favoritas están aquí
            </h2>
          </div>

          {/* Infinite Scrolling Carousel - Full Width */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll-left">
              {/* First set */}
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
                { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
                { name: 'Mercedes-Benz', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
                { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png' },
                { name: 'Jeep', logo: 'https://www.carlogos.org/car-logos/jeep-logo.png' },
                { name: 'Subaru', logo: 'https://www.carlogos.org/car-logos/subaru-logo.png' },
                { name: 'Mitsubishi', logo: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png' }
              ].map((brand, index) => (
                <div key={`${brand.name}-1-${index}`} className="flex-shrink-0 mx-3">
                  <div className="bg-gray-50 rounded-lg p-6 w-32 h-24 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
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
                { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
                { name: 'Mercedes-Benz', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
                { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png' },
                { name: 'Jeep', logo: 'https://www.carlogos.org/car-logos/jeep-logo.png' },
                { name: 'Subaru', logo: 'https://www.carlogos.org/car-logos/subaru-logo.png' },
                { name: 'Mitsubishi', logo: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png' }
              ].map((brand, index) => (
                <div key={`${brand.name}-2-${index}`} className="flex-shrink-0 mx-3">
                  <div className="bg-gray-50 rounded-lg p-6 w-32 h-24 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees Section - "LLÉVATE TRANQUILIDAD" */}
      <section className="relative py-20 md:py-24 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/20">
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
                <h3 className="text-lg md:text-xl lg:text-2xl font-black text-orange-600 tracking-wider uppercase">
                  LLÉVATE TRANQUILIDAD.
                </h3>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
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
                  onClick={() => {
                    trackCTAClick('Solicitar financiamiento', 'digital_financing_benefits');
                    document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-r from-primary to-orange-600 text-white hover:shadow-2xl px-8 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative">Solicitar financiamiento</span>
                  <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
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
      <section className="relative py-20 md:py-24 bg-gradient-to-br from-blue-50 via-white to-orange-50/30">
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
                <h3 className="text-lg md:text-xl lg:text-2xl font-black text-orange-600 tracking-wider uppercase">
                  NUESTRO COMPROMISO
                </h3>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  Te garantizamos el respaldo financiero que mereces
                </h2>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed font-normal mb-6">
                Elimina los riesgos de comprar tu auto a un particular o un lote convencional con nuestros programas de financiamiento digital respaldados por BBVA, Banregio, BANORTE, AFIRME, Scotiabank y Hey Banco.
              </p>

              <button
                onClick={() => {
                  trackCTAClick('Solicitar financiamiento', 'financial_commitment_section');
                  document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-r from-primary to-orange-600 text-white hover:shadow-2xl px-8 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative">Solicitar financiamiento</span>
                <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kit TREFA Benefits Section */}
      <section id="kit-trefa" className="py-20 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12">
            <p className="text-lg md:text-xl font-black text-primary uppercase tracking-wide">
              Todos nuestros autos incluyen el kit
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-gray-900">
              El Kit de Seguridad TREFA
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Cada auto TREFA incluye el Kit de Seguridad valorado en{' '}
              <span className="font-black text-primary">$123,500 MXN</span> sin costo adicional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: ShieldCheck,
                title: 'Garantía Blindada',
                value: '$100,000 MXN',
                description: 'Motor y transmisión cubiertos con hasta $100,000 pesos durante un año completo.'
              },
              {
                icon: FileText,
                title: 'Certificado de Procedencia',
                value: '$3,500 MXN',
                description: 'Validación en REPUVE, SAT, Totalcheck y TransUnion. Historial 100% verificado.'
              },
              {
                icon: Award,
                title: 'Check-up a los 6 Meses',
                value: '$4,000 MXN',
                description: 'Inspección multipunto gratuita: frenos, suspensión, niveles y componentes de seguridad.'
              },
              {
                icon: TrendingUp,
                title: 'Programa de Recompra',
                value: 'Protección de Valor',
                description: 'Recompra garantizada por el 80% del valor el primer año y 70% el segundo año.'
              },
              {
                icon: Car,
                title: 'Bono de Movilidad',
                value: '$7,500 MXN',
                description: 'Te damos $250 pesos diarios para tus traslados si tu auto está en nuestro taller.'
              },
              {
                icon: DollarSign,
                title: 'Bono Financiero',
                value: '$8,500 MXN',
                description: 'Cubrimos tu mensualidad promedio mientras tu auto está en reparación.'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">{benefit.title}</h3>
                <div className="text-primary font-black text-sm mb-3">{benefit.value}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wall of Love - Testimonials */}
      <WallOfLove />

      {/* Final CTA Section - Darker Blue with Orange CTA */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Tu próximo auto te espera con todo incluido
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-white leading-snug font-normal"
            >
              No dejes tu inversión al azar. Elige la certeza y la tranquilidad que solo TREFA te puede ofrecer.
              Cada auto incluye el Kit de Seguridad valorado en $123,500 MXN sin costo adicional.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex justify-center pt-4"
            >
              <button
                onClick={() => {
                  trackCTAClick('Solicitar financiamiento', 'final_cta_section');
                  document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-xl font-black shadow-2xl transition-all hover:scale-105 text-lg"
              >
                Solicitar financiamiento
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <p className="text-sm text-white/90 pt-4 font-normal">
              Financiamiento disponible • Garantía incluida • Inspección de 150 puntos • Respuesta en 24h
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-blue-600/20 w-[80%] translate-y-1/2 h-64"></div>
      </section>
      </div>
    </div>
  );
};

export default FinanciamientosPage;
