
'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';

import type { WordPressVehicle } from '../types/types';

import { formatPrice } from '../utils/formatters';

import ImageCarousel from './ImageCarousel';

import { getVehicleImage } from '../utils/getVehicleImage';



interface HeroVehicleCardProps {

  vehicle: WordPressVehicle;

}



const HeroVehicleCard: React.FC<HeroVehicleCardProps> = ({ vehicle }) => {

    const imagesForCarousel = useMemo(() => {

        const mainImage = getVehicleImage(vehicle);

        const imageUrls = [

          mainImage,

          ...(vehicle.galeria_exterior || []),

          ...(vehicle.galeria_interior || []),

        ];

        return [...new Set(imageUrls.filter(Boolean))];

    }, [vehicle]);



    return (

        <div className="relative h-full group">

            <div className="h-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">

                <div className="relative aspect-video bg-white flex-grow">

                    <ImageCarousel

                        images={imagesForCarousel}

                        alt={vehicle.titulo}

                        clasificacionid={vehicle.clasificacionid}

                        carroceria={vehicle.carroceria}

                        className="align-center h-full w-full"

                    />

                     {/* Hover Overlay */}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">

                        <h3 className="text-white font-bold text-sm truncate drop-shadow-md" title={vehicle.titulo}>

                            {vehicle.titulo}

                        </h3>

                        <p className="text-primary-400 font-semibold text-base drop-shadow-md">{formatPrice(vehicle.precio)}</p>

                    </div>

                </div>

            </div>

            {vehicle.slug && vehicle.slug.trim() !== '' && (
                <Link href={`/autos/${vehicle.slug}`} className="absolute inset-0 z-10" aria-label={`Ver detalles de ${vehicle.titulo}`}>

                    <span className="sr-only">Ver detalles de ${vehicle.titulo}</span>

                </Link>
            )}

        </div>

    );

};



export default HeroVehicleCard;