
import React, { useState } from 'react';
import type { CarouselProps } from '../../../../types/landing-builder';

export const HorizontalCarousel: React.FC<CarouselProps> = ({ headline, paragraph, images, color }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (images.length === 0) {
     return (
        <section className="py-4 @sm:py-8 @md:py-12 @lg:py-16" style={{ backgroundColor: color }}>
            <div className="text-center text-slate-500">Añade imágenes para ver el carrusel.</div>
        </section>
     )
  }

  return (
    <section className="py-4 @sm:py-8 @md:py-12 @lg:py-16" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto px-4 @sm:px-6 @lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-lg @sm:text-xl @md:text-3xl @lg:text-4xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-2 @sm:mt-3 text-base @sm:text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className="mt-4 @sm:mt-6 @md:mt-10 relative">
          <div className="overflow-hidden rounded-lg shadow-xl">
            <div className="whitespace-nowrap transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {images.map((image, index) => (
                <div key={image.id} className="inline-block w-full align-top">
                  <img src={image.src} alt={`Slide ${index + 1}`} className="w-full h-auto object-cover aspect-video max-h-[400px] @sm:max-h-[500px] @md:max-h-[600px]" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={goToPrevious} className="absolute top-1/2 left-2 @sm:left-4 -translate-y-1/2 bg-white/70 p-1.5 @sm:p-2 rounded-full shadow-lg hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-[#FF6801]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 @sm:h-6 @sm:w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToNext} className="absolute top-1/2 right-2 @sm:right-4 -translate-y-1/2 bg-white/70 p-1.5 @sm:p-2 rounded-full shadow-lg hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-[#FF6801]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 @sm:h-6 @sm:w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
};
