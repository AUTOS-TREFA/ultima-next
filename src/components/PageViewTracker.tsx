'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { conversionTracking } from '../services/ConversionTrackingService';

/**
 * PageViewTracker Component
 *
 * Automatically tracks page views on route changes for:
 * - Google Tag Manager (GTM)
 * - Facebook Pixel
 * - Supabase tracking_events table
 *
 * Place this component once at the top level of your app (in layout.tsx)
 */
function PageViewTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view on route change
    const pagePath = pathname;
    const pageTitle = document.title || pagePath;
    const search = searchParams?.toString() || '';

    // Send to ConversionTrackingService which handles:
    // 1. GTM dataLayer push
    // 2. Facebook Pixel PageView
    // 3. Supabase tracking_events insert
    conversionTracking.trackPageView(pageTitle, {
      page: pagePath,
      url: window.location.href,
      referrer: document.referrer,
      search: search
    });

    console.log(`📊 PageView tracked: ${pagePath}`, {
      title: pageTitle,
      url: window.location.href
    });
  }, [pathname, searchParams]); // Re-run on route or query string change

  return null; // This component doesn't render anything
}

export default function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerContent />
    </Suspense>
  );
}
