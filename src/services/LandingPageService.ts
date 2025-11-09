import { supabase } from '../../supabaseClient';
import type {
  SavedHeroProps,
  SavedBlockProps,
  SavedFeaturesProps,
  SavedCarouselProps,
  SavedComparisonProps
} from '../types/landing-builder';

export type ComponentType = 'hero' | 'section' | 'features' | 'carousel' | 'comparison';
export type LandingPageStatus = 'draft' | 'published' | 'archived';

export interface LandingPageComponent {
  id: string;
  component_type: ComponentType;
  layout: string;
  data: SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  status: LandingPageStatus;
  meta_title?: string | null;
  meta_description?: string | null;
  component_ids: string[];
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  views?: number;
  created_by?: string;
}

export interface LandingPageWithComponents extends LandingPage {
  components: LandingPageComponent[];
}

class LandingPageService {
  // ============================================
  // COMPONENT OPERATIONS
  // ============================================

  async createComponent(
    componentType: ComponentType,
    layout: string,
    data: any
  ): Promise<LandingPageComponent | null> {
    try {
      const { data: component, error } = await supabase
        .from('landing_page_components')
        .insert({
          component_type: componentType,
          layout,
          data
        })
        .select()
        .single();

      if (error) throw error;
      return component;
    } catch (error) {
      console.error('Error creating component:', error);
      return null;
    }
  }

  async getComponents(componentType?: ComponentType): Promise<LandingPageComponent[]> {
    try {
      let query = supabase
        .from('landing_page_components')
        .select('*')
        .order('created_at', { ascending: false });

      if (componentType) {
        query = query.eq('component_type', componentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching components:', error);
      return [];
    }
  }

  async getComponentById(id: string): Promise<LandingPageComponent | null> {
    try {
      const { data, error } = await supabase
        .from('landing_page_components')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching component:', error);
      return null;
    }
  }

  async updateComponent(
    id: string,
    updates: {
      layout?: string;
      data?: any;
    }
  ): Promise<LandingPageComponent | null> {
    try {
      const { data, error } = await supabase
        .from('landing_page_components')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating component:', error);
      return null;
    }
  }

  async deleteComponent(id: string): Promise<boolean> {
    try {
      // First check if this component is used in any landing pages
      const { data: pages, error: pagesError } = await supabase
        .from('landing_pages')
        .select('id, component_ids')
        .contains('component_ids', [id]);

      if (pagesError) throw pagesError;

      if (pages && pages.length > 0) {
        console.error('Cannot delete component: it is used in published landing pages');
        return false;
      }

      const { error } = await supabase
        .from('landing_page_components')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting component:', error);
      return false;
    }
  }

  // ============================================
  // LANDING PAGE OPERATIONS
  // ============================================

  async createLandingPage(
    slug: string,
    title: string,
    componentIds: string[],
    options?: {
      status?: LandingPageStatus;
      metaTitle?: string;
      metaDescription?: string;
    }
  ): Promise<LandingPage | null> {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          slug,
          title,
          component_ids: componentIds,
          status: options?.status || 'published',
          meta_title: options?.metaTitle,
          meta_description: options?.metaDescription,
          published_at: options?.status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating landing page:', error);
      if (error.code === '23505') {
        console.error('Slug already exists');
      }
      return null;
    }
  }

  async getLandingPages(status?: LandingPageStatus): Promise<LandingPage[]> {
    try {
      let query = supabase
        .from('landing_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      return [];
    }
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPageWithComponents | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_landing_page_with_components', { page_slug: slug })
        .single();

      if (error) throw error;
      if (!data) return null;

      // Transform the RPC response to our interface
      const pageData = data as any;
      return {
        id: pageData.page_id,
        slug: pageData.page_slug,
        title: pageData.page_title,
        status: pageData.page_status,
        meta_title: pageData.page_meta_title,
        meta_description: pageData.page_meta_description,
        views: pageData.page_views,
        component_ids: [],
        components: pageData.components || []
      };
    } catch (error) {
      console.error('Error fetching landing page:', error);
      return null;
    }
  }

  async getLandingPageById(id: string): Promise<LandingPageWithComponents | null> {
    try {
      const { data: page, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (pageError) throw pageError;
      if (!page) return null;

      // Fetch all components
      const { data: components, error: componentsError } = await supabase
        .from('landing_page_components')
        .select('*')
        .in('id', page.component_ids);

      if (componentsError) throw componentsError;

      // Sort components according to component_ids order
      const sortedComponents = page.component_ids
        .map((id: string) => components?.find(c => c.id === id))
        .filter(Boolean);

      return {
        ...page,
        components: sortedComponents
      };
    } catch (error) {
      console.error('Error fetching landing page by ID:', error);
      return null;
    }
  }

  async updateLandingPage(
    id: string,
    updates: {
      slug?: string;
      title?: string;
      componentIds?: string[];
      status?: LandingPageStatus;
      metaTitle?: string;
      metaDescription?: string;
    }
  ): Promise<LandingPage | null> {
    try {
      const updateData: any = {};

      if (updates.slug) updateData.slug = updates.slug;
      if (updates.title) updateData.title = updates.title;
      if (updates.componentIds) updateData.component_ids = updates.componentIds;
      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === 'published') {
          updateData.published_at = new Date().toISOString();
        }
      }
      if (updates.metaTitle !== undefined) updateData.meta_title = updates.metaTitle;
      if (updates.metaDescription !== undefined) updateData.meta_description = updates.metaDescription;

      const { data, error } = await supabase
        .from('landing_pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating landing page:', error);
      return null;
    }
  }

  async deleteLandingPage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting landing page:', error);
      return false;
    }
  }

  async duplicateLandingPage(id: string, newSlug: string, newTitle: string): Promise<LandingPage | null> {
    try {
      // Get the original page
      const original = await this.getLandingPageById(id);
      if (!original) return null;

      // Create a new page with the same component IDs
      return await this.createLandingPage(newSlug, newTitle, original.component_ids, {
        status: 'draft',
        metaTitle: original.meta_title || undefined,
        metaDescription: original.meta_description || undefined
      });
    } catch (error) {
      console.error('Error duplicating landing page:', error);
      return null;
    }
  }

  async incrementViews(slug: string): Promise<void> {
    try {
      await supabase.rpc('increment_landing_page_views', { page_slug: slug });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async validateSlug(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('landing_pages')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error validating slug:', error);
      return false;
    }
  }
}

export default new LandingPageService();
