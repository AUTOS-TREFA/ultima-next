'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getRedirects, Redirect } from '../services/RedirectService';

const RedirectManager: React.FC = () => {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getRedirects().then(setRedirects).catch(() => {
      // Silently fail if CSV can't be loaded
      console.warn('Could not load redirects CSV');
    });
  }, []);

  useEffect(() => {
    // Skip redirect logic for Google AI Studio preview paths
    const isGoogleStudioPreview = window.location.hostname.includes('scf.usercontent.goog');
    if (isGoogleStudioPreview && pathname.match(/^\/[a-f0-9-]{36}$/)) {
      router.replace('/');
      return;
    }

    if (redirects.length > 0) {
      const currentPath = pathname;
      const redirect = redirects.find(r => r.from === currentPath);
      if (redirect) {
        router.replace(redirect.to);
      }
    }
  }, [pathname, redirects, router]);

  return null;
};

export default RedirectManager;