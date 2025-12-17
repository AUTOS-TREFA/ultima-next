'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import { ConsignmentService, ConsignmentListing } from '@/services/ConsignmentService';
import { SellCarService } from '@/services/SellCarService';
import type { UserVehicleForSale } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Car,
  Store,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

const MyVehiclesPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [consignmentListings, setConsignmentListings] = useState<ConsignmentListing[]>([]);
  const [sellListings, setSellListings] = useState<UserVehicleForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/acceder');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [consignments, sells] = await Promise.all([
        ConsignmentService.getMyListings(user.id),
        SellCarService.getSellListings(user.id),
      ]);
      setConsignmentListings(consignments);
      setSellListings(sells);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string, type: 'consignment' | 'sell') => {
    if (type === 'consignment') {
      const configs: Record<string, { label: string; color: string; icon: React.ElementType }> = {
        draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: Clock },
        pending_approval: { label: 'En revision', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        active: { label: 'Publicado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
        sold: { label: 'Vendido', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
        paused: { label: 'Pausado', color: 'bg-gray-100 text-gray-600', icon: Clock },
      };
      return configs[status] || configs.draft;
    } else {
      const configs: Record<string, { label: string; color: string; icon: React.ElementType }> = {
        pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
        offer_made: { label: 'Oferta enviada', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
        accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
      };
      return configs[status] || configs.pending;
    }
  };

  const totalVehicles = consignmentListings.length + sellListings.length;
  const activeConsignments = consignmentListings.filter(l => l.status === 'active').length;
  const pendingItems = consignmentListings.filter(l => l.status === 'pending_approval' || l.status === 'draft').length + sellListings.filter(l => l.status === 'pending').length;

  if (authLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Mis Vehiculos
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra todos tus vehiculos en venta y consignacion en un solo lugar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/escritorio/vende-tu-auto')}>
              <DollarSign className="w-4 h-4 mr-2" />
              Venta directa
            </Button>
            <Button onClick={() => router.push('/escritorio/marketplace/nuevo')}>
              <Store className="w-4 h-4 mr-2" />
              Marketplace
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
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
                    <p className="text-2xl font-bold">{totalVehicles}</p>
                    <p className="text-xs text-muted-foreground">Total vehiculos</p>
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
                    <p className="text-2xl font-bold">{activeConsignments}</p>
                    <p className="text-xs text-muted-foreground">Publicados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingItems}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos ({totalVehicles})</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace ({consignmentListings.length})</TabsTrigger>
            <TabsTrigger value="venta-directa">Venta Directa ({sellListings.length})</TabsTrigger>
          </TabsList>

          {/* All Vehicles */}
          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : totalVehicles === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Car className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes vehiculos registrados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Comienza vendiendo tu auto directamente a TREFA o publicandolo en nuestro marketplace.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push('/escritorio/vende-tu-auto')}>
                      Venta directa
                    </Button>
                    <Button onClick={() => router.push('/escritorio/marketplace/nuevo')}>
                      Publicar en Marketplace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Consignment Listings */}
                {consignmentListings.map(listing => {
                  const config = getStatusConfig(listing.status, 'consignment');
                  const StatusIcon = config.icon;
                  return (
                    <Card key={`consignment-${listing.id}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                              <Store className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">
                                  {listing.year} {listing.brand} {listing.model}
                                </h3>
                                <Badge variant="outline" className="shrink-0 text-purple-600 border-purple-200 text-[10px]">
                                  Marketplace
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{formatPrice(listing.price)}</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {listing.view_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> {listing.contact_count}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className={`${config.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/escritorio/marketplace`)}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Sell Listings */}
                {sellListings.map(listing => {
                  const config = getStatusConfig(listing.status || 'pending', 'sell');
                  const StatusIcon = config.icon;
                  return (
                    <Card key={`sell-${listing.id}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-green-100 rounded-lg shrink-0">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">
                                  {listing.year} {listing.brand} {listing.model}
                                </h3>
                                <Badge variant="outline" className="shrink-0 text-green-600 border-green-200 text-[10px]">
                                  Venta Directa
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {listing.expected_price && (
                                  <span className="font-medium text-foreground">
                                    {formatPrice(listing.expected_price)}
                                  </span>
                                )}
                                {listing.mileage && (
                                  <span>{listing.mileage.toLocaleString()} km</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className={`${config.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/escritorio/vende-tu-auto`)}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Marketplace Only */}
          <TabsContent value="marketplace" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : consignmentListings.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Store className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes vehiculos en el Marketplace</h3>
                  <p className="text-muted-foreground mb-4">
                    Publica tu vehiculo y alcanza a miles de compradores.
                  </p>
                  <Button onClick={() => router.push('/escritorio/marketplace/nuevo')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear listado
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {consignmentListings.map(listing => {
                  const config = getStatusConfig(listing.status, 'consignment');
                  const StatusIcon = config.icon;
                  return (
                    <Card key={listing.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                              <Store className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate mb-1">
                                {listing.year} {listing.brand} {listing.model}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{formatPrice(listing.price)}</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {listing.view_count} vistas
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`${config.color} shrink-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Venta Directa Only */}
          <TabsContent value="venta-directa" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : sellListings.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes solicitudes de venta directa</h3>
                  <p className="text-muted-foreground mb-4">
                    Vende tu auto directamente a TREFA y recibe una oferta.
                  </p>
                  <Button onClick={() => router.push('/escritorio/vende-tu-auto')}>
                    Vender mi auto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sellListings.map(listing => {
                  const config = getStatusConfig(listing.status || 'pending', 'sell');
                  const StatusIcon = config.icon;
                  return (
                    <Card key={listing.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-green-100 rounded-lg shrink-0">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate mb-1">
                                {listing.year} {listing.brand} {listing.model}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {listing.expected_price && (
                                  <span className="font-medium text-foreground">
                                    Precio esperado: {formatPrice(listing.expected_price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={`${config.color} shrink-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
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
    </UnifiedDashboardLayout>
  );
};

export default MyVehiclesPage;
