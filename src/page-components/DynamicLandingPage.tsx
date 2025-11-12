'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPageService, { type LandingPageWithComponents } from '../services/LandingPageService';
import { generateSEOFromSections } from '../utils/seoGenerator';
import type {
  SavedHeroProps,
  SavedBlockProps,
  SavedFeaturesProps,
  SavedCarouselProps,
  SavedComparisonProps
} from '../types/landing-builder';

// Import all the block template components
import { HeroCentered } from '../components/landing-builder/block-templates/hero/HeroCentered';
import { HeroSplit } from '../components/landing-builder/block-templates/hero/HeroSplit';
import { HeroMinimalist } from '../components/landing-builder/block-templates/hero/HeroMinimalist';
import { BlockSideBySide } from '../components/landing-builder/block-templates/BlockSideBySide';
import { BlockImageTopCentered } from '../components/landing-builder/block-templates/BlockImageTopCentered';
import { BlockImageTopStandard } from '../components/landing-builder/block-templates/BlockImageTopStandard';
import { BlockSideBySideImageLeft } from '../components/landing-builder/block-templates/BlockSideBySideImageLeft';
import { FeaturesCards } from '../components/landing-builder/block-templates/features/FeaturesCards';
import { FeaturesAlternating } from '../components/landing-builder/block-templates/features/FeaturesAlternating';
import { FeaturesIconGrid } from '../components/landing-builder/block-templates/features/FeaturesIconGrid';
import { HorizontalCarousel } from '../components/landing-builder/block-templates/carousels/HorizontalCarousel';
import { CenteredCarousel } from '../components/landing-builder/block-templates/carousels/CenteredCarousel';
import { GalleryCarousel } from '../components/landing-builder/block-templates/carousels/GalleryCarousel';
import { ComparisonTable } from '../components/landing-builder/block-templates/comparison/ComparisonTable';
import { ComparisonSideBySide } from '../components/landing-builder/block-templates/comparison/ComparisonSideBySide';
import { ComparisonPricingBoxes } from '../components/landing-builder/block-templates/comparison/ComparisonPricingBoxes';

const renderSection = (
  section: SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps
) => {
  switch (section.layout) {
    // Hero layouts
    case 'split':
      return <HeroSplit {...(section as SavedHeroProps)} />;
    case 'minimalist':
      return <HeroMinimalist {...(section as SavedHeroProps)} />;
    // Section layouts
    case 'side':
      return <BlockSideBySide {...(section as SavedBlockProps)} />;
    case 'side-left':
      return <BlockSideBySideImageLeft {...(section as SavedBlockProps)} />;
    case 'standard':
      return <BlockImageTopStandard {...(section as SavedBlockProps)} />;
    case 'centered':
      if ('ctaText' in section) {
        return <HeroCentered {...(section as SavedHeroProps)} />;
      }
      return <BlockImageTopCentered {...(section as SavedBlockProps)} />;
    // Features layouts
    case 'cards':
      return <FeaturesCards {...(section as SavedFeaturesProps)} />;
    case 'alternating':
      return <FeaturesAlternating {...(section as SavedFeaturesProps)} />;
    case 'grid':
      return <FeaturesIconGrid {...(section as SavedFeaturesProps)} />;
    // Carousel layouts
    case 'horizontal':
      return <HorizontalCarousel {...(section as SavedCarouselProps)} />;
    case 'centered-slider':
      return <CenteredCarousel {...(section as SavedCarouselProps)} />;
    case 'gallery':
      return <GalleryCarousel {...(section as SavedCarouselProps)} />;
    // Comparison layouts
    case 'table':
      return <ComparisonTable {...(section as SavedComparisonProps)} />;
    case 'side-by-side':
      return <ComparisonSideBySide {...(section as SavedComparisonProps)} />;
    case 'pricing-boxes':
      return <ComparisonPricingBoxes {...(section as SavedComparisonProps)} />;
    default:
      return null;
  }
};

interface DynamicLandingPageProps {
  slug: string;
}

const DynamicLandingPage: React.FC<DynamicLandingPageProps> = ({ slug }) => {
  const router = useRouter();
  const [page, setPage] = useState<LandingPageWithComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const pageData = await LandingPageService.getLandingPageBySlug(slug);

        if (!pageData) {
          setError('Landing page not found');
          setLoading(false);
          return;
        }

        if (pageData.status !== 'published') {
          setError('This landing page is not published');
          setLoading(false);
          return;
        }

        setPage(pageData);

        // Increment view count
        await LandingPageService.incrementViews(slug);

        // Generate SEO from page content
        const sections = pageData.components.map(comp => ({
          ...comp.data,
          id: comp.id,
          layout: comp.layout
        })) as any[];

        const generatedSEO = generateSEOFromSections(sections, pageData.title);

        // Update page title - prioritize meta_title > generated title > page title
        const pageTitle = pageData.meta_title || generatedSEO.title;
        document.title = pageTitle;

        // Update meta description - prioritize meta_description > generated description
        const metaDescriptionContent = pageData.meta_description || generatedSEO.description;
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', metaDescriptionContent);

        // Add Open Graph meta tags for social sharing
        const updateOrCreateMeta = (property: string, content: string) => {
          let meta = document.querySelector(`meta[property="${property}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', content);
        };

        updateOrCreateMeta('og:title', pageTitle);
        updateOrCreateMeta('og:description', metaDescriptionContent);
        updateOrCreateMeta('og:type', 'website');
        updateOrCreateMeta('og:url', window.location.href);
      } catch (err) {
        console.error('Error loading landing page:', err);
        setError('Error loading landing page');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
          <p className="text-lg text-slate-600 mb-8">{error || 'Landing page not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {page.components.map((component) => {
        const section = {
          ...component.data,
          id: component.id,
          layout: component.layout
        };
        return (
          <div key={component.id}>
            {renderSection(section as any)}
          </div>
        );
      })}
    </main>
  );
};

export default DynamicLandingPage;
