import { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

const LeadSourceHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    // Check if we already have captured source data
    const existingData = sessionStorage.getItem('leadSourceData');
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        // If we already have first_visit_at, don't overwrite
        if (parsed.first_visit_at) {
          return;
        }
      } catch (e) {
        // Invalid JSON, continue with capture
      }
    }

    // This effect runs once on initial load to capture URL parameters.
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');
    const utm_term = searchParams.get('utm_term');
    const utm_content = searchParams.get('utm_content');
    const rfdm = searchParams.get('rfdm');
    const ordencompra = searchParams.get('ordencompra');
    const fbclid = searchParams.get('fbclid'); // Facebook Click ID
    const source = searchParams.get('source'); // Generic source parameter

    const leadSourceData: Record<string, string> = {};

    // Capture all UTM parameters
    if (utm_source) leadSourceData.utm_source = utm_source;
    if (utm_medium) leadSourceData.utm_medium = utm_medium;
    if (utm_campaign) leadSourceData.utm_campaign = utm_campaign;
    if (utm_term) leadSourceData.utm_term = utm_term;
    if (utm_content) leadSourceData.utm_content = utm_content;

    // Capture custom tracking parameters
    if (rfdm) leadSourceData.rfdm = rfdm;
    if (ordencompra) leadSourceData.ordencompra = ordencompra;
    if (fbclid) leadSourceData.fbclid = fbclid;
    if (source) leadSourceData.source = source;

    // Always capture referrer and landing page on first visit
    leadSourceData.referrer = document.referrer || '';
    leadSourceData.landing_page = window.location.href;
    leadSourceData.first_visit_at = new Date().toISOString();

    // We use sessionStorage to ensure it's cleared when the session ends.
    sessionStorage.setItem('leadSourceData', JSON.stringify(leadSourceData));
  }, []); // Run only once on mount

  return null; // This component does not render anything.
};

export default LeadSourceHandler;
