
import React, { useState } from 'react';
import type { CarouselProps } from '../../../../types/landing-builder';

export const GalleryCarousel: React.FC<CarouselProps> = ({ headline, paragraph, images, color }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
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
      <div className="max-w-4xl mx-auto px-4 @sm:px-6 @lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 @sm:mb-10 @md:mb-12">
          <h2 className="text-lg @sm:text-xl @md:text-3xl @lg:text-4xl font-extrabold text-slate-900 tracking-tight">{headline}</h2>
          <p className="mt-2 @sm:mt-3 text-base @sm:text-lg text-slate-600">{paragraph}</p>
        </div>
        <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg shadow-2xl">
            {images.length > 0 && <img src={images[currentIndex]?.src} alt="Main view" className="w-full h-full object-cover" />}
        </div>
        <div className="mt-2 @sm:mt-3">
          <div className="grid grid-cols-4 @sm:grid-cols-6 @md:grid-cols-8 gap-1.5 @sm:gap-2">
            {images.map((image, index) => (
              <button key={image.id} onClick={() => goToSlide(index)} className={`aspect-w-1 aspect-h-1 w-full rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-[#FF6801] ${currentIndex === index ? 'ring-2 ring-[#FF6801]' : 'opacity-70 hover:opacity-100'}`}>
                <img src={image.src} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
