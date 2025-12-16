'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { getCdnUrl, ImageOptions } from '../utils/imageUrl';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  onClick?: () => void;
  /** Image transformation options for CDN */
  imageOptions?: ImageOptions;
  /** Enable responsive images with srcset */
  responsive?: boolean;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
}

// Blur placeholder for loading state
const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,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';

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  objectFit = 'cover',
  onClick,
  imageOptions,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // Determine if src is valid
  const isValidSrc = typeof src === 'string' && src.trim() !== '';

  // Check if it's a data URL (placeholder) or local image
  const isDataUrl = isValidSrc && src.startsWith('data:');
  const isLocalImage = isValidSrc && src.startsWith('/');

  // Get optimized URL - only transform remote URLs, not local or data URLs
  const optimizedSrc = React.useMemo(() => {
    if (!isValidSrc) return DEFAULT_PLACEHOLDER_IMAGE;
    if (isDataUrl || isLocalImage) return src;

    // Transform remote URLs through CDN
    const cdnUrl = getCdnUrl(src, imageOptions);
    return cdnUrl || src;
  }, [src, isValidSrc, isDataUrl, isLocalImage, imageOptions]);

  const handleError = useCallback(() => {
    console.warn('LazyImage: Failed to load image, using placeholder', { src, alt });
    setHasError(true);
  }, [src, alt]);

  // Show placeholder on error or invalid src
  if (hasError || !isValidSrc) {
    return (
      <div
        className={`relative overflow-hidden bg-gray-100 ${className}`}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEFAULT_PLACEHOLDER_IMAGE}
          alt={alt}
          className={`w-full h-full object-${objectFit}`}
          loading="lazy"
        />
      </div>
    );
  }

  // For data URLs, use native img (Next.js Image doesn't support data URLs well)
  if (isDataUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-gray-100 ${className}`}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-${objectFit}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      onClick={onClick}
    >
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        sizes={sizes}
        quality={85}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        className={`object-${objectFit}`}
        onError={handleError}
      />
    </div>
  );
};

export default LazyImage;
