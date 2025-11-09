'use client';

import React from 'react';
import { WordPressVehicle } from '../types/types';
import SimpleVehicleCard from './SimpleVehicleCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VehicleCarouselProps {
  vehicles: WordPressVehicle[];
  title: string;
}

const VehicleCarousel: React.FC<VehicleCarouselProps> = ({ vehicles, title }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gray-50 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">{title}</h2>
          <div className="hidden sm:flex gap-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 border relative z-20"><ChevronLeft /></button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 border relative z-20"><ChevronRight /></button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="snap-start flex-shrink-0 w-[80vw] sm:w-[40vw] md:w-[30vw] lg:w-[23vw]">
              <SimpleVehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleCarousel;
