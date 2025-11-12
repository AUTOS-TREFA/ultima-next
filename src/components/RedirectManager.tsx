'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getRedirects, Redirect } from '../services/RedirectService';

const RedirectManager: React.FC = () => {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const fetchRedirects = useCallback(async () => {
    const data = await getRedirects();
    setRedirects(data);
    setIsReady(true);
  }, []);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  useEffect(() => {
    if (!isReady) return;

    // Check for 404 redirect path from sessionStorage, set by 404.html
    const pathFrom404 = sessionStorage.getItem('redirect404');
    if (pathFrom404) {
      sessionStorage.removeItem('redirect404');
      // Create a dummy URL to easily parse the pathname
      const targetPath = new URL(`http://localhost${pathFrom404}`).pathname;
      const redirect = redirects.find(r => r.from === targetPath);

      if (redirect) {
        router.replace(redirect.to);
        return; // Redirect handled
      }

      // If no specific redirect rule, navigate to the path so the router can show a 404
      router.replace(targetPath);
      return;
    }

    // Regular client-side redirect check for internal navigation
    const currentPath = pathname?.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

    // *** FIX: Do not attempt to redirect if we are already at the root path ***
    if (currentPath === '/') {
      return;
    }

    const redirect = redirects.find(r => r.from === currentPath);
    if (redirect) {
      router.replace(redirect.to);
    }

  }, [pathname, redirects, router, isReady]);

  return null;
};

export default RedirectManager;