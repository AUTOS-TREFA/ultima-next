'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Building2,
  AlertTriangle,
  Loader2,
  History,
  User,
  ArrowRight,
  X,
  Trash2,
  FileEdit,
  MessageCircle,
  UserCircle,
  Eye,
  Edit as EditIcon,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/ApplicationService';
import FinancialProjection from '../components/FinancialProjection';
import VehicleCarousel from '../components/VehicleCarousel';
import { BankProfilingService } from '../services/BankProfilingService';
import { ProfileService } from '../services/profileService';
import type { Profile } from '../types/types';
import { FileTextIcon, DownloadIcon } from '../components/icons';
import OnboardingModal from '../components/OnboardingModal';
import { proxyImage } from '../utils/proxyImage';
import { OnboardingStepper } from '../components/OnboardingStepper';
import PrintableApplication from '../components/PrintableApplication';
import { APPLICATION_STATUS, type ApplicationStatus } from '../constants/applicationStatus';
import PublicUploadLinkCard from '../components/PublicUploadLinkCard';

const statusMap: Record<string, { text: string; icon: any; color: string; bgColor: string }> = {
    [APPLICATION_STATUS.DRAFT]: { text: "Borrador", icon: FileText, color: "text-gray-500", bgColor: "bg-gray-100" },
    [APPLICATION_STATUS.COMPLETA]: { text: "Completa", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: { text: "Faltan Documentos", icon: FileText, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    [APPLICATION_STATUS.EN_REVISION]: { text: "En Revisión", icon: Clock, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    [APPLICATION_STATUS.APROBADA]: { text: "Aprobada", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    [APPLICATION_STATUS.RECHAZADA]: { text: "Rechazada", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
    [APPLICATION_STATUS.SUBMITTED]: { text: "Enviada", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
    [APPLICATION_STATUS.REVIEWING]: { text: "En Revisión", icon: Clock, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    [APPLICATION_STATUS.PENDING_DOCS]: { text: "Documentos Pendientes", icon: FileText, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    [APPLICATION_STATUS.APPROVED]: { text: "Aprobada", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    'rejected': { text: "Rechazada", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
};


// New Survey Component
const SurveyInvitation: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="relative bg-gradient-to-r from-trefa-blue to-indigo-600 text-white rounded-xl p-6 overflow-hidden shadow-lg">
        <div className="relative z-10">
            <h3 className="font-bold text-lg">Valoramos y premiamos tu opinión</h3>
            <p className="text-sm mt-1 text-white/80 max-w-2xl">
                Responde una breve encuesta sobre tu experiencia y recibe un bono especial para tu próxima compra o financiamiento. ¡Solo te tomará 3 minutos!
            </p>
            <div className="mt-4">
                <a
                    href="/encuesta-anonima"
                    className="inline-flex items-center px-5 py-2 bg-white text-trefa-blue font-semibold rounded-lg text-sm hover:bg-gray-100 transition-colors shadow-md"
                >
                    Realizar Encuesta <ArrowRight className="w-4 h-4 ml-2" />
                </a>
            </div>
        </div>
        <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-white/60 hover:text-white/90 rounded-full hover:bg-white/20 transition-colors z-20"
            aria-label="Cerrar invitación"
        >
            <X className="w-5 h-5" />
        </button>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full opacity-50 z-0"></div>
        <div className="absolute top-0 right-10 w-24 h-24 bg-white/5 rounded-full opacity-30 z-0"></div>
    </div>
);

const BetaSurveyInvitation: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="relative bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl p-6 overflow-hidden shadow-lg">
        <div className="relative z-10">
            <h3 className="font-bold text-lg">¿Probando el nuevo sitio? Danos tu feedback</h3>
            <p className="text-sm mt-1 text-white/80 max-w-2xl">
                Tu opinión es clave para mejorar. Responde esta encuesta sobre tu experiencia con la nueva versión de la plataforma.
            </p>
            <div className="mt-4">
                <Link
                    href="/beta-v.0.1"
                    className="inline-flex items-center px-5 py-2 bg-white text-indigo-700 font-semibold rounded-lg text-sm hover:bg-gray-100 transition-colors shadow-md"
                >
                    Dar mi opinión <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
        </div>
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-white/60 hover:text-white/90 rounded-full hover:bg-white/20 transition-colors z-20"
            aria-label="Cerrar invitación de encuesta beta"
        >
            <X className="w-5 h-5" />
        </button>
        {/* Decorative elements */}
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full opacity-50 z-0"></div>
        <div className="absolute top-0 right-10 w-20 h-20 bg-white/5 rounded-full opacity-30 z-0"></div>
    </div>
);

const OnboardingGuide: React.FC<{ profile: Profile | null, isBankProfileComplete: boolean }> = ({ profile, isBankProfileComplete }) => {
    // Address fields (address, city, state, zip_code) are now part of the application form, not profile requirements
    const requiredFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
    const isProfileComplete = requiredFields.every(field => profile?.[field] && String(profile[field]).trim() !== '');

    if (isProfileComplete && isBankProfileComplete) {
        return null; // Don't show if everything is done.
    }

    let title, description, linkTo, linkText, Icon;

    if (!isProfileComplete) {
        title = "Paso 1: Completa tu Perfil";
        description = "Necesitamos tu información personal para poder calcular tu RFC y preparar tus solicitudes.";
        linkTo = "/escritorio/profile";
        linkText = "Ir a Mi Perfil";
        Icon = User;
    } else {
        title = "Paso 2: Perfilamiento Bancario";
        description = "¡Excelente! Ahora completa tu perfil bancario para que podamos encontrar la mejor opción de crédito para ti.";
        linkTo = "/escritorio/profile?tab=perfil-bancario";
        linkText = "Comenzar Perfilación";
        Icon = Building2;
    }

    return (
        <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl border-2 border-primary-200 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8" />
            </div>
            <div className="flex-grow text-center sm:text-left">
                <h3 className="text-lg font-bold text-primary-900">{title}</h3>
                <p className="text-sm text-primary-800 mt-1">{description}</p>
            </div>
            <Link
                href={linkTo}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-md flex-shrink-0"
            >
                {linkText} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
        </div>
    );
};

const EbookCta: React.FC = () => (
    <div className="relative bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-6 overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col gap-4">
            <div>
                <h3 className="font-bold text-lg">¿Pensando en vender tu auto?</h3>
                <p className="text-sm mt-1 text-white/90">
                    La información de calidad puede ahorrarte muchos dolores de cabeza, y queremos que la tengas.
                </p>
            </div>
            <div>
                <a
                    href="/Manual-Venta-TREFA-2025.pdf"
                    download="Manual-Venta-TREFA-2025.pdf"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-green-700 font-semibold rounded-lg text-sm hover:bg-gray-100 transition-colors shadow-md w-full sm:w-auto"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Descargar Manual 2025
                </a>
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full opacity-50 z-0"></div>
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/5 rounded-full opacity-30 z-0"></div>
    </div>
);

// Mi Asesor Component
const MiAsesor: React.FC<{ asesorId: string }> = ({ asesorId }) => {
    const [asesor, setAsesor] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAsesor = async () => {
            console.log('Fetching advisor with ID:', asesorId);
            try {
                const asesorProfile = await ProfileService.getProfile(asesorId);
                console.log('Advisor profile fetched:', asesorProfile);
                if (asesorProfile) {
                    setAsesor(asesorProfile);
                } else {
                    setError('No se pudo cargar la información del asesor');
                }
            } catch (error: any) {
                console.error('Error fetching advisor profile:', error);
                setError('Error al cargar el asesor: ' + (error.message || 'Desconocido'));
            } finally {
                setLoading(false);
            }
        };

        if (asesorId) {
            fetchAsesor();
        } else {
            console.warn('No advisor ID provided');
            setLoading(false);
            setError('No se ha asignado un asesor aún');
        }
    }, [asesorId]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            </div>
        );
    }

    if (error || !asesor) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mi Asesor</h3>
                <div className="text-center py-4">
                    <UserCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{error || 'Información del asesor no disponible'}</p>
                    <p className="text-xs text-gray-500 mt-2">Si necesitas ayuda, contáctanos por WhatsApp</p>
                </div>
            </div>
        );
    }

    const asesorName = `${asesor.first_name || ''} ${asesor.last_name || ''}`.trim() || 'Tu Asesor';
    const asesorPhone = asesor.phone || '5218187049079';
    const whatsappLink = `https://wa.me/${asesorPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(asesor.first_name || 'asesor')},%20tengo%20una%20pregunta%20sobre%20mi%20solicitud`;
    const profilePicture = (asesor as any).picture_url || (asesor as any).avatar_url || (asesor as any).profile_picture_url;

    return (
        <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8 text-center">Mi Asesor Asignado</h3>
            <div className="flex flex-col items-center">
                <div className="mb-6 relative flex justify-center">
                    {profilePicture ? (
                        <div className="relative">
                            <img
                                src={profilePicture}
                                alt={asesorName}
                                className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-primary-300 shadow-2xl ring-4 ring-primary-100 transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-4 border-primary-300 shadow-2xl ring-4 ring-primary-100">
                            <UserCircle className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 text-primary-600" />
                        </div>
                    )}
                </div>
                <div className="text-center mb-8 w-full">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{asesorName}</p>
                    <p className="text-base sm:text-lg text-primary-700 font-semibold mb-4">Asesor de Ventas TREFA</p>
                    {asesorPhone && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm sm:text-base text-gray-800 font-medium">{asesorPhone}</p>
                        </div>
                    )}
                </div>
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl text-base sm:text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                    <MessageCircle className="w-6 h-6" />
                    Contactar por WhatsApp
                </a>
                <p className="text-xs text-gray-500 mt-4 text-center">
                    Tu asesor está disponible para ayudarte con tu solicitud
                </p>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { user, profile, loading: userLoading } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBankProfileComplete, setIsBankProfileComplete] = useState(false);
  const [isSurveyVisible, setIsSurveyVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [showPrintableModal, setShowPrintableModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setAppsLoading(true);
    setError(null);
    try {
        const [userApps, bankProfileStatus] = await Promise.all([
            ApplicationService.getUserApplications(user.id),
            BankProfilingService.isBankProfileComplete(user.id)
        ]);
        setApplications(userApps);
        setIsBankProfileComplete(bankProfileStatus);
    } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        setError(error.message || 'Ocurrió un error al cargar la información.');
    } finally {
        setAppsLoading(false);
    }
  }, [user?.id]);

  // Effect for loading data when user logs in
  useEffect(() => {
    if (!userLoading && user) {
        loadData();
    } else if (!userLoading && !user) {
        setAppsLoading(false);
    }
  }, [user, userLoading, loadData]);

  const drafts = useMemo(() => applications.filter(app => app.status === 'draft'), [applications]);
  const submittedApps = useMemo(() => applications.filter(app => app.status !== 'draft'), [applications]);

  // Required profile fields definition
  const requiredFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];

  // Effect for calculating onboarding step
  useEffect(() => {
    if (!profile || !user) return;

    const isProfileComplete = requiredFields.every(field => profile?.[field] && String(profile[field]).trim() !== '');

    // Step 1: Personal Information (incomplete profile)
    let step = 1;

    // Step 2: Banking Profile (profile complete, need banking profile)
    if (isProfileComplete && !isBankProfileComplete) {
      step = 2;
    }

    // Step 3: Select Vehicle (banking profile submitted, need to select vehicle)
    // User reaches this step once they submit their banking profile, even if no applications exist yet
    if (isProfileComplete && isBankProfileComplete && applications.length === 0) {
      step = 3;
    }

    // Step 4: Submit Application (vehicle selected via draft, but not submitted)
    if (isProfileComplete && isBankProfileComplete && applications.length > 0 && submittedApps.length === 0) {
      step = 4;
    }

    // If they have submitted apps, hide the stepper completely (step > 4)
    if (submittedApps.length > 0) {
      step = 5; // Beyond the last step, will hide stepper
    }

    setOnboardingStep(step);
  }, [profile, user, isBankProfileComplete, applications, submittedApps]);

  // Effect for showing the onboarding modal (only for new users without profile data)
  useEffect(() => {
    if (user?.id && profile && !onboardingChecked) {
      // Only show onboarding if profile is incomplete AND they haven't dismissed it in this session
      const ONBOARDING_KEY = `dashboardOnboardingShown_${user.id}`;
      const hasSeenOnboarding = sessionStorage.getItem(ONBOARDING_KEY); // Use sessionStorage instead of localStorage

      // Check if profile is incomplete (missing key fields)
      const isNewUser = !profile.first_name || !profile.last_name || !profile.phone;

      if (!hasSeenOnboarding && isNewUser) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true); // Mark as checked to prevent re-running
    }
  }, [user?.id, profile, onboardingChecked]); // Check when profile loads

  const handleDeleteDraft = async (draftId: string) => {
    if (!user || !window.confirm('¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer.')) return;
    try {
        await ApplicationService.deleteApplication(draftId, user.id);
        setApplications(prev => prev.filter(app => app.id !== draftId));
    } catch (e: any) {
        setError(e.message || 'No se pudo eliminar el borrador.');
    }
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    if (user) {
      const ONBOARDING_KEY = `dashboardOnboardingShown_${user.id}`;
      sessionStorage.setItem(ONBOARDING_KEY, 'true'); // Use sessionStorage so it resets per session
    }
  };


  // Get user's first name from nombre_completo (nombre field) if available, otherwise don't show personalized message
  const userName = profile?.nombre ? (profile.nombre.split(' ')[0] || undefined) : (profile?.first_name || undefined);

  // Show document upload section for any non-draft application (most recent first)
  const activeApplicationForDocs = applications
    .filter(app => app.status !== 'draft')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (appsLoading || userLoading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
        </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-200 max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Error al Cargar</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Intentar de Nuevo
        </button>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={handleCompleteOnboarding} />}
      <div className="space-y-6 lg:space-y-8 px-4 sm:px-6 lg:ml-6 lg:pl-6 text-neutral-800 max-w-full overflow-x-hidden bg-white">
        <div>
          <h4 className="text-lg sm:text-xl font-semibold text-neutral-800">Bienvenido a tu Escritorio, {userName}</h4>
          <p className="mt-1 text-sm text-neutral-600">Administra tus solicitudes y explora opciones de financiamiento.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8 lg:pl-5">
            {/* Show OnboardingStepper only if not on step 5 (which means they've submitted apps) */}
            {onboardingStep < 5 && (
              <OnboardingStepper
                currentStep={onboardingStep}
                isProfileComplete={!!profile && requiredFields.every(field => profile?.[field] && String(profile[field]).trim() !== '')}
                userName={profile?.first_name || 'Usuario'}
                onStepClick={(step) => {
                  // Handle step navigation
                  console.log('User clicked step:', step);
                }}
              />
            )}

            {/* Mi Asesor - Show on mobile right after onboarding stepper */}
            <div className="lg:hidden">
                {profile?.asesor_asignado_id && <MiAsesor asesorId={profile.asesor_asignado_id} />}
            </div>

            {/* Borradores de Solicitud - Show on mobile at the top (after Mi Asesor) */}
            {drafts.length > 0 && (
                <div className="lg:hidden bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <FileEdit className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
                        Borradores de Solicitud
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                        {drafts.map(draft => {
                            const status = statusMap[draft.status] || statusMap[APPLICATION_STATUS.DRAFT];
                            return (
                                <div key={draft.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex flex-col gap-3 mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm sm:text-base">{draft.car_info?._vehicleTitle || draft.car_info?.vehicleTitle || 'Solicitud General'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Creado: {new Date(draft.created_at).toLocaleDateString()}</p>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1.5 ${status.bgColor} ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                {status.text}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/escritorio/aplicacion/${draft.id}`}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors touch-manipulation min-h-[44px]"
                                    >
                                        <EditIcon className="w-4 h-4"/> Continuar Editando
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

             {submittedApps.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                            <History className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
                            Mis Solicitudes Enviadas
                        </h3>
                         <Link
                            href="/escritorio/aplicacion"
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors touch-manipulation min-h-[44px] w-full sm:w-auto"
                         >
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Solicitud
                        </Link>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {submittedApps.map(app => {
                            const status = statusMap[app.status] || statusMap[APPLICATION_STATUS.DRAFT];
                            const canEdit = app.status !== APPLICATION_STATUS.EN_REVISION && app.status !== APPLICATION_STATUS.REVIEWING;
                            return (
                                <div key={app.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex flex-col gap-2 mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{app.car_info?._vehicleTitle || app.car_info?.vehicleTitle || 'Solicitud General'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Enviada: {new Date(app.created_at).toLocaleDateString()}</p>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1.5 ${status.bgColor} ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                {status.text}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Document Upload Link */}
                                    {app.public_upload_token && (
                                        <div className="mt-3">
                                            <PublicUploadLinkCard token={app.public_upload_token} />
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                        <button
                                            onClick={() => {
                                                setSelectedApplication(app);
                                                setShowPrintableModal(true);
                                            }}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors touch-manipulation min-h-[44px]"
                                        >
                                            <Eye className="w-4 h-4"/> Ver Solicitud
                                        </button>
                                        {canEdit ? (
                                            <Link
                                                href={`/escritorio/aplicacion/${app.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors touch-manipulation min-h-[44px]"
                                            >
                                                <EditIcon className="w-4 h-4"/> Editar
                                            </Link>
                                        ) : (
                                            <button
                                                disabled
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed opacity-60"
                                            >
                                                <EditIcon className="w-4 h-4"/> Editar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                drafts.length === 0 && (
                    <div className="relative rounded-xl border-2 border-dashed border-orange-200 p-8 text-center overflow-hidden bg-orange-50">
                      {/* Patrón de círculos naranjas decorativo */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `radial-gradient(circle, #FF6801 2px, transparent 2px)`,
                          backgroundSize: '24px 24px'
                        }}>
                      </div>
                      <div className="relative">
                        <CreditCard className="w-10 h-12 text-primary-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary-900 mb-2">¡Bienvenido a TREFA!</h3>
                        <p className="text-primary-800 mb-6">
                          Comienza tu proceso de financiamiento automotriz.
                        </p>
                        <Link
                          href="/escritorio/aplicacion"
                          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Solicitar Financiamiento
                        </Link>
                      </div>
                    </div>
                )
            )}

            {/* DocumentUploadSection removido - ahora se usa el dropzone público accesible desde UserApplicationsPage */}

            <FinancialProjection />

            {/* Surveys and Ebook on Mobile */}
            <div className="lg:hidden space-y-6">
                {isSurveyVisible && <SurveyInvitation onClose={() => setIsSurveyVisible(false)} />}
                <EbookCta />
            </div>

            <VehicleCarousel isBankProfileComplete={isBankProfileComplete} />
        </div>


        {/* Sidebar Column (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 lg:space-y-8">
            {profile?.asesor_asignado_id && <MiAsesor asesorId={profile.asesor_asignado_id} />}
            {drafts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <FileEdit className="w-5 h-5 mr-3 text-primary-600" />
                        Borradores de Solicitud
                    </h3>
                    <div className="space-y-4">
                        {drafts.map(draft => (
                            <div key={draft.id} className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">{draft.car_info?._vehicleTitle || draft.car_info?.vehicleTitle || 'Borrador sin auto seleccionado'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Última modificación: {new Date(draft.updated_at).toLocaleDateString('es-MX')}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Link href={`/escritorio/aplicacion/${draft.id}`} className="px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-md hover:bg-primary-700">
                                        Continuar
                                    </Link>
                                    <button onClick={() => handleDeleteDraft(draft.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {isSurveyVisible && <SurveyInvitation onClose={() => setIsSurveyVisible(false)} />}
            <EbookCta />
        </aside>
      </div>
    </div>

    {/* PrintableApplication Modal */}
    {showPrintableModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPrintableModal(false)}>
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setShowPrintableModal(false)}
                    className="sticky top-4 right-4 float-right z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
                <div className="p-6">
                    <PrintableApplication application={selectedApplication} />
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Dashboard;
