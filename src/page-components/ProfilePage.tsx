'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileService } from '../services/profileService';
// Usar el singleton de Supabase para consistencia
import { getSupabaseClient } from '../../supabaseClient';
const supabase = getSupabaseClient();
import {
  User, ArrowLeft, CheckCircle, Loader2, Info,
  ChevronRight, ChevronLeft, Phone, Mail, Building2,
  Calendar, Users, FileText, Camera
} from 'lucide-react';
import PhoneVerification from '../components/PhoneVerification';
import type { Profile } from '../types/types';
import { calculateRFC } from '../utils/rfcCalculator';
import { toast } from 'sonner';
import { conversionTracking } from '../services/ConversionTrackingService';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const CELLPHONE_COMPANIES = [
  'Telcel', 'AT&T', 'Movistar', 'Unefon', 'Virgin Mobile', 'Weex (Dish)', 'Pillofon', 'Otro',
];

const COUNTRY_CODES = [
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'EE.UU./Canadá', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
];

const SALES_AGENTS = [
  { id: 'd21e808e-083c-48fd-be78-d52ee7837146', name: 'Anahi Garza Garcia' },
  { id: 'cb55da28-ef7f-4632-9fcd-a8d9f37f1463', name: 'Carlos Isidro Berrones' },
  { id: 'e49bf74c-308f-4e8d-b683-3575d7214e98', name: 'Daniel Rodríguez' },
  { id: '7e239ec5-aceb-4e9f-ae67-2ac16733609b', name: 'David Rojas' },
  { id: 'fe901e9e-c3f2-41a1-b5a0-6d95c9d81344', name: 'David Marconi Mazariegos' },
  { id: 'a4165ce3-e52b-4f8d-9123-327c0179f73c', name: 'Israel Ramírez' },
  { id: '4c8c43bb-c936-44a2-ab82-f40326387770', name: 'Ramón Araujo' },
];

