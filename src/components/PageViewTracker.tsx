import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { conversionTracking } from '../services/ConversionTrackingService';

/**
 * PageViewTracker Component
 *
 * Automatically tracks page views on route changes for:
 * - Google Tag Manager (GTM)
 * - Facebook Pixel
 * - Supabase tracking_events table
 *
 * Place this component once at the top level of your app (in App.tsx)
 */
export default function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pagePath = location.pathname;
    const pageTitle = document.title || pagePath;

    // Send to ConversionTrackingService which handles:
    // 1. GTM dataLayer push
    // 2. Facebook Pixel PageView
    // 3. Supabase tracking_events insert
    conversionTracking.trackPageView(pageTitle, {
      page: pagePath,
      url: window.location.href,
      referrer: document.referrer,
      search: location.search
    });

    console.log(`📊 PageView tracked: ${pagePath}`, {
      title: pageTitle,
      url: window.location.href
    });
  }, [location.pathname, location.search]); // Re-run on route or query string change

  return null; // This component doesn't render anything
}
