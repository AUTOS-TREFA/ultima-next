/**
 * Marketing Events Service
 *
 * Tracks marketing events, referrers, and campaign parameters
 * Stores data in Supabase for analytics and reporting
 */

import { supabase } from '../../supabaseClient';

export interface MarketingEvent {
  id?: string;
  event_type: 'page_view' | 'button_click' | 'form_submit' | 'lead_capture' | 'custom';
  event_name: string;
  page_url: string;
  referrer: string | null;

  // UTM Parameters
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;

  // Facebook tracking
  fbclid: string | null;

  // Other tracking parameters
  gclid: string | null; // Google Ads
  msclkid: string | null; // Microsoft Ads
  rfdm: string | null; // Custom referral

  // User context
  user_id: string | null;
  session_id: string;
  user_agent: string;
  ip_address: string | null;

  // Geographic data
  country: string | null;
  city: string | null;

  // Additional metadata
  metadata: Record<string, any>;

  created_at?: string;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface EventStats {
  total_events: number;
  unique_sessions: number;
  top_sources: Array<{ source: string; count: number }>;
  top_campaigns: Array<{ campaign: string; count: number }>;
  events_by_type: Array<{ type: string; count: number }>;
  events_over_time: Array<{ date: string; count: number }>;
}

class MarketingEventsService {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for tracking
   */
  private getOrCreateSessionId(): string {
    const key = 'trefa_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }

  /**
   * Extract tracking parameters from URL
   */
  private extractTrackingParams(url: string = window.location.href): Partial<MarketingEvent> {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
      fbclid: params.get('fbclid'),
      gclid: params.get('gclid'),
      msclkid: params.get('msclkid'),
      rfdm: params.get('rfdm'),
    };
  }

  /**
   * Track a marketing event
   */
  async trackEvent(
    eventType: MarketingEvent['event_type'],
    eventName: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const trackingParams = this.extractTrackingParams();

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const event: Omit<MarketingEvent, 'id' | 'created_at'> = {
        event_type: eventType,
        event_name: eventName,
        page_url: window.location.href,
        referrer: document.referrer || null,
        utm_source: trackingParams.utm_source || null,
        utm_medium: trackingParams.utm_medium || null,
        utm_campaign: trackingParams.utm_campaign || null,
        utm_term: trackingParams.utm_term || null,
        utm_content: trackingParams.utm_content || null,
        fbclid: trackingParams.fbclid || null,
        gclid: trackingParams.gclid || null,
        msclkid: trackingParams.msclkid || null,
        rfdm: trackingParams.rfdm || null,
        user_id: user?.id || null,
        session_id: this.sessionId,
        user_agent: navigator.userAgent,
        ip_address: null, // Will be set server-side
        country: null, // Can be set from IP geolocation
        city: null,
        metadata,
      };

      const { error } = await supabase
        .from('marketing_events')
        .insert([event]);

      if (error) {
        console.error('Failed to track marketing event:', error);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageName?: string): Promise<void> {
    await this.trackEvent(
      'page_view',
      pageName || document.title,
      {
        pathname: window.location.pathname,
      }
    );
  }

  /**
   * Track button click
   */
  async trackButtonClick(buttonName: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('button_click', buttonName, metadata);
  }

  /**
   * Track form submission
   */
  async trackFormSubmit(formName: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('form_submit', formName, metadata);
  }

  /**
   * Track lead capture
   */
  async trackLeadCapture(metadata: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('lead_capture', 'Lead Captured', metadata);
  }

  /**
   * Get marketing events with filters
   */
  async getEvents(filters: EventFilters = {}, limit: number = 100): Promise<MarketingEvent[]> {
    try {
      let query = supabase
        .from('marketing_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.utmSource) {
        query = query.eq('utm_source', filters.utmSource);
      }

      if (filters.utmMedium) {
        query = query.eq('utm_medium', filters.utmMedium);
      }

      if (filters.utmCampaign) {
        query = query.eq('utm_campaign', filters.utmCampaign);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching marketing events:', error);
      return [];
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(filters: EventFilters = {}): Promise<EventStats> {
    try {
      const events = await this.getEvents(filters, 10000); // Get more for stats

      // Calculate stats
      const uniqueSessions = new Set(events.map(e => e.session_id)).size;

      // Top sources
      const sourceCounts = events.reduce((acc, e) => {
        const source = e.utm_source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top campaigns
      const campaignCounts = events.reduce((acc, e) => {
        const campaign = e.utm_campaign || 'none';
        acc[campaign] = (acc[campaign] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topCampaigns = Object.entries(campaignCounts)
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Events by type
      const typeCounts = events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const eventsByType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }));

      // Events over time (last 30 days)
      const dateMap = events.reduce((acc, e) => {
        const date = e.created_at?.split('T')[0] || '';
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const eventsOverTime = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_events: events.length,
        unique_sessions: uniqueSessions,
        top_sources: topSources,
        top_campaigns: topCampaigns,
        events_by_type: eventsByType,
        events_over_time: eventsOverTime,
      };
    } catch (error) {
      console.error('Error calculating event stats:', error);
      return {
        total_events: 0,
        unique_sessions: 0,
        top_sources: [],
        top_campaigns: [],
        events_by_type: [],
        events_over_time: [],
      };
    }
  }

  /**
   * Store tracking parameters in localStorage for later attribution
   */
  storeAttribution(): void {
    const params = this.extractTrackingParams();
    const hasParams = Object.values(params).some(v => v !== null);

    if (hasParams) {
      localStorage.setItem('trefa_attribution', JSON.stringify({
        ...params,
        timestamp: Date.now(),
        referrer: document.referrer,
      }));
    }
  }

  /**
   * Get stored attribution data
   */
  getStoredAttribution(): Partial<MarketingEvent> | null {
    const stored = localStorage.getItem('trefa_attribution');
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const marketingEvents = new MarketingEventsService();
export default marketingEvents;
