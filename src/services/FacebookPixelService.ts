/**
 * FacebookPixelService
 *
 * Servicio completo para integración con Facebook Pixel y Facebook Catalogue
 * Maneja todos los eventos estándar de Meta para e-commerce de vehículos
 *
 * Eventos principales:
 * - ViewContent: Usuario ve un vehículo
 * - Search: Usuario busca vehículos
 * - AddToCart: Usuario muestra interés (calculadora, contacto)
 * - InitiateCheckout: Usuario inicia solicitud de financiamiento
 * - Lead: Usuario completa formulario de lead
 * - Purchase: Usuario completa compra (futuro)
 */

import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { marketingConfigService } from './MarketingConfigService';

// =================================================================================
// TIPOS Y INTERFACES
// =================================================================================

interface VehicleData {
  id: string | number;
  title: string;
  price: number;
  brand: string;
  model?: string;
  year?: number;
  category?: string; // carroceria
  slug?: string;
  image_url?: string;
}

interface FacebookPixelEventParams {
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  search_string?: string;
  predicted_ltv?: number;
  status?: boolean;
}

interface CatalogueEventData {
  event_type: 'ViewContent' | 'Search' | 'AddToCart' | 'InitiateCheckout' | 'Lead' | 'Purchase';
  vehicle_id?: string | number;
  vehicle_data?: VehicleData;
  search_query?: string;
  interaction_type?: string;
  user_id?: string;
  session_id?: string;
  fbclid?: string | null;
  metadata?: Record<string, any>;
}

// =================================================================================
// CLASE PRINCIPAL
// =================================================================================

class FacebookPixelService {
  private fbq: any;
  private isInitialized = false;
  private pixelId: string | null = null;

  constructor() {
    this.fbq = (window as any).fbq;
  }

  /**
   * Inicializa el servicio y obtiene el Pixel ID
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const config = await marketingConfigService.getConfig();
      this.pixelId = config.facebook_pixel_id;
      this.fbq = (window as any).fbq;
      this.isInitialized = true;

      console.log('[FB Pixel Service] ✅ Inicializado con Pixel ID:', this.pixelId);
    } catch (error) {
      console.error('[FB Pixel Service] ❌ Error al inicializar:', error);
    }
  }

  /**
   * Verifica si el Pixel está disponible
   */
  private isPixelAvailable(): boolean {
    if (!this.fbq || typeof this.fbq !== 'function') {
      console.warn('[FB Pixel Service] ⚠️ Facebook Pixel no está cargado');
      return false;
    }
    return true;
  }

  /**
   * Obtiene el fbclid de la URL o sessionStorage
   */
  private getFbclid(): string | null {
    // Intentar obtener de URL
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      // Guardar en sessionStorage para uso posterior
      sessionStorage.setItem('fbclid', fbclid);
      return fbclid;
    }

