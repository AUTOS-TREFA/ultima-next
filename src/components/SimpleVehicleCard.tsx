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
    <Link href={`/autos/${vehicle.slug}`} className="relative aspect-[4/3] w-full group rounded-lg overflow-hidden shadow-sm">
      <LazyImage
        src={imageSrc}
        alt={vehicle.titulo}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-3">
        <h3 className="text-white font-bold text-sm truncate drop-shadow-md" title={vehicle.titulo}>
          {vehicle.titulo}
        </h3>
      </div>
    </Link>
  );
};

export default SimpleVehicleCard;
