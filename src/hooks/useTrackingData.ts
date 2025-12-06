'use client';

// React Query hooks for tracking data

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { TrackingEvent, FinancingApplication, TrackingDashboardMetrics } from '@/types/tracking';
import { calculateTrackingDashboardMetrics } from '@/lib/trackingAnalytics';
import { GlobalMetricsService } from '@/services/GlobalMetricsService';
import { subDays } from 'date-fns';

/**
 * Fetch all tracking events within date range
 */
export function useTrackingEvents(
  startDate?: Date,
  endDate?: Date
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['tracking-events', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrackingEvent[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    staleTime: 15000
  });
}

/**
 * Fetch financing applications
 */
export function useFinancingApplications(): UseQueryResult<FinancingApplication[], Error> {
  return useQuery({
    queryKey: ['financing-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FinancingApplication[];
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}

/**
 * Fetch complete tracking dashboard metrics
 * Uses optimized RPC for funnel metrics and limited event queries for detailed analytics
 */
export function useTrackingDashboardMetrics(
  startDate?: Date,
  endDate?: Date
): UseQueryResult<TrackingDashboardMetrics, Error> {
  const defaultStartDate = startDate || subDays(new Date(), 30);
  const defaultEndDate = endDate || new Date();

  return useQuery({
    queryKey: ['tracking-dashboard-metrics', defaultStartDate.toISOString(), defaultEndDate.toISOString()],
    queryFn: async () => {
      console.log('[useTrackingDashboardMetrics] Fetching metrics using optimized queries...');

      // Fetch optimized funnel metrics from RPC and limited events for detailed analytics in parallel
      const [funnelMetrics, eventsResult, appsResult] = await Promise.all([
        // Use optimized RPC for funnel metrics (much faster than fetching all events)
        GlobalMetricsService.getTrackingFunnelMetrics(defaultStartDate, defaultEndDate),
        // Only fetch events needed for campaign/source analytics (limited to 10k most recent)
        supabase
          .from('tracking_events')
          .select('id, event_type, created_at, user_id, session_id, utm_source, utm_medium, utm_campaign, metadata')
          .gte('created_at', defaultStartDate.toISOString())
          .lte('created_at', defaultEndDate.toISOString())
          .in('event_type', ['PageView', 'ConversionLandingPage', 'PersonalInformationComplete', 'ComienzaSolicitud', 'LeadComplete'])
          .order('created_at', { ascending: false })
          .limit(10000),
        // Only fetch needed application fields
        supabase
          .from('financing_applications')
          .select('id, status, created_at, user_id')
          .neq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(5000)
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (appsResult.error) throw appsResult.error;

      const events = eventsResult.data as TrackingEvent[];
      const applications = appsResult.data as FinancingApplication[];

      console.log('[useTrackingDashboardMetrics] Fetched:', {
        funnelFromRPC: funnelMetrics,
        eventsCount: events.length,
        applicationsCount: applications.length
      });

      // Calculate detailed metrics from limited events
      const dashboardMetrics = calculateTrackingDashboardMetrics(events, applications);

      // Override funnel data with accurate RPC values
      dashboardMetrics.conversionMetrics = {
        ...dashboardMetrics.conversionMetrics,
        totalVisits: funnelMetrics.landingPageViews,
        totalRegistrations: funnelMetrics.registrations,
        totalProfileCompletes: funnelMetrics.profileCompletes,
        totalBankProfilingCompletes: funnelMetrics.bankProfilingCompletes,
        totalApplications: funnelMetrics.applicationSubmits,
        visitToRegistrationRate: funnelMetrics.landingPageViews > 0
          ? Math.round((funnelMetrics.registrations / funnelMetrics.landingPageViews) * 1000) / 10 : 0,
        registrationToProfileRate: funnelMetrics.registrations > 0
          ? Math.round((funnelMetrics.profileCompletes / funnelMetrics.registrations) * 1000) / 10 : 0,
        profileToBankProfilingRate: funnelMetrics.profileCompletes > 0
          ? Math.round((funnelMetrics.bankProfilingCompletes / funnelMetrics.profileCompletes) * 1000) / 10 : 0,
        bankProfilingToApplicationRate: funnelMetrics.bankProfilingCompletes > 0
          ? Math.round((funnelMetrics.applicationSubmits / funnelMetrics.bankProfilingCompletes) * 1000) / 10 : 0,
        overallConversionRate: funnelMetrics.landingPageViews > 0
          ? Math.round((funnelMetrics.applicationSubmits / funnelMetrics.landingPageViews) * 1000) / 10 : 0
      };

      // Update funnel data with RPC values
      const funnelStages = [
        { count: funnelMetrics.landingPageViews, name: 'Visitas Landing Page', stage: 'landing_page_visit' },
        { count: funnelMetrics.registrations, name: 'Registro Completado', stage: 'registration' },
        { count: funnelMetrics.profileCompletes, name: 'Información Personal', stage: 'profile_complete' },
        { count: funnelMetrics.applicationStarts, name: 'Inició Solicitud', stage: 'application_started' },
        { count: funnelMetrics.applicationSubmits, name: 'Solicitud Enviada', stage: 'application_submitted' }
      ];

      dashboardMetrics.funnelData = funnelStages.map((stage, index) => {
        const previousCount = index > 0 ? funnelStages[index - 1].count : stage.count;
        const conversionRate = previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
        const dropOffRate = 100 - conversionRate;
        const overallPercentage = funnelStages[0].count > 0 ? (stage.count / funnelStages[0].count) * 100 : 0;

        return {
          stage: stage.stage as any,
          stageName: stage.name,
          count: stage.count,
          percentage: Math.round(overallPercentage * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          dropOffRate: Math.round(dropOffRate * 10) / 10
        };
      });

      return dashboardMetrics;
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}

/**
 * Fetch events for a specific campaign
 */
export function useCampaignEvents(
  campaign: string
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['campaign-events', campaign],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('utm_campaign', campaign)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data as TrackingEvent[];
    },
    enabled: !!campaign,
    refetchInterval: 60000,
    staleTime: 30000
  });
}

/**
 * Fetch events for a specific source
 */
export function useSourceEvents(
  source: string,
  medium?: string
): UseQueryResult<TrackingEvent[], Error> {
  return useQuery({
    queryKey: ['source-events', source, medium],
    queryFn: async () => {
      let query = supabase
        .from('tracking_events')
        .select('*')
        .eq('utm_source', source)
        .order('created_at', { ascending: false });

      if (medium) {
        query = query.eq('utm_medium', medium);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrackingEvent[];
    },
    enabled: !!source,
    refetchInterval: 60000,
    staleTime: 30000
  });
}
