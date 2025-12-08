'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  MapPin,
  Package,
  FileText,
  Bell,
  CreditCard,
  User,
  Menu,
  X,
  CheckCircle,
  Copy,
  Car,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  MessageCircle,
  Heart,
  TrendingUp,
  Loader2,
  FileUp
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { DocumentService } from '@/services/documentService';
import { conversionTracking } from '@/services/ConversionTrackingService';

const SALES_AGENTS = [
  { id: 'd21e808e-083c-48fd-be78-d52ee7837146', name: 'Anahi Garza Garcia', phone: '+52 81 8704 9079' },
  { id: 'cb55da28-ef7f-4632-9fcd-a8d9f37f1463', name: 'Carlos Isidro Berrones', phone: '+52 81 8704 9079' },
  { id: 'e49bf74c-308f-4e8d-b683-3575d7214e98', name: 'Daniel Rodríguez', phone: '+52 81 8704 9079' },
  { id: '7e239ec5-aceb-4e9f-ae67-2ac16733609b', name: 'David Rojas', phone: '+52 81 8704 9079' },
  { id: 'fe901e9e-c3f2-41a1-b5a0-6d95c9d81344', name: 'David Marconi Mazariegos', phone: '+52 81 8704 9079' },
  { id: 'a4165ce3-e52b-4f8d-9123-327c0179f73c', name: 'Israel Ramírez', phone: '+52 81 8704 9079' },
  { id: '4c8c43bb-c936-44a2-ab82-f40326387770', name: 'Ramón Araujo', phone: '+52 81 8704 9079' },
];

// Documentos obligatorios
const REQUIRED_DOCUMENTS = [
  'ine_front',
  'ine_back',
  'proof_address',
  'proof_income'
];

// Mensajes motivacionales basados en progreso
const getMotivationalMessage = (progress: number): string => {
  if (progress === 0) return '¡Comienza tu proceso de financiamiento hoy!';
  if (progress < 25) return '¡Buen comienzo! Sigue completando tu información.';
  if (progress < 50) return '¡Vas muy bien! Estás a mitad de camino.';
  if (progress < 75) return '¡Excelente progreso! Ya casi terminas.';
  if (progress < 100) return '¡Casi lo logras! Solo un paso más.';
  return '¡Felicidades! Has completado todo el proceso.';
};

