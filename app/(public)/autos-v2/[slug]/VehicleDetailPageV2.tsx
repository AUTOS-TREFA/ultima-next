'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VehicleService from '@/services/VehicleService';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoritesService } from '@/services/FavoritesService';
import type { WordPressVehicle } from '@/types/types';
import VehicleProductOverview from '@/components/shadcn-studio/blocks/vehicle-product-overview/vehicle-product-overview';
import Breadcrumbs from '@/components/Breadcrumbs';

interface VehicleDetailPageV2Props {
  slug: string;
}

const VehicleDetailPageV2: React.FC<VehicleDetailPageV2Props> = ({ slug }) => {
  const router = useRouter();
  const { session } = useAuth();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  const [vehicle, setVehicle] = useState<WordPressVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [facebookPixelService, setFacebookPixelService] = useState<any>(null);

  // Dynamically import FacebookPixelService only on client side
  useEffect(() => {
    import('@/services/FacebookPixelService').then(module => {
      setFacebookPixelService(module.facebookPixelService);
    });
  }, []);

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!slug) {
        setError('No se proporciono el identificador del auto.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const vehicleData = await VehicleService.getAndRecordVehicleView(slug);
        if (vehicleData) {
          setVehicle(vehicleData);

          // Facebook Pixel: Tracking ViewContent
          if (facebookPixelService) {
            facebookPixelService.trackViewContent({
              id: vehicleData.record_id || vehicleData.id,
              title: vehicleData.title,
              price: vehicleData.autoprecio,
              brand: vehicleData.automarca,
              model: vehicleData.autosubmarcaversion,
              year: vehicleData.autoano,
              category: vehicleData.carroceria,
              slug: vehicleData.slug,
            }).catch((err: Error) => console.warn('[FB Pixel] Error tracking ViewContent:', err));
          }

          // Fetch favorite count
          try {
            const count = await FavoritesService.getFavoriteCountByVehicleId(vehicleData.id);
            setFavoriteCount(count);
          } catch (err) {
            console.error('Error fetching favorite count:', err);
          }
        } else {
          setError('Auto no encontrado.');
        }
      } catch (err: any) {
        setError('Error al cargar los detalles del auto: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleData();
  }, [slug, facebookPixelService]);

  // Scroll to top when vehicle changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const handleFinancingClick = () => {
    if (!vehicle) return;

    // Facebook Pixel: Tracking InitiateCheckout
    if (facebookPixelService) {
      facebookPixelService.trackInitiateCheckout({
        id: vehicle.record_id || vehicle.id,
        title: vehicle.title,
        price: vehicle.autoprecio,
        brand: vehicle.automarca,
        model: vehicle.autosubmarcaversion,
        year: vehicle.autoano,
        category: vehicle.carroceria,
        slug: vehicle.slug,
      }).catch((err: Error) => console.warn('[FB Pixel] Error tracking InitiateCheckout:', err));
    }

    const financingUrl = session ? '/escritorio/aplicacion' : '/acceder';
    const urlWithParams = vehicle.ordencompra ? `${financingUrl}?ordencompra=${vehicle.ordencompra}` : financingUrl;
    router.push(urlWithParams);
  };

  const handleWhatsAppClick = () => {
    if (!vehicle) return;

    // Facebook Pixel: Tracking AddToCart (WhatsApp interaction)
    if (facebookPixelService) {
      facebookPixelService.trackAddToCart({
        id: vehicle.record_id || vehicle.id,
        title: vehicle.title,
        price: vehicle.autoprecio,
        brand: vehicle.automarca,
        model: vehicle.autosubmarcaversion,
        year: vehicle.autoano,
        category: vehicle.carroceria,
        slug: vehicle.slug,
      }, 'whatsapp').catch((err: Error) => console.warn('[FB Pixel] Error tracking AddToCart:', err));
    }

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/5218187049079?text=${encodeURIComponent(`Hola, me interesa el ${vehicle.title}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleFavoriteClick = () => {
    if (!vehicle) return;
    toggleFavorite(vehicle.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-destructive px-4 text-center">{error}</p>
      </div>
    );
  }

  // No vehicle found
  if (!vehicle) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Auto no encontrado.</p>
      </div>
    );
  }

  const crumbs = [
    { name: 'Inventario', href: '/autos' },
    { name: vehicle.title }
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <Breadcrumbs crumbs={crumbs} />
      </div>

      {/* Main shadcn Product Overview Component */}
      <VehicleProductOverview
        vehicle={vehicle}
        onFinancingClick={handleFinancingClick}
        onWhatsAppClick={handleWhatsAppClick}
        onFavoriteClick={handleFavoriteClick}
        isFavorite={isFavorite(vehicle.id)}
        favoriteCount={favoriteCount}
      />

      {/* Link back to original version for comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Esta es una version alternativa con diseno shadcn.{' '}
            <a href={`/autos/${slug}`} className="text-primary hover:underline font-medium">
              Ver version original
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPageV2;
