import { supabase } from '../../supabaseClient';

/**
 * GlobalMetricsService - Centralized metrics service for all dashboards
 * Uses optimized RPC functions to ensure consistent data across the application
 */

export interface GlobalDashboardMetrics {
  // Lead Metrics
  totalLeads: number;
  contactedLeads: number;
  uncontactedLeads: number;
  leadsLast24h: number;
  leadsLast7d: number;
  leadsLast30d: number;

  // Application Metrics
  totalApplications: number;
  draftApplications: number;
  submittedApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  applicationsLast24h: number;
  applicationsLast7d: number;

  // Document Metrics
  totalDocuments: number;
  applicationsWithDocs: number;
  applicationsWith4PlusDocs: number;

  // Bank Profile Metrics
  totalBankProfiles: number;
  completeBankProfiles: number;

  // Source Breakdown
  leadsFacebook: number;
  leadsGoogle: number;
  leadsDirect: number;
  leadsWhatsapp: number;
  leadsOther: number;

  // Rates
  conversionRate: number;
  approvalRate: number;
  contactRate: number;
  documentCompletionRate: number;
}

export interface TrackingFunnelMetrics {
  landingPageViews: number;
  registrations: number;
  profileCompletes: number;
  bankProfilingCompletes: number;
  applicationStarts: number;
  applicationSubmits: number;
  uniqueVisitors: number;
}

export interface BusinessAnalyticsMetrics {
  totalInventoryVehicles: number;
  availableVehicles: number;
  soldVehicles: number;
  reservedVehicles: number;
  vehiclesWithApplications: number;
  totalActiveApplications: number;
  avgVehiclePrice: number;
}

// Cache for metrics to reduce database calls
let metricsCache: {
  global: GlobalDashboardMetrics | null;
  tracking: TrackingFunnelMetrics | null;
  business: BusinessAnalyticsMetrics | null;
  lastUpdated: Date | null;
} = {
  global: null,
  tracking: null,
  business: null,
  lastUpdated: null
};

const CACHE_DURATION_MS = 60000; // 1 minute cache

export class GlobalMetricsService {
  /**
   * Get global dashboard metrics from optimized RPC function
   * Uses caching to reduce database load
   */
  static async getGlobalMetrics(forceRefresh = false): Promise<GlobalDashboardMetrics> {
    // Check cache
    if (!forceRefresh && metricsCache.global && metricsCache.lastUpdated) {
      const cacheAge = Date.now() - metricsCache.lastUpdated.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        console.log('[GlobalMetricsService] Using cached global metrics');
        return metricsCache.global;
      }
    }

    try {
      console.log('[GlobalMetricsService] Fetching global metrics from database...');
      const { data, error } = await supabase.rpc('get_global_dashboard_metrics');

      if (error) {
        console.error('[GlobalMetricsService] Error fetching global metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('[GlobalMetricsService] No data returned from RPC');
        return this.getEmptyGlobalMetrics();
      }

      const row = data[0];

      // Calculate "other" sources
      const totalSources = (row.leads_facebook || 0) + (row.leads_google || 0) +
                          (row.leads_direct || 0) + (row.leads_whatsapp || 0);
      const leadsOther = Math.max(0, (row.total_leads || 0) - totalSources);

      const metrics: GlobalDashboardMetrics = {
        // Lead Metrics
        totalLeads: row.total_leads || 0,
        contactedLeads: row.contacted_leads || 0,
        uncontactedLeads: row.uncontacted_leads || 0,
        leadsLast24h: row.leads_last_24h || 0,
        leadsLast7d: row.leads_last_7d || 0,
        leadsLast30d: row.leads_last_30d || 0,

        // Application Metrics
        totalApplications: row.total_applications || 0,
        draftApplications: row.draft_applications || 0,
        submittedApplications: row.submitted_applications || 0,
        pendingApplications: row.pending_applications || 0,
        approvedApplications: row.approved_applications || 0,
        rejectedApplications: row.rejected_applications || 0,
        applicationsLast24h: row.applications_last_24h || 0,
        applicationsLast7d: row.applications_last_7d || 0,

        // Document Metrics
        totalDocuments: row.total_documents || 0,
        applicationsWithDocs: row.applications_with_docs || 0,
        applicationsWith4PlusDocs: row.applications_with_4plus_docs || 0,

        // Bank Profile Metrics
        totalBankProfiles: row.total_bank_profiles || 0,
        completeBankProfiles: row.complete_bank_profiles || 0,

        // Source Breakdown
        leadsFacebook: row.leads_facebook || 0,
        leadsGoogle: row.leads_google || 0,
        leadsDirect: row.leads_direct || 0,
        leadsWhatsapp: row.leads_whatsapp || 0,
        leadsOther: leadsOther,

        // Rates
        conversionRate: row.conversion_rate || 0,
        approvalRate: row.approval_rate || 0,
        contactRate: row.contact_rate || 0,
        documentCompletionRate: row.document_completion_rate || 0
      };

      // Update cache
      metricsCache.global = metrics;
      metricsCache.lastUpdated = new Date();

      console.log('[GlobalMetricsService] Global metrics loaded:', {
        totalLeads: metrics.totalLeads,
        totalApplications: metrics.totalApplications,
        submittedApplications: metrics.submittedApplications
      });

      return metrics;
    } catch (error) {
      console.error('[GlobalMetricsService] Error:', error);
      throw error;
    }
  }