const DashboardSidebarPage: React.FC = () => {
  const { isAdmin, user } = useAuth();

  const [stats, setStats] = useState({
    borradores: 0,
    enviadas: 0,
    documentosPendientes: 0,
    status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending',
    displayStatus: 'draft' as string, // Computed display status
    progreso: 0,
    profileComplete: false,
    bankProfileComplete: false
  });
  const [publicUploadLink, setPublicUploadLink] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const [draftApplications, setDraftApplications] = useState<any[]>([]);
  const [submittedApplications, setSubmittedApplications] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState<any>(null);
  const [sidebarVehicles, setSidebarVehicles] = useState<any[]>([]);
  const [vehiclesLabel, setVehiclesLabel] = useState('');
  const pathname = usePathname();

  // Dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar perfil completo
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileComplete = !!(
        profile?.first_name &&
        profile?.last_name &&
        profile?.phone &&
        profile?.email
      );

      // Verificar perfilación bancaria completa
      const { data: bankProfile } = await supabase
        .from('bank_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const bankProfileComplete = bankProfile?.is_complete || false;

      // Obtener todas las solicitudes del usuario
      const { data: applications } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Obtener la aplicación ACTIVA (no borrador más reciente) para mostrar su estado
      const activeApp = applications?.find(app => app.status !== 'draft');
      const latestApp = activeApp || applications?.[0]; // Si no hay activa, usa la más reciente
      setLatestApplication(latestApp);

      // Separar borradores y enviadas
      const drafts = applications?.filter(app => app.status === 'draft') || [];
      // Enviadas incluye todas las solicitudes que NO son borrador
      const submitted = applications?.filter(app => app.status !== 'draft') || [];

      setDraftApplications(drafts);
      setSubmittedApplications(submitted);

      const borradores = drafts.length;
      const enviadas = submitted.length;

      // Validar límite de 1 solicitud enviada
      if (enviadas > 1) {
        console.warn('⚠️ Usuario tiene más de 1 solicitud enviada');
      }

      // Obtener documentos de la solicitud más reciente
      let documentosPendientes = 4;
      let uploadedDocs: any[] = [];

      if (latestApp) {
        const { data: documents } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('application_id', latestApp.id);

        uploadedDocs = documents || [];

        // Contar documentos obligatorios presentes
        const docTypes = new Set(uploadedDocs.map(doc => doc.document_type));

        let docsPresentes = 0;
        if (docTypes.has('ine_front')) docsPresentes++;
        if (docTypes.has('ine_back')) docsPresentes++;
        if (docTypes.has('proof_address')) docsPresentes++;

        const proofIncomeCount = uploadedDocs.filter(doc =>
          doc.document_type === 'proof_income'
        ).length;
        if (proofIncomeCount >= 1) docsPresentes++;

        documentosPendientes = 4 - docsPresentes;

        // Obtener auto seleccionado
        if (latestApp.car_info?._ordenCompra) {
          const { data: vehicle } = await supabase
            .from('inventario_cache')
            .select('*')
            .eq('ordencompra', latestApp.car_info._ordenCompra)
            .single();

          if (!vehicle) {
            console.warn('Vehicle not found in database for ordencompra:', latestApp.car_info._ordenCompra);
          }
          setSelectedVehicle(vehicle);
        }

        // Generar link público
        if (latestApp.public_upload_token) {
          setPublicUploadLink(`https://trefa.mx/documentos/${latestApp.public_upload_token}`);
        }
      }

      // Calcular progreso basado en pasos reales del proceso
      let progress = 0;
      const hasSubmittedApp = enviadas > 0;

      // Paso 1: Perfil completo (25%)
      if (profileComplete) progress += 25;

      // Paso 2: Perfilación bancaria completa (25%)
      if (bankProfileComplete) progress += 25;

      // Paso 3: Solicitud enviada (25%)
      if (hasSubmittedApp) progress += 25;

      // Paso 4: Documentos completos (25%)
      if (hasSubmittedApp && documentosPendientes === 0) {
        progress += 25;
      } else if (hasSubmittedApp && documentosPendientes < 4) {
        // Progreso parcial de documentos
        progress += ((4 - documentosPendientes) / 4) * 25;
      }

      // Compute display status based on application status and documents
      const baseStatus = activeApp?.status || latestApp?.status || 'draft';
      let displayStatus = baseStatus;

      // If application is submitted/pending but missing documents, show "Faltan Documentos"
      if ((baseStatus === 'submitted' || baseStatus === 'pending') && documentosPendientes > 0) {
        displayStatus = 'faltan_documentos';
      }
      // If application is submitted/pending and all docs are complete, show "En Revisión"
      else if ((baseStatus === 'submitted' || baseStatus === 'pending') && documentosPendientes === 0) {
        displayStatus = 'en_revision';
      }

      setStats({
        borradores,
        enviadas,
        documentosPendientes,
        status: baseStatus,
        displayStatus,
        progreso: Math.min(Math.round(progress), 100),
        profileComplete,
        bankProfileComplete
      });

      // Cargar asesor asignado
      if (profile?.asesor_asignado_id) {
        const agent = SALES_AGENTS.find(a => a.id === profile.asesor_asignado_id);
        if (agent) {
          setAssignedAgent(agent);
        }
      }

      // Cargar autos para sidebar: favoritos > recently viewed > sugerencias
      let vehiclesLoaded = false;

      try {
        // 1. Intentar cargar favoritos
        const { data: favorites, error: favError } = await supabase
          .from('user_favorites')
          .select('vehicle_id')
          .eq('user_id', user.id)
          .limit(3);

        if (favorites && favorites.length > 0) {
          const vehicleIds = favorites.map(f => f.vehicle_id);
          const { data: favVehicles, error: vehError } = await supabase
            .from('inventario_cache')
            .select('id, slug, title, precio, feature_image, fotos_exterior_url, galeria_exterior')
            .in('id', vehicleIds)
            .limit(3);

          if (favVehicles && favVehicles.length > 0) {
            setSidebarVehicles(favVehicles);
            setVehiclesLabel('Tus Favoritos');
            vehiclesLoaded = true;
          }
        }

        // 2. Si no hay favoritos, intentar recently viewed
        if (!vehiclesLoaded) {
          const recentlyViewedRaw = localStorage.getItem('trefa_recently_viewed');

          if (recentlyViewedRaw) {
            const recentlyViewed = JSON.parse(recentlyViewedRaw);
            if (recentlyViewed && recentlyViewed.length > 0) {
              setSidebarVehicles(recentlyViewed.slice(0, 3));
              setVehiclesLabel('Vistos Recientemente');
              vehiclesLoaded = true;
            }
          }
        }

        // 3. Si no hay ni favoritos ni recently viewed, mostrar sugerencias
        if (!vehiclesLoaded) {
          const { data: suggestions, error: sugError } = await supabase
            .from('inventario_cache')
            .select('id, slug, title, precio, feature_image, fotos_exterior_url, galeria_exterior')
            .eq('disponibilidad', 'disponible')
            .order('created_at', { ascending: false })
            .limit(3);

          if (suggestions && suggestions.length > 0) {
            setSidebarVehicles(suggestions);
            setVehiclesLabel('Algunas Sugerencias');
          }
        }
      } catch (error) {
        console.error('Error cargando autos para sidebar:', error);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []); // Empty deps - function doesn't depend on any external values

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getStatusConfig = (status: string) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase();

    switch (normalizedStatus) {
      case 'draft':
      case 'borrador':
        return {
          label: 'Borrador',
          bgColor: 'bg-gray-500',
          textColor: 'text-white'
        };
      case 'faltan documentos':
      case 'faltan_documentos':
      case 'pending_docs':
        return {
          label: 'Faltan Documentos',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'completa':
        return {
          label: 'Completa',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
      case 'en revisión':
      case 'en_revision':
      case 'submitted':
      case 'pending':
      case 'reviewing':
      case 'in_review':
        return {
          label: 'En Revisión',
          bgColor: 'bg-indigo-500',
          textColor: 'text-white'
        };
      case 'aprobada':
      case 'approved':
        return {
          label: 'Aprobada',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'rechazada':
      case 'rejected':
        return {
          label: 'Rechazada',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      default:
        // Return null to hide the box when there's no valid status
        return null;
    }
  };

  // Reload stats when pathname changes (user navigates)
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const copyToClipboard = () => {
    if (publicUploadLink) {
      navigator.clipboard.writeText(publicUploadLink);
      toast.success('Link copiado al portapapeles');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusConfig = getStatusConfig(stats.displayStatus);
  const docsComplete = stats.documentosPendientes === 0;
  const motivationalMessage = getMotivationalMessage(stats.progreso);

  // Dropzone handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!latestApplication || !publicUploadLink) return;
    setIsDragging(true);
  }, [latestApplication, publicUploadLink]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the dropzone entirely
    if (dropzoneRef.current && !dropzoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!latestApplication || !user?.id) {
      toast.error('No hay una solicitud activa para subir documentos');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Filter only valid file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      toast.error('Solo se permiten archivos JPG, PNG, WebP o PDF');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of validFiles) {
      try {
        // Determine document type based on file name hints
        let documentType = 'proof_income'; // Default
        const fileName = file.name.toLowerCase();

        if (fileName.includes('ine') || fileName.includes('credencial')) {
          if (fileName.includes('front') || fileName.includes('frente')) {
            documentType = 'ine_front';
          } else if (fileName.includes('back') || fileName.includes('rever') || fileName.includes('atras')) {
            documentType = 'ine_back';
          } else {
            documentType = 'ine_front'; // Default to front
          }
        } else if (fileName.includes('domicilio') || fileName.includes('address') || fileName.includes('comprobante')) {
          documentType = 'proof_address';
        } else if (fileName.includes('ingreso') || fileName.includes('income') || fileName.includes('nomina') || fileName.includes('estado')) {
          documentType = 'proof_income';
        }

        await DocumentService.uploadDocument(file, latestApplication.id, documentType, user.id);
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} documento(s) subido(s) exitosamente`);

      // Track document upload event
      try {
        await conversionTracking.track('DocumentUpload', 'Document Upload', {
          applicationId: latestApplication.id,
          userId: user.id,
          documentCount: successCount,
          page: '/escritorio'
        });
      } catch (trackError) {
        console.error('Error tracking document upload:', trackError);
      }

      // Reload stats to update document count
      loadStats();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} documento(s) no se pudieron subir`);
    }
  }, [latestApplication, user?.id, loadStats]);

  return (
    <div className="w-full max-w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 max-w-full">
        {/* Main Content */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Limit Warning */}
            {stats.enviadas > 1 && (
              <Card className="border-2 border-yellow-500 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800">
                        Aviso: Solo se permite 1 solicitud enviada a la vez
                      </p>
                      <p className="text-sm text-yellow-700">
                        Actualmente tienes {stats.enviadas} solicitudes enviadas. Por favor, contacta a soporte.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards Row */}
            <div className={`grid grid-cols-2 ${statusConfig ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-3'} gap-2 sm:gap-3 md:gap-4 w-full max-w-full`}>
              {/* Borradores - Clickable */}
              <div
                className="cursor-pointer touch-manipulation"
                onClick={() => setShowDrafts(!showDrafts)}
              >
                <Card className="hover:shadow-md transition-all hover:scale-[1.02]">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="text-center">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Borradores</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.borradores}</p>
                      {stats.borradores > 0 && (
                        <div className="mt-1 sm:mt-2">
                          {showDrafts ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mx-auto text-gray-500" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mx-auto text-gray-500" />}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enviadas - Clickable */}
              <div
                className="cursor-pointer touch-manipulation"
                onClick={() => setShowSubmitted(!showSubmitted)}
              >
                <Card className="hover:shadow-md transition-all hover:scale-[1.02]">
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="text-center">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Enviadas</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.enviadas}</p>
                      {stats.enviadas > 0 && (
                        <div className="mt-1 sm:mt-2">
                          {showSubmitted ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mx-auto text-gray-500" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mx-auto text-gray-500" />}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Docs Pendientes */}
              <Card className={`${docsComplete ? 'bg-green-50 border-green-200' : ''}`}>
                <CardContent className="p-2.5 sm:p-3 md:p-4">
                  <div className="text-center">
                    {docsComplete ? (
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1 sm:mb-2" />
                    ) : (
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto mb-1 sm:mb-2" />
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Docs. Pendientes</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${docsComplete ? 'text-green-600' : 'text-gray-900'}`}>
                      {stats.documentosPendientes}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Estado de Solicitud - Only show if there's a valid status */}
              {statusConfig && (
                <Card className={statusConfig.bgColor}>
                  <CardContent className="p-2.5 sm:p-3 md:p-4">
                    <div className="text-center">
                      <MapPin className={`w-6 h-6 sm:w-8 sm:h-8 ${statusConfig.textColor} mx-auto mb-1 sm:mb-2`} />
                      <p className={`text-xs sm:text-sm ${statusConfig.textColor} opacity-90 font-medium`}>Estado</p>
                      <p className={`text-lg sm:text-xl font-bold ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dropdown Lists */}
            {showDrafts && draftApplications.length > 0 && (
              <Card className="border-2 border-gray-300">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Borradores</h3>
                  <div className="space-y-2">
                    {draftApplications.map((app) => (
                      <Link
                        key={app.id}
                        href={`/escritorio/aplicacion/${app.id}`}
                        className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.car_info?._vehicleTitle || app.car_info?.vehicleTitle || 'Solicitud sin auto'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Creada: {formatDate(app.created_at)}
                            </p>
                          </div>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Borrador
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {showSubmitted && submittedApplications.length > 0 && (
              <Card className="border-2 border-blue-300">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Solicitudes Enviadas</h3>
                  <div className="space-y-2">
                    {submittedApplications.map((app) => (
                      <Link
                        key={app.id}
                        href={`/escritorio/seguimiento/${app.id}`}
                        className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.car_info?._vehicleTitle || app.car_info?.vehicleTitle || 'Solicitud sin auto'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Enviada: {formatDate(app.created_at)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            app.status === 'approved' ? 'bg-green-200 text-green-800' :
                            app.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {getStatusConfig(app.status)?.label || app.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar with Motivational Message */}
            <Card>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Progreso del Proceso
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-primary-600">
                      {motivationalMessage}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.progreso}%</span>
                  </div>
                </div>
                <Progress value={stats.progreso} className="h-2 sm:h-3" />
              </CardContent>
            </Card>

            {/* Action Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full max-w-full">
              {/* Mi Perfil con check sutil */}
              <Link href="/escritorio/profile" className="touch-manipulation">
                <Card className={`hover:shadow-md transition-all hover:scale-[1.02] h-full ${
                  stats.profileComplete ? 'border-green-200 bg-green-50' : ''
                }`}>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      {stats.profileComplete ? (
                        <div className="relative flex-shrink-0">
                          <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">Mi Perfil</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {stats.profileComplete ? 'Completado ✓' : 'Actualiza tu información'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Perfilación Bancaria con check sutil */}
              <Link href="/escritorio/perfilacion-bancaria" className="touch-manipulation">
                <Card className={`hover:shadow-md transition-all hover:scale-[1.02] h-full ${
                  stats.bankProfileComplete ? 'border-green-200 bg-green-50' : ''
                }`}>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      {stats.bankProfileComplete ? (
                        <div className="relative flex-shrink-0">
                          <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">Perfilación Bancaria</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {stats.bankProfileComplete ? 'Completado ✓' : 'Completa tu perfil'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Auto Seleccionado */}
              {selectedVehicle ? (
                <Link href={`/autos/${selectedVehicle.slug || selectedVehicle.id}`} className="touch-manipulation">
                  <Card className="hover:shadow-md transition-all hover:scale-[1.02] h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {selectedVehicle.feature_image || selectedVehicle.fotos_exterior_url?.[0] ? (
                          <img
                            src={selectedVehicle.feature_image || selectedVehicle.fotos_exterior_url?.[0]}
                            alt={selectedVehicle.title}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <Car className="w-14 h-14 sm:w-16 sm:h-16 text-primary-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {selectedVehicle.title || 'Auto'}
                          </p>
                          <p className="text-xs text-gray-500">ID: {selectedVehicle.id}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Ver detalles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link href="/autos" className="touch-manipulation">
                  <Card className="border-2 border-dashed hover:border-primary-500 transition-colors cursor-pointer h-full">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-center gap-3">
                        <Car className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-600">Sin auto</p>
                          <p className="text-sm text-gray-500">Selecciona uno</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Mobile Only: Sidebar Content in Main Area */}
            <div className="md:hidden space-y-4">
              {/* Assigned Agent Card */}
              {assignedAgent && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Mi Asesor
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {assignedAgent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{assignedAgent.name}</p>
                        <p className="text-sm text-gray-600">{assignedAgent.phone}</p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${assignedAgent.phone.replace(/\D/g, '')}?text=Hola,%20necesito%20ayuda`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium touch-manipulation"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contactar por WhatsApp
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Vehicles Section */}
              {sidebarVehicles.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      {vehiclesLabel === 'Tus Favoritos' && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                      {vehiclesLabel === 'Vistos Recientemente' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                      {vehiclesLabel}
                    </h3>
                    <div className="space-y-3">
                      {sidebarVehicles.map((vehicle) => {
                        const imageUrl = vehicle.feature_image || vehicle.fotos_exterior_url?.[0] || vehicle.galeria_exterior?.[0];
                        return (
                          <Link
                            key={vehicle.id}
                            href={`/autos/${vehicle.slug || vehicle.id}`}
                            className="block"
                          >
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={vehicle.title}
                                  className="w-20 h-15 object-cover rounded flex-shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                  <Car className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                                  {vehicle.title}
                                </p>
                                <p className="text-sm text-primary-600 font-bold mt-1">
                                  ${vehicle.precio?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dropzone Section with QR and Link */}
            {publicUploadLink && latestApplication && (
              <Card
                ref={dropzoneRef}
                className={`border-2 transition-all duration-200 w-full max-w-full overflow-hidden ${
                  isDragging
                    ? 'border-primary-500 bg-primary-100 scale-[1.02] shadow-lg'
                    : 'border-primary-300 bg-gradient-to-br from-primary-50 to-white'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardContent className="p-3 sm:p-4 md:p-6 relative w-full max-w-full">
                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-100/90 rounded-lg z-10">
                      <div className="text-center">
                        <FileUp className="w-12 h-12 text-primary-600 mx-auto mb-2 animate-bounce" />
                        <p className="text-lg font-bold text-primary-700">Suelta tus documentos aquí</p>
                        <p className="text-sm text-primary-600">JPG, PNG, WebP o PDF</p>
                      </div>
                    </div>
                  )}

                  {/* Uploading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg z-10">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-primary-600 mx-auto mb-2 animate-spin" />
                        <p className="text-lg font-semibold text-gray-700">Subiendo documentos...</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 relative w-full max-w-full">
                    {/* QR Code */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
                        <QRCodeSVG
                          value={publicUploadLink}
                          size={100}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600 mt-2">
                        Escanea para subir
                      </p>
                    </div>

                    {/* Dropzone Info */}
                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <Upload className="w-8 h-8 text-primary-600" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            Carga de Documentos
                          </h3>
                          <p className="text-sm text-gray-600">
                            Arrastra documentos aquí o comparte el link
                          </p>
                        </div>
                      </div>

                      {/* Dropzone hint */}
                      <div className="mb-3 p-4 border-2 border-dashed border-primary-300 rounded-lg bg-primary-50/50 text-center cursor-pointer hover:bg-primary-100/50 transition-colors">
                        <FileUp className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                        <p className="text-sm font-medium text-primary-700">
                          Arrastra aquí tus documentos
                        </p>
                        <p className="text-xs text-primary-600">
                          INE, comprobante de domicilio, comprobante de ingresos
                        </p>
                      </div>

                      {/* Link con botón copiar */}
                      <div className="flex items-center gap-2 bg-white p-2 md:p-3 rounded-lg border-2 border-gray-200 w-full max-w-full overflow-hidden">
                        <input
                          type="text"
                          value={publicUploadLink}
                          readOnly
                          className="flex-1 text-xs sm:text-sm text-gray-700 bg-transparent outline-none truncate min-w-0"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Copiar</span>
                          <span className="sm:hidden">Copiar</span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {docsComplete
                          ? '✓ Todos los documentos han sido recibidos'
                          : `Faltan ${stats.documentosPendientes} documento(s) por recibir`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar - Fixed Right Side */}
        <div className="lg:col-span-4 xl:col-span-3 min-w-0 hidden lg:block">
          <Card className="sticky top-6">
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
            {/* Assigned Agent */}
            {assignedAgent && (
              <div className="bg-accent/50 p-2 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                    {assignedAgent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {assignedAgent.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Tu Asesor</p>
                  </div>
                </div>
                <a
                  href={`tel:${assignedAgent.phone}`}
                  className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 bg-background border rounded-md hover:bg-accent transition-colors text-xs font-medium"
                >
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{assignedAgent.phone}</span>
                </a>
              </div>
            )}

            {/* WhatsApp Support */}
            <a
              href="https://wa.me/5218187049079?text=Hola,%20necesito%20ayuda%20con%20mi%20financiamiento"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full px-2 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Soporte WhatsApp
            </a>

            {/* Vehicles Section */}
            {sidebarVehicles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {vehiclesLabel === 'Tus Favoritos' && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                  {vehiclesLabel === 'Vistos Recientemente' && <TrendingUp className="w-3 h-3 text-blue-500" />}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {vehiclesLabel}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {sidebarVehicles.map((vehicle) => {
                    const imageUrl = vehicle.feature_image || vehicle.fotos_exterior_url?.[0] || vehicle.galeria_exterior?.[0];
                    return (
                      <div key={vehicle.id} className="bg-accent/50 rounded-md p-1.5 border">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={vehicle.title}
                              className="w-12 h-9 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              <Car className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold truncate">
                              {vehicle.title}
                            </p>
                            <p className="text-[10px] text-primary font-bold">
                              ${vehicle.precio?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/autos/${vehicle.slug || vehicle.id}`}
                          className="block w-full px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded hover:bg-primary/90 transition-colors text-center"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebarPage;
