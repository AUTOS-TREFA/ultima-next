'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileService } from '../services/profileService';
import { supabase } from '../../supabaseClient';
import { User, ArrowLeft, CheckCircle, Loader2, Info, ChevronRight, ChevronLeft, Phone } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

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

const profileSchema = z.object({
  first_name: z.string().min(2, 'Por favor, ingresa tu nombre (mínimo 2 caracteres)'),
  last_name: z.string().min(2, 'Por favor, ingresa tu apellido paterno (mínimo 2 caracteres)'),
  mother_last_name: z.string().min(2, 'Por favor, ingresa tu apellido materno (mínimo 2 caracteres)'),
  phone: z.string().optional().or(z.literal('')),
  cellphone_company: z.string().optional().or(z.literal('')),
  birth_date: z.string().min(1, 'Por favor, selecciona tu fecha de nacimiento'),
  homoclave: z.string().length(3, 'La homoclave debe tener exactamente 3 caracteres'),
  fiscal_situation: z.string().min(1, 'Por favor, selecciona tu situación fiscal'),
  civil_status: z.string().min(1, 'Por favor, selecciona tu estado civil'),
  spouse_name: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  how_did_you_know: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.civil_status?.toLowerCase() === 'casado') {
    return data.spouse_name && data.spouse_name.length >= 2;
  }
  return true;
}, {
  message: 'Por favor, ingresa el nombre completo de tu cónyuge',
  path: ['spouse_name'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const STEPS = [
  { id: 1, title: 'Contacto', description: 'Información de contacto' },
  { id: 2, title: 'Personal', description: 'Datos personales' },
  { id: 3, title: 'Fiscal', description: 'Información fiscal' },
];

const ProfilePage: React.FC = () => {
  const { user, profile, loading, reloadProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formInitialized = useRef(false);

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

  // Initialize form ONCE when profile loads
  useEffect(() => {
    if (profile && !formInitialized.current) {
      formInitialized.current = true;

      // Check if phone verification is needed (new users without verified phone)
      const phoneVerified = profile.phone_verified === true;
      const hasPhone = profile.phone && profile.phone.length >= 10;

      // Need verification if: phone not verified AND (no phone OR is a new user)
      if (!phoneVerified) {
        setNeedsPhoneVerification(true);
        setPhoneForVerification(profile.phone || '');
      }

      const requiredFields = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
      const isComplete = requiredFields.every(field => profile[field as keyof Profile] && String(profile[field as keyof Profile]).trim() !== '');

      if (isComplete && phoneVerified) {
        setIsProfileComplete(true);
        setCurrentStep(3); // Set to last step so progress shows 100%
      } else if (!phoneVerified) {
        setIsFirstTimeUser(true);
      } else {
        setIsFirstTimeUser(true);
      }

      // Set form values without triggering re-renders
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
  const firstName = watch('first_name');
  const lastName = watch('last_name');
  const motherLastName = watch('mother_last_name');
  const birthDate = watch('birth_date');
  const homoclave = watch('homoclave');

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

      // Calculate and add RFC
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

      // Handle advisor assignment
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

      // Handle profile picture
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
    // Validate current step fields
    let fieldsToValidate: (keyof ProfileFormData)[] = [];

    if (currentStep === 1) {
      // Step 1: Contact information
      fieldsToValidate = ['phone'];
      // Validate asesor selection if user said "yes" to prior advisor
      if (hasPriorAdvisor === 'yes' && !selectedSalesAgentId) {
        toast.error('Por favor, selecciona tu asesor.');
        return;
      }
    } else if (currentStep === 2) {
      // Step 2: Personal information
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

    // Save current progress
    const saved = await saveStepData();
    if (!saved) return;

    // Move to next step
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
    // Validate all required fields for step 3
    const isValid = await profileForm.trigger(['homoclave', 'fiscal_situation']);
    if (!isValid) {
      toast.error('Por favor, completa la homoclave y situación fiscal.');
      return;
    }

    const saved = await saveStepData();
    if (!saved) return;

    // Check if profile is now complete
    const formData = getValues();
    const requiredFields = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status'];
    const isComplete = requiredFields.every(field => formData[field as keyof ProfileFormData] && String(formData[field as keyof ProfileFormData]).trim() !== '');

    if (isComplete) {
      // Track completion event
      conversionTracking.trackProfile.updated({
        userId: user?.id,
        email: user?.email,
        profileComplete: true,
        hasProfilePicture: !!previewUrl,
        asesorAutorizado: hasPriorAdvisor === 'yes' || !!profile?.asesor_asignado_id
      });

      // If user already had a complete profile, just show success without redirecting
      if (isProfileComplete) {
        toast.success('¡Perfil actualizado correctamente!');
        setIsProfileComplete(true);
        await reloadProfile();
        return;
      }

      // Check if user already has an ongoing application
      const { data: existingApplications } = await supabase
        .from('financing_applications')
        .select('id, status')
        .eq('user_id', user?.id)
        .not('status', 'eq', 'cancelled')
        .limit(1);

      if (existingApplications && existingApplications.length > 0) {
        // User has an existing application, don't redirect to perfilacion bancaria
        toast.success('¡Perfil actualizado! Ya tienes una solicitud en proceso.');
        setIsProfileComplete(true);
        await reloadProfile();

        // Check if there's a return path with ordencompra
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

      // Reload profile context and redirect
      await reloadProfile();
      setTimeout(() => {
        // Preserve ordencompra and returnTo when redirecting to bank profiling
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

  // Handle phone verification completion
  const handlePhoneVerified = async () => {
    setNeedsPhoneVerification(false);
    // Update the form with the verified phone
    setValue('phone', phoneForVerification);
    // Reload profile to get updated phone_verified status
    await reloadProfile();
    toast.success('¡Teléfono verificado! Continúa completando tu perfil.');
  };

  // Show 100% progress if profile is complete, otherwise based on current step
  const progress = isProfileComplete ? 100 : (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      <Link
        href="/escritorio"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 lg:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Dashboard
      </Link>

      {isProfileComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 lg:p-5 mb-4 lg:mb-6 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
                ¡Perfil completo!
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-1">
                Tu información de perfil está completa. Puedes editarla si es necesario.
              </p>
            </div>
          </div>
        </div>
      )}

      {isFirstTimeUser && !needsPhoneVerification && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 lg:p-5 mb-4 lg:mb-6 rounded-r-lg">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
            ¡Te has registrado con éxito!
          </h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-2">
            Completa la información de tu perfil para continuar con tu solicitud de crédito.
          </p>
        </div>
      )}

      {/* Phone Verification Step - Shows before profile form if phone not verified */}
      {needsPhoneVerification && user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-600" />
              Verificación de teléfono requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                Para tu seguridad y para poder contactarte sobre tu solicitud, necesitamos verificar tu número de teléfono celular.
              </p>
            </div>
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

      {/* Hide profile form when phone verification is needed */}
      {!needsPhoneVerification && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Bar */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
                  Completa tu perfil
                </h2>
                <span className="text-sm font-medium text-gray-600">
                  Paso {currentStep} de {STEPS.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`text-xs text-center flex-1 ${
                      step.id === currentStep ? 'text-primary-700 font-bold' :
                      step.id < currentStep ? 'text-green-500 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()}>
            <Card className="mb-6">
              <CardContent className="p-4 sm:p-6 min-h-[400px]">

                {/* Step 1: Contact */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200">
                      <div className="text-center mb-4">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Asignación de Asesor</h4>
                        <p className="text-xs sm:text-sm text-gray-600">¿Ya has sido atendido por un asesor de TREFA?</p>
                      </div>

                      <RadioGroup value={hasPriorAdvisor} onValueChange={setHasPriorAdvisor} className="flex gap-4">
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
                        <div className="mt-4">
                          <Label className="text-sm">Selecciona tu asesor</Label>
                          <select
                            value={selectedSalesAgentId}
                            onChange={(e) => setSelectedSalesAgentId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                          >
                            <option value="">Selecciona...</option>
                            {SALES_AGENTS.map((agent) => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {hasPriorAdvisor === 'no' && (
                        <p className="text-xs sm:text-sm text-blue-700 bg-blue-100 p-3 rounded-lg mt-4">
                          <Info className="w-4 h-4 inline mr-2" />
                          Se te asignará un asesor automáticamente.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Información de Contacto</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm sm:text-base">Teléfono</Label>
                        <div className="flex">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm sm:text-base min-h-[44px] sm:min-h-[48px] cursor-pointer"
                          >
                            {COUNTRY_CODES.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <Input {...register('phone')} placeholder="10 dígitos" className="rounded-l-none min-h-[44px] sm:min-h-[48px] text-base" />
                        </div>
                        {errors.phone && <p className="text-sm sm:text-base text-red-600">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cellphone_company" className="text-sm sm:text-base">Compañía Telefónica</Label>
                        <select {...register('cellphone_company')} className="flex h-12 sm:h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-base min-h-[44px] sm:min-h-[48px]">
                          <option value="">Seleccionar...</option>
                          {CELLPHONE_COMPANIES.map((company) => (
                            <option key={company} value={company}>{company}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input type="email" value={user?.email || ''} readOnly disabled />
                        <p className="text-xs text-muted-foreground">Este correo está vinculado a tu cuenta.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Personal */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Datos Personales</h3>
                      <p className="text-sm text-gray-600">Ingresa tu nombre como aparece en tu identificación</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Nombre(s) *</Label>
                        <Input {...register('first_name')} placeholder="Tu(s) nombre(s)" className="min-h-[44px] sm:min-h-[48px] text-base" />
                        {errors.first_name && <p className="text-sm sm:text-base text-red-600">{errors.first_name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Apellido Paterno *</Label>
                        <Input {...register('last_name')} placeholder="Apellido paterno" className="min-h-[44px] sm:min-h-[48px] text-base" />
                        {errors.last_name && <p className="text-sm sm:text-base text-red-600">{errors.last_name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Apellido Materno *</Label>
                        <Input {...register('mother_last_name')} placeholder="Apellido materno" className="min-h-[44px] sm:min-h-[48px] text-base" />
                        {errors.mother_last_name && <p className="text-sm sm:text-base text-red-600">{errors.mother_last_name.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Fecha de Nacimiento *</Label>
                      <Input type="date" {...register('birth_date')} className="min-h-[44px] sm:min-h-[48px] text-base" />
                      {errors.birth_date && <p className="text-sm sm:text-base text-red-600">{errors.birth_date.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Género</Label>
                      <RadioGroup value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v)} className="grid grid-cols-2 gap-3">
                        {['Masculino', 'Femenino'].map((g) => (
                          <div key={g}>
                            <RadioGroupItem value={g} id={`gender-${g}`} className="peer sr-only" />
                            <Label
                              htmlFor={`gender-${g}`}
                              className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 sm:p-4 text-sm sm:text-base hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer min-h-[44px] touch-manipulation"
                            >
                              {g}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Estado Civil *</Label>
                      <RadioGroup value={civilStatus || ''} onValueChange={(v) => setValue('civil_status', v)} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['soltero', 'casado', 'viudo', 'union', 'divorciado'].map((status) => (
                          <div key={status}>
                            <RadioGroupItem value={status} id={`civil-${status}`} className="peer sr-only" />
                            <Label
                              htmlFor={`civil-${status}`}
                              className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 sm:p-3.5 text-sm sm:text-base hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer min-h-[44px] touch-manipulation"
                            >
                              {status === 'soltero' ? 'Soltero(a)' :
                               status === 'casado' ? 'Casado(a)' :
                               status === 'viudo' ? 'Viudo(a)' :
                               status === 'union' ? 'Unión Libre' : 'Divorciado(a)'}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.civil_status && <p className="text-sm sm:text-base text-red-600">{errors.civil_status.message}</p>}
                    </div>

                    {isMarried && (
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Nombre del Cónyuge *</Label>
                        <Input {...register('spouse_name')} placeholder="Nombre completo del cónyuge" className="min-h-[44px] sm:min-h-[48px] text-base" />
                        {errors.spouse_name && <p className="text-sm sm:text-base text-red-600">{errors.spouse_name.message}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Fiscal */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Información Fiscal</h3>
                      <p className="text-sm text-gray-600">Completa tus datos fiscales</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Homoclave (RFC) *</Label>
                      <Input {...register('homoclave')} maxLength={3} placeholder="Últimos 3 dígitos" className="min-h-[44px] sm:min-h-[48px] text-base" />
                      {errors.homoclave && <p className="text-sm sm:text-base text-red-600">{errors.homoclave.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">RFC Calculado</Label>
                      <Input value={calculatedRfc} readOnly disabled className="font-mono font-bold min-h-[44px] sm:min-h-[48px] text-base" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Se calcula automáticamente.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Situación Fiscal *</Label>
                      <select {...register('fiscal_situation')} className="flex h-12 sm:h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-base min-h-[44px] sm:min-h-[48px]">
                        <option value="">Seleccionar...</option>
                        <option value="asalariado">Empleado con nómina</option>
                        <option value="honorarios">Honorarios</option>
                        <option value="dividendos">Dividendos o acciones</option>
                        <option value="pensionado">Pensionado</option>
                        <option value="actividad_empresarial">Persona Física con Actividad Empresarial</option>
                      </select>
                      {errors.fiscal_situation && <p className="text-sm sm:text-base text-red-600">{errors.fiscal_situation.message}</p>}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSaving}
                  style={{ backgroundColor: '#FF6801' }}
                  className="text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  style={{ backgroundColor: '#FF6801' }}
                  className="text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar y continuar'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-center">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <label htmlFor="profile-picture" className="cursor-pointer group inline-block">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-primary-500/50 group-hover:ring-primary-500/80">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 mt-2 group-hover:text-primary-600 block">Cambiar foto</span>
                </label>
                <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
              </div>

              {(firstName || lastName) && (
                <div className="space-y-2 text-sm text-gray-600 bg-muted p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{normalizeNameToTitleCase(firstName || '')} {normalizeNameToTitleCase(lastName || '')}</span>
                  </div>
                  {user?.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="truncate ml-2">{user.email}</span>
                    </div>
                  )}
                  {calculatedRfc && (
                    <div className="flex justify-between">
                      <span className="font-medium">RFC:</span>
                      <span className="font-mono font-bold text-primary-600">{calculatedRfc}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
};

export default ProfilePage;
