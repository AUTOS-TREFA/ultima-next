'use client';

import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { useForm, Controller, useController, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { WordPressVehicle, Profile } from '../types/types';
import {
  FileText, CheckCircle, Building2, User, AlertTriangle, Loader2, Users, PenSquare,
  ArrowLeft, ArrowRight, Edit, Info, DollarSign, AlertCircle
} from 'lucide-react';
import StepIndicator from '../components/StepIndicator';
import { ApplicationService } from '../services/ApplicationService';
import { BankProfilingService } from '../services/BankProfilingService';
import { ProfileService } from '../services/profileService';
import VehicleService from '../services/VehicleService';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import { BrevoEmailService } from '../services/BrevoEmailService';
import { supabase } from '../../supabaseClient';
import { conversionTracking } from '../services/ConversionTrackingService';
import { buildUrlWithTracking } from '../utils/sourceTracking';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

const VehicleSelector = lazy(() => import('../components/VehicleSelector'));

const MEXICAN_STATES = [ 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', ];

const baseApplicationObject = z.object({
  // Step 1: Personal Info & Address
  // cellphone_company removed - now collected in profile only
  current_address: z.string().optional(),
  current_colony: z.string().optional(),
  current_city: z.string().optional(),
  current_state: z.string().optional(),
  current_zip_code: z.string().optional(),
  time_at_address: z.string().min(1, 'Por favor, indica cuánto tiempo llevas viviendo en tu domicilio actual'),
  housing_type: z.string().min(1, 'Por favor, selecciona el tipo de vivienda donde resides'),
  grado_de_estudios: z.string().min(1, 'Por favor, selecciona tu grado de estudios'),
  dependents: z.string().min(1, 'Por favor, indica el número de dependientes económicos que tienes'),
  // spouse_full_name removed - this data is collected in Profile page as spouse_name

  // Step 2: Employment Info
  fiscal_classification: z.string().min(1, "Por favor, selecciona tu clasificación fiscal (Persona Física o Moral)"),
  company_name: z.string().min(2, "Por favor, ingresa el nombre completo de tu empresa o empleador"),
  company_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono de empresa válido de 10 dígitos")),
  supervisor_name: z.string().min(2, "Por favor, ingresa el nombre completo de tu jefe o supervisor inmediato"),
  company_website: z.string().optional().or(z.literal('')).refine(val => {
    if (!val) return true; // Optional field is valid if empty
    return val.includes('.') && !val.includes(' ');
  }, { message: 'Por favor, ingresa una URL válida (debe incluir un punto y no tener espacios). Ejemplo: www.empresa.com' }),
  company_address: z.string().min(5, "Por favor, ingresa la dirección completa de tu empresa o lugar de trabajo"),
  company_industry: z.string().min(2, "Por favor, indica a qué industria o sector pertenece tu empresa"),
  job_title: z.string().min(2, "Por favor, ingresa tu puesto o cargo en la empresa"),
  job_seniority: z.string().min(1, "Por favor, indica cuánto tiempo llevas trabajando en tu puesto actual"),
  net_monthly_income: z.string().min(1, "Por favor, ingresa tu ingreso mensual bruto (antes de impuestos)"),

  // Step 3: References
  parentesco: z.string().min(3, "Por favor, especifica tu parentesco o relación con la referencia familiar"),
  friend_reference_name: z.string().min(2, "Por favor, proporciona el nombre completo de una referencia personal (amigo o conocido)"),
  friend_reference_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono válido de 10 dígitos para tu referencia personal")),
  friend_reference_relationship: z.string().min(2, "Por favor, indica tu relación con esta referencia personal (ej: amigo, compañero de trabajo)"),
  family_reference_name: z.string().min(2, "Por favor, proporciona el nombre completo de una referencia familiar"),
  family_reference_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono válido de 10 dígitos para tu referencia familiar")),

  // Financing Preferences (optional fields, calculated dynamically)
  loan_term_months: z.number().optional(),
  down_payment_amount: z.number().optional(),
  estimated_monthly_payment: z.number().optional(),

  // Step 5: Consent
  terms_and_conditions: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar."
  }),
  consent_survey: z.boolean().optional(),
  ordencompra: z.string().optional(),
});

const baseApplicationSchema = baseApplicationObject;

type ApplicationFormData = z.infer<typeof baseApplicationSchema>;

interface ApplicationProps {
    id?: string;
}

