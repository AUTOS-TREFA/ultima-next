'use client';

import React from 'react';
import Link from 'next/link';
import type { WordPressVehicle } from '../types/types';
import { formatPrice } from '../utils/formatters';
import LazyImage from './LazyImage';
import { getVehicleImage } from '../utils/getVehicleImage';

interface InventorySliderCardProps {
    vehicle: WordPressVehicle;
}

const InventorySliderCard: React.FC<InventorySliderCardProps> = ({ vehicle }) => {
    const hasSlug = vehicle.slug && vehicle.slug.trim() !== '';
    const imageSrc = getVehicleImage(vehicle);
    
    const CardContent = () => (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative aspect-[4/3] bg-gray-100">
                <LazyImage 
                    src={imageSrc} 
                    alt={vehicle.title} 
                    className="w-full h-full"
                />
            </div>
            <div className="p-4 flex-shrink-0">
                <h3 className="text-gray-800 font-bold text-base truncate transition-colors group-hover:text-primary-600" title={vehicle.title}>
                    {vehicle.title}
                </h3>
                <p className="text-gray-700 font-semibold text-lg mt-1">{formatPrice(vehicle.precio)}</p>
            </div>
        </div>
    );

    return hasSlug ? (
        <Link href={`/autos/${vehicle.slug}`} aria-label={`Ver detalles de ${vehicle.title}`} className="contents">
            <CardContent />
        </Link>
    ) : (
        <div className="contents">
            <CardContent />
        </div>
    );
};

export default InventorySliderCard;