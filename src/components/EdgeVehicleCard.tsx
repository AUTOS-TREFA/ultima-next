'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { WordPressVehicle } from '../types/types';
import ImageCarousel from './ImageCarousel';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice, formatPromotion, getPromotionStyles, formatMileage } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';
import { HeartIcon, TagIcon } from './icons';

interface EdgeVehicleCardProps {
  vehicle: WordPressVehicle;
}

const SpecTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
        {children}
    </span>
);

const EdgeVehicleCard: React.FC<EdgeVehicleCardProps> = ({ vehicle }) => {
  const imagesForCarousel = useMemo(() => {
    const mainImage = getVehicleImage(vehicle);
    const imageUrls = [
      mainImage,
      ...(vehicle.galeria_exterior || []),
      ...(vehicle.galeria_interior || []),
    ];
    return [...new Set(imageUrls.filter(Boolean))];
  }, [vehicle]);

  const hasSlug = vehicle.slug && vehicle.slug.trim() !== '';
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(vehicle.id);
  const isSeparado = vehicle.separado === true;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(vehicle.id);
  };

  const CardContent = (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group flex flex-col relative h-full ${isSeparado ? 'opacity-70' : ''}`}>
        <div className="block relative">
            <ImageCarousel
              images={imagesForCarousel}
              alt={vehicle.title}
              isSeparado={isSeparado}
              clasificacionid={vehicle.clasificacionid}
              carroceria={vehicle.carroceria}
              className={`w-full h-56 ${isSeparado ? 'filter grayscale' : ''}`}
            />
            <div className="absolute top-3 right-3 z-20">
                 <button
                    onClick={handleToggleFavorite}
                    data-gtm-id="card-grid-favorite"
                    className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:text-red-400 transition-colors"
                    aria-label={favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                 >
                     <HeartIcon className={`w-6 h-6 ${favorite ? 'text-red-500 fill-current' : ''}`} />
                 </button>
            </div>
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                {vehicle.combustible && <SpecTag>{vehicle.combustible}</SpecTag>}
                {vehicle.transmision && <SpecTag>{vehicle.transmision}</SpecTag>}
            </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
            <div>
                <h3 className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors truncate" title={vehicle.title}>
                    {vehicle.title}
                </h3>
            </div>
            <p className="text-sm text-gray-500 mt-1 truncate">
                {vehicle.sucursal?.length > 0 && `Suc. ${vehicle.sucursal.join(', ')}`}
                {vehicle.sucursal?.length > 0 && vehicle.kilometraje > 0 && <span className="mx-1">&bull;</span>}
                {vehicle.kilometraje > 0 && formatMileage(vehicle.kilometraje)}
            </p>
            
            {vehicle.promociones && vehicle.promociones.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {vehicle.promociones.slice(0, 2).map((promo, index) => {
                       const styleClasses = getPromotionStyles(promo);
                       return (
                           <span key={index} className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${styleClasses}`}>
                               <TagIcon className="w-3 h-3" />
                               {formatPromotion(promo)}
                           </span>
                       );
                    })}
                </div>
            )}

            <div className="mt-auto pt-3">
                <p className="text-lg font-bold text-gray-900">
                    {formatPrice(vehicle.precio)}
                </p>
                {vehicle.engancheMinimo > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                        Enganche desde {formatPrice(vehicle.engancheMinimo)}
                    </p>
                )}
            </div>
        </div>

        {hasSlug && (
          <Link href={`/autos/${vehicle.slug}`} className="absolute inset-0 z-10">
            <span className="sr-only">Ver detalles de {vehicle.title}</span>
          </Link>
        )}
    </div>
  );

  return <div className="h-full">{CardContent}</div>
};

export default EdgeVehicleCard;