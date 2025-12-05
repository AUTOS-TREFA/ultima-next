import { supabase } from '../../supabaseClient';

export interface HeroContent {
  badgeText: string;
  title: string;
  description: string;
  desktopImageLeft: string;
  desktopImageRight: string;
  mobileImage: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  statsText: string;
  brandsText: string;
}

export interface InventoryHeroContent {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export interface CarouselItem {
  title: string;
  category: string;
  src: string;
  description: string;
  link: string;
}

export interface CarroceriaCarouselContent {
  title: string;
  subtitle: string;
  items: CarouselItem[];
}

export interface CTACard {
  type: 'inventory' | 'sell' | 'advisor' | 'financing';
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
}

export interface CTACardsContent {
  cards: CTACard[];
}

export interface YouTubeVSLContent {
  title: string;
  subtitle: string;
  videoId: string;
}

export interface TestimonialContent {
  image: string;
  alt: string;
}

export interface Branch {
  city: string;
  phone: string;
  address: string;
  imageUrl: string;
  directionsUrl: string;
  mapUrl: string;
}

export interface BranchesContent {
  title: string;
  subtitle: string;
  bottomNote: string;
  branches: Branch[];
}

export type SectionKey =
  | 'hero'
  | 'inventory_hero'
  | 'carroceria_carousel'
  | 'cta_cards'
  | 'youtube_vsl'
  | 'testimonial'
  | 'branches';

export type SectionContent =
  | HeroContent
  | InventoryHeroContent
  | CarroceriaCarouselContent
  | CTACardsContent
  | YouTubeVSLContent
  | TestimonialContent
  | BranchesContent;

export interface HomePageSection {
  id: string;
  section_key: SectionKey;
  content: SectionContent;
  created_at: string;
  updated_at: string;
}

class HomePageContentService {
  /**
   * Get content for a specific section
   */
  async getSection<T extends SectionContent>(sectionKey: SectionKey): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .select('content')
        .eq('section_key', sectionKey)
        .single();

      if (error) throw error;
      return data?.content as T || null;
    } catch (error) {
      console.error(`Error fetching section ${sectionKey}:`, error);
      return null;
    }
  }

  /**
   * Get all homepage sections
   */
  async getAllSections(): Promise<Record<SectionKey, SectionContent>> {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .select('section_key, content');

      if (error) throw error;

      const sections: any = {};
      data?.forEach((item) => {
        sections[item.section_key] = item.content;
      });

      return sections;
    } catch (error) {
      console.error('Error fetching all sections:', error);
      return {} as Record<SectionKey, SectionContent>;
    }
  }

  /**
   * Update content for a specific section
   */
  async updateSection(sectionKey: SectionKey, content: SectionContent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('homepage_content')
        .update({ content })
        .eq('section_key', sectionKey);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error updating section ${sectionKey}:`, error);
      return false;
    }
  }

  /**
   * Create a new section (if it doesn't exist)
   */
  async createSection(sectionKey: SectionKey, content: SectionContent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('homepage_content')
        .insert({ section_key: sectionKey, content });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error creating section ${sectionKey}:`, error);
      return false;
    }
  }

  /**
   * Upsert (insert or update) a section
   */
  async upsertSection(sectionKey: SectionKey, content: SectionContent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('homepage_content')
        .upsert(
          { section_key: sectionKey, content },
          { onConflict: 'section_key' }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error upserting section ${sectionKey}:`, error);
      return false;
    }
  }

  /**
   * Upload an image to R2 and return the URL
   */
  async uploadImage(file: File, path?: string): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `homepage/${path || ''}${timestamp}_${sanitizedFileName}`;

      const { data, error } = await supabase.storage
        .from('fotos_airtable')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('fotos_airtable')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('fotos_airtable')
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}

export default new HomePageContentService();
