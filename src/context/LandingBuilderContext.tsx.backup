import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  SavedHeroProps,
  SavedBlockProps,
  SavedFeaturesProps,
  SavedCarouselProps,
  SavedComparisonProps
} from '../types/landing-builder';
import LandingPageService, { type LandingPage, type LandingPageComponent } from '../services/LandingPageService';

// PublishedPage type for backward compatibility
export interface PublishedPage {
  slug: string;
  title?: string;
  sections: (SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps)[];
}

interface BuilderContextType {
  savedHeros: SavedHeroProps[];
  savedSections: SavedBlockProps[];
  savedFeatures: SavedFeaturesProps[];
  savedCarousels: SavedCarouselProps[];
  savedComparisons: SavedComparisonProps[];
  publishedPages: LandingPage[];
  loading: boolean;
  addHero: (hero: Omit<SavedHeroProps, 'id'>) => Promise<boolean>;
  addSection: (section: Omit<SavedBlockProps, 'id'>) => Promise<boolean>;
  addFeature: (feature: Omit<SavedFeaturesProps, 'id'>) => Promise<boolean>;
  addCarousel: (carousel: Omit<SavedCarouselProps, 'id'>) => Promise<boolean>;
  addComparison: (comparison: Omit<SavedComparisonProps, 'id'>) => Promise<boolean>;
  addPublishedPage: (slug: string, title: string, componentIds: string[]) => Promise<boolean>;
  removeHero: (id: string) => Promise<boolean>;
  removeSection: (id: string) => Promise<boolean>;
  removeFeature: (id: string) => Promise<boolean>;
  removeCarousel: (id: string) => Promise<boolean>;
  removeComparison: (id: string) => Promise<boolean>;
  deleteLandingPage: (id: string) => Promise<boolean>;
  duplicateLandingPage: (id: string, newSlug: string, newTitle: string) => Promise<boolean>;
  updateLandingPageStatus: (id: string, status: 'draft' | 'published' | 'archived') => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedHeros, setSavedHeros] = useState<SavedHeroProps[]>([]);
  const [savedSections, setSavedSections] = useState<SavedBlockProps[]>([]);
  const [savedFeatures, setSavedFeaturesProps] = useState<SavedFeaturesProps[]>([]);
  const [savedCarousels, setSavedCarousels] = useState<SavedCarouselProps[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparisonProps[]>([]);
  const [publishedPages, setPublishedPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to transform database component to typed component
  const transformComponent = (component: LandingPageComponent): any => {
    return {
      id: component.id,
      layout: component.layout,
      ...component.data
    };
  };

  // Load all data from Supabase on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        heroComponents,
        sectionComponents,
        featureComponents,
        carouselComponents,
        comparisonComponents,
        pages
      ] = await Promise.all([
        LandingPageService.getComponents('hero'),
        LandingPageService.getComponents('section'),
        LandingPageService.getComponents('features'),
        LandingPageService.getComponents('carousel'),
        LandingPageService.getComponents('comparison'),
        LandingPageService.getLandingPages()
      ]);

      setSavedHeros(heroComponents.map(transformComponent));
      setSavedSections(sectionComponents.map(transformComponent));
      setSavedFeaturesProps(featureComponents.map(transformComponent));
      setSavedCarousels(carouselComponents.map(transformComponent));
      setSavedComparisons(comparisonComponents.map(transformComponent));
      setPublishedPages(pages);
    } catch (error) {
      console.error('Error loading builder data:', error);
      toast.error('Error al cargar los datos del constructor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Add functions
  const addHero = async (hero: Omit<SavedHeroProps, 'id'>): Promise<boolean> => {
    try {
      const component = await LandingPageService.createComponent('hero', hero.layout, hero);
      if (component) {
        setSavedHeros(prev => [...prev, transformComponent(component)]);
        toast.success('Hero guardado correctamente');
        return true;
      }
      toast.error('Error al guardar hero');
      return false;
    } catch (error) {
      console.error('Error adding hero:', error);
      toast.error('Error al guardar hero');
      return false;
    }
  };

  const addSection = async (section: Omit<SavedBlockProps, 'id'>): Promise<boolean> => {
    try {
      const component = await LandingPageService.createComponent('section', section.layout, section);
      if (component) {
        setSavedSections(prev => [...prev, transformComponent(component)]);
        toast.success('Sección guardada correctamente');
        return true;
      }
      toast.error('Error al guardar sección');
      return false;
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Error al guardar sección');
      return false;
    }
  };

  const addFeature = async (feature: Omit<SavedFeaturesProps, 'id'>): Promise<boolean> => {
    try {
      const component = await LandingPageService.createComponent('features', feature.layout, feature);
      if (component) {
        setSavedFeaturesProps(prev => [...prev, transformComponent(component)]);
        toast.success('Features guardadas correctamente');
        return true;
      }
      toast.error('Error al guardar features');
      return false;
    } catch (error) {
      console.error('Error adding feature:', error);
      toast.error('Error al guardar features');
      return false;
    }
  };

  const addCarousel = async (carousel: Omit<SavedCarouselProps, 'id'>): Promise<boolean> => {
    try {
      const component = await LandingPageService.createComponent('carousel', carousel.layout, carousel);
      if (component) {
        setSavedCarousels(prev => [...prev, transformComponent(component)]);
        toast.success('Carrusel guardado correctamente');
        return true;
      }
      toast.error('Error al guardar carrusel');
      return false;
    } catch (error) {
      console.error('Error adding carousel:', error);
      toast.error('Error al guardar carrusel');
      return false;
    }
  };

  const addComparison = async (comparison: Omit<SavedComparisonProps, 'id'>): Promise<boolean> => {
    try {
      const component = await LandingPageService.createComponent('comparison', comparison.layout, comparison);
      if (component) {
        setSavedComparisons(prev => [...prev, transformComponent(component)]);
        toast.success('Comparación guardada correctamente');
        return true;
      }
      toast.error('Error al guardar comparación');
      return false;
    } catch (error) {
      console.error('Error adding comparison:', error);
      toast.error('Error al guardar comparación');
      return false;
    }
  };

  const addPublishedPage = async (slug: string, title: string, componentIds: string[]): Promise<boolean> => {
    try {
      // Check if slug already exists
      const isValid = await LandingPageService.validateSlug(slug);
      if (!isValid) {
        toast.error(`La URL "${slug}" ya existe. Por favor, elige otra.`);
        return false;
      }

      const page = await LandingPageService.createLandingPage(slug, title, componentIds, {
        status: 'published'
      });

      if (page) {
        setPublishedPages(prev => [...prev, page]);
        toast.success(`Landing page "${title}" publicada correctamente`);
        return true;
      }
      toast.error('Error al publicar landing page');
      return false;
    } catch (error) {
      console.error('Error adding published page:', error);
      toast.error('Error al publicar landing page');
      return false;
    }
  };

  // Remove functions
  const removeHero = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteComponent(id);
      if (success) {
        setSavedHeros(prev => prev.filter(h => h.id !== id));
        toast.success('Hero eliminado correctamente');
        return true;
      }
      toast.error('No se puede eliminar: el hero está en uso en una landing page');
      return false;
    } catch (error) {
      console.error('Error removing hero:', error);
      toast.error('Error al eliminar hero');
      return false;
    }
  };

  const removeSection = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteComponent(id);
      if (success) {
        setSavedSections(prev => prev.filter(s => s.id !== id));
        toast.success('Sección eliminada correctamente');
        return true;
      }
      toast.error('No se puede eliminar: la sección está en uso en una landing page');
      return false;
    } catch (error) {
      console.error('Error removing section:', error);
      toast.error('Error al eliminar sección');
      return false;
    }
  };

  const removeFeature = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteComponent(id);
      if (success) {
        setSavedFeaturesProps(prev => prev.filter(f => f.id !== id));
        toast.success('Features eliminadas correctamente');
        return true;
      }
      toast.error('No se puede eliminar: las features están en uso en una landing page');
      return false;
    } catch (error) {
      console.error('Error removing feature:', error);
      toast.error('Error al eliminar features');
      return false;
    }
  };

  const removeCarousel = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteComponent(id);
      if (success) {
        setSavedCarousels(prev => prev.filter(c => c.id !== id));
        toast.success('Carrusel eliminado correctamente');
        return true;
      }
      toast.error('No se puede eliminar: el carrusel está en uso en una landing page');
      return false;
    } catch (error) {
      console.error('Error removing carousel:', error);
      toast.error('Error al eliminar carrusel');
      return false;
    }
  };

  const removeComparison = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteComponent(id);
      if (success) {
        setSavedComparisons(prev => prev.filter(c => c.id !== id));
        toast.success('Comparación eliminada correctamente');
        return true;
      }
      toast.error('No se puede eliminar: la comparación está en uso en una landing page');
      return false;
    } catch (error) {
      console.error('Error removing comparison:', error);
      toast.error('Error al eliminar comparación');
      return false;
    }
  };

  // Landing page management functions
  const deleteLandingPage = async (id: string): Promise<boolean> => {
    try {
      const success = await LandingPageService.deleteLandingPage(id);
      if (success) {
        setPublishedPages(prev => prev.filter(p => p.id !== id));
        toast.success('Landing page eliminada correctamente');
        return true;
      }
      toast.error('Error al eliminar landing page');
      return false;
    } catch (error) {
      console.error('Error deleting landing page:', error);
      toast.error('Error al eliminar landing page');
      return false;
    }
  };

  const duplicateLandingPage = async (id: string, newSlug: string, newTitle: string): Promise<boolean> => {
    try {
      const newPage = await LandingPageService.duplicateLandingPage(id, newSlug, newTitle);
      if (newPage) {
        setPublishedPages(prev => [...prev, newPage]);
        toast.success(`Landing page duplicada como "${newTitle}"`);
        return true;
      }
      toast.error('Error al duplicar landing page');
      return false;
    } catch (error) {
      console.error('Error duplicating landing page:', error);
      toast.error('Error al duplicar landing page');
      return false;
    }
  };

  const updateLandingPageStatus = async (
    id: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<boolean> => {
    try {
      const updated = await LandingPageService.updateLandingPage(id, { status });
      if (updated) {
        setPublishedPages(prev =>
          prev.map(p => (p.id === id ? { ...p, status } : p))
        );
        const statusText = status === 'published' ? 'publicada' : status === 'archived' ? 'archivada' : 'guardada como borrador';
        toast.success(`Landing page ${statusText} correctamente`);
        return true;
      }
      toast.error('Error al actualizar el estado de la landing page');
      return false;
    } catch (error) {
      console.error('Error updating landing page status:', error);
      toast.error('Error al actualizar el estado de la landing page');
      return false;
    }
  };

  return (
    <BuilderContext.Provider
      value={{
        savedHeros,
        savedSections,
        savedFeatures,
        savedCarousels,
        savedComparisons,
        publishedPages,
        loading,
        addHero,
        addSection,
        addFeature,
        addCarousel,
        addComparison,
        addPublishedPage,
        removeHero,
        removeSection,
        removeFeature,
        removeCarousel,
        removeComparison,
        deleteLandingPage,
        duplicateLandingPage,
        updateLandingPageStatus,
        refreshData,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilderContext = (): BuilderContextType => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilderContext must be used within a BuilderProvider');
  }
  return context;
};
