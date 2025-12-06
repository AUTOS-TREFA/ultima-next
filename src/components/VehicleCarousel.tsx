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
    <div className="py-8 sm:py-10 lg:py-14 bg-gradient-to-br from-muted/20 to-muted/40 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header with shadcn design system styling */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="inline-flex items-center justify-center rounded-lg p-3 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background border border-input shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="inline-flex items-center justify-center rounded-lg p-3 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background border border-input shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable container with improved mobile visibility and larger cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 lg:gap-7 overflow-x-auto overflow-y-visible pb-6 scroll-smooth snap-x snap-mandatory -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none'
          }}
        >
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="snap-start flex-shrink-0 w-[300px] sm:w-[340px] lg:w-[380px] xl:w-[400px] transition-transform duration-300 hover:scale-[1.02]"
            >
              <SimpleVehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default VehicleCarousel;
