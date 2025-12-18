'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { SellCarService } from '@/services/SellCarService';
import { supabase } from '@/lib/supabase/client';
import type { UserVehicleForSale } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  MapPin,
  FileText,
  Phone,
  TrendingUp,
  Banknote,
  ClipboardCheck,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  Upload,
  ChevronDown,
  Loader2,
  History,
  ArrowLeft,
  Image as ImageIcon,
  Shield,
  Zap,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import AutometricaValuationForm from '@/components/AutometricaValuationForm';

// ============================================================================
// CONSTANTS
// ============================================================================

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

const BRANCHES = ['Monterrey', 'Guadalupe', 'Tampico', 'Coahuila'];

// ============================================================================
// FORM SCHEMA
// ============================================================================

const vehicleDetailsSchema = z.object({
  owner_count: z.string().min(1, "El número de dueños es requerido."),
  key_info: z.string().min(1, "La información de las llaves es requerida."),
  invoice_status: z.enum(['liberada', 'financiada'], { message: "El estado de la factura es requerido." }),
  financing_entity_type: z.enum(['banco', 'agencia']).optional(),
  financing_entity_name: z.string().optional(),
  vehicle_state: z.string().min(1, "El estado del vehículo es requerido."),
  plate_registration_state: z.string().min(1, "El estado de las placas es requerido."),
  accident_history: z.string().min(1, "El historial de accidentes es requerido."),
  reason_for_selling: z.string().min(1, "El motivo de venta es requerido."),
  additional_details: z.string().optional(),
  inspection_branch: z.string().min(1, "Debes seleccionar una sucursal para la inspección."),
}).refine(data => {
  if (data.invoice_status === 'financiada') {
    return !!data.financing_entity_type && !!data.financing_entity_name;
  }
  return true;
}, {
  message: "Debes especificar el tipo y nombre de la entidad financiera.",
  path: ["financing_entity_name"],
});

