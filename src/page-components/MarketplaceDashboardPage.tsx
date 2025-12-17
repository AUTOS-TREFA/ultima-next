'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ConsignmentService, ConsignmentListing, ConsignmentStats } from '@/services/ConsignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  AlertCircle,
  Car,
  Package,
  DollarSign,
  ArrowRight,
  Edit,
  Trash2,
  Send,
  Play,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: Edit },
  pending_approval: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle },
  sold: { label: 'Vendido', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
  expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  paused: { label: 'Pausado', color: 'bg-gray-100 text-gray-600', icon: Pause },
};

const MarketplaceDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<ConsignmentListing[]>([]);
  const [stats, setStats] = useState<ConsignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
      const [listingsData, statsData] = await Promise.all([
        ConsignmentService.getMyListings(user.id),
        ConsignmentService.getMyStats(user.id),
      ]);
      setListings(listingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (listingId: string) => {
    if (!user) return;
    setActionLoading(listingId);
    try {
      await ConsignmentService.submitForApproval(user.id, listingId);
      await loadData();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePause = async (listingId: string) => {
    if (!user) return;
    setActionLoading(listingId);
    try {
      await ConsignmentService.toggleListingPause(user.id, listingId);
      await loadData();
    } catch (error) {
      console.error('Error toggling pause:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDraft = async (listingId: string) => {
    if (!user) return;
    if (!confirm('¿Estas seguro de eliminar este borrador?')) return;

    setActionLoading(listingId);
    try {
      await ConsignmentService.deleteDraftListing(user.id, listingId);
      await loadData();
    } catch (error) {
      console.error('Error deleting draft:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = activeTab === 'all'
    ? listings
    : listings.filter(l => l.status === activeTab);

  const renderListingCard = (listing: ConsignmentListing) => {
    const config = statusConfig[listing.status] || statusConfig.draft;
    const StatusIcon = config.icon;
    const isLoading = actionLoading === listing.id;

    return (
      <Card key={listing.id} className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold truncate">
                {listing.year} {listing.brand} {listing.model}
              </CardTitle>
              <CardDescription className="truncate">
                {listing.version || 'Version no especificada'}
              </CardDescription>
            </div>
            <Badge className={`${config.color} shrink-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(listing.price)}
            </span>
            {listing.negotiable && (
              <Badge variant="outline" className="text-xs">Negociable</Badge>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{listing.view_count}</p>
              <p className="text-[10px] text-muted-foreground">Vistas</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <MessageSquare className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{listing.contact_count}</p>
              <p className="text-[10px] text-muted-foreground">Contactos</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{listing.favorite_count}</p>
              <p className="text-[10px] text-muted-foreground">Favoritos</p>
            </div>
          </div>

          {/* Rejection reason if applicable */}
          {listing.status === 'rejected' && listing.rejection_reason && (
            <div className="p-2 bg-red-50 border border-red-100 rounded-lg mb-4">
              <p className="text-xs text-red-700">
                <strong>Motivo:</strong> {listing.rejection_reason}
              </p>
            </div>
          )}

          {/* Location and mileage */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {listing.mileage && (
              <span>{listing.mileage.toLocaleString()} km</span>
            )}
            {listing.city && listing.state && (
              <span>{listing.city}, {listing.state}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-3 border-t flex flex-wrap gap-2">
          {/* Draft actions */}
          {listing.status === 'draft' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/escritorio/marketplace/${listing.id}/edit`)}
                disabled={isLoading}
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                onClick={() => handleSubmitForApproval(listing.id)}
                disabled={isLoading}
              >
                <Send className="w-3 h-3 mr-1" />
                Enviar a revision
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteDraft(listing.id)}
                disabled={isLoading}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}

          {/* Rejected actions */}
          {listing.status === 'rejected' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/escritorio/marketplace/${listing.id}/edit`)}
                disabled={isLoading}
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar y reenviar
              </Button>
            </>
          )}

          {/* Active actions */}
          {listing.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTogglePause(listing.id)}
                disabled={isLoading}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pausar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`/autos/consignacion/${listing.id}`, '_blank')}
              >
                <Eye className="w-3 h-3 mr-1" />
                Ver listado
              </Button>
            </>
          )}

          {/* Paused actions */}
          {listing.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => handleTogglePause(listing.id)}
              disabled={isLoading}
            >
              <Play className="w-3 h-3 mr-1" />
              Reactivar
            </Button>
          )}

          {/* Pending approval - no actions */}
          {listing.status === 'pending_approval' && (
            <p className="text-xs text-muted-foreground">
              Tu listado esta siendo revisado...
            </p>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              Marketplace
            </h1>
            <p className="text-muted-foreground mt-1">
              Publica tu vehiculo en nuestro inventario y recibe ofertas de compradores.
            </p>
          </div>
          <Button onClick={() => router.push('/escritorio/marketplace/nuevo')} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo listado
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_listings}</p>
                    <p className="text-xs text-muted-foreground">Total listados</p>
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
                    <p className="text-2xl font-bold">{stats.active_listings}</p>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_views}</p>
                    <p className="text-xs text-muted-foreground">Vistas totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_contacts}</p>
                    <p className="text-xs text-muted-foreground">Contactos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Listings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="draft">Borradores</TabsTrigger>
            <TabsTrigger value="pending_approval">Pendientes</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="sold">Vendidos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Car className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay listados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {activeTab === 'all'
                      ? 'Comienza publicando tu primer vehiculo en el marketplace.'
                      : `No tienes listados con estado "${statusConfig[activeTab]?.label || activeTab}".`}
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => router.push('/escritorio/marketplace/nuevo')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear mi primer listado
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map(renderListingCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* How it works section for empty state */}
        {!loading && listings.length === 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">¿Como funciona el Marketplace?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">1. Crea tu listado</h4>
                  <p className="text-sm text-muted-foreground">
                    Agrega fotos y detalles de tu vehiculo
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">2. Envia a revision</h4>
                  <p className="text-sm text-muted-foreground">
                    Nuestro equipo verificara la informacion
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">3. Publicacion activa</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu vehiculo aparecera en nuestro inventario
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">4. Recibe ofertas</h4>
                  <p className="text-sm text-muted-foreground">
                    Contacta con compradores interesados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default MarketplaceDashboardPage;
