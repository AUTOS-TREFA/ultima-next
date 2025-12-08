import React from 'react';
import Link from 'next/link';
import type { Vehicle } from '../types/types';
import LazyImage from './LazyImage';
import { getVehicleImage } from '../utils/getVehicleImage';

interface SimpleVehicleCardProps {
  vehicle: Vehicle;
}

const SimpleVehicleCard: React.FC<SimpleVehicleCardProps> = ({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);

  return (
    <Link
      href={`/autos/${vehicle.slug}`}
      className="group block w-full h-full"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-ring">
        {/* Image Container with fixed aspect ratio */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <LazyImage
            src={imageSrc}
            alt={vehicle.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3
            className="text-sm sm:text-base font-semibold text-white line-clamp-2 leading-tight drop-shadow-lg"
            title={vehicle.title}
          >
            {vehicle.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default SimpleVehicleCard;
