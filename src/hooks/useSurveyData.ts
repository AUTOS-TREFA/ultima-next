// React Query hooks for survey data fetching

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { SurveyResponse, DashboardMetrics } from '../types/survey';
import { calculateDashboardMetrics } from '../lib/surveyAnalytics';

/**
 * Fetch all survey responses
 */
export function useSurveyResponses(): UseQueryResult<SurveyResponse[], Error> {
  return useQuery({
    queryKey: ['survey-responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anonymous_survey_responses')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as SurveyResponse[];
    },
    refetchInterval: 60000, // Refetch every minute for real-time updates
    staleTime: 30000 // Consider data stale after 30 seconds
  });
}

/**
 * Fetch dashboard metrics
 */
export function useDashboardMetrics(): UseQueryResult<DashboardMetrics, Error> {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anonymous_survey_responses')
        .select('*');

      if (error) throw error;

      const responses = data as SurveyResponse[];
      return calculateDashboardMetrics(responses);
    },
    refetchInterval: 60000,
    staleTime: 30000
  });
}

/**
 * Fetch responses with pagination
 */
export function usePaginatedSurveyResponses(
  page: number = 0,
  pageSize: number = 10
): UseQueryResult<{ data: SurveyResponse[]; total: number }, Error> {
  return useQuery({
    queryKey: ['survey-responses-paginated', page, pageSize],
    queryFn: async () => {
      // Get total count
      const { count, error: countError } = await supabase
        .from('anonymous_survey_responses')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get paginated data
      const { data, error } = await supabase
        .from('anonymous_survey_responses')
        .select('*')
        .order('completed_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return {
        data: data as SurveyResponse[],
        total: count || 0
      };
    },
    keepPreviousData: true,
    staleTime: 30000
  });
}
