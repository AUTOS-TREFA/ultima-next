import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

interface UseLazyLoadResult {
  ref: React.RefObject<any>;
  isInView: boolean;
  hasBeenInView: boolean;
}

/**
 * Custom hook for lazy loading elements
 * Uses Intersection Observer API for efficient viewport detection
 */
export function useLazyLoad({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  enabled = true,
}: UseLazyLoadOptions = {}): UseLazyLoadResult {
  const ref = useRef<any>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);

          if (inView) {
            setHasBeenInView(true);

            if (triggerOnce && ref.current) {
              observer.unobserve(ref.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [enabled, threshold, rootMargin, triggerOnce]);

  return {
    ref,
    isInView,
    hasBeenInView,
  };
}

/**
 * Hook for batch lazy loading multiple elements
 * Useful for lists of images or components
 */
export function useBatchLazyLoad(
  count: number,
  options: UseLazyLoadOptions = {}
): Map<number, UseLazyLoadResult> {
  const [results] = useState(() => new Map<number, UseLazyLoadResult>());

  // Create lazy load hooks for each item
  for (let i = 0; i < count; i++) {
    if (!results.has(i)) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const result = useLazyLoad(options);
      results.set(i, result);
    }
  }

  return results;
}

/**
 * Hook for progressive image loading
 * Loads a low-quality placeholder first, then the full image
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
): {
  src: string;
  isLoading: boolean;
  error: Error | null;
} {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const img = new Image();

    img.onload = () => {
      setSrc(highQualitySrc);
      setIsLoading(false);
    };

    img.onerror = (e) => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = highQualitySrc;

    return () => {
      // Cancel image loading if component unmounts
      img.onload = null;
      img.onerror = null;
    };
  }, [highQualitySrc]);

  return {
    src,
    isLoading,
    error,
  };
}

/**
 * Hook for detecting network speed and adjusting quality accordingly
 */
export function useAdaptiveLoading(): {
  shouldReduceData: boolean;
  connectionType: string | undefined;
  effectiveConnectionType: string | undefined;
} {
  const [networkInfo, setNetworkInfo] = useState(() => {
    const connection = (navigator as any).connection;
    return {
      shouldReduceData: connection?.saveData || false,
      connectionType: connection?.type,
      effectiveConnectionType: connection?.effectiveType,
    };
  });

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        shouldReduceData: connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
        connectionType: connection.type,
        effectiveConnectionType: connection.effectiveType,
      });
    };

    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}

/**
 * Hook for preloading images
 * Useful for preloading hero images or critical assets
 */
export function useImagePreloader(urls: string[]): {
  loaded: boolean;
  errors: Error[];
  progress: number;
} {
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Error[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!urls.length) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    const errorsList: Error[] = [];
    const totalCount = urls.length;

    const checkComplete = () => {
      if (loadedCount + errorsList.length === totalCount) {
        setLoaded(true);
        setErrors(errorsList);
      }
    };

    urls.forEach((url) => {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        setProgress((loadedCount / totalCount) * 100);
        checkComplete();
      };

      img.onerror = () => {
        errorsList.push(new Error(`Failed to load: ${url}`));
        setProgress(((loadedCount + errorsList.length) / totalCount) * 100);
        checkComplete();
      };

      img.src = url;
    });
  }, [urls]);

  return {
    loaded,
    errors,
    progress,
  };
}
