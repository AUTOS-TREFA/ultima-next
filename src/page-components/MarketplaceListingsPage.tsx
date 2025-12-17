'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { ConsignmentService, type ConsignmentListing } from '@/services/ConsignmentService';
import {
  Car,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusConfig = {
  pending_approval: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  active: {
    label: 'Activo',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  sold: {
    label: 'Vendido',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expirado',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle,
  },
};

export default function MarketplaceListingsPage() {
  const [listings, setListings] = useState<ConsignmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Use ConsignmentService to fetch listings
      const listingsData = await ConsignmentService.getMyListings(user.id);

      // Fetch images for each listing
      const listingsWithImages = await Promise.all(
        listingsData.map(async (listing) => {
          const images = await ConsignmentService.getListingImages(listing.id);
          return { ...listing, images };
        })
      );

      setListings(listingsWithImages as any);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.message || 'Error al cargar los listings');
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('¿Estás seguro de eliminar este listing?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Use ConsignmentService to delete draft listing
      await ConsignmentService.deleteDraftListing(user.id, listingId);
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      setError(err.message || 'Error al eliminar el listing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Car className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Vehículos en Marketplace</h1>
            <p className="text-sm text-gray-600">Gestiona tus publicaciones</p>
          </div>
        </div>
        <Link href="/escritorio/marketplace/nuevo">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {listings.length === 0 ? (
        <Card className="bg-white/95 border-gray-100">
          <CardContent className="p-8 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes vehículos publicados
            </h3>
            <p className="text-gray-600 mb-6">
              Publica tu primer vehículo en el marketplace para comenzar a vender
            </p>
            <Link href="/escritorio/marketplace/nuevo">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Vehículo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const primaryImage = (listing as any).images?.find((img: any) => img.is_primary) || (listing as any).images?.[0];
            const StatusIcon = statusConfig[listing.status as keyof typeof statusConfig]?.icon || AlertCircle;

            return (
              <Card key={listing.id} className="bg-white/95 border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {primaryImage && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={primaryImage.public_url || primaryImage.storage_path}
                      alt={`${listing.brand} ${listing.model}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${statusConfig[listing.status as keyof typeof statusConfig]?.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[listing.status as keyof typeof statusConfig]?.label || listing.status}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">
                    {listing.brand} {listing.model}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {listing.year} {listing.version && `· ${listing.version}`}
                  </p>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-orange-600">
                      ${listing.price.toLocaleString('es-MX')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {listing.mileage.toLocaleString()} km
                    </span>
                  </div>

                  {listing.status === 'rejected' && listing.rejection_reason && (
                    <Alert variant="destructive" className="mb-3 py-2">
                      <AlertDescription className="text-xs">
                        {listing.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 pb-3 border-b">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{listing.view_count || 0} vistas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      <span>{listing.contact_count || 0} contactos</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={listing.status === 'sold'}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteListing(listing.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
