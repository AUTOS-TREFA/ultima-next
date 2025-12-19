'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { WordPressVehicle } from '../types/types';
import { useVehicles } from '../context/VehicleContext';
import { getVehicleImage } from '../utils/getVehicleImage';
import Link from 'next/link';

const HeroVehicleScroller: React.FC = () => {
    const { vehicles: allVehicles } = useVehicles();
    const [vehicles, setVehicles] = useState<WordPressVehicle[]>([]);

    const availableVehicles = useMemo(() =>
        allVehicles.filter(v => !v.separado && !v.vendido && getVehicleImage(v)),
    [allVehicles]);

    useEffect(() => {
        if (availableVehicles.length > 0) {
            let vehicleSlice = [...availableVehicles].sort(() => 0.5 - Math.random()).slice(0, 14);
            setVehicles([...vehicleSlice, ...vehicleSlice]); // Duplicate for seamless loop
        }
    }, [availableVehicles]);

    if (vehicles.length === 0) return null;

    const scrollerBaseClass = "flex gap-4 animate-scroll";
    
    return (
        <div className="w-full relative h-[450px] overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center gap-4">
                <div className={scrollerBaseClass}>
                    {vehicles.slice(0, 7).map((v, i) => <VehicleImage key={`${v.id}-${i}`} vehicle={v} />)}
                    {vehicles.slice(0, 7).map((v, i) => <VehicleImage key={`${v.id}-${i}-clone`} vehicle={v} />)}
                </div>
                <div className={`${scrollerBaseClass} [animation-direction:reverse]`} style={{animationDelay: '-15s'}}>
                    {vehicles.slice(7, 14).map((v, i) => <VehicleImage key={`${v.id}-${i}`} vehicle={v} />)}
                    {vehicles.slice(7, 14).map((v, i) => <VehicleImage key={`${v.id}-${i}-clone`} vehicle={v} />)}
                </div>
            </div>
            <style>{`
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
            `}</style>
        </div>
    );
};

const VehicleImage: React.FC<{vehicle: WordPressVehicle}> = ({ vehicle }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const imageSrc = getVehicleImage(vehicle);
    return (
        <Link href={`/autos/${vehicle.slug}`} className="flex-shrink-0 w-64 h-48 rounded-2xl overflow-hidden group relative bg-gray-200">
            <img
                src={imageSrc}
                alt={vehicle.title} 
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-110 ${isLoaded ? 'blur-0 scale-100' : 'blur-lg scale-110'}`}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-bold text-sm leading-tight drop-shadow-md">{vehicle.title}</h3>
            </div>
        </Link>
    );
};

export default HeroVehicleScroller;