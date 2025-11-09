'use client';

import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
  };
}

/**
 * A custom hook to dynamically update SEO meta tags.
 * @param title - The title for the page.
 * @param description - The meta description for the page.
 * @param keywords - The meta keywords for the page.
 * @param canonical - The canonical URL for the page.
 * @param openGraph - Open Graph metadata for the page.
 */
const useSEO = ({ title, description, keywords, canonical, openGraph }: SEOProps) => {
  useEffect(() => {
    // Set document title
    if (title) {
        document.title = title;
    }

    // Helper to find and update or create a meta tag
    const setMetaTag = (name: string, content: string | undefined) => {
      if (!content) return;
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper for Open Graph tags
    const setOgMetaTag = (property: string, content: string | undefined) => {
        if (!content) return;
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMetaTag('description', description);
    setMetaTag('keywords', keywords);

    // Set canonical URL if provided
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute('href', canonical);
    }

    // Set Open Graph tags
    setOgMetaTag('og:title', openGraph?.title || title);
    setOgMetaTag('og:description', openGraph?.description || description);
    if (openGraph?.type) setOgMetaTag('og:type', openGraph.type);
    if (openGraph?.url) setOgMetaTag('og:url', openGraph.url);

  }, [title, description, keywords, canonical, openGraph]);
};

export default useSEO;