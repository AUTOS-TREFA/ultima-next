'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SellCarService } from '@/services/SellCarService';
import type { UserVehicleForSale } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Mail,
  TrendingUp,
  Banknote,
  ClipboardCheck,
  Sparkles,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import ValuationApp from '@/Valuation/App';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; progress: number; description: string }> = {
  draft: {
    label: 'Borrador',
    color: 'bg-gray-100 text-gray-700',
    icon: FileText,
    progress: 10,
    description: 'Completa la informacion de tu vehiculo'
  },
  in_inspection: {
    label: 'En inspeccion',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ClipboardCheck,
    progress: 40,
    description: 'Tu vehiculo esta siendo evaluado'
  },
  offer_made: {
    label: 'Oferta recibida',
    color: 'bg-blue-100 text-blue-700',
    icon: Banknote,
    progress: 70,
    description: 'Tienes una oferta pendiente de respuesta'
  },
  accepted: {
    label: 'Aceptada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    progress: 90,
    description: 'Coordinando la entrega del vehiculo'
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
    color: 'bg-purple-100 text-purple-700',
    icon: Sparkles,
    progress: 100,
    description: 'Venta finalizada exitosamente'
  },
};

const SellerDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<UserVehicleForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValuationApp, setShowValuationApp] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/acceder');
      return;
    }

    if (user) {
      loadListings();
    }
  }, [user, authLoading]);

  const loadListings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await SellCarService.getSellListings(user.id);
      setListings(data);
    } catch (error) {
      console.error('Error loading sell listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleInfo = (listing: UserVehicleForSale) => {
    const valuation = listing.valuation_data;
    if (!valuation?.vehicle) {
      return { label: 'Vehiculo sin informacion', year: '', brand: '', model: '' };
    }
    return {
      label: valuation.vehicle.label || `${valuation.vehicle.year} ${valuation.vehicle.brand} ${valuation.vehicle.model}`,
      year: valuation.vehicle.year,
      brand: valuation.vehicle.brand,
      model: valuation.vehicle.model,
    };
  };

  const getValuationOffer = (listing: UserVehicleForSale) => {
    if (listing.final_offer) return listing.final_offer;
    return listing.valuation_data?.valuation?.suggestedOffer || null;
  };

  const handleStartNewValuation = () => {
    // Clear any existing valuation data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sellCarValuation');
      localStorage.removeItem('pendingValuationData');
    }
    setShowValuationApp(true);
  };

  const activeListings = listings.filter(l => !['completed', 'rejected'].includes(l.status));
  const pendingOffers = listings.filter(l => l.status === 'offer_made');
  const completedListings = listings.filter(l => l.status === 'completed');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the valuation app is open, show it full-screen
  if (showValuationApp) {
    return (
      <div className="space-y-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Nueva Valuacion
            </h1>
            <p className="text-muted-foreground mt-1">
              Obtén una valuacion instantanea de tu vehiculo
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowValuationApp(false);
              loadListings(); // Reload listings in case a new one was created
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>

        {/* Valuation App */}
        <div className="w-full">
          <ValuationApp />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Venta Directa
            </h1>
            <p className="text-muted-foreground mt-1">
              Vende tu auto directamente a TREFA y recibe una oferta en minutos.
            </p>
          </div>
          <Button onClick={handleStartNewValuation} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Nueva valuacion
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeListings.length}</p>
                    <p className="text-xs text-muted-foreground">En proceso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Banknote className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingOffers.length}</p>
                    <p className="text-xs text-muted-foreground">Ofertas pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedListings.length}</p>
                    <p className="text-xs text-muted-foreground">Completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Offers Alert */}
        {pendingOffers.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Banknote className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">
                      Tienes {pendingOffers.length} oferta{pendingOffers.length > 1 ? 's' : ''} pendiente{pendingOffers.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-orange-700">
                      Revisa y responde para continuar con la venta
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver ofertas
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listings Section */}
        <div id="listings-section">
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
                <h3 className="text-xl font-semibold mb-2">Comienza a vender tu auto</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Obtén una valuación instantánea de tu auto y recibe una oferta competitiva.
                  El proceso es rápido, seguro y sin compromisos.
                </p>
                <Button size="lg" onClick={handleStartNewValuation}>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Obtener valuación gratuita
                </Button>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mt-12 w-full max-w-3xl">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-medium mb-1">Rapido</h4>
                    <p className="text-sm text-muted-foreground">
                      Valuación en menos de 5 minutos
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Banknote className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium mb-1">Mejor precio</h4>
                    <p className="text-sm text-muted-foreground">
                      Ofertas competitivas del mercado
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-medium mb-1">Sin compromiso</h4>
                    <p className="text-sm text-muted-foreground">
                      Evalúa sin obligación de vender
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Mis vehiculos en venta</h2>
              {listings.map(listing => {
                const vehicleInfo = getVehicleInfo(listing);
                const offer = getValuationOffer(listing);
                const config = statusConfig[listing.status] || statusConfig.draft;
                const StatusIcon = config.icon;

                return (
                  <Card key={listing.id} className={`hover:shadow-md transition-shadow ${listing.status === 'offer_made' ? 'ring-2 ring-orange-300' : ''}`}>
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
                                {listing.asesor_asignado && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Asesor: {listing.asesor_asignado}</span>
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
                                  {listing.final_offer ? '💰 Oferta final' : '📊 Valuacion estimada'}
                                </p>
                                <p className={`text-3xl font-bold ${listing.final_offer ? 'text-green-700' : 'text-blue-700'}`}>
                                  {formatPrice(offer)}
                                </p>
                                {!listing.final_offer && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Sujeto a inspeccion
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Action buttons based on status */}
                          <div className="flex gap-2">
                            {listing.status === 'offer_made' && (
                              <>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                  Rechazar
                                </Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                            {listing.status === 'draft' && (
                              <Button size="sm" onClick={() => router.push('/vender-mi-auto')}>
                                Continuar
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                            {listing.status === 'completed' && listing.listing_url && (
                              <Button size="sm" variant="ghost" onClick={() => window.open(listing.listing_url, '_blank')}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver publicacion
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
        </div>

        {/* How it works - show only if user has listings */}
        {!loading && listings.length > 0 && (
          <Card className="mt-8 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">¿Como funciona la venta directa?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Valuacion</h4>
                    <p className="text-sm text-muted-foreground">
                      Ingresa los datos de tu auto y recibe una oferta inicial
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Inspeccion</h4>
                    <p className="text-sm text-muted-foreground">
                      Agenda una cita en sucursal para verificar tu vehiculo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Oferta final</h4>
                    <p className="text-sm text-muted-foreground">
                      Recibe una oferta definitiva basada en la inspeccion
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Pago inmediato</h4>
                    <p className="text-sm text-muted-foreground">
                      Acepta y recibe tu pago el mismo dia
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default SellerDashboardPage;
