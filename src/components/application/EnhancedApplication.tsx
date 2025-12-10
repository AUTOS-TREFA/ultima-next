'use client';

import React, { useState, useEffect } from 'react';
import * as Stepperize from '@stepperize/react';
import {
  User, Building2, Users, PenSquare, CheckCircle,
  FileText, Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useVehicles } from '../../context/VehicleContext';
import { WordPressVehicle } from '../../types/types';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ApplicationService } from '../../services/ApplicationService';
import { BankProfilingService } from '../../services/BankProfilingService';
import { ProfileService } from '../../services/profileService';
import VehicleService from '../../services/VehicleService';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../utils/constants';
import { getVehicleImage } from '../../utils/getVehicleImage';
import { BrevoEmailService } from '../../services/BrevoEmailService';
import { supabase } from '../../../supabaseClient';
import { conversionTracking } from '../../services/ConversionTrackingService';

// Import step components
import VehicleFinancingStep from './steps/VehicleFinancingStep';
import PersonalInfoStepSimplified from './steps/PersonalInfoStepSimplified';
import EmploymentStep from './steps/EmploymentStep';
import AdditionalDetailsStep from './steps/AdditionalDetailsStep';
import ReferencesStep from './steps/ReferencesStep';
import ConsentStep from './steps/ConsentStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import CompletedStep from './steps/CompletedStep';

// Mexican states for address
const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos',
  'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// Validation schema
const baseApplicationSchema = z.object({
  // Step 1: Personal Info & Address
  current_address: z.string().optional(),
  current_colony: z.string().optional(),
  current_city: z.string().optional(),
  current_state: z.string().optional(),
  current_zip_code: z.string().optional(),
  time_at_address: z.string().min(1, 'Por favor, indica cuánto tiempo llevas viviendo en tu domicilio actual'),
  housing_type: z.string().min(1, 'Por favor, selecciona el tipo de vivienda donde resides'),
  grado_de_estudios: z.string().min(1, 'Por favor, selecciona tu grado de estudios'),
  dependents: z.string().min(1, 'Por favor, indica el número de dependientes económicos que tienes'),

  // Step 2: Employment Info
  fiscal_classification: z.string().min(1, "Por favor, selecciona tu clasificación fiscal"),
  company_name: z.string().min(2, "Por favor, ingresa el nombre completo de tu empresa"),
  company_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono de empresa válido de 10 dígitos")),
  supervisor_name: z.string().min(2, "Por favor, ingresa el nombre completo de tu jefe inmediato"),
  company_website: z.string().optional().or(z.literal('')),
  company_address: z.string().min(5, "Por favor, ingresa la dirección completa de tu empresa"),
  company_industry: z.string().min(2, "Por favor, indica a qué industria pertenece tu empresa"),
  job_title: z.string().min(2, "Por favor, ingresa tu puesto en la empresa"),
  job_seniority: z.string().min(1, "Por favor, indica cuánto tiempo llevas en tu puesto"),
  net_monthly_income: z.string().min(1, "Por favor, ingresa tu ingreso mensual bruto"),

  // Step 3: References
  parentesco: z.string().min(3, "Por favor, especifica tu parentesco con la referencia familiar"),
  friend_reference_name: z.string().min(2, "Por favor, proporciona el nombre completo de una referencia personal"),
  friend_reference_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono válido de 10 dígitos")),
  friend_reference_relationship: z.string().min(2, "Por favor, indica tu relación con esta referencia"),
  family_reference_name: z.string().min(2, "Por favor, proporciona el nombre completo de una referencia familiar"),
  family_reference_phone: z.string().default('').transform(val => val.replace(/\D/g, '')).pipe(z.string().length(10, "Por favor, ingresa un teléfono válido de 10 dígitos")),

  // Financing Preferences
  loan_term_months: z.number().optional(),
  down_payment_amount: z.number().optional(),
  estimated_monthly_payment: z.number().optional(),

  // Step 4: Consent
  terms_and_conditions: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar."
  }),
  digital_signature: z.string().min(1, "La firma digital es obligatoria para enviar tu solicitud"),
  consent_survey: z.boolean().optional(),
  ordencompra: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof baseApplicationSchema>;