    // Intentar obtener de sessionStorage
    return sessionStorage.getItem('fbclid');
  }

  /**
   * Obtiene el session ID actual
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('marketing_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('marketing_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Registra el evento en Supabase para análisis posterior
   */
  private async logEventToDatabase(eventData: CatalogueEventData): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('facebook_catalogue_events').insert({
        event_type: eventData.event_type,
        vehicle_id: eventData.vehicle_id?.toString(),
        vehicle_data: eventData.vehicle_data,
        search_query: eventData.search_query,
        interaction_type: eventData.interaction_type,
        user_id: user?.id || eventData.user_id,
        session_id: eventData.session_id || this.getSessionId(),
        fbclid: eventData.fbclid || this.getFbclid(),
        metadata: eventData.metadata || {},
        created_at: new Date().toISOString(),
      });

      console.log('[FB Pixel Service] 📊 Evento guardado en BD:', eventData.event_type);
    } catch (error) {
      console.error('[FB Pixel Service] ❌ Error guardando evento:', error);
    }
  }

  // =================================================================================
  // EVENTOS ESTÁNDAR DE FACEBOOK
  // =================================================================================

  /**
   * ViewContent - Usuario ve un vehículo específico
   * Este es el evento MÁS IMPORTANTE para el catálogo
   */
  async trackViewContent(vehicle: VehicleData): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      content_ids: [vehicle.id.toString()],
      content_type: 'product',
      content_name: vehicle.title,
      content_category: vehicle.category || 'vehicle',
      value: vehicle.price,
      currency: 'MXN',
      contents: [{
        id: vehicle.id.toString(),
        quantity: 1,
        item_price: vehicle.price,
      }],
    };

    // Enviar a Facebook Pixel
    if (this.isPixelAvailable()) {
      this.fbq('track', 'ViewContent', eventParams);
      console.log('[FB Pixel] 👁️ ViewContent:', vehicle.title, eventParams);
    }

    // Guardar en BD
    await this.logEventToDatabase({
      event_type: 'ViewContent',
      vehicle_id: vehicle.id,
      vehicle_data: vehicle,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: eventParams,
    });
  }

  /**
   * Search - Usuario busca vehículos
   */
  async trackSearch(searchQuery: string, filters?: Record<string, any>): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      search_string: searchQuery,
      content_type: 'product',
    };

    if (this.isPixelAvailable()) {
      this.fbq('track', 'Search', eventParams);
      console.log('[FB Pixel] 🔍 Search:', searchQuery);
    }

    await this.logEventToDatabase({
      event_type: 'Search',
      search_query: searchQuery,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: { ...eventParams, filters },
    });
  }

  /**
   * AddToCart - Usuario muestra interés en un vehículo
   * (calculadora de financiamiento, contacto por WhatsApp, etc.)
   */
  async trackAddToCart(vehicle: VehicleData, interactionType: string = 'calculator'): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      content_ids: [vehicle.id.toString()],
      content_type: 'product',
      content_name: vehicle.title,
      value: vehicle.price,
      currency: 'MXN',
      contents: [{
        id: vehicle.id.toString(),
        quantity: 1,
        item_price: vehicle.price,
      }],
      num_items: 1,
    };

    if (this.isPixelAvailable()) {
      this.fbq('track', 'AddToCart', eventParams);
      console.log('[FB Pixel] 🛒 AddToCart:', vehicle.title, `(${interactionType})`);
    }

    await this.logEventToDatabase({
      event_type: 'AddToCart',
      vehicle_id: vehicle.id,
      vehicle_data: vehicle,
      interaction_type: interactionType,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: eventParams,
    });
  }

  /**
   * InitiateCheckout - Usuario inicia proceso de financiamiento
   */
  async trackInitiateCheckout(vehicle: VehicleData): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      content_ids: [vehicle.id.toString()],
      content_type: 'product',
      content_name: vehicle.title,
      value: vehicle.price,
      currency: 'MXN',
      num_items: 1,
    };

    if (this.isPixelAvailable()) {
      this.fbq('track', 'InitiateCheckout', eventParams);
      console.log('[FB Pixel] 💳 InitiateCheckout:', vehicle.title);
    }

    await this.logEventToDatabase({
      event_type: 'InitiateCheckout',
      vehicle_id: vehicle.id,
      vehicle_data: vehicle,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: eventParams,
    });
  }

  /**
   * Lead - Usuario completa formulario de lead
   */
  async trackLead(vehicle?: VehicleData, leadValue?: number): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      content_type: 'product',
      value: leadValue || vehicle?.price || 0,
      currency: 'MXN',
    };

    if (vehicle) {
      eventParams.content_ids = [vehicle.id.toString()];
      eventParams.content_name = vehicle.title;
    }

    if (this.isPixelAvailable()) {
      this.fbq('track', 'Lead', eventParams);
      console.log('[FB Pixel] 📝 Lead:', vehicle?.title || 'General');
    }

    await this.logEventToDatabase({
      event_type: 'Lead',
      vehicle_id: vehicle?.id,
      vehicle_data: vehicle,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: eventParams,
    });
  }

  /**
   * Purchase - Usuario completa compra (para uso futuro)
   */
  async trackPurchase(vehicle: VehicleData, transactionId: string): Promise<void> {
    await this.initialize();

    const eventParams: FacebookPixelEventParams = {
      content_ids: [vehicle.id.toString()],
      content_type: 'product',
      content_name: vehicle.title,
      value: vehicle.price,
      currency: 'MXN',
      num_items: 1,
    };

    if (this.isPixelAvailable()) {
      this.fbq('track', 'Purchase', {
        ...eventParams,
        transaction_id: transactionId,
      });
      console.log('[FB Pixel] ✅ Purchase:', vehicle.title);
    }

    await this.logEventToDatabase({
      event_type: 'Purchase',
      vehicle_id: vehicle.id,
      vehicle_data: vehicle,
      session_id: this.getSessionId(),
      fbclid: this.getFbclid(),
      metadata: { ...eventParams, transaction_id: transactionId },
    });
  }

  // =================================================================================
  // EVENTOS PERSONALIZADOS
  // =================================================================================

  /**
   * Evento personalizado para acciones específicas
   */
  async trackCustomEvent(eventName: string, params: Record<string, any> = {}): Promise<void> {
    await this.initialize();

    if (this.isPixelAvailable()) {
      this.fbq('trackCustom', eventName, params);
      console.log('[FB Pixel] 🎯 Custom Event:', eventName, params);
    }
  }

  /**
   * Tracking de scroll en página de vehículo (para remarketing)
   */
  async trackVehicleEngagement(vehicle: VehicleData, engagementType: string): Promise<void> {
    await this.trackCustomEvent('VehicleEngagement', {
      vehicle_id: vehicle.id.toString(),
      vehicle_name: vehicle.title,
      engagement_type: engagementType,
      value: vehicle.price,
      currency: 'MXN',
    });
  }
}

// Exportar instancia singleton
export const facebookPixelService = new FacebookPixelService();
export default facebookPixelService;
