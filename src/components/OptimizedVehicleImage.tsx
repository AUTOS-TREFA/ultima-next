'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { getCdnUrl } from '../utils/imageUrl';

// Local placeholder - inline SVG data URL (no external dependency)
const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHBhdGggZD0iTTI4MCAyNTBhNzAgNzAgMCAwIDEgNzAgNzBsNjAgMGE3MCA3MCAwIDAgMSA3MC03MGwwLTQwYTcwIDcwIDAgMCAxLTcwLTcwbC0xMjAgMGE3MCA3MCAwIDAgMS03MCA3MHoiIGZpbGw9IiNlNWU3ZWIiLz48Y2lyY2xlIGN4PSIyNjAiIGN5PSIzNTAiIHI9IjQwIiBmaWxsPSIjZDFkNWRiIi8+PGNpcmNsZSBjeD0iNTQwIiBjeT0iMzUwIiByPSI0MCIgZmlsbD0iI2QxZDVkYiIvPjx0ZXh0IHg9IjQwMCIgeT0iNDUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOWNhM2FmIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';

// Blur placeholder for loading state
const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,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';

interface OptimizedVehicleImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

const OptimizedVehicleImage: React.FC<OptimizedVehicleImageProps> = ({
  src,
  alt,
  fill = true,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 80,
  onLoad,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get optimized CDN URL
  const imageSrc = React.useMemo(() => {
    if (!src || hasError) return PLACEHOLDER_SVG;

    // Convert to CDN URL with optimization
    const cdnUrl = getCdnUrl(src, {
      width: width || 800,
      quality: quality,
      format: 'auto'
    });

    return cdnUrl || PLACEHOLDER_SVG;
  }, [src, hasError, width, quality]);

  const handleError = useCallback(() => {
    console.warn('OptimizedVehicleImage: Failed to load image, using placeholder', { src, alt });
    setHasError(true);
    setIsLoading(false);
  }, [src, alt]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // If no src provided, show placeholder immediately
  if (!src) {
    return (
      <div className={`relative bg-gray-100 ${className}`} style={fill ? { width: '100%', height: '100%' } : { width, height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PLACEHOLDER_SVG}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Check if it's already a data URL (placeholder)
  const isDataUrl = imageSrc.startsWith('data:');

  return (
    <div className={`relative overflow-hidden ${className}`} style={fill ? { width: '100%', height: '100%' } : { width, height }}>
      {/* Loading skeleton */}
      {isLoading && !isDataUrl && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      {isDataUrl ? (
        // For data URLs (placeholders), use native img
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleLoad}
        />
      ) : (
        // For remote URLs, use Next.js Image with optimization
        <Image
          src={imageSrc}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={false}
        />
      )}
    </div>
  );
};

export default OptimizedVehicleImage;