const Application: React.FC<ApplicationProps> = ({ id: applicationIdFromUrl }) => {
    const router = useRouter();
    const { user, profile, loading: authLoading, isAdmin } = useAuth();
    const { vehicles } = useVehicles();
    const searchParams = useSearchParams();

    const [pageStatus, setPageStatus] = useState<'initializing' | 'loading' | 'checking_profile' | 'profile_incomplete' | 'bank_profile_incomplete' | 'active_application_exists' | 'ready' | 'error' | 'success'>('initializing');
    const [pageError, setPageError] = useState<string | null>(null);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    // Validate applicationId from URL - filter out invalid values like "undefined"
    const [applicationId, setApplicationId] = useState<string | null>(
        applicationIdFromUrl && applicationIdFromUrl !== 'undefined' && applicationIdFromUrl !== 'null'
            ? applicationIdFromUrl
            : null
    );
    const [applicationData, setApplicationData] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [recommendedBank, setRecommendedBank] = useState<string | null>(null);
    const [vehicleInfo, setVehicleInfo] = useState<any>(null);

    const applicationSchema = baseApplicationSchema;

    const form = useForm<ApplicationFormData>({
      resolver: zodResolver(applicationSchema),
      defaultValues: {
        terms_and_conditions: false,
        consent_survey: false,
        loan_term_months: 60, // Default to 60 months
      }
    });
    const { control, handleSubmit, formState: { errors, isValid }, reset, trigger, getValues, setValue } = form;
    const isMarried = profile?.civil_status?.toLowerCase() === 'casado';

    useEffect(() => {
        const checkUserProfile = async () => {
            if (authLoading) {
                setPageStatus('loading');
                return;
            }
            if (!user || !profile) {
                setPageStatus('profile_incomplete');
                return;
            }

            setPageStatus('checking_profile');
            try {
                // Preserve ordencompra from URL or sessionStorage
                const ordenCompraFromUrl = searchParams?.get('ordencompra');
                const pendingOrdenCompra = sessionStorage.getItem('pendingOrdenCompra');
                const currentOrdenCompra = ordenCompraFromUrl || pendingOrdenCompra;

                // Save ordencompra to sessionStorage if present in URL
                if (ordenCompraFromUrl) {
                    sessionStorage.setItem('pendingOrdenCompra', ordenCompraFromUrl);
                }

                // Address fields (address, city, state, zip_code) are now part of the application form, not profile requirements
                const requiredFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
                const isProfileComplete = requiredFields.every(field => profile[field] && String(profile[field]).trim() !== '');

                if (!isProfileComplete) {
                    console.log('[Application] Profile incomplete, redirecting to profile page');
                    setPageStatus('profile_incomplete');
                    return;
                }

                const bankProfile = await BankProfilingService.getUserBankProfile(user.id);
                console.log('[Application] Bank profile check:', {
                    bankProfile,
                    is_complete: bankProfile?.is_complete,
                    banco_recomendado: bankProfile?.banco_recomendado
                });

                // Only check bank profile if it's truly incomplete
                if (!bankProfile || !bankProfile.is_complete || !bankProfile.banco_recomendado) {
                    console.log('[Application] Bank profile incomplete or missing recommended bank');
                    setPageStatus('bank_profile_incomplete');
                    return;
                }
                setRecommendedBank(bankProfile.banco_recomendado);

                // Admin users can create unlimited applications
                if (!isAdmin) {
                    const hasActiveApp = await ApplicationService.hasActiveApplication(user.id);
                    if (hasActiveApp && !applicationIdFromUrl) {
                        setPageStatus('active_application_exists');
                        return;
                    }
                }

                setPageStatus('ready');
            } catch (error: any) {
                console.error("Error during application pre-flight checks:", error);
                setPageError(error.message || 'No pudimos verificar los requisitos de tu solicitud. Por favor, asegúrate de que tu perfil esté completo e intenta nuevamente. Si el problema persiste, contacta con soporte.');
                setPageStatus('error');
            }
        };

        if (pageStatus === 'initializing') {
            checkUserProfile();
        }
    }, [user, profile, authLoading, applicationIdFromUrl, searchParams, pageStatus, isAdmin]);

    useEffect(() => {
        const loadOrCreateDraft = async () => {
            if (pageStatus !== 'ready' || !user) return;

            // If we already have the application data loaded for this ID, skip
            if (applicationData && applicationIdFromUrl && applicationId === applicationIdFromUrl) return;

            try {
                if (applicationIdFromUrl) {
                    const draft = await ApplicationService.getApplicationById(user.id, applicationIdFromUrl);
                    if (!draft) throw new Error('No encontramos el borrador de tu solicitud. Es posible que haya sido eliminado o que el enlace sea incorrecto. Por favor, inicia una nueva solicitud.');

                    setApplicationId(draft.id);
                    setApplicationData(draft.application_data || {});
                    const carInfo = (draft.car_info || {}) as any;
                    setVehicleInfo(carInfo);
                    if (carInfo?._ordenCompra) setValue('ordencompra', carInfo._ordenCompra);

                    const applicationData = { ...(draft.application_data || {}) };
                    reset(applicationData);
                    if (!carInfo._ordenCompra) setShowVehicleSelector(true);

                    // DO NOT track ComienzaSolicitud for existing drafts - only track once on creation
                    // This prevents duplicate tracking when users return to their draft
                } else {
                    const pendingOrdenCompra = sessionStorage.getItem('pendingOrdenCompra');
                    const finalOrdenCompra = searchParams?.get('ordencompra') || pendingOrdenCompra;

                    let initialData: Record<string, any> = {};
                    if (finalOrdenCompra) {
                        // Fetch vehicle directly by ordencompra instead of searching in paginated results
                        const vehicle = await VehicleService.getVehicleByOrdenCompra(finalOrdenCompra);
                        if (vehicle) {
                            const featureImage = vehicle.thumbnail_webp || vehicle.thumbnail || vehicle.feature_image_webp || vehicle.feature_image || DEFAULT_PLACEHOLDER_IMAGE;
                            const carData = {
                                _vehicleTitle: vehicle.title,
                                _ordenCompra: vehicle.ordencompra,
                                _featureImage: featureImage,
                                precio: vehicle.precio,
                                enganche_recomendado: vehicle.enganche_recomendado,
                                enganchemin: vehicle.enganchemin,
                                mensualidad_recomendada: vehicle.mensualidad_recomendada,
                                plazomax: vehicle.plazomax
                            };
                            initialData.car_info = carData;
                            initialData.application_data = { ordencompra: finalOrdenCompra };
                            setVehicleInfo(carData);
                            setValue('ordencompra', vehicle.ordencompra);
                        } else {
                            console.warn(`Vehicle with ordencompra ${finalOrdenCompra} not found`);
                        }
                        sessionStorage.removeItem('pendingOrdenCompra');
                    } else {
                        setShowVehicleSelector(true);
                    }

                    const newDraft = await ApplicationService.createDraftApplication(user.id, initialData);
                    if (newDraft && newDraft.id) {
                        // DO NOT track ComienzaSolicitud here - it's already tracked in PerfilacionBancariaPage
                        // when user completes bank profiling and sees results

                        // Set only the application ID - do NOT set applicationData
                        // This allows the effect to load the full draft from database after navigation
                        setApplicationId(newDraft.id);

                        // Navigate to the new URL (this will trigger the effect to reload the full draft)
                        router.replace(`/escritorio/aplicacion/${newDraft.id}`);
                    } else {
                        throw new Error('No pudimos crear el borrador de tu solicitud. Por favor, intenta nuevamente. Si el problema persiste, contacta con soporte.');
                    }
                }
            } catch (error: any) {
                setPageError(error.message || 'No pudimos cargar o crear tu solicitud de financiamiento. Por favor, verifica tu conexión a internet e intenta nuevamente.');
                setPageStatus('error');
            }
        };

        loadOrCreateDraft();
    }, [pageStatus, user, applicationIdFromUrl, vehicles, reset, searchParams, setValue, router, applicationData]);

    const handleVehicleSelect = async (vehicle: WordPressVehicle) => {
        if (!applicationId) return;
        const featureImage = vehicle.thumbnail_webp || vehicle.thumbnail || vehicle.feature_image_webp || vehicle.feature_image || DEFAULT_PLACEHOLDER_IMAGE;
        const carData = {
            _vehicleTitle: vehicle.title,
            _ordenCompra: vehicle.ordencompra,
            _featureImage: featureImage,
            precio: vehicle.precio,
            enganche_recomendado: vehicle.enganche_recomendado,
            enganchemin: vehicle.enganchemin,
            mensualidad_recomendada: vehicle.mensualidad_recomendada,
            plazomax: vehicle.plazomax
        };
        setVehicleInfo(carData);
        setValue('ordencompra', vehicle.ordencompra);
        await ApplicationService.saveApplicationDraft(applicationId, { car_info: carData });
        setShowVehicleSelector(false);
    };

    const steps = [
        { title: 'Personal', icon: User, fields: ['time_at_address', 'housing_type', 'dependents', 'grado_de_estudios'] },
        { title: 'Empleo', icon: Building2, fields: ['fiscal_classification', 'company_name', 'company_phone', 'supervisor_name', 'company_address', 'company_industry', 'job_title', 'job_seniority', 'net_monthly_income'] },
        { title: 'Referencias', icon: Users, fields: ['friend_reference_name', 'friend_reference_phone', 'friend_reference_relationship', 'family_reference_name', 'family_reference_phone', 'parentesco'] },
        { title: 'Consentimiento', icon: PenSquare, fields: ['terms_and_conditions'] },
        { title: 'Resumen', icon: CheckCircle, fields: [] },
    ];

    const handleNext = async () => {
      console.log('handleNext called:', { currentStep, applicationId, hasFields: steps[currentStep].fields.length > 0 });

      // If there are no fields to validate (like Documents or Summary steps), just move forward
      if (steps[currentStep].fields.length === 0) {
        if (applicationId) {
          try {
            // Get current form values and clean them (remove undefined values)
            const formValues = getValues();
            const cleanValues = Object.fromEntries(
              Object.entries(formValues).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );

            await ApplicationService.saveApplicationDraft(applicationId, { application_data: cleanValues });
            if(currentStep < steps.length - 1) setCurrentStep(s => s + 1);
          } catch (e: any) {
            console.error("Error saving application draft:", e);
            console.error("Error details:", e?.message, e?.code, e?.details);
            alert("Hubo un problema al guardar tu progreso. Por favor, intenta de nuevo.");
          }
        } else {
          console.error('No applicationId available');
          alert("No se pudo guardar el progreso. Por favor, recarga la página.");
        }
        return;
      }

      // Validate step fields
      const isValidStep = await trigger(steps[currentStep].fields as any);
      console.log('Validation result:', isValidStep, 'Errors:', errors);

      if (!isValidStep) {
        // Show which fields have errors
        const stepErrors = steps[currentStep].fields.filter(field => errors[field as keyof typeof errors]);
        console.error('Validation failed for fields:', stepErrors);
        alert(`Por favor, completa todos los campos requeridos antes de continuar.`);
        return;
      }

      if (!applicationId) {
        console.error('No applicationId available');
        alert("No se pudo guardar el progreso. Por favor, recarga la página.");
        return;
      }

      // Save and proceed
      try {
        // Get current form values and clean them (remove undefined values)
        const formValues = getValues();
        const cleanValues = Object.fromEntries(
          Object.entries(formValues).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        await ApplicationService.saveApplicationDraft(applicationId, { application_data: cleanValues });

        // Track step completion
        conversionTracking.trackApplication.stepCompleted(currentStep + 1, steps[currentStep].title, {
          applicationId: applicationId,
          vehicleId: vehicleInfo?._ordenCompra || undefined
        });

        if(currentStep < steps.length - 1) setCurrentStep(s => s + 1);
      } catch (e: any) {
        console.error("Error saving application draft:", e);
        console.error("Error details:", e?.message, e?.code, e?.details);
        alert("Hubo un problema al guardar tu progreso. Por favor, intenta de nuevo.");
      }
    };

    const handlePrev = () => { if(currentStep > 0) setCurrentStep(s => s - 1); };

    // Documents are optional - users can upload later from dashboard
    // Validation function kept for potential future use but not enforced
    const validateDocuments = useCallback(() => {
        // Document validation is disabled - users can submit without uploading documents
        return null;
    }, []);


    const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
        setSubmissionError(null);

        if (!applicationId || !user || !profile || !recommendedBank) {
            setSubmissionError("Faltan datos esenciales para completar tu solicitud. Por favor, recarga la página. Si el problema persiste, contacta con nuestro equipo de soporte.");
            return;
        }

        // Validate vehicleInfo with comprehensive null checks
        if (!vehicleInfo || !vehicleInfo._ordenCompra) {
            setSubmissionError("Aún no has seleccionado un auto para tu solicitud de financiamiento. Por favor, selecciona el auto que te interesa para continuar.");
            setShowVehicleSelector(true);
            return;
        }

        // Validate that spouse is not used as a reference
        if (profile?.spouse_name) {
            const normalizeName = (name: string) => {
                if (!name) return '';
                return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            };

            const normalizedSpouse = normalizeName(profile.spouse_name);
            const normalizedFriend = normalizeName(data.friend_reference_name || '');
            const normalizedFamily = normalizeName(data.family_reference_name || '');

            if (normalizedSpouse && (normalizedSpouse === normalizedFriend || normalizedSpouse === normalizedFamily)) {
                setSubmissionError("Tu cónyuge no puede ser utilizado como referencia personal. Por favor, proporciona referencias diferentes en el paso de Referencias Personales.");
                setCurrentStep(2); // Go back to references step
                return;
            }
        }

        // Documents are optional - users can upload later from dashboard
        // const docValidationError = validateDocuments();
        // if (docValidationError) {
        //     setSubmissionError(docValidationError);
        //     setCurrentStep(3); // Go back to documents step
        //     return;
        // }

        try {
            // Re-check for active applications right before submission to prevent race conditions
            const currentApp = await ApplicationService.getApplicationById(user.id, applicationId);
            const isFirstSubmit = currentApp?.status === 'draft'; // Track if this is the first submission

            if (!currentApp || currentApp.status !== 'draft') {
                // If this application is no longer a draft, check if there's another active application
                const hasActiveApp = await ApplicationService.hasActiveApplication(user.id);
                if (hasActiveApp) {
                    setSubmissionError('Ya cuentas con una solicitud activa en proceso. Por el momento, solo puedes tener una solicitud a la vez. Puedes revisar el estado de tu solicitud actual desde tu panel de control.');
                    setPageStatus('active_application_exists');
                    return;
                }
            }

            // Update profile with address information from application form
            await ProfileService.updateProfile({
                id: user.id,
                address: data.current_address,
                colony: data.current_colony,
                city: data.current_city,
                state: data.current_state,
                zip_code: data.current_zip_code,
            }, user.id);

            const payload = {
                personal_info_snapshot: profile,
                car_info: vehicleInfo,
                application_data: data,
                selected_banks: [recommendedBank],
            };

            const updatedApp = await ApplicationService.updateApplication(applicationId, payload);

            // Send email notifications (non-blocking)
            const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            const clientEmail = profile.email || '';
            const vehicleTitle = vehicleInfo?._vehicleTitle || null;

            // Send notification to client
            if (clientEmail) {
                BrevoEmailService.notifyApplicationSubmitted(
                    clientEmail,
                    clientName,
                    vehicleTitle,
                    applicationId
                ).catch(err => console.error('[Application] Error sending client email:', err));
            }

            // Get advisor info if assigned
            let advisorEmail: string | null = null;
            let advisorName: string | null = null;
            if (profile.asesor_asignado_id) {
                const { data: advisor } = await supabase
                    .from('profiles')
                    .select('email, first_name, last_name')
                    .eq('id', profile.asesor_asignado_id)
                    .maybeSingle();

                if (advisor) {
                    advisorEmail = advisor.email;
                    advisorName = `${advisor.first_name || ''} ${advisor.last_name || ''}`.trim();
                }
            }

            // Send notification to admins
            BrevoEmailService.notifyAdminsNewApplication(
                clientName,
                clientEmail,
                profile.phone ?? null,
                vehicleTitle,
                user.id, // Using user.id for the client profile URL
                advisorName
            ).catch(err => console.error('[Application] Error sending admin emails:', err));

            // Send notification to assigned advisor if exists
            if (advisorEmail && advisorName) {
                BrevoEmailService.notifySalesAdvisor(
                    advisorEmail,
                    advisorName,
                    clientName,
                    clientEmail,
                    profile.phone ?? null,
                    vehicleTitle,
                    user.id
                ).catch(err => console.error('[Application] Error sending advisor email:', err));
            }

            // Send survey invitation email if user consented
            if (data.consent_survey && clientEmail) {
                BrevoEmailService.sendSurveyInvitation(
                    clientEmail,
                    clientName,
                    user.id
                ).catch(err => console.error('[Application] Error sending survey invitation:', err));
            }

            // Track application submission (with safe null checks)
            conversionTracking.trackApplication.submitted({
                applicationId: applicationId,
                vehicleId: vehicleInfo?._ordenCompra || '',
                vehicleName: vehicleTitle || undefined,
                vehiclePrice: vehicleInfo?._precioNumerico || vehicleInfo?.precio || 0,
                recommendedBank: recommendedBank,
                userId: user.id
            });

            // Redirect based on whether this is first submit or an edit
            if (isFirstSubmit) {
                // First submission: go to confirmation page
                router.replace(`/escritorio/aplicacion/${applicationId}/confirmacion?firstSubmit=true`);
            } else {
                // Edit/resubmission: go to seguimiento page
                router.replace(`/escritorio/seguimiento/${applicationId}`);
            }

        } catch(e: any) {
            // Check if error is due to duplicate application
            if (e.message?.includes('Ya tienes una solicitud activa')) {
                setPageStatus('active_application_exists');
            }
            setSubmissionError(e.message || "No pudimos enviar tu solicitud de financiamiento. Por favor, verifica que todos los campos estén completos correctamente y vuelve a intentarlo. Si el problema persiste, contacta con nuestro equipo de soporte.");
        }
    };

    const StatusDisplay: React.FC<{ icon: React.ElementType, title: string, message: string, linkTo: string, linkText: string }> = ({ icon: Icon, title, message, linkTo, linkText }) => {
        // Usar la utilidad para preservar todos los parametros de tracking
        const buildRedirectUrl = () => {
            if (linkTo !== '/escritorio/profile' && linkTo !== '/escritorio/perfilacion-bancaria') {
                return linkTo;
            }

            // Obtener ordencompra de la URL o sessionStorage
            const ordenCompra = searchParams?.get('ordencompra') || sessionStorage.getItem('pendingOrdenCompra');

            return buildUrlWithTracking(linkTo, searchParams, {
                returnTo: '/escritorio/aplicacion',
                ...(ordenCompra ? { ordencompra: ordenCompra } : {})
            });
        };

        const finalLinkTo = buildRedirectUrl();

        return (
            <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-xl shadow-sm border border-yellow-300">
                <Icon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-2">{message}</p>
                <Link href={finalLinkTo} className="mt-6 inline-block bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-700">{linkText}</Link>
            </div>
        );
    };

    const isSubmitDisabled = form.formState.isSubmitting || !isValid;

    const renderPageContent = () => {
        switch(pageStatus) {
            case 'loading':
            case 'checking_profile':
                return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
            case 'profile_incomplete':
                return <StatusDisplay icon={User} title="¡Casi listo para empezar!" message="Por favor completa la informacion de tu perfil para comenzar una solicitud de financiamiento." linkTo="/escritorio/profile" linkText="Ir a mi perfil" />;
            case 'bank_profile_incomplete':
                return <StatusDisplay icon={Building2} title="Completa tu Perfil Bancario" message="Tu perfil personal está completo. El siguiente paso es el perfilamiento bancario para encontrar la mejor opción para ti." linkTo="/escritorio/perfilacion-bancaria" linkText="Ir a Perfilamiento Bancario" />;
            case 'active_application_exists':
                 return <StatusDisplay icon={AlertTriangle} title="Solicitud en Proceso" message="Ya tienes una solicitud activa. Solo puedes tener una a la vez. Puedes ver el estado de tu solicitud actual o contactar a tu asesor." linkTo="/escritorio/seguimiento" linkText="Ver Mis Solicitudes" />;
            case 'error':
                 return <StatusDisplay icon={Info} title="Ocurrió un Error" message={pageError || 'Error desconocido'} linkTo="/escritorio" linkText="Volver al Escritorio" />;
            case 'success':
                 return (
                     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                         <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
                             {/* Success Header */}
                             <div className="text-center mb-6">
                                 <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                     <CheckCircle className="w-12 h-12 text-green-600" />
                                 </div>
                                 <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                     ¡Solicitud Enviada!
                                 </h1>
                                 <p className="text-base text-gray-600 max-w-md mx-auto">
                                     Tu solicitud está en revisión. Te notificaremos por email y WhatsApp.
                                 </p>
                             </div>

                             {/* Vehicle Info (if selected) */}
                             {vehicleInfo?._vehicleTitle && (
                                 <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                                     <p className="text-xs text-gray-500 mb-2">Auto de Interés</p>
                                     <div className="flex items-center gap-3">
                                         <img src={vehicleInfo._featureImage} alt={vehicleInfo._vehicleTitle} className="w-20 h-14 object-cover rounded flex-shrink-0" />
                                         <h3 className="text-sm font-bold text-gray-900">{vehicleInfo._vehicleTitle}</h3>
                                     </div>
                                 </div>
                             )}

                             {/* Important Notice */}
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                 <p className="text-sm text-blue-900">
                                     <strong>Próximo Paso:</strong> Revisaremos tu solicitud y documentos. Una vez aprobado tu crédito, podrás separar el auto de tu preferencia.
                                 </p>
                             </div>

                             {/* Action Buttons */}
                             <div className="space-y-3 mb-6">
                                 <Link
                                     href="/escritorio/seguimiento"
                                     className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
                                 >
                                     Ver Estado de Solicitud
                                     <ArrowRight className="w-4 h-4" />
                                 </Link>
                                 <button
                                     disabled
                                     className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                                     title="Disponible después de la aprobación"
                                 >
                                     Separar Auto
                                     <span className="text-xs">(Disponible al aprobar)</span>
                                 </button>
                             </div>

                             {/* Secondary Actions */}
                             <div className="pt-4 border-t border-gray-200 text-center">
                                 <Link
                                     href="/explorar"
                                     className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                                 >
                                     Explorar Más Autos →
                                 </Link>
                             </div>
                         </div>
                     </div>
                 );
            case 'ready':
                return (
                    <>
                        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
                            <VehicleSelector isOpen={showVehicleSelector} onClose={() => setShowVehicleSelector(false)} onSelect={handleVehicleSelect} />
                        </Suspense>
                        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 text-gray-900">

                            {vehicleInfo?._vehicleTitle ? (
                                <Card className="mb-6 lg:mb-8">
                                    <CardContent className="p-4 lg:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
                                                <img src={vehicleInfo._featureImage} alt={vehicleInfo._vehicleTitle} className="w-20 h-14 lg:w-24 lg:h-16 object-cover rounded-md flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs lg:text-sm text-muted-foreground">Solicitud de financiamiento para:</p>
                                                    <h1 className="text-base lg:text-lg font-bold text-foreground truncate">{vehicleInfo._vehicleTitle}</h1>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => setShowVehicleSelector(true)} className="flex items-center justify-center gap-2 flex-shrink-0 w-full sm:w-auto">
                                                <Edit className="w-4 h-4" />
                                                Cambiar Auto
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                !showVehicleSelector && (
                                    <Card className="mb-6 lg:mb-8 bg-yellow-50 border-yellow-200">
                                        <CardContent className="p-4 lg:p-6 text-center">
                                            <h1 className="text-base lg:text-lg font-bold text-yellow-800">No has seleccionado un auto</h1>
                                            <p className="text-sm text-yellow-700 mt-1 mb-4">Tu solicitud se guardará como un borrador general.</p>
                                            <Button onClick={() => setShowVehicleSelector(true)} className="w-full sm:w-auto">
                                                Seleccionar Auto
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            )}

                            <div className="mb-6 lg:mb-10">
                                <StepIndicator steps={steps} currentStep={currentStep} />
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <input type="hidden" {...form.register('ordencompra')} />
                                <Card>
                                    <CardContent className="p-4 sm:p-6">
                                        {currentStep === 0 && <PersonalInfoStep control={control} errors={errors} isMarried={isMarried} profile={profile} setValue={setValue} trigger={trigger} />}
                                        {currentStep === 1 && <EmploymentStep control={control} errors={errors} setValue={setValue} />}
                                        {currentStep === 2 && <ReferencesStep control={control} errors={errors} profile={profile} getValues={getValues} />}
                                        {currentStep === 3 && <ConsentStep control={control} errors={errors} setValue={setValue}/>}
                                        {currentStep === 4 && (
                                            <>
                                                <FinancingPreferencesSection control={control} vehicleInfo={vehicleInfo} setValue={setValue} getValues={getValues} />
                                                <SummaryStep applicationData={getValues()} profile={profile} vehicleInfo={vehicleInfo} bank={recommendedBank} />
                                                {submissionError && (
                                                    <div className="mt-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-center">
                                                        <p className="font-semibold">Error al Enviar</p>
                                                        <p className="text-sm mt-1">{submissionError}</p>
                                                        {submissionError.includes("vehículo") && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => setShowVehicleSelector(true)}
                                                                className="mt-3"
                                                            >
                                                                Seleccionar Auto
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {isSubmitDisabled && !form.formState.isSubmitting && currentStep === 5 && (
                                    <MissingFields errors={form.formState.errors} />
                                )}

                                {/* Mobile: Go back button at top */}
                                <div className="lg:hidden mb-6">
                                    <Button type="button" onClick={handlePrev} disabled={currentStep === 0} variant="secondary" size="sm" className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                                    </Button>
                                </div>

                                {/* Desktop navigation */}
                                <div className="hidden lg:flex justify-between items-center gap-4 mt-8">
                                    <Button type="button" onClick={handlePrev} disabled={currentStep === 0} variant="secondary" size="lg">
                                        <ArrowLeft className="w-4 h-4" /> Anterior
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => router.push('/escritorio')}
                                            variant="outline"
                                            size="lg"
                                        >
                                            Guardar y continuar después
                                        </Button>
                                        {currentStep < steps.length - 1 ? (
                                            <Button type="button" onClick={handleNext} size="lg" className="text-white">
                                                Siguiente <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button type="submit" disabled={isSubmitDisabled} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                                                {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile: Action buttons at bottom */}
                                <div className="lg:hidden mt-6 space-y-3">
                                    <Button
                                        type="button"
                                        onClick={() => router.push('/escritorio')}
                                        variant="outline"
                                        size="lg"
                                        className="w-full"
                                    >
                                        Guardar y continuar después
                                    </Button>
                                    {currentStep < steps.length - 1 ? (
                                        <Button type="button" onClick={handleNext} size="lg" className="w-full text-white">
                                            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitDisabled} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                                            {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </>
                );
        }
    }

    return <div className="min-h-[50vh] flex items-center justify-center">{renderPageContent()}</div>;
};

// --- HELPER: Missing Fields Component ---
const MissingFields: React.FC<{ errors: any }> = ({ errors }) => {
    const errorMessages: string[] = [];

    // Extract error messages from nested error objects
    const extractErrors = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object') {
                if (value.message) {
                    errorMessages.push(value.message);
                } else {
                    extractErrors(value, key);
                }
            }
        });
    };

    extractErrors(errors);

    if (errorMessages.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 text-center text-sm text-red-600 p-3 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="font-bold mb-2">Por favor, corrige los siguientes errores:</p>
            <ul className="list-disc list-inside text-left max-w-2xl mx-auto">
                {errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
        </div>
    );
};

// --- STEP COMPONENTS ---

const CELLPHONE_COMPANIES = [
    'Telcel',
    'AT&T',
    'Movistar',
    'Virgin Mobile',
    'Unefon',
    'Weex',
    'Otro'
];

// Utility function to normalize names to proper case (Title Case)
const normalizeNameToTitleCase = (name: string): string => {
    if (!name) return '';

    // List of Spanish prepositions and articles that should stay lowercase
    const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];

    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            // First word should always be capitalized
            if (index === 0) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            // Check if word should stay lowercase
            if (lowercaseWords.includes(word)) {
                return word;
            }
            // Capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

const PersonalInfoStep: React.FC<{ control: any, errors: any, isMarried: boolean, profile: Profile | null, setValue: any, trigger: any }> = ({ control, errors, isMarried, profile, setValue, trigger }) => {
    const [useDifferentAddress, setUseDifferentAddress] = useState(
        () => !(profile?.address && profile.address.length >= 5)
    );

    // Normalize profile names on mount
    useEffect(() => {
        if (profile) {
            // Normalize names in profile display (this won't update the profile, just for display)
            // The actual profile update would happen when they submit
        }
    }, [profile]);

    useEffect(() => {
        const profileAddressIsValid = profile?.address && profile.address.length >= 5;
        if (profileAddressIsValid && !useDifferentAddress) {
            // Set values with validation and mark as touched
            setValue('current_address', profile.address || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue('current_colony', profile.colony || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue('current_city', profile.city || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue('current_state', profile.state || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue('current_zip_code', profile.zip_code || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });

            // Explicitly trigger validation for the address fields to ensure form is valid
            setTimeout(() => {
                trigger(['current_address', 'current_colony', 'current_city', 'current_state', 'current_zip_code']);
            }, 0);
        }
    }, [profile, setValue, useDifferentAddress, trigger]);

    return (
    <div className="space-y-8">
        <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Información Personal</h2>
            <p className="text-sm sm:text-base text-gray-600">Confirma que tu información personal esté correcta y actualizada.</p>
        </div>

        {/* Profile Information Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Datos Personales Registrados
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-xs text-gray-500">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">
                        {normalizeNameToTitleCase(profile?.first_name || '')} {normalizeNameToTitleCase(profile?.last_name || '')} {normalizeNameToTitleCase(profile?.mother_last_name || '')}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">RFC</p>
                    <p className="font-semibold text-gray-900 font-mono">{profile?.rfc || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                    <p className="font-semibold text-gray-900">{profile?.birth_date || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-semibold text-gray-900">{profile?.phone || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Estado Civil</p>
                    <p className="font-semibold text-gray-900">{profile?.civil_status || 'N/A'}</p>
                </div>
                {profile?.spouse_name && (
                    <div>
                        <p className="text-xs text-gray-500">Nombre del Cónyuge</p>
                        <p className="font-semibold text-gray-900">{normalizeNameToTitleCase(profile.spouse_name)}</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                    Si necesitas actualizar esta información, puedes hacerlo desde tu <a href="/escritorio/profile" className="underline font-semibold">perfil</a>.
                </p>
            </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Domicilio Actual</h3>

            <div className="flex items-start space-x-3">
                <Checkbox
                    id="use_different_address_checkbox"
                    checked={useDifferentAddress}
                    onCheckedChange={(checked) => setUseDifferentAddress(checked === true)}
                />
                <div className="space-y-1 leading-none">
                    <Label htmlFor="use_different_address_checkbox">
                        Usar una dirección diferente a la de mi perfil
                    </Label>
                    <p className="text-xs text-muted-foreground">Esta debe ser la dirección de tu domicilio actual donde recibes correspondencia.</p>
                    {errors.current_address && useDifferentAddress && (
                        <p className="text-destructive text-xs">⚠️ Tu dirección parece incompleta. Por favor, revisa todos los campos.</p>
                    )}
                </div>
            </div>

            {useDifferentAddress ? (
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <FormInput control={control} name="current_address" label="Calle y Número" error={errors.current_address?.message} />
                    <FormInput control={control} name="current_colony" label="Colonia o Fraccionamiento" error={errors.current_colony?.message} />
                    <FormInput control={control} name="current_city" label="Ciudad o Municipio" error={errors.current_city?.message} />
                    <FormSelect control={control} name="current_state" label="Estado" options={MEXICAN_STATES} error={errors.current_state?.message} />
                    <FormInput control={control} name="current_zip_code" label="Código Postal" error={errors.current_zip_code?.message} />
                </div>
            ) : (
                <div className="pt-4 border-t bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Dirección registrada en tu perfil:</p>
                    <p className="text-sm font-semibold">
                        {profile?.address}, {profile?.colony}, {profile?.city}, {profile?.state} C.P. {profile?.zip_code}
                    </p>
                </div>
            )}
        </div>

        {/* Housing & Personal Info */}
        <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Información del Hogar</h3>

            <FormRadio
                control={control}
                name="time_at_address"
                label="Tiempo Viviendo en el Domicilio Actual"
                options={['Menos de 1 año', '1-2 años', '3-5 años', '6-10 años', 'Más de 10 años']}
                error={errors.time_at_address?.message}
            />

            <FormRadio
                control={control}
                name="housing_type"
                label="Tipo de Vivienda"
                options={['Propia', 'Rentada', 'Familiar']}
                error={errors.housing_type?.message}
            />

            <div>
                <FormRadio
                    control={control}
                    name="dependents"
                    label="Número de Dependientes Económicos"
                    options={['0', '1', '2', '3', '4+']}
                    error={errors.dependents?.message}
                />
            </div>

            <FormRadio
                control={control}
                name="grado_de_estudios"
                label="Nivel de Estudios"
                options={['Primaria', 'Secundaria', 'Preparatoria', 'Licenciatura', 'Posgrado']}
                error={errors.grado_de_estudios?.message}
            />
        </div>
    </div>
    )
};

const EmploymentStep: React.FC<{ control: any, errors: any, setValue: any }> = ({ control, errors }) => {
    const { field: incomeField } = useController({ name: 'net_monthly_income', control });

    const formatNumberWithCommas = (value: string): string => {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue === '') return '';
        const number = parseInt(numericValue, 10);
        return number.toLocaleString('es-MX');
    };

    const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatNumberWithCommas(e.target.value);
        incomeField.onChange(formattedValue);
    };

    const incomeDisplayValue = incomeField.value || '';

    return (
        <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Información Laboral</h2>
            <FormRadio control={control} name="fiscal_classification" label="Clasificación Fiscal" options={['Empleado del sector privado', 'Física con actividad empresarial', 'Empleado del sector público', 'Pensionado']} error={errors.fiscal_classification?.message} />
            <div className="grid md:grid-cols-2 gap-6">
                <FormInput control={control} name="company_name" label="Nombre de la Empresa" error={errors.company_name?.message} />
                <FormInput control={control} name="company_phone" label="Teléfono de la Empresa" error={errors.company_phone?.message} />
                <FormInput control={control} name="supervisor_name" label="Nombre del Jefe Inmediato" error={errors.supervisor_name?.message} />
                <FormInput control={control} name="company_website" label="Sitio Web (Opcional)" error={errors.company_website?.message} />
            </div>
            <FormInput control={control} name="company_address" label="Dirección de la Empresa" error={errors.company_address?.message} />
            <div className="grid md:grid-cols-2 gap-6">
                <FormInput control={control} name="company_industry" label="Sector o Industria" error={errors.company_industry?.message} />
                <FormInput control={control} name="job_title" label="Nombre de tu Puesto" error={errors.job_title?.message} />
                <FormRadio control={control} name="job_seniority" label="Antigüedad en el Puesto" options={['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años']} error={errors.job_seniority?.message} />

                <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Ingreso Mensual Neto</Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-semibold text-base sm:text-lg">$</span>
                        <Input
                            value={incomeDisplayValue}
                            onChange={handleIncomeChange}
                            placeholder="25,000"
                            className="pl-7 sm:pl-8 font-semibold min-h-[44px] sm:min-h-[48px] text-base"
                            inputMode="numeric"
                        />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ingresa tu salario bruto mensual (antes de impuestos)</p>
                    {errors.net_monthly_income && <p className="text-destructive text-sm sm:text-base">{errors.net_monthly_income.message}</p>}
                </div>
            </div>
        </div>
    );
};

const FAMILY_RELATIONSHIPS = [
    'Hijo/Hija',
    'Primo/Prima',
    'Madre',
    'Padre',
    'Hermano/Hermana',
    'Tía/Tío',
    'Sobrino/Sobrina',
    'Abuelo/Abuela',
    'Nieto/Nieta'
];

const FRIEND_RELATIONSHIPS = [
    'Amistad',
    'Laboral',
    'Familia Política'
];

const ReferencesStep: React.FC<{ control: any, errors: any, profile: Profile | null, getValues: any }> = ({ control, errors, profile, getValues }) => {
    const [spouseWarning, setSpouseWarning] = useState<string | null>(null);

    // Function to normalize names for comparison (remove accents, lowercase, trim)
    const normalizeName = (name: string) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove accents
    };

    // Check if a reference name matches the spouse name
    const checkSpouseReference = useCallback(() => {
        const spouseName = profile?.spouse_name || '';
        if (!spouseName) return; // Not married or no spouse name

        const friendRefName = getValues('friend_reference_name') || '';
        const familyRefName = getValues('family_reference_name') || '';

        const normalizedSpouse = normalizeName(spouseName);
        const normalizedFriend = normalizeName(friendRefName);
        const normalizedFamily = normalizeName(familyRefName);

        if (normalizedSpouse && normalizedFriend && normalizedSpouse === normalizedFriend) {
            setSpouseWarning('Tu cónyuge no puede ser usado como referencia de amistad.');
            return;
        }

        if (normalizedSpouse && normalizedFamily && normalizedSpouse === normalizedFamily) {
            setSpouseWarning('Tu cónyuge no puede ser usado como referencia familiar.');
            return;
        }

        setSpouseWarning(null);
    }, [profile, getValues]);

    // Check on component mount and when names change
    useEffect(() => {
        checkSpouseReference();
    }, [checkSpouseReference]);

    return (
        <div className="space-y-8">
            {profile?.spouse_name && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm sm:text-base text-blue-800">
                        <strong>Importante:</strong> Tu cónyuge ({profile.spouse_name}) no puede ser usado como referencia familiar o de amistad.
                    </p>
                </div>
            )}

            {spouseWarning && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm sm:text-base text-red-800 font-semibold">
                        ⚠️ {spouseWarning}
                    </p>
                </div>
            )}

            <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Referencia de Amistad</h2>
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                    <FormInput control={control} name="friend_reference_name" label="Nombre Completo" error={errors.friend_reference_name?.message} />
                    <FormInput control={control} name="friend_reference_phone" label="Teléfono" error={errors.friend_reference_phone?.message} />
                    <FormSelect control={control} name="friend_reference_relationship" label="Relación" options={FRIEND_RELATIONSHIPS} error={errors.friend_reference_relationship?.message} />
                </div>
            </div>
            <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Referencia Familiar</h2>
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                    <FormInput control={control} name="family_reference_name" label="Nombre Completo" error={errors.family_reference_name?.message} />
                    <FormInput control={control} name="family_reference_phone" label="Teléfono" error={errors.family_reference_phone?.message} />
                    <FormSelect control={control} name="parentesco" label="Parentesco" options={FAMILY_RELATIONSHIPS} error={errors.parentesco?.message} />
                </div>
            </div>
        </div>
    );
};

const DocumentRequirements: React.FC = () => (
    <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Declaraciones</h3>
        <p className="text-xs text-gray-600 mb-4">Confirmo que mis documentos cumplen con los siguientes requisitos:</p>
        <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Mi INE es legible, nítida, sin reflejos y muestra las cuatro esquinas en ambos lados.</span>
            </li>
            <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Mi comprobante de domicilio es legible, está en PDF y coincide con los datos de mi solicitud.</span>
            </li>
            <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Subí 3 comprobantes de ingresos de los últimos 3 meses (3 archivos PDF distintos o 1 archivo ZIP).</span>
            </li>
        </ul>
    </div>
);

const declarations = [
    "Confirmo que la información que he proporcionado es correcta y completa.",
    "Autorizo a TREFA a compartir mi solicitud con las instituciones financieras necesarias para encontrar la mejor opción de crédito para mí.",
    "Entiendo que se consultará mi historial crediticio para evaluar mi solicitud.",
    "Acepto que TREFA me contacte por los medios proporcionados para dar seguimiento a mi solicitud.",
    "He leído y acepto el Aviso de Privacidad de TREFA.",
    "Comprendo que el envío de esta solicitud no garantiza la aprobación del crédito, la cual depende del análisis de la institución financiera.",
    "Confirmo que soy mayor de edad y tengo capacidad legal para realizar esta solicitud."
];

const ConsentStep: React.FC<{ control: any, errors: any, setValue: any }> = ({ control, errors}) => (
    <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Declaraciones Finales</h2>
        <p className="text-sm sm:text-base text-gray-600">Al continuar, expreso y certifico haber leído, aceptado o estar de acuerdo con cada una de las siguientes cláusulas:</p>
        <ul className="space-y-3 list-disc list-inside text-gray-700 text-sm sm:text-base pl-4">
            {declarations.map((declaration, index) => (
                <li key={index}>{declaration}</li>
            ))}
        </ul>
        <hr className="my-6"/>
        <FormCheckbox
            control={control}
            name="terms_and_conditions"
            label="He leído y estoy de acuerdo con los términos y condiciones"
            error={errors.terms_and_conditions?.message}
        />
        <hr className="my-6"/>
        <FormCheckbox
            control={control}
            name="consent_survey"
            label="Sí, me gustaría recibir un cupón promocional a cambio de responder una breve encuesta por correo electrónico después de enviar mi solicitud."
        />
    </div>
);

const SummaryStep: React.FC<{ applicationData: any, profile: Profile | null, vehicleInfo: any, bank: string | null }> = ({ applicationData, profile, vehicleInfo, bank }) => {
    // Use application address if provided, otherwise fallback to profile address
    const address = applicationData.current_address || profile?.address || '';
    const colony = applicationData.current_colony || profile?.colony || '';
    const city = applicationData.current_city || profile?.city || '';
    const state = applicationData.current_state || profile?.state || '';
    const zipCode = applicationData.current_zip_code || profile?.zip_code || '';

    const fullAddress = [address, colony, city, state, zipCode ? `C.P. ${zipCode}` : '']
        .filter(part => part && part.trim())
        .join(', ');

    return (
        <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center">Revisa y Envía tu Solicitud</h2>

            {/* Compact vehicle info banner */}
            <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-center gap-4">
                    {vehicleInfo?._featureImage && (
                        <img src={vehicleInfo._featureImage} alt={vehicleInfo._vehicleTitle} className="w-24 h-16 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">Auto Seleccionado</p>
                        <p className="font-semibold text-primary-700 truncate">{vehicleInfo?._vehicleTitle}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">Banco Recomendado</p>
                        <p className="font-semibold text-primary-700">{bank || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Compact summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummarySection title="Datos Personales" icon={User}>
                    <ReviewItem label="Nombre" value={`${profile?.first_name || ''} ${profile?.last_name || ''} ${profile?.mother_last_name || ''}`} />
                    <ReviewItem label="RFC" value={profile?.rfc} />
                    <ReviewItem label="Teléfono" value={profile?.phone} />
                    <ReviewItem label="Dirección" value={fullAddress} />
                </SummarySection>

                <SummarySection title="Datos Laborales" icon={Building2}>
                    <ReviewItem label="Empresa" value={applicationData.company_name} />
                    <ReviewItem label="Puesto" value={applicationData.job_title} />
                    <ReviewItem label="Ingreso Bruto" value={applicationData.net_monthly_income} />
                    <ReviewItem label="Antigüedad" value={applicationData.job_seniority} />
                </SummarySection>
            </div>
        </div>
    );
};


// --- FORM HELPER COMPONENTS ---

const FormInput: React.FC<{control: any, name: any, label: string, error?: string}> = ({ control, name, label, error }) => (
    <Controller name={name} control={control} render={({ field }) => (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-sm sm:text-base">{label}</Label>
            <Input id={name} {...field} className="min-h-[44px] sm:min-h-[48px] text-base" />
            {error && <p className="text-destructive text-sm sm:text-base">{error}</p>}
        </div>
    )} />
);
const FormSelect: React.FC<{ control: any, name: any, label: string, options: string[], error?: string }> = ({ control, name, label, options, error }) => (
    <Controller name={name} control={control} render={({ field }) => (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-sm sm:text-base">{label}</Label>
            <select id={name} {...field} className="flex h-12 sm:h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] sm:min-h-[48px]">
                <option value="">Seleccionar...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {error && <p className="text-destructive text-sm sm:text-base">{error}</p>}
        </div>
    )} />
);
const FormRadio: React.FC<{control: any, name: any, label: string, options: string[], error?: string}> = ({ control, name, label, options, error }) => (
    <Controller name={name} control={control} render={({ field }) => (
        <div className="space-y-2">
            <Label className="text-sm sm:text-base">{label}</Label>
            <div className="flex flex-wrap gap-2 lg:gap-3">
                {options.map(opt => (
                    <button type="button" key={opt} onClick={() => field.onChange(opt)} className={`px-4 py-3 sm:px-5 sm:py-3 lg:px-4 lg:py-2 text-sm sm:text-base lg:text-sm font-semibold rounded-full border-2 transition-colors min-h-[44px] touch-manipulation ${field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'}`}>{opt}</button>
                ))}
            </div>
            {error && <p className="text-destructive text-sm sm:text-base">{error}</p>}
        </div>
    )} />
);
const FormCheckbox: React.FC<{ control: any, name: any, label: string, error?: string, onChange?: (e: any) => void, checked?: boolean, disabled?: boolean }> = ({ control, name, label, error, onChange, checked, disabled }) => (
    <Controller name={name} control={control} render={({ field }) => (
        <div className="flex items-start space-x-3 min-h-[44px] touch-manipulation">
            <Checkbox
                id={name}
                checked={checked ?? (field.value || false)}
                onCheckedChange={onChange ?? field.onChange}
                disabled={disabled}
                className="mt-1 min-w-[20px] min-h-[20px]"
            />
            <div className="space-y-1 leading-none flex-1">
                <Label htmlFor={name} className={`text-sm sm:text-base cursor-pointer ${disabled ? 'text-muted-foreground' : ''}`}>{label}{error && <span className="text-destructive">*</span>}</Label>
                {error && <p className="text-destructive text-sm sm:text-base">{error}</p>}
            </div>
        </div>
    )} />
);
const ReviewItem: React.FC<{label: string, value: any, isLarge?: boolean}> = ({label, value, isLarge}) => (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
        <p className={` ${isLarge ? 'text-sm' : 'text-xs'} text-gray-500`}>{label}</p>
        <p className={`font-semibold ${isLarge ? 'text-lg text-primary-600' : 'text-base text-gray-800'}`}>{value || 'N/A'}</p>
    </div>
);
const SummarySection: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode}> = ({title, icon: Icon, children}) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center"><Icon className="w-4 h-4 mr-2 text-primary-600" />{title}</h3>
        <div className="space-y-1">{children}</div>
    </div>
);

// --- FINANCING PREFERENCES SECTION ---
const FinancingPreferencesSection: React.FC<{ control: any; vehicleInfo: any; setValue: any; getValues: any }> = ({ control, vehicleInfo, setValue, getValues }) => {
    const [loanTerm, setLoanTerm] = useState(60);
    const [downPaymentRaw, setDownPaymentRaw] = useState('');

    // Get vehicle pricing and financing info from API
    const vehiclePrice = vehicleInfo?.precio || vehicleInfo?._precio || 0;
    // Use API values if available, otherwise calculate defaults
    const minDownPayment = vehicleInfo?.enganchemin || vehicleInfo?._enganchemin || Math.round(vehiclePrice * 0.25); // From API or 25% default
    const recommendedDownPayment = vehicleInfo?.enganche_recomendado || vehicleInfo?._enganche_recomendado || Math.round(vehiclePrice * 0.40); // From API or 40% default
    const maxTerm = vehicleInfo?.plazomax || 60;

    // Format number with thousands separator
    const formatNumber = (value: number | string): string => {
        const numStr = String(value).replace(/[^0-9]/g, '');
        if (!numStr) return '';
        return parseInt(numStr, 10).toLocaleString('es-MX');
    };

    // Parse formatted string back to number
    const parseFormattedNumber = (formatted: string): number => {
        const numStr = formatted.replace(/[^0-9]/g, '');
        return numStr ? parseInt(numStr, 10) : 0;
    };

    // Initialize down payment with MINIMUM value (25% or API value) and term with vehicle's max
    useEffect(() => {
        if (minDownPayment > 0 && !downPaymentRaw) {
            setDownPaymentRaw(formatNumber(minDownPayment));
            setValue('down_payment_amount', minDownPayment);
        }
        // Set initial loan term to vehicle's max term (capped at 60)
        const initialTerm = Math.min(maxTerm, 60);
        if (loanTerm !== initialTerm) {
            setLoanTerm(initialTerm);
        }
    }, [minDownPayment, downPaymentRaw, setValue, maxTerm]);

    // Update form value when term or down payment changes
    useEffect(() => {
        const downPaymentValue = parseFormattedNumber(downPaymentRaw);
        setValue('loan_term_months', loanTerm);
        setValue('down_payment_amount', downPaymentValue);
    }, [loanTerm, downPaymentRaw, setValue]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
    };

    // Filter term options based on vehicle's plazomax (max 60 months)
    const allTermOptions = [12, 24, 36, 48, 60];
    const termOptions = allTermOptions.filter(term => term <= maxTerm);

    if (!vehiclePrice || vehiclePrice === 0) {
        console.warn('[FinancingPreferencesSection] Vehicle price missing or zero:', { vehicleInfo, vehiclePrice });
        return (
            <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <div>
                        <p className="font-semibold text-yellow-900">Información del Auto Faltante</p>
                        <p className="text-sm text-yellow-800 mt-1">
                            No pudimos cargar el precio del auto. Por favor, regresa al inicio y selecciona tu auto nuevamente.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 space-y-6">
            <div className="pb-4 border-b">
                <h2 className="text-xl font-semibold text-center flex items-center justify-center gap-2">
                    <DollarSign className="w-6 h-6 text-primary-600" />
                    Preferencias de Financiamiento
                </h2>
                <p className="text-sm text-gray-600 text-center mt-2">
                    Selecciona el plazo y enganche para calcular tu mensualidad aproximada
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Loan Term Selection */}
                <div className="space-y-3">
                    <Label>Plazo del Crédito (meses)</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {termOptions.map(term => (
                            <Button
                                key={term}
                                type="button"
                                variant={loanTerm === term ? "default" : "outline"}
                                onClick={() => setLoanTerm(term)}
                                className="py-3"
                            >
                                {term}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Down Payment Input with Real-time Currency Formatting */}
                <div className="space-y-2">
                    <Label>Enganche</Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input
                            type="text"
                            value={downPaymentRaw}
                            onChange={(e) => {
                                const formatted = formatNumber(e.target.value);
                                setDownPaymentRaw(formatted);
                            }}
                            placeholder="0"
                            className="pl-7"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDownPaymentRaw(formatNumber(recommendedDownPayment))}
                            className="flex-1 text-xs"
                        >
                            Usar Recomendado (40%): {formatCurrency(recommendedDownPayment)}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Mínimo permitido: {formatCurrency(minDownPayment)} (25%)
                    </p>
                </div>
            </div>

            {/* Summary Display */}
            <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-6 border-2 border-primary-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-600">Precio del Auto</p>
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(vehiclePrice)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">Enganche</p>
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(parseFormattedNumber(downPaymentRaw))}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">Monto a Financiar</p>
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(vehiclePrice - parseFormattedNumber(downPaymentRaw))}</p>
                    </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                    *La mensualidad final será determinada por el banco.
                </p>
            </div>
        </div>
    );
};

export default Application;