type VehicleDetailsFormData = z.infer<typeof vehicleDetailsSchema>;

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; progress: number; description: string }> = {
  draft: {
    label: 'Valuación recibida',
    color: 'bg-blue-100 text-blue-700',
    icon: FileText,
    progress: 20,
    description: 'Completa los detalles para continuar'
  },
  in_inspection: {
    label: 'En inspección',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ClipboardCheck,
    progress: 50,
    description: 'Tu vehículo está siendo evaluado'
  },
  offer_made: {
    label: 'Oferta recibida',
    color: 'bg-purple-100 text-purple-700',
    icon: Banknote,
    progress: 75,
    description: 'Tienes una oferta pendiente de respuesta'
  },
  accepted: {
    label: 'Aceptada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    progress: 90,
    description: 'Coordinando la entrega del vehículo'
  },
  rejected: {
    label: 'Rechazada',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
    progress: 0,
    description: 'La oferta fue rechazada'
  },
  completed: {
    label: 'Completada',
    color: 'bg-emerald-100 text-emerald-700',
    icon: Sparkles,
    progress: 100,
    description: 'Venta finalizada exitosamente'
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SellerDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  // State
  const [listings, setListings] = useState<UserVehicleForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'valuate' | 'history'>('valuate');
  const [selectedListing, setSelectedListing] = useState<UserVehicleForSale | null>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exteriorPhotos, setExteriorPhotos] = useState<File[]>([]);
  const [interiorPhotos, setInteriorPhotos] = useState<File[]>([]);

  // Form
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<VehicleDetailsFormData>({
    resolver: zodResolver(vehicleDetailsSchema),
  });

  const invoiceStatus = watch('invoice_status');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/acceder');
      return;
    }

    if (user) {
      loadListings();
    }
  }, [user, authLoading]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadListings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await SellCarService.getSellListings(user.id);
      setListings(data);
      // If user has listings, show history tab by default
      if (data.length > 0) {
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error loading sell listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const uploadPhotos = async (files: File[], type: 'exterior' | 'interior'): Promise<string[]> => {
    if (!user) throw new Error("Usuario no autenticado");
    if (files.length === 0) return [];

    const uploadPromises = files.map(file => {
      const filePath = `${user.id}/sell-my-car/${type}/${Date.now()}-${file.name}`;
      return supabase.storage.from('user-car-photos').upload(filePath, file);
    });

    const results = await Promise.all(uploadPromises);
    const paths: string[] = [];
    for (const result of results) {
      if (result.error) throw result.error;
      paths.push(result.data.path);
    }
    return paths;
  };

  const handleSubmitDetails = async (data: VehicleDetailsFormData) => {
    if (!user || !selectedListing) return;
    setSubmitting(true);

    try {
      const [exterior_photos, interior_photos] = await Promise.all([
        uploadPhotos(exteriorPhotos, 'exterior'),
        uploadPhotos(interiorPhotos, 'interior')
      ]);

      const updatePayload: Partial<UserVehicleForSale> = {
        id: selectedListing.id,
        user_id: user.id,
        status: 'in_inspection',
        exterior_photos: [...(selectedListing.exterior_photos || []), ...exterior_photos],
        interior_photos: [...(selectedListing.interior_photos || []), ...interior_photos],
        ...data,
        owner_count: parseInt(data.owner_count, 10),
      };

      await SellCarService.createOrUpdateSellListing(updatePayload);

      // Reset form and reload
      setShowDetailsForm(false);
      setSelectedListing(null);
      setExteriorPhotos([]);
      setInteriorPhotos([]);
      reset();
      await loadListings();

      // Navigate to citas page
      router.push('/escritorio/citas');
    } catch (error: any) {
      console.error("Failed to submit details:", error);
      alert(error.message || "No se pudo guardar la información. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOffer = async (listing: UserVehicleForSale) => {
    if (!user) return;

    try {
      await SellCarService.createOrUpdateSellListing({
        id: listing.id,
        user_id: user.id,
        status: 'accepted',
      });
      await loadListings();
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleRejectOffer = async (listing: UserVehicleForSale) => {
    if (!user) return;

    if (!confirm('¿Estás seguro de rechazar esta oferta?')) return;

    try {
      await SellCarService.createOrUpdateSellListing({
        id: listing.id,
        user_id: user.id,
        status: 'rejected',
      });
      await loadListings();
    } catch (error) {
      console.error('Error rejecting offer:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      setter(Array.from(e.target.files));
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getVehicleInfo = (listing: UserVehicleForSale) => {
    const valuation = listing.valuation_data;
    if (!valuation?.vehicle) {
      return { label: 'Vehículo sin información', year: '', brand: '', model: '' };
    }
    return {
      label: valuation.vehicle.label || `${valuation.vehicle.year} ${valuation.vehicle.brand} ${valuation.vehicle.subbrand || valuation.vehicle.model}`,
      year: valuation.vehicle.year,
      brand: valuation.vehicle.brand,
      model: valuation.vehicle.subbrand || valuation.vehicle.model,
    };
  };

  const getValuationOffer = (listing: UserVehicleForSale) => {
    if (listing.final_offer) return listing.final_offer;
    return listing.valuation_data?.purchasePrice || listing.valuation_data?.valuation?.suggestedOffer || null;
  };

  const activeListings = listings.filter(l => !['completed', 'rejected'].includes(l.status));
  const pendingOffers = listings.filter(l => l.status === 'offer_made');
  const completedListings = listings.filter(l => l.status === 'completed');
  const draftListings = listings.filter(l => l.status === 'draft');

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================================================
  // VEHICLE DETAILS FORM (Post-Acceptance Flow)
  // ============================================================================

  if (showDetailsForm && selectedListing) {
    const vehicleInfo = getVehicleInfo(selectedListing);
    const offer = getValuationOffer(selectedListing);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => { setShowDetailsForm(false); setSelectedListing(null); }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Car className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Completa los Detalles de tu Auto</CardTitle>
            </div>
            <CardDescription>Proporciona la siguiente información para continuar con la venta.</CardDescription>
          </CardHeader>
        </Card>

        {/* Vehicle Summary Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold text-blue-800">Vehículo a vender:</Label>
                <p className="text-lg font-bold text-blue-900">{vehicleInfo.label}</p>
              </div>
              {offer && (
                <div className="text-right">
                  <Label className="text-sm font-semibold text-blue-800">Oferta Inicial:</Label>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(offer)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit(handleSubmitDetails)} className="space-y-6">
          {/* Vehicle Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles del Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Número de dueños anteriores" error={errors.owner_count?.message}>
                  <select {...register('owner_count')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3 o más</option>
                  </select>
                </FormField>

                <FormField label="¿Cuántos juegos de llaves tienes?" error={errors.key_info?.message}>
                  <select {...register('key_info')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    <option value="Duplicado">Duplicado (2 llaves)</option>
                    <option value="Una llave">Una sola llave</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Estado de la factura" error={errors.invoice_status?.message}>
                <select {...register('invoice_status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="liberada">Liberada (Pagada por completo)</option>
                  <option value="financiada">Aún está financiada</option>
                </select>
              </FormField>

              {invoiceStatus === 'financiada' && (
                <Card className="border-muted">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField label="Tipo de entidad" error={errors.financing_entity_type?.message}>
                        <select {...register('financing_entity_type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Seleccionar...</option>
                          <option value="banco">Banco</option>
                          <option value="agencia">Agencia de autos</option>
                        </select>
                      </FormField>
                      <FormField label="Nombre de la entidad" error={errors.financing_entity_name?.message}>
                        <Input {...register('financing_entity_name')} placeholder="Ej: BBVA, GM Financial" />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="¿En qué estado se encuentra el vehículo?" error={errors.vehicle_state?.message}>
                  <select {...register('vehicle_state')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="¿En qué estado están registradas las placas?" error={errors.plate_registration_state?.message}>
                  <select {...register('plate_registration_state')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="¿El auto ha tenido algún accidente?" error={errors.accident_history?.message}>
                <select {...register('accident_history')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="ninguno">No, ninguno</option>
                  <option value="leves">Sí, solo daños estéticos leves</option>
                  <option value="graves">Sí, con reparaciones estructurales</option>
                </select>
              </FormField>

              <FormField label="¿Cuál es tu principal motivo para vender?" error={errors.reason_for_selling?.message}>
                <select {...register('reason_for_selling')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="Quiero un auto más nuevo">Quiero un auto más nuevo</option>
                  <option value="Necesito el dinero">Necesito el dinero</option>
                  <option value="Ya no lo uso">Ya no lo uso</option>
                  <option value="Otro">Otro</option>
                </select>
              </FormField>

              {/* Photo Upload */}
              <div className="space-y-4 pt-4">
                <FormField label="Fotos del exterior (opcional)">
                  <FileUpload
                    id="exterior-upload"
                    onChange={(e) => handleFileChange(e, setExteriorPhotos)}
                    multiple
                    filesCount={exteriorPhotos.length}
                  />
                </FormField>
                <FormField label="Fotos del interior (opcional)">
                  <FileUpload
                    id="interior-upload"
                    onChange={(e) => handleFileChange(e, setInteriorPhotos)}
                    multiple
                    filesCount={interiorPhotos.length}
                  />
                </FormField>
              </div>

              <FormField label="Selecciona una sucursal para la inspección" error={errors.inspection_branch?.message}>
                <select {...register('inspection_branch')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Seleccionar sucursal...</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </FormField>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button type="submit" disabled={submitting} className="w-full h-12 text-base" size="lg">
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {submitting ? 'Enviando...' : 'Agendar Inspección y Enviar'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Vende tu Auto
          </h1>
          <p className="text-muted-foreground mt-1">
            Recibe una oferta instantánea basada en datos reales del mercado mexicano.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{activeListings.length}</p>
                  <p className="text-xs text-muted-foreground">En proceso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Banknote className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{pendingOffers.length}</p>
                  <p className="text-xs text-muted-foreground">Ofertas pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{draftListings.length}</p>
                  <p className="text-xs text-muted-foreground">Por completar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{completedListings.length}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Offers Alert */}
      {pendingOffers.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Banknote className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">
                    Tienes {pendingOffers.length} oferta{pendingOffers.length > 1 ? 's' : ''} pendiente{pendingOffers.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-purple-700">
                    Revisa y responde para continuar con la venta
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => setActiveTab('history')}
              >
                Ver ofertas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'valuate' | 'history')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="valuate" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Nueva Valuación
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Mis Valuaciones
            {listings.length > 0 && (
              <Badge variant="secondary" className="ml-1">{listings.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* NEW VALUATION TAB */}
        <TabsContent value="valuate" className="mt-6">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Valuation Form - Wider layout (3/5 columns) */}
            <div className="lg:col-span-3">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Zap className="w-5 h-5 text-primary" />
                  Cotiza tu Auto
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingresa los datos de tu vehículo y recibe una oferta instantánea
                </p>
              </div>
              <AutometricaValuationForm
                onComplete={() => {
                  loadListings();
                  setActiveTab('history');
                }}
              />
            </div>

            {/* Benefits - 2/5 columns */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Por qué vender con nosotros?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Mejor precio del mercado</h4>
                      <p className="text-sm text-muted-foreground">
                        Precios competitivos basados en datos reales de la Guía Autométrica.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Pago en 24 horas</h4>
                      <p className="text-sm text-muted-foreground">
                        Recibe tu dinero al día siguiente. Sin esperas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">100% seguro</h4>
                      <p className="text-sm text-muted-foreground">
                        Nos encargamos de todo el papeleo. Transacción transparente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Sin comisiones ocultas</h4>
                      <p className="text-sm text-muted-foreground">
                        El precio que te ofrecemos es lo que recibes. Sin sorpresas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How it works */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <p className="text-sm">Ingresa los datos de tu auto y recibe una oferta inicial</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <p className="text-sm">Completa los detalles y agenda una inspección</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <p className="text-sm">Recibe una oferta definitiva basada en la inspección</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <p className="text-sm">Acepta y recibe tu pago el mismo día</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tienes valuaciones aún</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Obtén una valuación instantánea de tu auto y recibe una oferta competitiva.
                </p>
                <Button size="lg" onClick={() => setActiveTab('valuate')}>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Obtener valuación gratuita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map(listing => {
                const vehicleInfo = getVehicleInfo(listing);
                const offer = getValuationOffer(listing);
                const config = statusConfig[listing.status] || statusConfig.draft;
                const StatusIcon = config.icon;

                return (
                  <Card
                    key={listing.id}
                    className={`hover:shadow-md transition-shadow ${
                      listing.status === 'offer_made' ? 'ring-2 ring-purple-300' : ''
                    } ${listing.status === 'draft' ? 'ring-2 ring-amber-300' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Vehicle Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-muted rounded-lg shrink-0">
                              <Car className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-lg truncate">
                                  {vehicleInfo.label}
                                </h3>
                                <Badge className={config.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {config.description}
                              </p>

                              {/* Progress bar */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Progreso</span>
                                  <span className="text-xs font-medium">{config.progress}%</span>
                                </div>
                                <Progress value={config.progress} className="h-2" />
                              </div>

                              {/* Details grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {listing.inspection_branch && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{listing.inspection_branch}</span>
                                  </div>
                                )}
                                {listing.created_at && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(listing.created_at).toLocaleDateString('es-MX')}</span>
                                  </div>
                                )}
                                {listing.valuation_data?.kilometraje && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>{Number(listing.valuation_data.kilometraje).toLocaleString()} km</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Offer and Actions */}
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          {offer && (
                            <Card className={`${listing.final_offer ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                              <CardContent className="pt-3 pb-3 px-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  {listing.final_offer ? '💰 Oferta final' : '📊 Valuación estimada'}
                                </p>
                                <p className={`text-2xl font-bold ${listing.final_offer ? 'text-green-700' : 'text-blue-700'}`}>
                                  {formatPrice(offer)}
                                </p>
                                {!listing.final_offer && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Sujeto a inspección
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Action buttons based on status */}
                          <div className="flex gap-2 flex-wrap">
                            {listing.status === 'draft' && (
                              <Button
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setShowDetailsForm(true);
                                }}
                              >
                                Completar detalles
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                            {listing.status === 'offer_made' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleRejectOffer(listing)}
                                >
                                  Rechazar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAcceptOffer(listing)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aceptar oferta
                                </Button>
                              </>
                            )}
                            {listing.status === 'in_inspection' && (
                              <Button size="sm" variant="outline" onClick={() => router.push('/escritorio/citas')}>
                                <Calendar className="w-4 h-4 mr-1" />
                                Ver cita
                              </Button>
                            )}
                            {listing.status === 'accepted' && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Coordinando entrega
                              </Badge>
                            )}
                            {listing.status === 'completed' && listing.listing_url && (
                              <Button size="sm" variant="ghost" onClick={() => window.open(listing.listing_url, '_blank')}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver publicación
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const FormField: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="text-destructive text-xs">{error}</p>}
  </div>
);

const FileUpload: React.FC<{
  id: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  filesCount?: number;
}> = ({ id, onChange, multiple, filesCount = 0 }) => (
  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${filesCount > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
    <div className="space-y-1 text-center">
      {filesCount > 0 ? (
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      <div className="flex flex-col items-center text-sm text-gray-600">
        <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 px-2 py-1">
          <span>{filesCount > 0 ? 'Cambiar archivos' : 'Sube archivos'}</span>
          <input id={id} type="file" className="sr-only" onChange={onChange} multiple={multiple} accept="image/*" />
        </label>
        {filesCount > 0 && (
          <p className="text-green-600 font-semibold mt-2">{filesCount} archivo{filesCount !== 1 ? 's' : ''} seleccionado{filesCount !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  </div>
);

export default SellerDashboardPage;
