import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export interface MarketingConfig {
  id?: string;
  gtm_container_id: string;
  facebook_pixel_id: string;
  google_analytics_id?: string;
  conversion_events: ConversionEvent[];
  active: boolean;
  // Cloudflare Google Tag Gateway
  gtm_server_container_url?: string; // Optional server-side GTM container URL
  use_cloudflare_tag_gateway?: boolean; // Enable Cloudflare first-party tracking
  created_at?: string;
  updated_at?: string;
}

export interface ConversionEvent {
  id: string;
  name: string;
  event_type: 'PageView' | 'ViewContent' | 'InitialRegistration' | 'PersonalInformationComplete' | 'LeadComplete' | 'ConversionLandingPage' | 'PerfilacionBancariaComplete';
  trigger_location: string;
  enabled: boolean;
  fb_enabled: boolean;
  gtm_enabled: boolean;
  custom_parameters?: Record<string, any>;
}

export interface TrackingEvent {
  id?: string;
  event_name: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at?: string;
}

class MarketingConfigService {
  private config: MarketingConfig | null = null;

  /**
   * Default conversion events
   */
  private readonly DEFAULT_EVENTS: ConversionEvent[] = [
    { id: 'pageview', name: 'Vista de Página', event_type: 'PageView', trigger_location: 'Todas las páginas', enabled: true, fb_enabled: true, gtm_enabled: true },
    { id: 'viewcontent', name: 'Ver Contenido', event_type: 'ViewContent', trigger_location: 'Páginas de vehículos', enabled: true, fb_enabled: true, gtm_enabled: true },
    { id: 'initialregistration', name: 'Registro Inicial', event_type: 'InitialRegistration', trigger_location: 'Página de autenticación', enabled: true, fb_enabled: true, gtm_enabled: true },
    { id: 'personalinfocomplete', name: 'Información Personal Completa', event_type: 'PersonalInformationComplete', trigger_location: 'Página de perfil', enabled: true, fb_enabled: true, gtm_enabled: true },
    { id: 'leadcomplete', name: 'Lead Completo', event_type: 'LeadComplete', trigger_location: 'Aplicación de financiamiento', enabled: true, fb_enabled: true, gtm_enabled: true },
    { id: 'conversionlandingpage', name: 'Conversión Landing Page', event_type: 'ConversionLandingPage', trigger_location: 'Página de financiamientos', enabled: true, fb_enabled: true, gtm_enabled: true },
  ];

  /**
   * Default configuration values
   */
  private readonly DEFAULT_CONFIG: Partial<MarketingConfig> = {
    gtm_container_id: 'GTM-KDVDMB4X',
    facebook_pixel_id: '846689825695126',
    google_analytics_id: 'G-E580PSBCHH',
    conversion_events: this.DEFAULT_EVENTS,
    active: true,
  };

