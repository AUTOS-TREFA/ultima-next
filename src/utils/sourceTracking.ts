/**
 * Source Tracking Utility
 * Captures URL parameters and referrer information when leads first arrive at the site
 */

export interface SourceTrackingData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  rfdm?: string;
  referrer?: string;
  landing_page?: string;
  first_visit_at?: string;
}

const SOURCE_TRACKING_KEY = 'strefa_source_tracking';

/**
 * Captures URL parameters and referrer on first visit
 * Should be called on app initialization
 */
export function captureSourceTracking(): void {
  // Check if we already have source tracking data
  const existing = getSourceTracking();
  if (existing && existing.first_visit_at) {
    // Already captured, don't overwrite
    return;
  }

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  const sourceData: SourceTrackingData = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    rfdm: urlParams.get('rfdm') || undefined,
    referrer: document.referrer || undefined,
    landing_page: window.location.href,
    first_visit_at: new Date().toISOString(),
  };

  // Remove undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(sourceData).filter(([_, value]) => value !== undefined)
  ) as SourceTrackingData;

  // Store in sessionStorage (persists across page navigation but not browser close)
  try {
    sessionStorage.setItem(SOURCE_TRACKING_KEY, JSON.stringify(cleanedData));
  } catch (error) {
    console.error('Failed to store source tracking data:', error);
  }
}

/**
 * Retrieves stored source tracking data
 */
export function getSourceTracking(): SourceTrackingData | null {
  try {
    const stored = sessionStorage.getItem(SOURCE_TRACKING_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SourceTrackingData;
  } catch (error) {
    console.error('Failed to retrieve source tracking data:', error);
    return null;
  }
}

/**
 * Clears source tracking data (used after successful save to database)
 */
export function clearSourceTracking(): void {
  try {
    sessionStorage.removeItem(SOURCE_TRACKING_KEY);
  } catch (error) {
    console.error('Failed to clear source tracking data:', error);
  }
}

/**
 * Checks if there are any source parameters in the URL
 */
export function hasSourceParameters(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const sourceParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'rfdm'
  ];
  return sourceParams.some(param => urlParams.has(param));
}

/**
 * Builds a URL preserving all tracking parameters
 * Combines current URL params, sessionStorage data, and additional params
 * @param basePath - The base path to redirect to
 * @param currentSearchParams - Current URL search params (from useSearchParams or URLSearchParams)
 * @param additionalParams - Additional params to add (optional)
 * @returns Full URL with all tracking params preserved
 */
export function buildUrlWithTracking(
  basePath: string,
  currentSearchParams?: { get: (key: string) => string | null } | null,
  additionalParams?: Record<string, string>
): string {
  const params = new URLSearchParams();

  // 1. Add additional params first (like returnTo, ordencompra)
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }

  // 2. Copy tracking params from current URL
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'rfdm', 'referrer'
  ];

  if (currentSearchParams) {
    trackingParams.forEach(param => {
      const value = currentSearchParams.get(param);
      if (value && !params.has(param)) {
        params.set(param, value);
      }
    });

    // Also preserve ordencompra if present
    const ordencompra = currentSearchParams.get('ordencompra');
    if (ordencompra && !params.has('ordencompra')) {
      params.set('ordencompra', ordencompra);
    }
  }

  // 3. Fill in missing params from sessionStorage (leadSourceData)
  try {
    const leadSourceData = sessionStorage.getItem('leadSourceData');
    if (leadSourceData) {
      const parsed = JSON.parse(leadSourceData);
      trackingParams.forEach(param => {
        if (parsed[param] && !params.has(param)) {
          params.set(param, parsed[param]);
        }
      });
    }
  } catch (e) {
    console.warn('[sourceTracking] Error parsing leadSourceData:', e);
  }

  // 4. Also check SOURCE_TRACKING_KEY (strefa_source_tracking)
  const sourceData = getSourceTracking();
  if (sourceData) {
    if (sourceData.utm_source && !params.has('utm_source')) params.set('utm_source', sourceData.utm_source);
    if (sourceData.utm_medium && !params.has('utm_medium')) params.set('utm_medium', sourceData.utm_medium);
    if (sourceData.utm_campaign && !params.has('utm_campaign')) params.set('utm_campaign', sourceData.utm_campaign);
    if (sourceData.utm_term && !params.has('utm_term')) params.set('utm_term', sourceData.utm_term);
    if (sourceData.utm_content && !params.has('utm_content')) params.set('utm_content', sourceData.utm_content);
    if (sourceData.rfdm && !params.has('rfdm')) params.set('rfdm', sourceData.rfdm);
  }

  const paramsString = params.toString();
  return paramsString ? `${basePath}?${paramsString}` : basePath;
}