// Define stepper
const { useStepper, utils } = Stepperize.defineStepper(
  { id: 'vehicle-financing', title: 'Vehículo', description: 'Auto y financiamiento', icon: FileText },
  { id: 'personal-info', title: 'Personal', description: 'Información personal', icon: User },
  { id: 'employment', title: 'Empleo', description: 'Información laboral', icon: Building2 },
  { id: 'additional-details', title: 'Historial', description: 'Historial complementario', icon: PenSquare },
  { id: 'references', title: 'Referencias', description: 'Referencias personales', icon: Users },
  { id: 'consent', title: 'Consentimiento', description: 'Términos y condiciones', icon: CheckCircle },
  { id: 'review', title: 'Revisión', description: 'Revisar y enviar', icon: FileText },
  { id: 'complete', title: 'Completado', description: 'Solicitud enviada', icon: CheckCircle }
);

export type StepperType = ReturnType<typeof useStepper>;

const EnhancedApplication: React.FC = () => {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const { vehicles } = useVehicles();
  const searchParams = useSearchParams();
  const params = useParams();
  const applicationIdFromUrl = params?.id as string | undefined;

  const [pageStatus, setPageStatus] = useState<'initializing' | 'loading' | 'checking_profile' | 'profile_incomplete' | 'bank_profile_incomplete' | 'active_application_exists' | 'ready' | 'error' | 'success'>('initializing');
  const [pageError, setPageError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  // Validate applicationId from URL - filter out invalid values like "undefined"
  const [applicationId, setApplicationId] = useState<string | null>(
    applicationIdFromUrl && applicationIdFromUrl !== 'undefined' && applicationIdFromUrl !== 'null'
      ? applicationIdFromUrl
      : null
  );
  const [applicationData, setApplicationData] = useState<any>(null);
  const [recommendedBank, setRecommendedBank] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  const stepper = useStepper();
  const currentStep = utils.getIndex(stepper.current.id);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(baseApplicationSchema),
    defaultValues: {
      terms_and_conditions: false,
      consent_survey: false,
      loan_term_months: 60,
    }
  });

  const { control, handleSubmit, formState: { errors, isValid, isSubmitting }, reset, trigger, getValues, setValue } = form;
  const isMarried = profile?.civil_status?.toLowerCase() === 'casado';

  // Pre-flight checks (same as original)
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
        const requiredFields: (keyof typeof profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
        const isProfileComplete = requiredFields.every(field => profile[field] && String(profile[field]).trim() !== '');

        if (!isProfileComplete) {
          const ordenCompraFromUrl = searchParams.get('ordencompra');
          if (ordenCompraFromUrl) {
            sessionStorage.setItem('pendingOrdenCompra', ordenCompraFromUrl);
          }
          setPageStatus('profile_incomplete');
          return;
        }

        const bankProfile = await BankProfilingService.getUserBankProfile(user.id);
        if (!bankProfile?.is_complete || !bankProfile.banco_recomendado) {
          setPageStatus('bank_profile_incomplete');
          return;
        }
        setRecommendedBank(bankProfile.banco_recomendado);

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
        setPageError(error.message || 'No pudimos verificar los requisitos de tu solicitud.');
        setPageStatus('error');
      }
    };

    if (pageStatus === 'initializing') {
      checkUserProfile();
    }
  }, [user, profile, authLoading, applicationIdFromUrl, searchParams, pageStatus, isAdmin]);

  // Load or create draft
  useEffect(() => {
    const loadOrCreateDraft = async () => {
      if (pageStatus !== 'ready' || !user) return;
      if (applicationData && applicationIdFromUrl && applicationId === applicationIdFromUrl) return;

      try {
        if (applicationIdFromUrl) {
          const draft = await ApplicationService.getApplicationById(user.id, applicationIdFromUrl);
          if (!draft) throw new Error('No encontramos el borrador de tu solicitud.');

          setApplicationId(draft.id);
          setApplicationData(draft.application_data || {});
          const carInfo = (draft.car_info || {}) as any;
          setVehicleInfo(carInfo);
          if (carInfo?._ordenCompra) setValue('ordencompra', carInfo._ordenCompra);

          const appData = { ...(draft.application_data || {}) };
          reset(appData);
          // If no vehicle selected, user will start at vehicle-selection step
        } else {
          const pendingOrdenCompra = sessionStorage.getItem('pendingOrdenCompra');
          const finalOrdenCompra = searchParams.get('ordencompra') || pendingOrdenCompra;

          let initialData: Record<string, any> = {};
          if (finalOrdenCompra) {
            const vehicle = await VehicleService.getVehicleByOrdenCompra(finalOrdenCompra);
            if (vehicle) {
              const featureImage = getVehicleImage(vehicle);
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
            }
            sessionStorage.removeItem('pendingOrdenCompra');
          }
          // If no vehicle selected, user will start at vehicle-selection step

          const newDraft = await ApplicationService.createDraftApplication(user.id, initialData);
          if (newDraft && newDraft.id) {
            setApplicationId(newDraft.id);
            router.replace(`/escritorio/aplicacion/${newDraft.id}`);
          } else {
            throw new Error('No pudimos crear el borrador de tu solicitud.');
          }
        }
      } catch (error: any) {
        setPageError(error.message || 'No pudimos cargar o crear tu solicitud de financiamiento.');
        setPageStatus('error');
      }
    };

    loadOrCreateDraft();
  }, [pageStatus, user, applicationIdFromUrl, vehicles, reset, searchParams, setValue, router, applicationData, applicationId]);

  const handleVehicleSelect = async (vehicle: WordPressVehicle) => {
    if (!applicationId) return;
    const featureImage = getVehicleImage(vehicle);
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
  };

  // Save progress and move to next step
  const handleNext = async () => {
    const stepFieldsMap: Record<string, string[]> = {
      'vehicle-financing': [], // Validation handled in component
      'personal-info': [], // Address validation handled in component
      'employment': ['fiscal_classification', 'company_name', 'company_phone', 'supervisor_name', 'company_address', 'company_industry', 'job_title', 'job_seniority', 'net_monthly_income'],
      'additional-details': ['time_at_address', 'housing_type', 'dependents', 'grado_de_estudios'],
      'references': ['friend_reference_name', 'friend_reference_phone', 'friend_reference_relationship', 'family_reference_name', 'family_reference_phone', 'parentesco'],
      'consent': ['terms_and_conditions', 'digital_signature'],
      'review': []
    };

    const currentStepFields = stepFieldsMap[stepper.current.id] || [];

    if (currentStepFields.length > 0) {
      const isValidStep = await trigger(currentStepFields as any);
      if (!isValidStep) {
        alert('Por favor, completa todos los campos requeridos antes de continuar.');
        return;
      }
    }

    if (!applicationId) {
      alert("No se pudo guardar el progreso. Por favor, recarga la página.");
      return;
    }

    try {
      const formValues = getValues();
      const cleanValues = Object.fromEntries(
        Object.entries(formValues).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      await ApplicationService.saveApplicationDraft(applicationId, { application_data: cleanValues });

      conversionTracking.trackApplication.stepCompleted(currentStep + 1, stepper.current.title, {
        applicationId: applicationId,
        vehicleId: vehicleInfo?._ordenCompra || undefined
      });

      stepper.next();
    } catch (e: any) {
      console.error("Error saving application draft:", e);
      alert("Hubo un problema al guardar tu progreso. Por favor, intenta de nuevo.");
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmissionError(null);

    if (!applicationId || !user || !profile || !recommendedBank) {
      setSubmissionError("Faltan datos esenciales para completar tu solicitud.");
      return;
    }

    if (!vehicleInfo?._ordenCompra) {
      setSubmissionError("Aún no has seleccionado un vehículo para tu solicitud. Por favor, regresa al paso de selección.");
      stepper.goTo('vehicle-selection');
      return;
    }

    // Validate spouse not used as reference
    if (profile?.spouse_name) {
      const normalizeName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };

      const normalizedSpouse = normalizeName(profile.spouse_name);
      const normalizedFriend = normalizeName(data.friend_reference_name || '');
      const normalizedFamily = normalizeName(data.family_reference_name || '');

      if (normalizedSpouse && (normalizedSpouse === normalizedFriend || normalizedSpouse === normalizedFamily)) {
        setSubmissionError("Tu cónyuge no puede ser utilizado como referencia personal.");
        stepper.goTo('references');
        return;
      }
    }

    try {
      const currentApp = await ApplicationService.getApplicationById(user.id, applicationId);
      const isFirstSubmit = currentApp?.status === 'draft';

      if (!currentApp || currentApp.status !== 'draft') {
        const hasActiveApp = await ApplicationService.hasActiveApplication(user.id);
        if (hasActiveApp) {
          setSubmissionError('Ya cuentas con una solicitud activa en proceso.');
          setPageStatus('active_application_exists');
          return;
        }
      }

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
        status: 'Faltan Documentos', // Changed from 'pending_documents' to match APPLICATION_STATUS.FALTAN_DOCUMENTOS
      };

      const updatedApp = await ApplicationService.updateApplication(applicationId, payload);

      // Send email notifications
      const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      const clientEmail = profile.email || '';
      const vehicleTitle = vehicleInfo?._vehicleTitle || null;

      if (clientEmail) {
        BrevoEmailService.notifyApplicationSubmitted(
          clientEmail,
          clientName,
          vehicleTitle,
          applicationId
        ).catch(err => console.error('[Application] Error sending client email:', err));
      }

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

      BrevoEmailService.notifyAdminsNewApplication(
        clientName,
        clientEmail,
        profile.phone,
        vehicleTitle,
        user.id,
        advisorName
      ).catch(err => console.error('[Application] Error sending admin emails:', err));

      if (advisorEmail && advisorName) {
        BrevoEmailService.notifySalesAdvisor(
          advisorEmail,
          advisorName,
          clientName,
          clientEmail,
          profile.phone,
          vehicleTitle,
          user.id
        ).catch(err => console.error('[Application] Error sending advisor email:', err));
      }

      if (data.consent_survey && clientEmail) {
        BrevoEmailService.sendSurveyInvitation(
          clientEmail,
          clientName,
          user.id
        ).catch(err => console.error('[Application] Error sending survey invitation:', err));
      }

      conversionTracking.trackApplication.submitted({
        applicationId: applicationId,
        vehicleId: vehicleInfo._ordenCompra,
        vehicleName: vehicleTitle || undefined,
        vehiclePrice: vehicleInfo._precioNumerico || 0,
        recommendedBank: recommendedBank,
        userId: user.id
      });

      // Move to completion step
      stepper.goTo('complete');
      setPageStatus('success');

    } catch(e: any) {
      if (e.message?.includes('Ya tienes una solicitud activa')) {
        setPageStatus('active_application_exists');
      }
      setSubmissionError(e.message || "No pudimos enviar tu solicitud de financiamiento.");
    }
  };

  // Status displays for different page states
  const StatusDisplay: React.FC<{ icon: React.ElementType, title: string, message: string, linkTo: string, linkText: string }> = ({ icon: Icon, title, message, linkTo, linkText }) => (
    <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-xl shadow-sm border border-yellow-300">
      <Icon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">{message}</p>
      <Button onClick={() => router.push(linkTo)} className="mt-6">
        {linkText}
      </Button>
    </div>
  );

  if (pageStatus === 'loading' || pageStatus === 'checking_profile') {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (pageStatus === 'profile_incomplete') {
    return <StatusDisplay icon={User} title="¡Casi listo para empezar!" message="Por favor completa la información de tu perfil para comenzar una solicitud de financiamiento." linkTo="/escritorio/profile" linkText="Ir a mi perfil" />;
  }

  if (pageStatus === 'bank_profile_incomplete') {
    return <StatusDisplay icon={Building2} title="Completa tu Perfil Bancario" message="Tu perfil personal está completo. El siguiente paso es el perfilamiento bancario." linkTo="/escritorio/perfilacion-bancaria" linkText="Ir a Perfilamiento Bancario" />;
  }

  if (pageStatus === 'active_application_exists') {
    return <StatusDisplay icon={User} title="Solicitud en Proceso" message="Ya tienes una solicitud activa. Solo puedes tener una a la vez." linkTo="/escritorio/seguimiento" linkText="Ver Mis Solicitudes" />;
  }

  if (pageStatus === 'error') {
    return <StatusDisplay icon={User} title="Ocurrió un Error" message={pageError || 'Error desconocido'} linkTo="/escritorio" linkText="Volver al Escritorio" />;
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-2 sm:p-6 lg:p-8">

        <Card className="gap-0 p-0 md:grid md:max-lg:grid-cols-5 lg:grid-cols-4 border-0 md:border shadow-none md:shadow-sm">
          {/* Sidebar navigation */}
          <CardContent className="col-span-5 p-2 sm:p-4 md:p-6 max-md:border-b md:border-r md:max-lg:col-span-2 lg:col-span-1">
            <nav aria-label="Pasos de la solicitud">
              {/* Mobile: Horizontal scrollable stepper */}
              <ol className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-y-4 pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0">
                {stepper.all
                  .filter(step => step.id !== 'complete')
                  .map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isClickable = index <= currentStep; // Can click current and previous steps

                    return (
                      <li key={step.id} className="flex-shrink-0 md:flex-shrink">
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-auto shrink-0 gap-2 md:gap-3 rounded !bg-transparent p-2 transition-all",
                            "md:w-full md:justify-start",
                            "w-auto justify-center flex-col md:flex-row",
                            isClickable ? "cursor-pointer hover:bg-accent" : "cursor-not-allowed opacity-50"
                          )}
                          onClick={() => isClickable && stepper.goTo(step.id)}
                          disabled={!isClickable}
                        >
                          {/* Step Number */}
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 transition-all",
                            isActive && "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
                            isCompleted && "bg-green-600 text-white",
                            !isActive && !isCompleted && "bg-gray-200 text-gray-600"
                          )}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          {/* Step Info */}
                          <div className="flex flex-col items-center md:items-start flex-1 min-w-0">
                            <span className={cn(
                              "font-medium text-xs md:text-sm truncate w-full text-center md:text-left",
                              isActive && "text-primary"
                            )}>
                              {step.title}
                            </span>
                            <span className="text-muted-foreground text-xs truncate w-full hidden md:block">
                              {step.description}
                            </span>
                          </div>
                        </Button>
                      </li>
                    );
                  })}
              </ol>
            </nav>
          </CardContent>

          {/* Step content */}
          {stepper.switch({
            'vehicle-financing': () => (
              <VehicleFinancingStep
                stepper={stepper}
                vehicleInfo={vehicleInfo}
                control={control}
                setValue={setValue}
                onVehicleSelect={handleVehicleSelect}
                onNext={handleNext}
              />
            ),
            'personal-info': () => (
              <PersonalInfoStepSimplified
                stepper={stepper}
                control={control}
                errors={errors}
                isMarried={isMarried}
                profile={profile}
                setValue={setValue}
                trigger={trigger}
                onNext={handleNext}
              />
            ),
            'employment': () => (
              <EmploymentStep
                stepper={stepper}
                control={control}
                errors={errors}
                setValue={setValue}
                onNext={handleNext}
              />
            ),
            'additional-details': () => (
              <AdditionalDetailsStep
                stepper={stepper}
                control={control}
                errors={errors}
                onNext={handleNext}
              />
            ),
            'references': () => (
              <ReferencesStep
                stepper={stepper}
                control={control}
                errors={errors}
                profile={profile}
                getValues={getValues}
                onNext={handleNext}
              />
            ),
            'consent': () => (
              <ConsentStep
                stepper={stepper}
                control={control}
                errors={errors}
                setValue={setValue}
                onNext={handleNext}
              />
            ),
            'review': () => (
              <ReviewSubmitStep
                stepper={stepper}
                control={control}
                getValues={getValues}
                setValue={setValue}
                profile={profile}
                vehicleInfo={vehicleInfo}
                bank={recommendedBank}
                onSubmit={handleSubmit(onSubmit)}
                isSubmitting={isSubmitting}
                submissionError={submissionError}
              />
            ),
            'complete': () => (
              <CompletedStep
                vehicleInfo={vehicleInfo}
                applicationId={applicationId}
              />
            )
          })}
        </Card>
      </div>
    </>
  );
};

export default EnhancedApplication;