const CIVIL_STATUS_OPTIONS = [
  { value: 'soltero', label: 'Soltero(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'viudo', label: 'Viudo(a)' },
  { value: 'union', label: 'Unión Libre' },
  { value: 'divorciado', label: 'Divorciado(a)' },
];

const FISCAL_OPTIONS = [
  { value: 'asalariado', label: 'Empleado con nómina' },
  { value: 'honorarios', label: 'Honorarios' },
  { value: 'dividendos', label: 'Dividendos o acciones' },
  { value: 'pensionado', label: 'Pensionado' },
  { value: 'actividad_empresarial', label: 'Persona Física con Actividad Empresarial' },
];

const STEPS = [
  { id: 1, title: 'Contacto', icon: Phone, description: 'Datos de contacto' },
  { id: 2, title: 'Personal', icon: User, description: 'Información personal' },
  { id: 3, title: 'Fiscal', icon: FileText, description: 'Datos fiscales' },
];

// ============================================================================
// HELPERS
// ============================================================================

const normalizeNameToTitleCase = (name: string): string => {
  if (!name) return '';
  const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];
  return name.trim().toLowerCase().split(' ').map((word, index) => {
    if (index === 0 || !lowercaseWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
};

// ============================================================================
// SCHEMA
// ============================================================================

const profileSchema = z.object({
  first_name: z.string().min(2, 'Mínimo 2 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  mother_last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional().or(z.literal('')),
  cellphone_company: z.string().optional().or(z.literal('')),
  birth_date: z.string().min(1, 'Selecciona tu fecha de nacimiento'),
  homoclave: z.string().length(3, 'Debe tener 3 caracteres'),
  fiscal_situation: z.string().min(1, 'Selecciona tu situación fiscal'),
  civil_status: z.string().min(1, 'Selecciona tu estado civil'),
  spouse_name: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  how_did_you_know: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.civil_status?.toLowerCase() === 'casado') {
    return data.spouse_name && data.spouse_name.length >= 2;
  }
  return true;
}, {
  message: 'Ingresa el nombre completo de tu cónyuge',
  path: ['spouse_name'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

interface StepIndicatorProps {
  steps: typeof STEPS;
  currentStep: number;
  isComplete: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, isComplete }) => {
  const progress = isComplete ? 100 : (currentStep / steps.length) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep || isComplete;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted ? "bg-green-500 text-white" :
                    isActive ? "bg-primary text-white ring-4 ring-primary/20" :
                    "bg-gray-100 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium hidden sm:block",
                  isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-gray-400"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  step.id < currentStep || isComplete ? "bg-green-500" : "bg-gray-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
};

// ============================================================================
// PROFILE SIDEBAR COMPONENT
// ============================================================================

interface ProfileSidebarProps {
  previewUrl: string | null;
  firstName: string;
  lastName: string;
  email: string | undefined;
  calculatedRfc: string;
  onPictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  previewUrl, firstName, lastName, email, calculatedRfc, onPictureChange
}) => {
  return (
    <Card className="sticky top-6">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">Tu Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <label htmlFor="profile-picture" className="cursor-pointer group">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-primary/20 transition-all">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </label>
          <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={onPictureChange} />
          <span className="text-xs text-muted-foreground mt-2">Haz clic para cambiar</span>
        </div>

        <div className="space-y-3 pt-2">
          {(firstName || lastName) && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium truncate">
                  {normalizeNameToTitleCase(firstName || '')} {normalizeNameToTitleCase(lastName || '')}
                </p>
              </div>
            </div>
          )}

          {email && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{email}</p>
              </div>
            </div>
          )}

          {calculatedRfc && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">RFC</p>
                <p className="text-sm font-mono font-bold text-primary">{calculatedRfc}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProfilePage: React.FC = () => {
  const { user, profile, loading, reloadProfile, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formInitialized = useRef(false);

  // Debug logging para verificar que tenemos la sesion
  useEffect(() => {
    console.log('[ProfilePage] Estado de auth:', {
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email,
      hasProfile: !!profile,
      loading
    });
  }, [session, user, profile, loading]);

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [calculatedRfc, setCalculatedRfc] = useState('');
  const [hasPriorAdvisor, setHasPriorAdvisor] = useState<string>('no');
  const [selectedSalesAgentId, setSelectedSalesAgentId] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('+52');
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [phoneForVerification, setPhoneForVerification] = useState('');

  // Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      last_name: '',
      mother_last_name: '',
      phone: '',
      cellphone_company: '',
      birth_date: '',
      homoclave: '',
      fiscal_situation: '',
      civil_status: '',
      spouse_name: '',
      gender: '',
      how_did_you_know: '',
    }
  });

  const { watch, setValue, getValues, register, formState: { errors } } = profileForm;
  const civilStatus = watch('civil_status');
  const isMarried = civilStatus?.toLowerCase() === 'casado';
  const firstName = watch('first_name');
  const lastName = watch('last_name');
  const motherLastName = watch('mother_last_name');
  const birthDate = watch('birth_date');
  const homoclave = watch('homoclave');

  // Initialize form when profile loads
  useEffect(() => {
    if (profile && !formInitialized.current) {
      formInitialized.current = true;

      const phoneVerified = profile.phone_verified === true;

      if (!phoneVerified) {
        setNeedsPhoneVerification(true);
        setPhoneForVerification(profile.phone || '');
      }

      const requiredFields = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
      const isComplete = requiredFields.every(field => profile[field as keyof Profile] && String(profile[field as keyof Profile]).trim() !== '');

      if (isComplete && phoneVerified) {
        setIsProfileComplete(true);
        setCurrentStep(3);
      } else {
        setIsFirstTimeUser(true);
      }

      profileForm.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mother_last_name: profile.mother_last_name || '',
        phone: profile.phone || '',
        cellphone_company: profile.cellphone_company || '',
        birth_date: profile.birth_date || '',
        homoclave: profile.homoclave || '',
        fiscal_situation: profile.fiscal_situation || '',
        civil_status: profile.civil_status || '',
        spouse_name: profile.spouse_name || '',
        gender: profile.gender || '',
        how_did_you_know: profile.how_did_you_know || '',
      }, { keepDefaultValues: false });

      setCalculatedRfc(profile.rfc || '');
      setPreviewUrl(profile.picture_url || null);

      if (profile.asesor_asignado_id) {
        setHasPriorAdvisor('yes');
        setSelectedSalesAgentId(profile.asesor_asignado_id);
      }
    }
  }, [profile, profileForm]);

  // Calculate RFC when relevant fields change
  useEffect(() => {
    if (firstName && lastName && motherLastName && birthDate && homoclave?.length === 3) {
      const rfc = calculateRFC({
        first_name: firstName,
        last_name: lastName,
        mother_last_name: motherLastName,
        birth_date: birthDate,
        homoclave
      });
      if (rfc) setCalculatedRfc(rfc);
    }
  }, [firstName, lastName, motherLastName, birthDate, homoclave]);

  // Save current step data
  const saveStepData = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const formData = getValues();

      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email,
        first_name: formData.first_name ? normalizeNameToTitleCase(formData.first_name) : undefined,
        last_name: formData.last_name ? normalizeNameToTitleCase(formData.last_name) : undefined,
        mother_last_name: formData.mother_last_name ? normalizeNameToTitleCase(formData.mother_last_name) : undefined,
        phone: formData.phone || undefined,
        cellphone_company: formData.cellphone_company || undefined,
        birth_date: formData.birth_date || undefined,
        homoclave: formData.homoclave || undefined,
        fiscal_situation: formData.fiscal_situation || undefined,
        civil_status: formData.civil_status || undefined,
        spouse_name: formData.spouse_name ? normalizeNameToTitleCase(formData.spouse_name) : undefined,
        gender: formData.gender || undefined,
        how_did_you_know: formData.how_did_you_know || undefined,
      };

      if (formData.first_name && formData.last_name && formData.mother_last_name &&
          formData.birth_date && formData.homoclave?.length === 3) {
        const rfc = calculateRFC({
          first_name: formData.first_name,
          last_name: formData.last_name,
          mother_last_name: formData.mother_last_name,
          birth_date: formData.birth_date,
          homoclave: formData.homoclave
        });
        if (rfc) payload.rfc = rfc;
      }

      if (hasPriorAdvisor === 'yes' && selectedSalesAgentId) {
        payload.asesor_asignado_id = selectedSalesAgentId;
        payload.asesor_autorizado_acceso = true;
      } else if (!profile?.asesor_asignado_id) {
        const assignedAdvisorId = await ProfileService.assignAdvisorToUser(user.id);
        if (assignedAdvisorId) {
          payload.asesor_asignado_id = assignedAdvisorId;
          payload.asesor_autorizado_acceso = true;
        }
      }

      if (profilePictureFile) {
        const pictureUrl = await ProfileService.uploadProfilePicture(user.id, profilePictureFile);
        payload.picture_url = pictureUrl;
      }

      await ProfileService.updateProfile(payload, user.id);
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar. Por favor, intenta de nuevo.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getValues, hasPriorAdvisor, selectedSalesAgentId, profile, profilePictureFile]);

  // Handle next step
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof ProfileFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['phone'];
      if (hasPriorAdvisor === 'yes' && !selectedSalesAgentId) {
        toast.error('Por favor, selecciona tu asesor.');
        return;
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ['first_name', 'last_name', 'mother_last_name', 'birth_date', 'civil_status'];
      if (isMarried) fieldsToValidate.push('spouse_name');
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await profileForm.trigger(fieldsToValidate);
      if (!isValid) {
        toast.error('Por favor, completa los campos obligatorios.');
        return;
      }
    }

    const saved = await saveStepData();
    if (!saved) return;

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    const isValid = await profileForm.trigger(['homoclave', 'fiscal_situation']);
    if (!isValid) {
      toast.error('Por favor, completa la homoclave y situación fiscal.');
      return;
    }

    const saved = await saveStepData();
    if (!saved) return;

    const formData = getValues();
    const requiredFields = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status'];
    const isComplete = requiredFields.every(field => formData[field as keyof ProfileFormData] && String(formData[field as keyof ProfileFormData]).trim() !== '');

    if (isComplete) {
      // Track conversion event
      conversionTracking.trackProfile.updated({
        userId: user?.id,
        email: user?.email,
        profileComplete: true,
        hasProfilePicture: !!previewUrl,
        asesorAutorizado: hasPriorAdvisor === 'yes' || !!profile?.asesor_asignado_id
      });

      if (isProfileComplete) {
        toast.success('¡Perfil actualizado correctamente!');
        setIsProfileComplete(true);
        await reloadProfile();
        return;
      }

      const { data: existingApplications } = await supabase
        .from('financing_applications')
        .select('id, status')
        .eq('user_id', user?.id)
        .not('status', 'eq', 'cancelled')
        .limit(1);

      if (existingApplications && existingApplications.length > 0) {
        toast.success('¡Perfil actualizado! Ya tienes una solicitud en proceso.');
        setIsProfileComplete(true);
        await reloadProfile();

        const returnTo = searchParams?.get('returnTo');
        const ordencompra = searchParams?.get('ordencompra');
        if (returnTo && ordencompra) {
          router.push(`${returnTo}?ordencompra=${ordencompra}`);
        } else {
          router.push('/escritorio');
        }
        return;
      }

      toast.success('¡Perfil completado! Redirigiendo a perfilación bancaria...');
      await reloadProfile();

      setTimeout(() => {
        const returnTo = searchParams?.get('returnTo');
        const ordencompra = searchParams?.get('ordencompra');
        let redirectPath = '/escritorio/perfilacion-bancaria';

        if (returnTo && ordencompra) {
          redirectPath = `${redirectPath}?returnTo=${returnTo}&ordencompra=${ordencompra}`;
        }

        router.push(redirectPath);
      }, 1000);
    } else {
      toast.info('Progreso guardado. Algunos campos obligatorios están pendientes.');
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePhoneVerified = async () => {
    setNeedsPhoneVerification(false);
    setValue('phone', phoneForVerification);
    await reloadProfile();
    toast.success('¡Teléfono verificado! Continúa completando tu perfil.');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/escritorio"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Dashboard
        </Link>
      </div>

      {/* Status Banners */}
      {isProfileComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">¡Perfil completo!</h3>
            <p className="text-sm text-green-700">Tu información está completa. Puedes editarla si es necesario.</p>
          </div>
        </div>
      )}

      {isFirstTimeUser && !needsPhoneVerification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">¡Bienvenido!</h3>
            <p className="text-sm text-blue-700">Completa tu perfil para continuar con tu solicitud de crédito.</p>
          </div>
        </div>
      )}

      {/* Phone Verification */}
      {needsPhoneVerification && user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Verificación de Teléfono
            </CardTitle>
            <CardDescription>
              Para tu seguridad, necesitamos verificar tu número de teléfono celular.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneVerification
              phone={phoneForVerification}
              onPhoneChange={setPhoneForVerification}
              onVerified={handlePhoneVerified}
              userId={user.id}
              showSkip={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!needsPhoneVerification && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Completa tu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Step Indicator */}
                <StepIndicator steps={STEPS} currentStep={currentStep} isComplete={isProfileComplete} />

                {/* Form */}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

                  {/* Step 1: Contact */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      {/* Advisor Selection */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold">Asignación de Asesor</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">¿Ya has sido atendido por un asesor de TREFA?</p>

                        <RadioGroup value={hasPriorAdvisor} onValueChange={setHasPriorAdvisor} className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="no-prior" />
                            <Label htmlFor="no-prior" className="cursor-pointer">No</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="yes-prior" />
                            <Label htmlFor="yes-prior" className="cursor-pointer">Sí</Label>
                          </div>
                        </RadioGroup>

                        {hasPriorAdvisor === 'yes' && (
                          <div className="pt-2">
                            <Label className="text-sm">Selecciona tu asesor</Label>
                            <select
                              value={selectedSalesAgentId}
                              onChange={(e) => setSelectedSalesAgentId(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5"
                            >
                              <option value="">Selecciona...</option>
                              {SALES_AGENTS.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {hasPriorAdvisor === 'no' && (
                          <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            Se te asignará un asesor automáticamente al completar tu perfil.
                          </p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          Información de Contacto
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <div className="flex">
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm"
                              >
                                {COUNTRY_CODES.map((country) => (
                                  <option key={country.code} value={country.code}>
                                    {country.flag} {country.code}
                                  </option>
                                ))}
                              </select>
                              <Input {...register('phone')} placeholder="10 dígitos" className="rounded-l-none" />
                            </div>
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Compañía Telefónica</Label>
                            <select {...register('cellphone_company')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="">Seleccionar...</option>
                              {CELLPHONE_COMPANIES.map((company) => (
                                <option key={company} value={company}>{company}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Correo Electrónico</Label>
                          <Input type="email" value={user?.email || ''} readOnly disabled className="bg-muted" />
                          <p className="text-xs text-muted-foreground">Este correo está vinculado a tu cuenta.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Personal */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Datos Personales
                        </h4>
                        <p className="text-sm text-muted-foreground">Ingresa tu nombre tal como aparece en tu identificación oficial.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre(s) *</Label>
                            <Input {...register('first_name')} placeholder="Tu(s) nombre(s)" />
                            {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Apellido Paterno *</Label>
                            <Input {...register('last_name')} placeholder="Apellido paterno" />
                            {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Apellido Materno *</Label>
                            <Input {...register('mother_last_name')} placeholder="Apellido materno" />
                            {errors.mother_last_name && <p className="text-sm text-destructive">{errors.mother_last_name.message}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Fecha de Nacimiento *
                            </Label>
                            <Input type="date" {...register('birth_date')} />
                            {errors.birth_date && <p className="text-sm text-destructive">{errors.birth_date.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Género</Label>
                            <RadioGroup
                              value={watch('gender') || ''}
                              onValueChange={(v) => setValue('gender', v)}
                              className="flex gap-4 pt-2"
                            >
                              {['Masculino', 'Femenino'].map((g) => (
                                <div key={g} className="flex items-center space-x-2">
                                  <RadioGroupItem value={g} id={`gender-${g}`} />
                                  <Label htmlFor={`gender-${g}`} className="cursor-pointer">{g}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Estado Civil *
                          </Label>
                          <RadioGroup
                            value={civilStatus || ''}
                            onValueChange={(v) => setValue('civil_status', v)}
                            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                          >
                            {CIVIL_STATUS_OPTIONS.map((status) => (
                              <div key={status.value}>
                                <RadioGroupItem value={status.value} id={`civil-${status.value}`} className="peer sr-only" />
                                <Label
                                  htmlFor={`civil-${status.value}`}
                                  className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 text-sm hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all"
                                >
                                  {status.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          {errors.civil_status && <p className="text-sm text-destructive">{errors.civil_status.message}</p>}
                        </div>

                        {isMarried && (
                          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                            <Label>Nombre del Cónyuge *</Label>
                            <Input {...register('spouse_name')} placeholder="Nombre completo del cónyuge" />
                            {errors.spouse_name && <p className="text-sm text-destructive">{errors.spouse_name.message}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Fiscal */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Información Fiscal
                        </h4>
                        <p className="text-sm text-muted-foreground">Completa tus datos fiscales para generar tu RFC.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Homoclave (3 caracteres) *</Label>
                            <Input
                              {...register('homoclave')}
                              maxLength={3}
                              placeholder="Ej: XYZ"
                              className="font-mono uppercase"
                            />
                            <p className="text-xs text-muted-foreground">Los últimos 3 caracteres de tu RFC</p>
                            {errors.homoclave && <p className="text-sm text-destructive">{errors.homoclave.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>RFC Calculado</Label>
                            <Input
                              value={calculatedRfc}
                              readOnly
                              disabled
                              className="font-mono font-bold bg-muted text-primary"
                            />
                            <p className="text-xs text-muted-foreground">Se genera automáticamente</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Situación Fiscal *</Label>
                          <RadioGroup
                            value={watch('fiscal_situation') || ''}
                            onValueChange={(v) => setValue('fiscal_situation', v)}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                          >
                            {FISCAL_OPTIONS.map((option) => (
                              <div key={option.value}>
                                <RadioGroupItem value={option.value} id={`fiscal-${option.value}`} className="peer sr-only" />
                                <Label
                                  htmlFor={`fiscal-${option.value}`}
                                  className="flex items-center rounded-lg border-2 border-muted bg-popover p-3 text-sm hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          {errors.fiscal_situation && <p className="text-sm text-destructive">{errors.fiscal_situation.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1 || isSaving}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              previewUrl={previewUrl}
              firstName={firstName}
              lastName={lastName}
              email={user?.email}
              calculatedRfc={calculatedRfc}
              onPictureChange={handlePictureChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