  /**
   * Get tracking funnel metrics
   */
  static async getTrackingFunnelMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<TrackingFunnelMetrics> {
    try {
      console.log('[GlobalMetricsService] Fetching tracking funnel metrics...');

      const { data, error } = await supabase.rpc('get_tracking_funnel_metrics', {
        p_start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate?.toISOString() || new Date().toISOString()
      });

      if (error) {
        console.error('[GlobalMetricsService] Error fetching tracking metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return this.getEmptyTrackingMetrics();
      }

      const row = data[0];

      const metrics: TrackingFunnelMetrics = {
        landingPageViews: row.landing_page_views || 0,
        registrations: row.registrations || 0,
        profileCompletes: row.profile_completes || 0,
        bankProfilingCompletes: row.bank_profiling_completes || 0,
        applicationStarts: row.application_starts || 0,
        applicationSubmits: row.application_submits || 0,
        uniqueVisitors: row.unique_visitors || 0
      };

      // Update cache
      metricsCache.tracking = metrics;

      return metrics;
    } catch (error) {
      console.error('[GlobalMetricsService] Tracking metrics error:', error);
      throw error;
    }
  }

  /**
   * Get business analytics metrics
   */
  static async getBusinessAnalyticsMetrics(): Promise<BusinessAnalyticsMetrics> {
    try {
      console.log('[GlobalMetricsService] Fetching business analytics metrics...');

      const { data, error } = await supabase.rpc('get_business_analytics_metrics');

      if (error) {
        console.error('[GlobalMetricsService] Error fetching business metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return this.getEmptyBusinessMetrics();
      }

      const row = data[0];

      const metrics: BusinessAnalyticsMetrics = {
        totalInventoryVehicles: row.total_inventory_vehicles || 0,
        availableVehicles: row.available_vehicles || 0,
        soldVehicles: row.sold_vehicles || 0,
        reservedVehicles: row.reserved_vehicles || 0,
        vehiclesWithApplications: row.vehicles_with_applications || 0,
        totalActiveApplications: row.total_active_applications || 0,
        avgVehiclePrice: row.avg_vehicle_price || 0
      };

      // Update cache
      metricsCache.business = metrics;

      return metrics;
    } catch (error) {
      console.error('[GlobalMetricsService] Business metrics error:', error);
      throw error;
    }
  }

  /**
   * Clear the metrics cache
   */
  static clearCache(): void {
    metricsCache = {
      global: null,
      tracking: null,
      business: null,
      lastUpdated: null
    };
    console.log('[GlobalMetricsService] Cache cleared');
  }

  /**
   * Get all metrics in parallel
   */
  static async getAllMetrics(forceRefresh = false): Promise<{
    global: GlobalDashboardMetrics;
    tracking: TrackingFunnelMetrics;
    business: BusinessAnalyticsMetrics;
  }> {
    const [global, tracking, business] = await Promise.all([
      this.getGlobalMetrics(forceRefresh),
      this.getTrackingFunnelMetrics(),
      this.getBusinessAnalyticsMetrics()
    ]);

    return { global, tracking, business };
  }

  // Empty metrics helpers
  private static getEmptyGlobalMetrics(): GlobalDashboardMetrics {
    return {
      totalLeads: 0,
      contactedLeads: 0,
      uncontactedLeads: 0,
      leadsLast24h: 0,
      leadsLast7d: 0,
      leadsLast30d: 0,
      totalApplications: 0,
      draftApplications: 0,
      submittedApplications: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      applicationsLast24h: 0,
      applicationsLast7d: 0,
      totalDocuments: 0,
      applicationsWithDocs: 0,
      applicationsWith4PlusDocs: 0,
      totalBankProfiles: 0,
      completeBankProfiles: 0,
      leadsFacebook: 0,
      leadsGoogle: 0,
      leadsDirect: 0,
      leadsWhatsapp: 0,
      leadsOther: 0,
      conversionRate: 0,
      approvalRate: 0,
      contactRate: 0,
      documentCompletionRate: 0
    };
  }

  private static getEmptyTrackingMetrics(): TrackingFunnelMetrics {
    return {
      landingPageViews: 0,
      registrations: 0,
      profileCompletes: 0,
      bankProfilingCompletes: 0,
      applicationStarts: 0,
      applicationSubmits: 0,
      uniqueVisitors: 0
    };
  }

  private static getEmptyBusinessMetrics(): BusinessAnalyticsMetrics {
    return {
      totalInventoryVehicles: 0,
      availableVehicles: 0,
      soldVehicles: 0,
      reservedVehicles: 0,
      vehiclesWithApplications: 0,
      totalActiveApplications: 0,
      avgVehiclePrice: 0
    };
  }
}
