'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VehicleService from '@/services/VehicleService';
import { useAuth } from '@/context/AuthContext';
import { useVehicles } from '@/context/VehicleContext';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoritesService } from '@/services/FavoritesService';
import { InspectionService } from '@/services/InspectionService';
import type { WordPressVehicle, InspectionReportData } from '@/types/types';
import { getVehicleImage } from '@/utils/getVehicleImage';
import { formatPrice, formatMileage } from '@/utils/formatters';
import VehicleProductOverview from '@/components/shadcn-studio/blocks/vehicle-product-overview/vehicle-product-overview';
import Breadcrumbs from '@/components/Breadcrumbs';
import RecentlyViewed from '@/components/RecentlyViewed';
import SimpleVehicleCard from '@/components/SimpleVehicleCard';
import VehicleCarousel from '@/components/VehicleCarousel';
import { ChevronLeft, ChevronRight, ArrowLeft, Grid3X3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Previous and Next vehicles for navigation
  const { prevVehicle, nextVehicle } = useMemo(() => {
    if (!vehicle || !allVehicles.length) return { prevVehicle: null, nextVehicle: null };

    // Find current vehicle index in all vehicles
    const currentIndex = allVehicles.findIndex(v => v.id === vehicle.id);

    // If not found in list, use similar vehicles for navigation
    if (currentIndex === -1) {
      const prev = similarVehicles[0] || null;
      const next = similarVehicles[1] || null;
      return { prevVehicle: prev, nextVehicle: next };
    }

    // Get previous and next from the full list
    const prev = currentIndex > 0 ? allVehicles[currentIndex - 1] : allVehicles[allVehicles.length - 1];
    const next = currentIndex < allVehicles.length - 1 ? allVehicles[currentIndex + 1] : allVehicles[0];

    return {
      prevVehicle: prev?.id !== vehicle.id ? prev : null,
      nextVehicle: next?.id !== vehicle.id ? next : null
    };
  }, [vehicle, allVehicles, similarVehicles]);

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
      {/* SOLD Banner for historic vehicles */}
      {(vehicle.vendido || vehicle.isHistoric || vehicle.ordenstatus === 'Historico') && (
        <div className="bg-amber-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-center">
                <p className="font-bold text-lg">VENDIDO</p>
                <p className="text-sm opacity-90">Este vehículo ya no está disponible. Explora nuestro inventario actual para encontrar opciones similares.</p>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <Link
                href="/autos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-full font-semibold text-sm hover:bg-amber-50 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                Ver inventario disponible
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Breadcrumbs with back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/autos"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver al inventario</span>
              <span className="sm:hidden">Volver</span>
            </Link>
            <div className="hidden sm:block">
              <Breadcrumbs crumbs={crumbs} />
            </div>
          </div>
          <Link
            href="/autos"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Ver todos</span>
          </Link>
        </div>
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
        isSold={vehicle.vendido || vehicle.isHistoric || vehicle.ordenstatus === 'Historico'}
      />

      {/* Recently Viewed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecentlyViewed currentVehicleId={vehicle.id} />
      </div>

      {/* Vehicle Navigation - Previous/Next (Kavak/CarMax style) */}
      {(prevVehicle || nextVehicle) && (
        <div className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              {/* Previous Vehicle */}
              {prevVehicle ? (
                <Link
                  href={`/autos/${prevVehicle.slug}`}
                  className="flex items-center gap-4 group flex-1 max-w-[45%] p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={getVehicleImage(prevVehicle)}
                      alt={prevVehicle.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Anterior</p>
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600 transition-colors">
                        {prevVehicle.autoano} {prevVehicle.marca} {prevVehicle.modelo}
                      </p>
                      <p className="text-xs text-orange-600 font-bold">{formatPrice(prevVehicle.precio)}</p>
                    </div>
                  </div>
                  <span className="sm:hidden text-sm font-medium text-muted-foreground group-hover:text-orange-600">
                    Anterior
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {/* Center - Back to list */}
              <Link
                href="/autos"
                className="flex flex-col items-center justify-center px-4 py-2 text-center hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Grid3X3 className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-medium">Ver todos</span>
              </Link>

              {/* Next Vehicle */}
              {nextVehicle ? (
                <Link
                  href={`/autos/${nextVehicle.slug}`}
                  className="flex items-center gap-4 group flex-1 max-w-[45%] p-3 rounded-xl hover:bg-gray-50 transition-colors justify-end"
                >
                  <span className="sm:hidden text-sm font-medium text-muted-foreground group-hover:text-orange-600">
                    Siguiente
                  </span>
                  <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Siguiente</p>
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600 transition-colors">
                        {nextVehicle.autoano} {nextVehicle.marca} {nextVehicle.modelo}
                      </p>
                      <p className="text-xs text-orange-600 font-bold">{formatPrice(nextVehicle.precio)}</p>
                    </div>
                    <img
                      src={getVehicleImage(nextVehicle)}
                      alt={nextVehicle.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        </div>
      )}

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
