/**
 * MetricsService - Servicio Unificado de Métricas
 *
 * Este servicio es la ÚNICA fuente de verdad para todas las métricas y cálculos
 * de leads, conversiones y eventos en toda la aplicación.
 *
 * IMPORTANTE: Todos los dashboards deben usar este servicio para garantizar
 * consistencia en los números mostrados.
 */

import { supabase } from '../../supabaseClient';

export interface FunnelMetrics {
  // Eventos del embudo principal (/financiamientos)
  landing_page_views: number;          // PageView a /financiamientos
  registrations: number;                // ConversionLandingPage
  profile_completes: number;            // PersonalInformationComplete
  bank_profiling_completes: number;     // PerfilacionBancariaComplete
  application_starts: number;           // ComienzaSolicitud
  application_submissions: number;      // ApplicationSubmission (todos)
  lead_completes: number;               // LeadComplete (solo desde landing)

  // IDs únicos para tracking secuencial
  landing_user_ids: string[];           // Usuarios que llegaron al landing
  registered_user_ids: string[];        // Usuarios que se registraron
  profile_complete_user_ids: string[];  // Usuarios con perfil completo
  bank_profile_user_ids: string[];      // Usuarios con perfilación bancaria
  application_start_user_ids: string[]; // Usuarios que iniciaron aplicación
  lead_complete_user_ids: string[];     // Usuarios que completaron todo
}

export interface MetaFunnelMetrics {
  // Embudo específico de Meta (Facebook/Instagram)
  meta_landing_views: number;
  meta_registrations: number;
  meta_profile_completes: number;
  meta_bank_profiling_completes: number;
  meta_application_starts: number;
  meta_lead_completes: number;

  meta_user_ids: string[];
}

export interface TimeFrameMetrics {
  all_time: FunnelMetrics;
  last_24h: FunnelMetrics;
  last_7d: FunnelMetrics;
  last_30d: FunnelMetrics;
}

export interface SourceMetrics {
  source: string;
  count: number;
  users: number;
  sessions: number;
  conversions: number;
  conversionRate: number;
}

export interface CampaignMetrics {
  campaign: string;
  source: string;
  medium: string;
  count: number;
  users: number;
  conversions: number;
  conversionRate: number;
}

export interface PageMetrics {
  page: string;
  views: number;
  unique_users: number;
  unique_sessions: number;
  bounceRate?: number;
}

export interface EventTypeMetrics {
  type: string;
  count: number;
  percentage: number;
  unique_users: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  unique_users: number;
  unique_sessions: number;
}

class MetricsServiceClass {

