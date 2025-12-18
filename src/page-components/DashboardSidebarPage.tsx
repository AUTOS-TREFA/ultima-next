'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  CheckCircle,
  Copy,
  Car,
  Upload,
  AlertCircle,
  Phone,
  MessageCircle,
  Heart,
  TrendingUp,
  Loader2,
  FileUp,
  User,
  CreditCard,
  ArrowRight,
  Clock,
  ChevronRight,
  FileCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '../../supabaseClient';
const supabase = getSupabaseClient();
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

const getMotivationalMessage = (progress: number): string => {
  if (progress === 0) return '¡Comienza tu proceso de financiamiento hoy!';
  if (progress < 25) return '¡Buen comienzo! Sigue completando tu información.';
  if (progress < 50) return '¡Vas muy bien! Estás a mitad de camino.';
  if (progress < 75) return '¡Excelente progreso! Ya casi terminas.';
  if (progress < 100) return '¡Casi lo logras! Solo un paso más.';
  return '¡Felicidades! Has completado todo el proceso.';
};

const DashboardSidebarPage: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const [stats, setStats] = useState({
    borradores: 0,
    enviadas: 0,
    documentosPendientes: 0,
    status: 'draft' as string,
    displayStatus: 'draft' as string,
    progreso: 0,
    profileComplete: false,
    bankProfileComplete: false
  });
  const [publicUploadLink, setPublicUploadLink] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const [assignedAgent, setAssignedAgent] = useState<any>(null);
  const [sidebarVehicles, setSidebarVehicles] = useState<any[]>([]);
  const [vehiclesLabel, setVehiclesLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const profileComplete = !!(profile?.first_name && profile?.last_name && profile?.phone && profile?.email);

      const { data: bankProfile } = await supabase.from('bank_profiles').select('*').eq('user_id', user.id).single();
      const bankProfileComplete = bankProfile?.is_complete || false;

      const { data: applications } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const activeApp = applications?.find(app => app.status !== 'draft');
      const latestApp = activeApp || applications?.[0];
      setLatestApplication(latestApp);

      const drafts = applications?.filter(app => app.status === 'draft') || [];
      const submitted = applications?.filter(app => app.status !== 'draft') || [];

      let documentosPendientes = 4;
      if (latestApp) {
        const { data: documents } = await supabase.from('uploaded_documents').select('*').eq('application_id', latestApp.id);
        const uploadedDocs = documents || [];
        const docTypes = new Set(uploadedDocs.map(doc => doc.document_type));
        let docsPresentes = 0;
        if (docTypes.has('ine_front')) docsPresentes++;
        if (docTypes.has('ine_back')) docsPresentes++;
        if (docTypes.has('proof_address')) docsPresentes++;
        if (uploadedDocs.filter(doc => doc.document_type === 'proof_income').length >= 1) docsPresentes++;
        documentosPendientes = 4 - docsPresentes;

        if (latestApp.car_info?._ordenCompra) {
          const { data: vehicle } = await supabase.from('inventario_cache').select('*').eq('ordencompra', latestApp.car_info._ordenCompra).single();
          setSelectedVehicle(vehicle);
        }

        if (latestApp.public_upload_token) {
          setPublicUploadLink(`https://trefa.mx/documentos/${latestApp.public_upload_token}`);
        }
      }

      let progress = 0;
      const hasSubmittedApp = submitted.length > 0;
      if (profileComplete) progress += 25;
      if (bankProfileComplete) progress += 25;
      if (hasSubmittedApp) progress += 25;
      if (hasSubmittedApp && documentosPendientes === 0) {
        progress += 25;
      } else if (hasSubmittedApp && documentosPendientes < 4) {
        progress += ((4 - documentosPendientes) / 4) * 25;
      }

      const baseStatus = activeApp?.status || latestApp?.status || 'draft';
      let displayStatus = baseStatus;
      if ((baseStatus === 'submitted' || baseStatus === 'pending') && documentosPendientes > 0) {
        displayStatus = 'faltan_documentos';
      } else if ((baseStatus === 'submitted' || baseStatus === 'pending') && documentosPendientes === 0) {
        displayStatus = 'en_revision';
      }

      setStats({
        borradores: drafts.length,
        enviadas: submitted.length,
        documentosPendientes,
        status: baseStatus,
        displayStatus,
        progreso: Math.min(Math.round(progress), 100),
        profileComplete,
        bankProfileComplete
      });

      if (profile?.asesor_asignado_id) {
        const agentBasicInfo = SALES_AGENTS.find(a => a.id === profile.asesor_asignado_id);
        const { data: agentProfile } = await supabase
          .from('profiles')
          .select('picture_url, first_name, last_name')
          .eq('id', profile.asesor_asignado_id)
          .single();

        if (agentBasicInfo) {
          setAssignedAgent({
            ...agentBasicInfo,
            picture_url: agentProfile?.picture_url,
            full_name: agentProfile?.first_name && agentProfile?.last_name
              ? `${agentProfile.first_name} ${agentProfile.last_name}`
              : agentBasicInfo.name
          });
        }
      }

      // Load vehicles for sidebar
      let vehiclesLoaded = false;
      try {
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('vehicle_id')
          .eq('user_id', user.id)
          .limit(3);

        if (favorites && favorites.length > 0) {
          const vehicleIds = favorites.map(f => f.vehicle_id);
          const { data: favVehicles } = await supabase
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

        if (!vehiclesLoaded) {
          const { data: suggestions } = await supabase
            .from('inventario_cache')
            .select('id, slug, title, precio, feature_image, fotos_exterior_url, galeria_exterior')
            .eq('disponibilidad', 'disponible')
            .order('created_at', { ascending: false })
            .limit(3);

          if (suggestions && suggestions.length > 0) {
            setSidebarVehicles(suggestions);
            setVehiclesLabel('Sugerencias');
          }
        }
      } catch (error) {
        console.error('Error cargando autos para sidebar:', error);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadStats(); }, [pathname]);

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'draft':
      case 'borrador':
        return { label: 'Borrador', color: 'bg-slate-100 text-slate-700' };
      case 'faltan documentos':
      case 'faltan_documentos':
      case 'pending_docs':
        return { label: 'Faltan Documentos', color: 'bg-amber-100 text-amber-700' };
      case 'en revisión':
      case 'en_revision':
      case 'submitted':
      case 'pending':
      case 'reviewing':
      case 'in_review':
        return { label: 'En Revisión', color: 'bg-blue-100 text-blue-700' };
      case 'aprobada':
      case 'approved':
        return { label: 'Aprobada', color: 'bg-green-100 text-green-700' };
      case 'rechazada':
      case 'rejected':
        return { label: 'Rechazada', color: 'bg-red-100 text-red-700' };
      default:
        return null;
    }
  };

  const copyToClipboard = () => {
    if (publicUploadLink) {
      navigator.clipboard.writeText(publicUploadLink);
      toast.success('Link copiado al portapapeles');
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!latestApplication || !publicUploadLink) return;
    setIsDragging(true);
  }, [latestApplication, publicUploadLink]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

    for (const file of validFiles) {
      try {
        let documentType = 'proof_income';
        const fileName = file.name.toLowerCase();

        if (fileName.includes('ine') || fileName.includes('credencial')) {
          documentType = fileName.includes('front') || fileName.includes('frente') ? 'ine_front' : 'ine_back';
        } else if (fileName.includes('domicilio') || fileName.includes('address') || fileName.includes('comprobante')) {
          documentType = 'proof_address';
        }

        await DocumentService.uploadDocument(file, latestApplication.id, documentType, user.id);
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} documento(s) subido(s) exitosamente`);
      try {
        await conversionTracking.track('DocumentUpload', 'Document Upload', {
          applicationId: latestApplication.id,
          userId: user.id,
          documentCount: successCount,
          page: '/escritorio'
        });
      } catch (trackError) {}
      loadStats();
    }
  }, [latestApplication, user?.id, loadStats]);

  const statusConfig = getStatusConfig(stats.displayStatus);
  const docsComplete = stats.documentosPendientes === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mi Dashboard</h1>
          <p className="text-sm text-slate-600">{getMotivationalMessage(stats.progreso)}</p>
        </div>
        {statusConfig && (
          <Badge className={`${statusConfig.color} text-xs font-medium px-3 py-1`}>
            {statusConfig.label}
          </Badge>
        )}
      </div>

      {/* Main Layout: Content + Right Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Progreso del proceso</span>
                <span className="text-sm font-bold text-slate-900">{stats.progreso}%</span>
              </div>
              <Progress value={stats.progreso} className="h-2" />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/escritorio/seguimiento">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.enviadas}</div>
                  <div className="text-xs text-slate-600">Solicitudes</div>
                </CardContent>
              </Card>
            </Link>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.borradores}</div>
                <div className="text-xs text-slate-600">Borradores</div>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-sm ${docsComplete ? 'bg-green-50' : ''}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${docsComplete ? 'text-green-600' : 'text-slate-900'}`}>
                  {docsComplete ? <CheckCircle className="w-6 h-6 mx-auto" /> : stats.documentosPendientes}
                </div>
                <div className="text-xs text-slate-600">Docs. Pendientes</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {selectedVehicle ? '1' : '0'}
                </div>
                <div className="text-xs text-slate-600">Auto Seleccionado</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/escritorio/profile">
              <Card className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${stats.profileComplete ? 'ring-1 ring-green-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stats.profileComplete ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <User className={`w-5 h-5 ${stats.profileComplete ? 'text-green-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">Mi Perfil</p>
                      <p className="text-xs text-slate-500">{stats.profileComplete ? 'Completado' : 'Completar información'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/escritorio/perfilacion-bancaria">
              <Card className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${stats.bankProfileComplete ? 'ring-1 ring-green-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stats.bankProfileComplete ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <CreditCard className={`w-5 h-5 ${stats.bankProfileComplete ? 'text-green-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">Perfilación Bancaria</p>
                      <p className="text-xs text-slate-500">{stats.bankProfileComplete ? 'Completado' : 'Completar perfil'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {selectedVehicle ? (
              <Link href={`/autos/${selectedVehicle.slug || selectedVehicle.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {selectedVehicle.feature_image || selectedVehicle.fotos_exterior_url?.[0] ? (
                        <img
                          src={selectedVehicle.feature_image || selectedVehicle.fotos_exterior_url?.[0]}
                          alt={selectedVehicle.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Car className="w-5 h-5 text-slate-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{selectedVehicle.title || 'Tu Auto'}</p>
                        <p className="text-xs text-slate-500">Ver detalles</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Link href="/autos">
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer border-dashed border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Car className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-600">Selecciona un Auto</p>
                        <p className="text-xs text-slate-400">Explorar inventario</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            <Link href="/escritorio/seguimiento">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">Mis Solicitudes</p>
                      <p className="text-xs text-slate-500">Ver historial</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Vehicles Section */}
          {sidebarVehicles.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {vehiclesLabel === 'Tus Favoritos' && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                  {vehiclesLabel === 'Vistos Recientemente' && <Clock className="w-4 h-4 text-blue-500" />}
                  {vehiclesLabel === 'Sugerencias' && <Sparkles className="w-4 h-4 text-amber-500" />}
                  <CardTitle className="text-sm font-semibold text-slate-600">{vehiclesLabel}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid sm:grid-cols-3 gap-3">
                  {sidebarVehicles.map((vehicle) => {
                    const imageUrl = vehicle.feature_image || vehicle.fotos_exterior_url?.[0] || vehicle.galeria_exterior?.[0];
                    return (
                      <Link
                        key={vehicle.id}
                        href={`/autos/${vehicle.slug || vehicle.id}`}
                        className="group"
                      >
                        <div className="rounded-lg overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                          {imageUrl ? (
                            <img src={imageUrl} alt={vehicle.title} className="w-full h-24 object-cover" />
                          ) : (
                            <div className="w-full h-24 bg-slate-100 flex items-center justify-center">
                              <Car className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-xs font-medium text-slate-900 truncate">{vehicle.title}</p>
                            <p className="text-xs font-bold text-primary">${vehicle.precio?.toLocaleString()}</p>
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

        {/* Right Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Assigned Agent Card - Prominent */}
          {assignedAgent && (
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-slate-300 uppercase tracking-wide mb-4">Tu Asesor Asignado</p>
                {/* Prominent Avatar */}
                <div className="relative mx-auto mb-4">
                  {assignedAgent.picture_url ? (
                    <img
                      src={assignedAgent.picture_url}
                      alt={assignedAgent.full_name || assignedAgent.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-3xl mx-auto ring-4 ring-white/20">
                      {(assignedAgent.full_name || assignedAgent.name).charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <p className="font-bold text-lg text-white">{assignedAgent.full_name || assignedAgent.name}</p>
                <p className="text-sm text-slate-300 mb-4">{assignedAgent.phone}</p>
                <a
                  href={`https://wa.me/${assignedAgent.phone.replace(/\D/g, '')}?text=Hola,%20necesito%20ayuda%20con%20mi%20solicitud`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Document Dropzone */}
          {publicUploadLink && latestApplication && (
            <Card
              ref={dropzoneRef}
              className={`border-2 border-dashed transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-6 text-center relative">
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg z-10">
                    <div className="text-center">
                      <FileUp className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
                      <p className="font-semibold text-primary">Suelta aquí</p>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg z-10">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileUp className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Sube tus documentos</h3>
                  <p className="text-xs text-slate-500 mb-3">Arrastra archivos aquí o usa el código QR</p>

                  {/* Status */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${docsComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {docsComplete ? (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        Documentos completos
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Faltan {stats.documentosPendientes} documento(s)
                      </>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl shadow-sm border inline-block mb-4">
                  <QRCodeSVG value={publicUploadLink} size={120} level="H" includeMargin={false} />
                </div>

                {/* Copy Link Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <input
                      type="text"
                      value={publicUploadLink}
                      readOnly
                      className="flex-1 text-xs text-slate-600 bg-transparent outline-none truncate font-mono"
                    />
                    <Button size="sm" variant="secondary" onClick={copyToClipboard} className="h-7 px-2 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-left">
                    <p className="text-xs font-medium text-blue-900 mb-1">Cómo subir documentos:</p>
                    <ul className="text-xs text-blue-700 space-y-0.5">
                      <li>• Arrastra archivos a esta área</li>
                      <li>• O copia la liga y ábrela en tu celular</li>
                      <li>• Formatos: JPG, PNG, PDF</li>
                    </ul>
                  </div>

                  {/* Link to Seguimiento */}
                  <Link
                    href={`/escritorio/seguimiento/${latestApplication.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver solicitud y documentos
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-sm text-slate-900 mb-1">¿Necesitas ayuda?</h3>
              <p className="text-xs text-slate-600 mb-3">Nuestro equipo está listo para asistirte</p>
              <a
                href="https://wa.me/5218187049079?text=Hola,%20necesito%20ayuda%20con%20mi%20financiamiento"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  Contactar Soporte
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebarPage;
