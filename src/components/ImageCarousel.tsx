import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import LazyImage from './LazyImage';
import { getPlaceholderImage } from '../utils/getPlaceholderImage';
import { MapPinIcon, TagIcon, ShieldCheckIcon } from './icons';
import { formatPromotion, getPromotionStyles } from '../utils/formatters';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  isSeparado?: boolean;
  garantia?: string;
  sucursal?: string[];
  clasificacionid?: string[] | number;
  carroceria?: string;
  isPopular?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, className, isSeparado, garantia, sucursal, clasificacionid, carroceria, isPopular }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const constraintsRef = useRef(null);

  const allImages = useMemo(() => {
    // Filter out falsy values and check for valid image URLs
    const filteredImages = images.filter(img => {
      if (!img) return false;
      if (typeof img !== 'string') return false;
      const trimmed = img.trim();
      return trimmed.length > 0 && trimmed.startsWith('http');
    });

    const placeholder = getPlaceholderImage(clasificacionid, carroceria);
    return filteredImages.length > 0 ? filteredImages : [placeholder];
  }, [images, clasificacionid, carroceria]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 50; // pixels to drag to trigger a slide
    const swipePower = 10000; // velocity needed to trigger a slide

    if (offset < -threshold || velocity < -swipePower) {
      // Swiped left
      setCurrentIndex((prev) => Math.min(prev + 1, allImages.length - 1));
    } else if (offset > threshold || velocity > swipePower) {
      // Swiped right
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
    x.set(0); // Snap back to center
  }, [allImages.length, x]);

  const currentImage = allImages[currentIndex];

  // Only render current image + adjacent ones for instant navigation
  const imagesToRender = useMemo(() => {
    const indices = [currentIndex];
    if (currentIndex > 0) indices.unshift(currentIndex - 1);
    if (currentIndex < allImages.length - 1) indices.push(currentIndex + 1);
    return indices;
  }, [currentIndex, allImages.length]);

  return (
    <div ref={constraintsRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <motion.div
        className="flex h-full"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ translateX: `-${currentIndex * 100}%` }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      >
        {allImages.map((imgSrc, index) => {
          // Only render visible + adjacent images
          const shouldRender = imagesToRender.includes(index);

          return (
            <div key={index} className="flex-shrink-0 w-full h-full relative">
              {shouldRender ? (
                <>
                  <LazyImage
                    src={imgSrc}
                    alt={`${alt} - ${index + 1}`}
                    className={`w-full h-full object-cover ${isSeparado ? 'filter grayscale' : ''}`}
                  />

                  {/* Dark fadeout gradient at bottom for better text readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10"></div>

                  {/* Top-left tag: Popular pill */}
                  {isPopular && (
                    <div className="absolute top-3 left-3 z-20">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 text-white shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Popular
                      </span>
                    </div>
                  )}

                  {/* Bottom-left tags: Garantia, Sucursal - Enhanced glassmorphism */}
                  <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-2 max-w-[calc(100%-1.5rem)]">
                    {garantia && garantia !== 'N/A' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30">
                        <ShieldCheckIcon className="w-4 h-4" />
                        {garantia}
                      </span>
                    )}

                    {sucursal && sucursal.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30">
                        <MapPinIcon className="w-4 h-4" />
                        {sucursal[0]}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
          );
        })}
      </motion.div>

      {allImages.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => Math.max(prev - 1, 0));
            }}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm ${
              currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => Math.min(prev + 1, allImages.length - 1));
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm ${
              currentIndex === allImages.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dots Navigation - Show only up to 3 dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-30">
            {allImages.slice(0, 3).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-white scale-125 w-6' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;