  /**
   * Get marketing configuration from localStorage and Supabase
   */
  async getConfig(): Promise<MarketingConfig | null> {
    // Clear stale cache (if config version is old or missing conversion_events)
    const localConfig = localStorage.getItem('marketing_config');
    if (localConfig) {
      try {
        const parsed = JSON.parse(localConfig);
        // Check if config has all required fields and events
        if (!parsed.conversion_events || parsed.conversion_events.length < 6) {
          console.log('🔄 Clearing stale marketing config cache');
          localStorage.removeItem('marketing_config');
        } else {
          this.config = parsed;
          return this.config;
        }
      } catch (e) {
        localStorage.removeItem('marketing_config');
      }
    }

    // Fallback to Supabase
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from('marketing_config')
      .select('*')
      .eq('active', true)
      .single();

    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('⚠️ La tabla marketing_config no existe. Usando configuración por defecto.');
        // Return default config
        this.config = this.DEFAULT_CONFIG as MarketingConfig;
        return this.config;
      } else if (error.code === 'PGRST116') {
        // No rows found - use default config
        console.log('No config found in database, using defaults');
        this.config = this.DEFAULT_CONFIG as MarketingConfig;
        return this.config;
      } else {
        console.error('Error fetching marketing config:', error);
      }
      return null;
    }

    if (data) {
      this.config = data as MarketingConfig;
      localStorage.setItem('marketing_config', JSON.stringify(this.config));
    }

    return this.config;
  }

  /**
   * Save marketing configuration
   */
  async saveConfig(config: Partial<MarketingConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createBrowserSupabaseClient();
      // Deactivate all existing configs
      await supabase
        .from('marketing_config')
        .update({ active: false })
        .eq('active', true);

      // Insert new config
      const { data, error } = await supabase
        .from('marketing_config')
        .insert({
          ...config,
          active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.config = data as MarketingConfig;
      localStorage.setItem('marketing_config', JSON.stringify(this.config));

      // Initialize GTM and Facebook Pixel if IDs are provided
      if (config.gtm_container_id) {
        this.initializeGTM(config.gtm_container_id, config.gtm_server_container_url);
      }
      if (config.facebook_pixel_id) {
        this.initializeFacebookPixel(config.facebook_pixel_id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving marketing config:', error);

      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'La tabla marketing_config no existe. Por favor, ejecuta la migración con: supabase db push'
        };
      }

      return { success: false, error: error.message || 'Error desconocido al guardar configuración' };
    }
  }

  /**
   * Update existing configuration
   */
  async updateConfig(id: string, updates: Partial<MarketingConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('marketing_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.config = data as MarketingConfig;
      localStorage.setItem('marketing_config', JSON.stringify(this.config));

      return { success: true };
    } catch (error: any) {
      console.error('Error updating marketing config:', error);

      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'La tabla marketing_config no existe. Por favor, ejecuta la migración con: supabase db push'
        };
      }

      return { success: false, error: error.message || 'Error desconocido al actualizar configuración' };
    }
  }

  /**
   * Initialize Google Tag Manager dynamically with Cloudflare Tag Gateway support
   */
  initializeGTM(containerId: string, serverContainerUrl?: string): void {
    if (typeof window === 'undefined') return;

    // Check if GTM is already loaded
    if ((window as any).google_tag_manager) {
      console.log('GTM already initialized');
      return;
    }

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];

    // Add server_container_url for server-side GTM if provided
    if (serverContainerUrl) {
      (window as any).dataLayer.push({
        'gtm.server_container_url': serverContainerUrl
      });
      console.log('GTM Server Container URL configured:', serverContainerUrl);
    }

    // Detect if Cloudflare Tag Gateway is active by checking response headers
    // Cloudflare Tag Gateway automatically proxies GTM requests through your domain
    const isCloudflareTagGateway = this.detectCloudflareTagGateway();
    if (isCloudflareTagGateway) {
      console.log('✅ Cloudflare Google Tag Gateway detected - using first-party tracking');
    }

    // Add GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    // Add noscript iframe
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    console.log('GTM initialized with container:', containerId);
  }

  /**
   * Detect if Cloudflare Google Tag Gateway is active
   * Tag Gateway proxies requests through your domain for better tracking
   */
  private detectCloudflareTagGateway(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if GTM requests are being served from the same origin (first-party)
    // Cloudflare Tag Gateway makes GTM appear to come from your domain
    try {
      const currentDomain = window.location.hostname;
      // Tag Gateway active if we're on a custom domain (not localhost)
      const isProductionDomain = !currentDomain.includes('localhost') &&
                                !currentDomain.includes('127.0.0.1') &&
                                !currentDomain.includes('.local');
      return isProductionDomain;
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize Facebook Pixel dynamically
   */
  initializeFacebookPixel(pixelId: string): void {
    if (typeof window === 'undefined') return;

    // Check if Pixel is already loaded
    if ((window as any).fbq) {
      console.log('Facebook Pixel already initialized');
      return;
    }

    // Facebook Pixel Code
    const fbPixelCode = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;

    const script = document.createElement('script');
    script.innerHTML = fbPixelCode;
    document.head.appendChild(script);

    // Add noscript pixel
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.insertBefore(noscript, document.body.firstChild);

    console.log('Facebook Pixel initialized with ID:', pixelId);
  }

  /**
   * Track event to both GTM and Facebook Pixel
   */
  trackConversionEvent(
    eventName: string,
    eventType: ConversionEvent['event_type'],
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config) {
      console.warn('Marketing config not loaded. Call getConfig() first.');
      return;
    }

    const event = this.config.conversion_events.find(e => e.event_type === eventType && e.enabled);
    if (!event) {
      console.warn(`Event ${eventType} not found or not enabled`);
      return;
    }

    // Track to GTM
    if (event.gtm_enabled && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        eventType: eventType,
        ...metadata,
        ...event.custom_parameters,
        timestamp: new Date().toISOString()
      });
      console.log('GTM Event tracked:', eventName, metadata);
    }

    // Track to Facebook Pixel
    if (event.fb_enabled && (window as any).fbq) {
      (window as any).fbq('track', eventType, metadata);
      console.log('Facebook Pixel Event tracked:', eventType, metadata);
    }

    // Also track to Supabase for analytics
    this.saveTrackingEvent(eventName, eventType, metadata);
  }

  /**
   * Save tracking event to Supabase
   */
  private async saveTrackingEvent(
    eventName: string,
    eventType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient();
      const sessionId = sessionStorage.getItem('session_id') || '';
      const { data: { user } } = await supabase.auth.getUser();

      // Get UTM parameters from sessionStorage
      const leadSourceData = sessionStorage.getItem('leadSourceData');
      let utmParams = {};
      if (leadSourceData) {
        const parsed = JSON.parse(leadSourceData);
        utmParams = {
          utm_source: parsed.utm_source,
          utm_medium: parsed.utm_medium,
          utm_campaign: parsed.utm_campaign
        };
      }

      await supabase.from('tracking_events').insert({
        event_name: eventName,
        event_type: eventType,
        user_id: user?.id,
        session_id: sessionId,
        metadata: metadata,
        ...utmParams,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving tracking event:', error);
    }
  }

  /**
   * Get all tracking events with filters
   */
  async getTrackingEvents(filters?: {
    eventType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TrackingEvent[]> {
    try {
      const supabase = createBrowserSupabaseClient();
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrackingEvent[];
    } catch (error) {
      console.error('Error fetching tracking events:', error);
      return [];
    }
  }

  /**
   * Get lead source analytics
   */
  async getLeadSourceAnalytics(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const supabase = createBrowserSupabaseClient();
      let query = supabase
        .from('tracking_events')
        .select('utm_source, utm_medium, utm_campaign, event_type, created_at')
        .in('event_type', ['LeadComplete', 'InitialRegistration', 'ConversionLandingPage', 'PersonalInformationComplete'])
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by source
      const grouped = data.reduce((acc: any, event: any) => {
        const key = event.utm_source || 'direct';
        if (!acc[key]) {
          acc[key] = {
            source: key,
            medium: event.utm_medium,
            campaign: event.utm_campaign,
            count: 0,
            events: []
          };
        }
        acc[key].count++;
        acc[key].events.push(event);
        return acc;
      }, {});

      return Object.values(grouped);
    } catch (error) {
      console.error('Error fetching lead source analytics:', error);
      return [];
    }
  }

  /**
   * Test if GTM and Facebook Pixel are working
   */
  testTracking(): { gtm: boolean; facebook: boolean; config: boolean } {
    return {
      config: !!this.config,
      gtm: !!(window as any).dataLayer,
      facebook: !!(window as any).fbq
    };
  }

  /**
   * Clear cached configuration
   */
  clearCache(): void {
    this.config = null;
    localStorage.removeItem('marketing_config');
  }
}

export const marketingConfigService = new MarketingConfigService();
