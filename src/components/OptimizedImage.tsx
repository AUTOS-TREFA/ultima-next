import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { getCdnUrl, getResponsiveSrcSet, getThumbnailUrl } from '../utils/imageUrl';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  fallbackSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  sizes = '100vw',
  loading = 'lazy',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  width,
  height,
  objectFit = 'cover',
  quality = 85,
  fallbackSrc = '/placeholder-vehicle.webp',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current || loading !== 'lazy' || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [loading, priority]);

  // Update image src when prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  };

  // Generate optimized URLs
  const optimizedSrc = getCdnUrl(imgSrc, {
    width: width ? width * 2 : undefined, // 2x for retina
    quality,
    format: 'auto',
  });

  const srcSet = getResponsiveSrcSet(imgSrc, [400, 800, 1200, 1600]);

  // Generate blur placeholder
  const placeholderSrc = placeholder === 'blur'
    ? blurDataURL || getThumbnailUrl(imgSrc, 40)
    : undefined;

  const imageStyle: CSSProperties = {
    objectFit,
    ...style,
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    backgroundColor: '#f3f4f6',
  };

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${className}`}
      style={containerStyle}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && isLoading && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: 0.8,
          }}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && placeholder === 'empty' && (
        <div
          className="animate-pulse"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#e5e7eb',
          }}
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            ...imageStyle,
            width: '100%',
            height: '100%',
            display: hasError ? 'none' : 'block',
          }}
          // Performance attributes
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div
          className="flex items-center justify-center w-full h-full bg-gray-200"
          style={{ minHeight: height || 200 }}
        >
          <div className="text-gray-500 text-center p-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Imagen no disponible</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;