import React, { useEffect } from 'react';

/**
 * ResourceHints Component
 *
 * Manages resource preloading, prefetching, and DNS prefetching
 * for optimal performance
 */
const ResourceHints: React.FC = () => {
  useEffect(() => {
    // Preconnect to critical third-party origins
    const origins = [
      'https://mhlztgilrmgebkyqowxz.supabase.co',
      'https://images.trefa.mx',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    origins.forEach(origin => {
      // Create preconnect link
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      // Also add dns-prefetch for older browsers
      const dnsPrefetch = document.createElement('link');
      dnsPrefetch.rel = 'dns-prefetch';
      dnsPrefetch.href = origin;
      document.head.appendChild(dnsPrefetch);
    });

    // Prefetch critical routes based on user behavior
    const prefetchRoute = (route: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
    };

    // Prefetch likely next pages after a delay
    const prefetchTimer = setTimeout(() => {
      // Only prefetch if user is on a fast connection
      const connection = (navigator as any).connection;
      if (connection && (connection.saveData || connection.effectiveType === 'slow-2g')) {
        return; // Skip prefetching on slow connections
      }

      // Prefetch based on current route
      const currentPath = window.location.pathname;

      if (currentPath === '/') {
        // Home page - prefetch common next pages
        prefetchRoute('/autos');
        prefetchRoute('/financiamientos');
      } else if (currentPath.includes('/autos')) {
        // Vehicle list - prefetch application page
        prefetchRoute('/escritorio/aplicacion');
      }
    }, 5000); // Wait 5 seconds before prefetching

    // Cleanup function
    return () => {
      clearTimeout(prefetchTimer);
    };
  }, []);

  // Preload critical fonts
  useEffect(() => {
    const fontUrls: string[] = [
      // Add your critical font URLs here if using custom fonts
      // Example: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
    ];

    fontUrls.forEach((url: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);

  // Preload critical images
  useEffect(() => {
    const criticalImages = [
      '/placeholder-vehicle.webp',
      // Add other critical images here
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }, []);

  // Implement Intersection Observer for route prefetching
  useEffect(() => {
    const handleLinkHover = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.href && target.href.startsWith(window.location.origin)) {
        const url = new URL(target.href);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url.pathname;
        link.as = 'document';

        // Check if already prefetched
        const existing = document.querySelector(`link[rel="prefetch"][href="${url.pathname}"]`);
        if (!existing) {
          document.head.appendChild(link);
        }
      }
    };

    // Add hover listener for link prefetching
    document.addEventListener('mouseover', handleLinkHover, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleLinkHover);
    };
  }, []);

  // Prefetch components based on viewport visibility
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    const componentPrefetchMap: Record<string, () => void> = {
      // Map component selectors to their prefetch functions
      '[data-prefetch="vehicle-detail"]': () => {
        import('../page-components/VehicleDetailPage');
      },
      '[data-prefetch="application"]': () => {
        import('../page-components/Application');
      },
      // Add more mappings as needed
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const prefetchKey = element.dataset.prefetch;

          if (prefetchKey) {
            const selector = `[data-prefetch="${prefetchKey}"]`;
            const prefetchFn = componentPrefetchMap[selector];
            if (prefetchFn) {
              prefetchFn();
              observer.unobserve(element);
            }
          }
        }
      });
    }, observerOptions);

    // Start observing elements with data-prefetch attribute
    const elements = document.querySelectorAll('[data-prefetch]');
    elements.forEach(element => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ResourceHints;