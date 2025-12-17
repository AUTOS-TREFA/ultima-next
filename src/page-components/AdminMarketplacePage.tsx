'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ConsignmentService, ConsignmentListing, AdminConsignmentStats } from '@/services/ConsignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  DollarSign,
  Users,
  TrendingUp,
  MoreVertical,
  Star,
  StarOff,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  BarChart3,
  Activity,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  pending_approval: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  sold: { label: 'Vendido', color: 'bg-purple-100 text-purple-700' },
  expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-700' },
  paused: { label: 'Pausado', color: 'bg-gray-100 text-gray-600' },
};

const AdminMarketplacePage: React.FC = () => {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<ConsignmentListing[]>([]);
  const [stats, setStats] = useState<AdminConsignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectListingId, setRejectListingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/acceder');
      return;
    }

    if (!authLoading && !isAdmin) {
      router.push('/escritorio');
      return;
    }

    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsData, statsData] = await Promise.all([
        ConsignmentService.getAllListingsForAdmin(),
        ConsignmentService.getAdminStats(),
      ]);
      setListings(listingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    if (!user) return;
    setActionLoading(listingId);
    try {
      await ConsignmentService.approveListing(user.id, listingId, 30);
      await loadData();
    } catch (error) {
      console.error('Error approving listing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (listingId: string) => {
    setRejectListingId(listingId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!user || !rejectListingId || !rejectReason.trim()) return;
    setActionLoading(rejectListingId);
    try {
      await ConsignmentService.rejectListing(user.id, rejectListingId, rejectReason);
      setRejectDialogOpen(false);
      setRejectListingId(null);
      setRejectReason('');
      await loadData();
    } catch (error) {
      console.error('Error rejecting listing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeature = async (listingId: string, currentlyFeatured: boolean) => {
    setActionLoading(listingId);
    try {
      await ConsignmentService.toggleFeatureListing(listingId, !currentlyFeatured, 7);
      await loadData();
    } catch (error) {
      console.error('Error toggling feature:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsSold = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await ConsignmentService.markAsSold(listingId, true);
      await loadData();
    } catch (error) {
      console.error('Error marking as sold:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = listings
    .filter(l => activeTab === 'all' || l.status === activeTab)
    .filter(l => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        l.brand?.toLowerCase().includes(query) ||
        l.model?.toLowerCase().includes(query) ||
        l.year?.toString().includes(query)
      );
    });

  const pendingCount = listings.filter(l => l.status === 'pending_approval').length;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              Admin Marketplace
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pendientes
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y aprueba listados de consignacion.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending_approval}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
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
                    <p className="text-2xl font-bold">{stats.approved_active}</p>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.sold}</p>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_users_selling}</p>
                    <p className="text-xs text-muted-foreground">Vendedores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <Store className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-900">{stats.inventory_consignment_count}</p>
                    <p className="text-xs text-orange-700 font-medium">En inventario</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights Panel */}
        {!loading && stats && (
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-700" />
                Insights de Consignación
              </CardTitle>
              <CardDescription>
                Métricas clave del sistema de marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>Precio promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(stats.avg_listing_price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    De {stats.approved_active} vehículos activos
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>Potencial de ingresos</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(stats.total_revenue_potential)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inventario total activo
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    <span>Tasa de aprobación</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.total_listings > 0
                      ? Math.round((stats.approved_active / stats.total_listings) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.approved_active} aprobados de {stats.total_listings} totales
                  </p>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Rechazados</p>
                    <p className="font-semibold text-red-600">{stats.rejected}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Vendedores únicos</p>
                    <p className="font-semibold text-blue-600">{stats.total_users_selling}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">En inventario público</p>
                    <p className="font-semibold text-orange-600">{stats.inventory_consignment_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Tasa de conversión</p>
                    <p className="font-semibold text-green-600">
                      {stats.approved_active > 0
                        ? Math.round((stats.sold / stats.approved_active) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending_approval" className="relative">
              Pendientes
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            <TabsTrigger value="sold">Vendidos</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Store className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay listados</h3>
                  <p className="text-muted-foreground">
                    No hay listados con estado "{statusConfig[activeTab]?.label || activeTab}".
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map(listing => {
                  const config = statusConfig[listing.status] || statusConfig.draft;
                  const isLoading = actionLoading === listing.id;

                  return (
                    <Card key={listing.id} className={`hover:shadow-md transition-shadow ${listing.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            {/* Vehicle Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {listing.is_featured && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                                <h3 className="font-semibold truncate">
                                  {listing.year} {listing.brand} {listing.model}
                                </h3>
                                <Badge className={config.color}>
                                  {config.label}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-muted-foreground">Precio</p>
                                  <p className="font-medium">{formatPrice(listing.price)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Ubicacion</p>
                                  <p className="font-medium">{listing.city || '-'}, {listing.state || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Vistas</p>
                                  <p className="font-medium flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> {listing.view_count}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Contactos</p>
                                  <p className="font-medium flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> {listing.contact_count}
                                  </p>
                                </div>
                              </div>

                              {listing.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {listing.description}
                                </p>
                              )}

                              {listing.rejection_reason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm">
                                  <strong className="text-red-700">Motivo de rechazo:</strong>{' '}
                                  <span className="text-red-600">{listing.rejection_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {listing.status === 'pending_approval' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(listing.id)}
                                  disabled={isLoading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectClick(listing.id)}
                                  disabled={isLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isLoading}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {listing.status === 'active' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleToggleFeature(listing.id, listing.is_featured)}>
                                      {listing.is_featured ? (
                                        <>
                                          <StarOff className="w-4 h-4 mr-2" />
                                          Quitar destacado
                                        </>
                                      ) : (
                                        <>
                                          <Star className="w-4 h-4 mr-2" />
                                          Destacar
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMarkAsSold(listing.id)}>
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Marcar como vendido
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => window.open(`/autos/consignacion/${listing.id}`, '_blank')}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver listado publico
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Rechazar listado
            </DialogTitle>
            <DialogDescription>
              Por favor indica el motivo del rechazo. El usuario recibira esta informacion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Escribe el motivo del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || actionLoading === rejectListingId}
            >
              Rechazar listado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMarketplacePage;
