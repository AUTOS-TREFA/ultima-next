'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFavorites } from '../hooks/useFavorites';
import { useVehicles } from '../context/VehicleContext';
import type { Vehicle } from '../types/types';
import { getVehicleImage } from '../utils/getVehicleImage';
import { formatPrice } from '../utils/formatters';
import { HeartIcon } from './icons';
import LazyImage from './LazyImage';

interface FavoritesQuickAccessProps {
  variant?: 'sidebar' | 'mobile';
}

const FavoritesQuickAccess: React.FC<FavoritesQuickAccessProps> = ({ variant = 'sidebar' }) => {
  const { favorites, isLoading } = useFavorites();
  const { vehicles } = useVehicles();
  const [favoriteVehicles, setFavoriteVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    console.log('[FavoritesQuickAccess] favorites:', favorites);
    console.log('[FavoritesQuickAccess] vehicles count:', vehicles.length);

    if (favorites.length > 0 && vehicles.length > 0) {
      // Try matching with both id and ordencompra
      const favVehicles = vehicles.filter(v =>
        favorites.includes(v.id) ||
        favorites.includes(v.ordencompra as any) ||
        favorites.includes(String(v.id) as any) ||
        favorites.includes(String(v.ordencompra) as any)
      );
      console.log('[FavoritesQuickAccess] matched vehicles:', favVehicles.length);
      setFavoriteVehicles(favVehicles.slice(0, 6));
    } else {
      setFavoriteVehicles([]);
    }
  }, [favorites, vehicles]);

  if (isLoading) {
    return null;
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <HeartIcon className="w-5 h-5 text-red-500 fill-current" />
          <h3 className="text-base font-bold text-gray-900">Mis Favoritos</h3>
        </div>

        {favoriteVehicles.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 leading-relaxed">
              Guarda tus favoritos y accésalos de forma rápida desde aquí! Prueba agregando un auto a tus favoritos.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {favoriteVehicles.map(vehicle => (
                <Link
                  key={vehicle.id}
                  href={`/autos/${vehicle.slug}`}
                  className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary-300 transition-all duration-200"
                >
                  <div className="relative aspect-[4/3]">
                    <LazyImage
                      src={getVehicleImage(vehicle)}
                      alt={vehicle.title}
                      className="w-full h-full"
                      objectFit="cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                      {vehicle.title}
                    </p>
                    <p className="text-xs font-bold text-primary-600 mt-0.5">
                      {formatPrice(vehicle.precio)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/escritorio/favoritos"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline block text-center"
            >
              Ver todos mis favoritos →
            </Link>
          </>
        )}
      </div>
    );
  }

  // Mobile variant - horizontal slider
  if (variant === 'mobile' && favoriteVehicles.length > 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 px-4">
          <HeartIcon className="w-4 h-4 text-red-500 fill-current" />
          <h3 className="text-sm font-bold text-gray-900">Mis Favoritos</h3>
        </div>

        <div className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-3 pb-2">
            {favoriteVehicles.map(vehicle => (
              <Link
                key={vehicle.id}
                href={`/autos/${vehicle.slug}`}
                className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 flex-shrink-0 w-36"
              >
                <div className="relative aspect-[4/3]">
                  <LazyImage
                    src={getVehicleImage(vehicle)}
                    alt={vehicle.title}
                    className="w-full h-full"
                    objectFit="cover"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {vehicle.title}
                  </p>
                  <p className="text-xs font-bold text-primary-600 mt-0.5">
                    {formatPrice(vehicle.precio)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default React.memo(FavoritesQuickAccess);
