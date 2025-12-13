'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import VehicleService from '@/services/VehicleService';
import { useAuth } from '@/context/AuthContext';
import { useVehicles } from '@/context/VehicleContext';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoritesService } from '@/services/FavoritesService';
import { InspectionService } from '@/services/InspectionService';
import type { WordPressVehicle, InspectionReportData } from '@/types/types';
import { getVehicleImage } from '@/utils/getVehicleImage';
import VehicleProductOverview from '@/components/shadcn-studio/blocks/vehicle-product-overview/vehicle-product-overview';
import Breadcrumbs from '@/components/Breadcrumbs';
import RecentlyViewed from '@/components/RecentlyViewed';
import SimpleVehicleCard from '@/components/SimpleVehicleCard';
import VehicleCarousel from '@/components/VehicleCarousel';

interface VehicleDetailPageV2Props {
  slug: string;
}

const VehicleDetailPageV2: React.FC<VehicleDetailPageV2Props> = ({ slug }) => {
  const router = useRouter();
  const { session } = useAuth();
  const { vehicles: allVehicles } = useVehicles();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  const [vehicle, setVehicle] = useState<WordPressVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [inspectionData, setInspectionData] = useState<InspectionReportData | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(true);
  const [facebookPixelService, setFacebookPixelService] = useState<any>(null);
  const [calculatorTracked, setCalculatorTracked] = useState(false);

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
        setError('No se proporcionó el identificador del auto.');
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
              image_url: getVehicleImage(vehicleData),
            }).catch((err: Error) => console.warn('[FB Pixel] Error tracking ViewContent:', err));
          }

          // Fetch inspection and favorite count in parallel
          setInspectionLoading(true);
          try {
            const [inspectionResult, favoriteCountResult] = await Promise.allSettled([
              InspectionService.getInspectionByVehicleId(vehicleData.id),
              FavoritesService.getFavoriteCountByVehicleId(vehicleData.id)
            ]);

            if (inspectionResult.status === 'fulfilled') setInspectionData(inspectionResult.value);
            if (favoriteCountResult.status === 'fulfilled') setFavoriteCount(favoriteCountResult.value);
          } catch (err) {
            console.error('Error fetching secondary data:', err);
          } finally {
            setInspectionLoading(false);
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

  // Similar vehicles
  const similarVehicles = useMemo(() => {
    if (!vehicle || !allVehicles.length) return [];

    const priceRange = vehicle.precio * 0.2;
    const minPrice = vehicle.precio - priceRange;
    const maxPrice = vehicle.precio + priceRange;

    return allVehicles
      .filter(v =>
        v.id !== vehicle.id &&
        (v.marca === vehicle.marca || v.clasificacionid?.[0] === vehicle.clasificacionid?.[0]) &&
        v.precio >= minPrice &&
        v.precio <= maxPrice
      )
      .slice(0, 8);
  }, [vehicle, allVehicles]);

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

  const handleCalculatorInteraction = () => {
    if (!vehicle || calculatorTracked) return;

    // Facebook Pixel: Tracking AddToCart when calculator is used (only once per session)
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
      }, 'calculator').catch((err: Error) => console.warn('[FB Pixel] Error tracking AddToCart:', err));

      setCalculatorTracked(true);
    }
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
        onCalculatorInteraction={handleCalculatorInteraction}
        isFavorite={isFavorite(vehicle.id)}
        favoriteCount={favoriteCount}
        inspectionData={inspectionData}
        inspectionLoading={inspectionLoading}
      />

      {/* Recently Viewed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecentlyViewed currentVehicleId={vehicle.id} />
      </div>

      {/* Similar Vehicles */}
      {similarVehicles.length > 0 && (
        <>
          {/* Mobile Carousel */}
          <div className="lg:hidden">
            <VehicleCarousel vehicles={similarVehicles} title="También te puede interesar" />
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:block py-12 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">También te puede interesar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {similarVehicles.slice(0, 4).map(v => (
                  <SimpleVehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleDetailPageV2;
