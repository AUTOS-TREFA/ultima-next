
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../types/types';
import { useFavorites } from '../hooks/useFavorites';
import { useQueryClient } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import { getVehicleImage } from '../utils/getVehicleImage';

import ImageCarousel from './ImageCarousel'; // Import the new ImageCarousel
import VehicleCardHeader from './VehicleCard/VehicleCardHeader';
import VehicleCardSpecs from './VehicleCard/VehicleCardSpecs';
import VehicleCardPrice from './VehicleCard/VehicleCardPrice';
import VehicleCardActions from './VehicleCard/VehicleCardActions';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const queryClient = useQueryClient();
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  const hasSlug = vehicle.slug && vehicle.slug.trim() !== '';
  const isSeparado = vehicle.separado === true;
  const favoriteStatus = isFavorite(vehicle.id);
  const whatsappUrl = vehicle.liga_boton_whatsapp || `https://wa.me/5218187049079?text=Hola,%20me%20interesa%20el%20${encodeURIComponent(vehicle.title)}`;

  // Check if vehicle is popular (1000+ views)
  const isPopular = vehicle.view_count >= 1000;

  // Check if vehicle is recently added (within 3 days)
  const isRecentlyAdded = useMemo(() => {
    if (!vehicle.ingreso_inventario) return false;
    const ingresoDate = new Date(vehicle.ingreso_inventario);
    const now = new Date();
    const diffInDays = (now.getTime() - ingresoDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 3;
  }, [vehicle.ingreso_inventario]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasFavorite = isFavorite(vehicle.id);
    await toggleFavorite(vehicle.id);
    setToastMessage(!wasFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos');
    setShowFavoriteToast(true);
    setTimeout(() => setShowFavoriteToast(false), 2000);
  };

  const prefetchVehicle = () => {
    if (hasSlug) {
      queryClient.prefetchQuery({
        queryKey: ['vehicle', vehicle.slug],
        queryFn: () => VehicleService.getVehicleBySlug(vehicle.slug),
      });
    }
  };

  const imagesForCarousel = useMemo(() => {
    const mainImage = getVehicleImage(vehicle);
    const imageUrls = [
      mainImage,
      ...(vehicle.galeria_exterior || []),
    ];
    // Deduplicate, filter out falsy values, and LIMIT TO 3 IMAGES MAX for performance
    const uniqueImages = [...new Set(imageUrls.filter(Boolean))];
    return uniqueImages.slice(0, 3);
  }, [vehicle]);

  const isRezago = vehicle.rezago === true;

  return (
    <div
      onMouseEnter={prefetchVehicle}
      className={`rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group relative border isolate ${isSeparado ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-white border-transparent'} ${isRezago ? 'rezago-border' : ''} ${isPopular ? 'popular-card' : ''}`}
    >
      {/* Recently Added Badge */}
      {isRecentlyAdded && (
        <div className="absolute top-3 left-3 z-[3] bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          ¡Recién llegado!
        </div>
      )}

      {showFavoriteToast && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full z-[4] transition-all duration-300 animate-fade-in-out">
          {toastMessage}
        </div>
      )}

      {/* Separado Badge */}
      {isSeparado && (
        <div className="absolute top-3 right-3 z-[3] bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          SEPARADO
        </div>
      )}

      <div className={`flex flex-col md:flex-row rounded-3xl overflow-hidden relative ${isSeparado ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="md:w-[42%] md:flex-shrink-0 relative">
          <ImageCarousel
            images={imagesForCarousel}
            alt={vehicle.title}
            isSeparado={isSeparado}
            garantia={vehicle.garantia}
            sucursal={vehicle.ubicacion}
            clasificacionid={vehicle.clasificacionid}
            carroceria={vehicle.carroceria}
            isPopular={isPopular}
            className="w-full h-64 md:h-80"
          />
        </div>

        <div className="flex-grow p-5 flex flex-col justify-between min-w-0">
          <div>
            <VehicleCardHeader title={vehicle.titulo} year={vehicle.autoano || vehicle.year} viewCount={vehicle.view_count || 0} ordencompra={vehicle.ordencompra} promociones={vehicle.promociones} />
            <VehicleCardSpecs
              sucursal={vehicle.ubicacion}
              kilometraje={vehicle.kilometraje}
              transmision={vehicle.transmision}
              combustible={vehicle.combustible}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex-grow">
              <VehicleCardPrice
                precio={vehicle.precio}
                mensualidadRecomendada={vehicle.mensualidad_recomendada}
              />
            </div>
            <VehicleCardActions
              isSeparado={isSeparado}
              ordencompra={vehicle.ordencompra}
              whatsappUrl={whatsappUrl}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favoriteStatus}
              marca={vehicle.marca}
              carroceria={vehicle.carroceria}
              precio={vehicle.precio}
              vehicleTitle={vehicle.titulo}
              vehicleSlug={vehicle.slug}
            />
          </div>
        </div>
      </div>

      {hasSlug && (
        <Link to={`/autos/${vehicle.slug}`} data-gtm-id="card-list-view-details" className="absolute inset-0 z-[1]">
          <span className="sr-only">Ver detalles de {vehicle.title}</span>
        </Link>
      )}
    </div>
  );
};

export default React.memo(VehicleCard);