  /**
   * Obtiene todas las métricas del embudo de financiamientos
   * Esta es la función principal que todos los dashboards deben usar
   */
  async getFunnelMetrics(startDate?: string, endDate?: string): Promise<FunnelMetrics> {
    try {
      // Construir query base
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('[MetricsService] Error fetching events:', error);
        throw error;
      }

      if (!events) {
        return this.getEmptyMetrics();
      }

      // PASO 1: Identificar usuarios que llegaron al landing (/financiamientos)
      const landingPageViews = events.filter(e =>
        e.event_type === 'PageView' && (
          e.metadata?.page === '/financiamientos' ||
          e.page_url?.includes('/financiamientos')
        )
      );

      // PASO 2: Usuarios que se registraron (ConversionLandingPage)
      // Contar TODOS los usuarios únicos que completaron el registro
      const registrationEvents = events.filter(e =>
        e.event_type === 'ConversionLandingPage' || e.event_name === 'ConversionLandingPage'
      );
      const registeredUserIds = [...new Set(registrationEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 3: Usuarios con perfil completo (PersonalInformationComplete)
      // Contar TODOS los usuarios únicos con perfil completo
      const profileCompleteEvents = events.filter(e =>
        e.event_type === 'PersonalInformationComplete' || e.event_name === 'PersonalInformationComplete'
      );
      const profileCompleteUserIds = [...new Set(profileCompleteEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 4: Usuarios con perfilación bancaria completa
      // Contar TODOS los usuarios únicos con perfilación bancaria
      const bankProfilingEvents = events.filter(e =>
        e.event_type === 'PerfilacionBancariaComplete' || e.event_name === 'PerfilacionBancariaComplete'
      );
      const bankProfileUserIds = [...new Set(bankProfilingEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 5: Usuarios que iniciaron aplicación (ComienzaSolicitud)
      // Contar TODOS los usuarios únicos que iniciaron aplicación
      const applicationStartEvents = events.filter(e =>
        e.event_type === 'ComienzaSolicitud' || e.event_name === 'ComienzaSolicitud'
      );
      const applicationStartUserIds = [...new Set(applicationStartEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 6: Usuarios que completaron solicitud (LeadComplete)
      // Contar TODOS los usuarios únicos que completaron la solicitud
      const leadCompleteEvents = events.filter(e =>
        e.event_type === 'LeadComplete' || e.event_name === 'LeadComplete'
      );
      const leadCompleteUserIds = [...new Set(leadCompleteEvents.map(e => e.user_id).filter(Boolean))] as string[];

      // PASO 7: Todos los ApplicationSubmission (para comparación)
      const allApplicationSubmissions = events.filter(e =>
        (e.event_type === 'ApplicationSubmission' || e.event_name === 'ApplicationSubmission')
      ).length;

      const metrics = {
        landing_page_views: landingPageViews.length,
        registrations: registeredUserIds.length,
        profile_completes: profileCompleteUserIds.length,
        bank_profiling_completes: bankProfileUserIds.length,
        application_starts: applicationStartUserIds.length,
        application_submissions: allApplicationSubmissions,
        lead_completes: leadCompleteUserIds.length,

        landing_user_ids: [],
        registered_user_ids: registeredUserIds,
        profile_complete_user_ids: profileCompleteUserIds,
        bank_profile_user_ids: bankProfileUserIds,
        application_start_user_ids: applicationStartUserIds,
        lead_complete_user_ids: leadCompleteUserIds,
      };

      console.log('[MetricsService] 📊 Funnel Metrics Calculated:', {
        period: `${startDate} to ${endDate}`,
        total_events: events.length,
        landing_views: metrics.landing_page_views,
        registrations: metrics.registrations,
        profile_completes: metrics.profile_completes,
        bank_profiling: metrics.bank_profiling_completes,
        app_starts: metrics.application_starts,
        app_submissions: metrics.application_submissions,
        lead_completes: metrics.lead_completes
      });

      return metrics;
    } catch (error) {
      console.error('[MetricsService] Error in getFunnelMetrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Obtiene métricas específicas de tráfico Meta (Facebook/Instagram)
   */
  async getMetaFunnelMetrics(startDate?: string, endDate?: string): Promise<MetaFunnelMetrics> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error || !events) {
        return this.getEmptyMetaMetrics();
      }

      // Filtrar eventos que vienen de Meta
      const isFromMeta = (event: any) => {
        const hasFbclid = event.metadata?.fbclid ||
                         event.referrer?.includes('facebook.com') ||
                         event.referrer?.includes('instagram.com');
        const isMetaSource = event.utm_source?.toLowerCase().includes('facebook') ||
                            event.utm_source?.toLowerCase().includes('instagram') ||
                            event.utm_source?.toLowerCase().includes('meta');
        return hasFbclid || isMetaSource;
      };

      // Usuarios que se registraron desde Meta
      const metaRegistrations = events.filter(e =>
        (e.event_type === 'ConversionLandingPage' || e.event_name === 'ConversionLandingPage') &&
        isFromMeta(e) && e.user_id
      );
      const metaUserIds = [...new Set(metaRegistrations.map(e => e.user_id).filter(Boolean))] as string[];

      // Métricas del embudo Meta
      const metaLandingViews = events.filter(e =>
        e.event_type === 'PageView' &&
        (e.metadata?.page === '/financiamientos' || e.page_url?.includes('/financiamientos')) &&
        isFromMeta(e)
      ).length;

      const metaProfileCompletes = events.filter(e =>
        (e.event_type === 'PersonalInformationComplete' || e.event_name === 'PersonalInformationComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaBankProfiling = events.filter(e =>
        (e.event_type === 'PerfilacionBancariaComplete' || e.event_name === 'PerfilacionBancariaComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaApplicationStarts = events.filter(e =>
        (e.event_type === 'ComienzaSolicitud' || e.event_name === 'ComienzaSolicitud') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      const metaLeadCompletes = events.filter(e =>
        (e.event_type === 'LeadComplete' || e.event_name === 'LeadComplete') &&
        e.user_id && metaUserIds.includes(e.user_id)
      ).length;

      return {
        meta_landing_views: metaLandingViews,
        meta_registrations: metaUserIds.length,
        meta_profile_completes: metaProfileCompletes,
        meta_bank_profiling_completes: metaBankProfiling,
        meta_application_starts: metaApplicationStarts,
        meta_lead_completes: metaLeadCompletes,
        meta_user_ids: metaUserIds,
      };
    } catch (error) {
      console.error('[MetricsService] Error in getMetaFunnelMetrics:', error);
      return this.getEmptyMetaMetrics();
    }
  }

  /**
   * Obtiene métricas para múltiples períodos de tiempo
   */
  async getTimeFrameMetrics(): Promise<TimeFrameMetrics> {
    const now = new Date();

    // Últimas 24 horas
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const metrics24h = await this.getFunnelMetrics(last24h.toISOString().split('T')[0]);

    // Últimos 7 días
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const metrics7d = await this.getFunnelMetrics(last7d.toISOString().split('T')[0]);

    // Últimos 30 días
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const metrics30d = await this.getFunnelMetrics(last30d.toISOString().split('T')[0]);

    // Todo el tiempo (histórico completo)
    const allTime = await this.getFunnelMetrics();

    return {
      all_time: allTime,
      last_24h: metrics24h,
      last_7d: metrics7d,
      last_30d: metrics30d,
    };
  }

  /**
   * Obtiene el conteo total de leads (LeadComplete)
   * Esta función debe ser usada por TODOS los dashboards para mostrar el mismo número
   */
  async getTotalLeads(startDate?: string, endDate?: string): Promise<number> {
    const metrics = await this.getFunnelMetrics(startDate, endDate);
    return metrics.lead_completes;
  }

  /**
   * Obtiene el total de visitas al sitio (PageView events)
   * Cuenta TODAS las vistas de página, no solo /financiamientos
   */
  async getTotalSiteVisits(startDate?: string, endDate?: string): Promise<number> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: false })
        .eq('event_type', 'PageView');

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[MetricsService] Error fetching site visits:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[MetricsService] Error in getTotalSiteVisits:', error);
      return 0;
    }
  }

  /**
   * Obtiene visitantes únicos del sitio
   */
  async getUniqueSiteVisitors(startDate?: string, endDate?: string): Promise<number> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('user_id, session_id')
        .eq('event_type', 'PageView');

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('[MetricsService] Error fetching unique visitors:', error);
        return 0;
      }

      // Usar session_id para contar visitantes únicos (más preciso que user_id)
      const uniqueSessions = new Set(data.map(e => e.session_id).filter(Boolean));
      return uniqueSessions.size;
    } catch (error) {
      console.error('[MetricsService] Error in getUniqueSiteVisitors:', error);
      return 0;
    }
  }

  /**
   * Obtiene todas las fuentes UTM disponibles en los datos
   */
  async getAvailableUTMSources(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('utm_source')
        .not('utm_source', 'is', null)
        .order('utm_source');

      if (error || !data) {
        return [];
      }

      const uniqueSources = [...new Set(data.map(e => e.utm_source).filter(Boolean))] as string[];
      return uniqueSources.sort();
    } catch (error) {
      console.error('[MetricsService] Error in getAvailableUTMSources:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las campañas UTM disponibles en los datos
   */
  async getAvailableUTMCampaigns(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('utm_campaign')
        .not('utm_campaign', 'is', null)
        .order('utm_campaign');

      if (error || !data) {
        return [];
      }

      const uniqueCampaigns = [...new Set(data.map(e => e.utm_campaign).filter(Boolean))] as string[];
      return uniqueCampaigns.sort();
    } catch (error) {
      console.error('[MetricsService] Error in getAvailableUTMCampaigns:', error);
      return [];
    }
  }

  /**
   * Calcula tasas de conversión entre etapas del embudo
   */
  calculateConversionRates(metrics: FunnelMetrics) {
    const safeDiv = (a: number, b: number) => b > 0 ? (a / b) * 100 : 0;

    return {
      landing_to_registration: safeDiv(metrics.registrations, metrics.landing_page_views),
      registration_to_profile: safeDiv(metrics.profile_completes, metrics.registrations),
      profile_to_bank_profiling: safeDiv(metrics.bank_profiling_completes, metrics.profile_completes),
      bank_profiling_to_application: safeDiv(metrics.application_starts, metrics.bank_profiling_completes),
      application_to_lead: safeDiv(metrics.lead_completes, metrics.application_starts),
      overall_conversion: safeDiv(metrics.lead_completes, metrics.landing_page_views),
    };
  }

  /**
   * Obtiene métricas por fuente UTM
   * Incluye conteo de eventos, usuarios únicos, sesiones y conversiones
   */
  async getSourceMetrics(startDate?: string, endDate?: string, utmCampaign?: string): Promise<SourceMetrics[]> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (utmCampaign) {
        query = query.eq('utm_campaign', utmCampaign);
      }

      const { data: events, error } = await query;

      if (error || !events) {
        console.error('[MetricsService] Error fetching events for source metrics:', error);
        return [];
      }

      // Agrupar eventos por fuente
      const sourceMap = new Map<string, {
        count: number;
        users: Set<string>;
        sessions: Set<string>;
        conversions: Set<string>;
      }>();

      events.forEach(event => {
        const source = event.utm_source || 'directo';

        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            count: 0,
            users: new Set(),
            sessions: new Set(),
            conversions: new Set()
          });
        }

        const metrics = sourceMap.get(source)!;
        metrics.count++;

        if (event.user_id) {
          metrics.users.add(event.user_id);
        }
        if (event.session_id) {
          metrics.sessions.add(event.session_id);
        }

        // Contar conversiones (LeadComplete)
        if ((event.event_type === 'LeadComplete' || event.event_name === 'LeadComplete') && event.user_id) {
          metrics.conversions.add(event.user_id);
        }
      });

      // Convertir a array y calcular tasas de conversión
      return Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source,
          count: data.count,
          users: data.users.size,
          sessions: data.sessions.size,
          conversions: data.conversions.size,
          conversionRate: data.users.size > 0
            ? Math.round((data.conversions.size / data.users.size) * 1000) / 10
            : 0
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('[MetricsService] Error in getSourceMetrics:', error);
      return [];
    }
  }

  /**
   * Obtiene métricas por campaña UTM
   * Incluye fuente, medio y métricas de conversión
   */
  async getCampaignMetrics(startDate?: string, endDate?: string, utmSource?: string): Promise<CampaignMetrics[]> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (utmSource) {
        query = query.eq('utm_source', utmSource);
      }

      const { data: events, error } = await query;

      if (error || !events) {
        console.error('[MetricsService] Error fetching events for campaign metrics:', error);
        return [];
      }

      // Agrupar por campaña + fuente + medio
      const campaignMap = new Map<string, {
        campaign: string;
        source: string;
        medium: string;
        count: number;
        users: Set<string>;
        conversions: Set<string>;
      }>();

      events.forEach(event => {
        // Solo procesar eventos con campaña
        if (!event.utm_campaign) return;

        const campaign = event.utm_campaign;
        const source = event.utm_source || 'directo';
        const medium = event.utm_medium || 'none';
        const key = `${campaign}|${source}|${medium}`;

        if (!campaignMap.has(key)) {
          campaignMap.set(key, {
            campaign,
            source,
            medium,
            count: 0,
            users: new Set(),
            conversions: new Set()
          });
        }

        const metrics = campaignMap.get(key)!;
        metrics.count++;

        if (event.user_id) {
          metrics.users.add(event.user_id);
        }

        // Contar conversiones
        if ((event.event_type === 'LeadComplete' || event.event_name === 'LeadComplete') && event.user_id) {
          metrics.conversions.add(event.user_id);
        }
      });

      return Array.from(campaignMap.values())
        .map(data => ({
          campaign: data.campaign,
          source: data.source,
          medium: data.medium,
          count: data.count,
          users: data.users.size,
          conversions: data.conversions.size,
          conversionRate: data.users.size > 0
            ? Math.round((data.conversions.size / data.users.size) * 1000) / 10
            : 0
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('[MetricsService] Error in getCampaignMetrics:', error);
      return [];
    }
  }

  /**
   * Obtiene métricas por página
   * Analiza vistas de página, usuarios únicos y sesiones únicas
   */
  async getPageMetrics(startDate?: string, endDate?: string): Promise<PageMetrics[]> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .eq('event_type', 'PageView')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error || !events) {
        console.error('[MetricsService] Error fetching events for page metrics:', error);
        return [];
      }

      // Agrupar por página
      const pageMap = new Map<string, {
        views: number;
        users: Set<string>;
        sessions: Set<string>;
      }>();

      events.forEach(event => {
        const page = event.metadata?.page || event.metadata?.url || 'unknown';

        if (!pageMap.has(page)) {
          pageMap.set(page, {
            views: 0,
            users: new Set(),
            sessions: new Set()
          });
        }

        const metrics = pageMap.get(page)!;
        metrics.views++;

        if (event.user_id) {
          metrics.users.add(event.user_id);
        }
        if (event.session_id) {
          metrics.sessions.add(event.session_id);
        }
      });

      return Array.from(pageMap.entries())
        .map(([page, data]) => ({
          page,
          views: data.views,
          unique_users: data.users.size,
          unique_sessions: data.sessions.size
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 50); // Limitar a top 50
    } catch (error) {
      console.error('[MetricsService] Error in getPageMetrics:', error);
      return [];
    }
  }

  /**
   * Obtiene distribución de eventos por tipo
   */
  async getEventTypeMetrics(startDate?: string, endDate?: string): Promise<EventTypeMetrics[]> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data: events, error } = await query;

      if (error || !events) {
        console.error('[MetricsService] Error fetching events for event type metrics:', error);
        return [];
      }

      const totalEvents = events.length;

      // Agrupar por tipo de evento
      const typeMap = new Map<string, {
        count: number;
        users: Set<string>;
      }>();

      events.forEach(event => {
        const type = event.event_type || event.event_name || 'unknown';

        if (!typeMap.has(type)) {
          typeMap.set(type, {
            count: 0,
            users: new Set()
          });
        }

        const metrics = typeMap.get(type)!;
        metrics.count++;

        if (event.user_id) {
          metrics.users.add(event.user_id);
        }
      });

      return Array.from(typeMap.entries())
        .map(([type, data]) => ({
          type,
          count: data.count,
          percentage: totalEvents > 0
            ? Math.round((data.count / totalEvents) * 1000) / 10
            : 0,
          unique_users: data.users.size
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('[MetricsService] Error in getEventTypeMetrics:', error);
      return [];
    }
  }

  /**
   * Obtiene serie temporal de eventos
   * Agrupa eventos por día con usuarios y sesiones únicos
   */
  async getTimeSeriesData(startDate?: string, endDate?: string, eventType?: string): Promise<TimeSeriesData[]> {
    try {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: events, error } = await query;

      if (error || !events) {
        console.error('[MetricsService] Error fetching events for time series:', error);
        return [];
      }

      // Agrupar por fecha
      const dateMap = new Map<string, {
        count: number;
        users: Set<string>;
        sessions: Set<string>;
      }>();

      events.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];

        if (!dateMap.has(date)) {
          dateMap.set(date, {
            count: 0,
            users: new Set(),
            sessions: new Set()
          });
        }

        const metrics = dateMap.get(date)!;
        metrics.count++;

        if (event.user_id) {
          metrics.users.add(event.user_id);
        }
        if (event.session_id) {
          metrics.sessions.add(event.session_id);
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          unique_users: data.users.size,
          unique_sessions: data.sessions.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[MetricsService] Error in getTimeSeriesData:', error);
      return [];
    }
  }

  private getEmptyMetrics(): FunnelMetrics {
    return {
      landing_page_views: 0,
      registrations: 0,
      profile_completes: 0,
      bank_profiling_completes: 0,
      application_starts: 0,
      application_submissions: 0,
      lead_completes: 0,
      landing_user_ids: [],
      registered_user_ids: [],
      profile_complete_user_ids: [],
      bank_profile_user_ids: [],
      application_start_user_ids: [],
      lead_complete_user_ids: [],
    };
  }

  private getEmptyMetaMetrics(): MetaFunnelMetrics {
    return {
      meta_landing_views: 0,
      meta_registrations: 0,
      meta_profile_completes: 0,
      meta_bank_profiling_completes: 0,
      meta_application_starts: 0,
      meta_lead_completes: 0,
      meta_user_ids: [],
    };
  }

  /**
   * OPTIMIZED: Get funnel metrics using RPC function (much faster than fetching all events)
   * Uses database-side aggregation instead of client-side processing
   */
  async getFunnelMetricsOptimized(startDate?: string, endDate?: string): Promise<FunnelMetrics> {
    try {
      console.log('[MetricsService] Using optimized RPC for funnel metrics');

      const { data, error } = await supabase.rpc('get_tracking_funnel_metrics', {
        p_start_date: startDate ? `${startDate}T00:00:00Z` : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate ? `${endDate}T23:59:59Z` : new Date().toISOString()
      });

      if (error) {
        console.error('[MetricsService] RPC error, falling back to standard method:', error);
        return this.getFunnelMetrics(startDate, endDate);
      }

      if (!data || data.length === 0) {
        return this.getEmptyMetrics();
      }

      const row = data[0];

      return {
        landing_page_views: row.landing_page_views || 0,
        registrations: row.registrations || 0,
        profile_completes: row.profile_completes || 0,
        bank_profiling_completes: row.bank_profiling_completes || 0,
        application_starts: row.application_starts || 0,
        application_submissions: row.application_submits || 0,
        lead_completes: row.application_submits || 0,
        landing_user_ids: [],
        registered_user_ids: [],
        profile_complete_user_ids: [],
        bank_profile_user_ids: [],
        application_start_user_ids: [],
        lead_complete_user_ids: [],
      };
    } catch (error) {
      console.error('[MetricsService] Error in getFunnelMetricsOptimized:', error);
      return this.getFunnelMetrics(startDate, endDate);
    }
  }

  /**
   * OPTIMIZED: Get global dashboard metrics using RPC function
   */
  async getGlobalDashboardMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_global_dashboard_metrics');

      if (error) {
        console.error('[MetricsService] Error fetching global metrics:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('[MetricsService] Error in getGlobalDashboardMetrics:', error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Get business analytics metrics using RPC function
   */
  async getBusinessMetricsOptimized() {
    try {
      const { data, error } = await supabase.rpc('get_business_analytics_metrics');

      if (error) {
        console.error('[MetricsService] Error fetching business metrics:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('[MetricsService] Error in getBusinessMetricsOptimized:', error);
      throw error;
    }
  }
}

export const MetricsService = new MetricsServiceClass();
