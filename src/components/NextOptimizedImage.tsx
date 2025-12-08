'use client';

import Image from 'next/image';
import { useState } from 'react';

interface NextOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * Componente optimizado de imagen con Next.js Image
 *
 * Diferencia con OptimizedImage:
 * - Este componente usa next/image (optimización del framework)
 * - OptimizedImage usa un CDN personalizado
 *
 * Características:
 * - Optimización automática de imágenes (WebP, AVIF)
 * - Lazy loading por defecto
 * - Fallback automático a placeholder en caso de error
 * - Soporte para imágenes de Supabase Storage y R2
 * - Responsive images con sizes
 *
 * Uso básico:
 * ```tsx
 * <NextOptimizedImage
 *   src="/images/vehicle.jpg"
 *   alt="Honda Civic 2020"
 *   width={800}
 *   height={600}
 * />
 * ```
 *
 * Con layout responsive:
 * ```tsx
 * <NextOptimizedImage
 *   src={vehicleImage}
 *   alt={vehicle.title}
 *   fill
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 *   className="object-cover"
 * />
 * ```
 */
export default function NextOptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  className = '',
  quality = 85,
  loading = 'lazy',
  objectFit = 'cover',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder-vehicle.jpg',
}: NextOptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.warn(`Error loading image: ${src}, using fallback`);
    setImgSrc(fallbackSrc);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Validar que src no esté vacío
  const imageSrc = imgSrc && imgSrc.trim() !== '' ? imgSrc : fallbackSrc;

  // Props comunes para next/image
  const commonProps = {
    src: imageSrc,
    alt: alt || 'Imagen',
    quality,
    onError: handleError,
    onLoad: handleLoad,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    loading: priority ? undefined : loading,
    priority,
  };

  // Configurar object-fit
  const style = fill
    ? { objectFit }
    : {};

  if (fill) {
    return (
      <Image
        {...commonProps}
        fill
        sizes={sizes || '100vw'}
        style={style}
      />
    );
  }

  if (!width || !height) {
    console.warn('NextOptimizedImage: width and height are required when fill is false');
    return (
      <Image
        {...commonProps}
        fill
        sizes={sizes || '100vw'}
        style={style}
      />
    );
  }

  return (
    <Image
      {...commonProps}
      width={width}
      height={height}
      sizes={sizes}
      style={style}
    />
  );
}

/**
 * Componente optimizado específico para imágenes de vehículos
 *
 * Configuración pre-optimizada para las necesidades de TREFA:
 * - Aspect ratio 4:3 (estándar para fotos de vehículos)
 * - Sizes responsivos optimizados
 * - Placeholder automático de vehículo
 *
 * Uso:
 * ```tsx
 * <VehicleImage
 *   src={vehicle.feature_image[0]}
 *   alt={vehicle.title}
 *   priority={false}
 * />
 * ```
 */
export function VehicleImage({
  src,
  alt,
  priority = false,
  className = '',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <NextOptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={priority}
      className={className}
      quality={85}
      objectFit="cover"
      fallbackSrc="/images/placeholder-vehicle.jpg"
    />
  );
}

/**
 * Componente optimizado para avatares y fotos de perfil
 *
 * Características:
 * - Formato cuadrado
 * - Sizes pequeños para rendimiento
 * - Fallback a avatar genérico
 */
export function AvatarImage({
  src,
  alt,
  size = 128,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <NextOptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={90}
      fallbackSrc="/images/default-avatar.png"
    />
  );
}
