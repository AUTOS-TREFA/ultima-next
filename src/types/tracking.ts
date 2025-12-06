// Unified tracking and analytics type definitions

export interface TrackingEvent {
  id: string;
  event_name: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  page_url?: string;
  referrer?: string;
  created_at: string;
}

export interface FinancingApplication {
  id: string;
  user_id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';
  car_info?: any;
  personal_info_snapshot?: any;
  application_data?: any;
  selected_banks?: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  created_at: string;
  updated_at?: string;
  role?: string;
}

// Funnel Stage Definitions
export type FunnelStage =
  | 'landing_page_visit'
  | 'registration'
  | 'profile_complete'
  | 'application_started'
  | 'application_submitted';

export interface FunnelData {
  stage: FunnelStage;
  stageName: string;
  count: number;
  percentage: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface CampaignMetrics {
  campaign: string;
  source: string;
  medium: string;
  visits: number;
  registrations: number;
  profileCompletes: number;
  applications: number;
  conversionRate: number;
  cost?: number;
  cpa?: number; // Cost per acquisition
  roi?: number;
}

export interface ConversionMetrics {
  totalVisits: number;
  totalRegistrations: number;
  totalProfileCompletes: number;
  totalBankProfilingCompletes: number;
  totalApplications: number;
  visitToRegistrationRate: number;
  registrationToProfileRate: number;
  profileToBankProfilingRate: number;
  bankProfilingToApplicationRate: number;
  overallConversionRate: number;
}

export interface TimeSeriesMetrics {
  date: string;
  visits: number;
  registrations: number;
  profileCompletes: number;
  applications: number;
  conversionRate: number;
}

export interface SourcePerformance {
  source: string;
  medium: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  averageTimeToConvert?: number; // in days
}

export interface ForecastData {
  date: string;
  actualVisits?: number;
  predictedVisits: number;
  actualConversions?: number;
  predictedConversions: number;
  confidence: number; // 0-100
}

export interface Recommendation {
  id: string;
  type: 'campaign' | 'budget' | 'optimization' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  metric?: string;
  currentValue?: number;
  potentialValue?: number;
}

export interface TrackingDashboardMetrics {
  conversionMetrics: ConversionMetrics;
  funnelData: FunnelData[];
  campaignMetrics: CampaignMetrics[];
  timeSeriesMetrics: TimeSeriesMetrics[];
  sourcePerformance: SourcePerformance[];
  forecast: ForecastData[];
  recommendations: Recommendation[];
  topPerformingCampaigns: CampaignMetrics[];
  underperformingCampaigns: CampaignMetrics[];
}

export interface EventTypeDistribution {
  eventType: string;
  count: number;
  percentage: number;
}

export interface PagePerformance {
  page: string;
  visits: number;
  averageTimeOnPage?: number;
  bounceRate?: number;
  conversionRate?: number;
}

export interface UserJourneyStep {
  step: number;
  eventType: string;
  timestamp: string;
  page?: string;
  timeSincePrevious?: number; // in seconds
}

export interface UserJourney {
  userId: string;
  sessionId: string;
  steps: UserJourneyStep[];
  totalDuration: number; // in seconds
  completed: boolean;
  droppedAtStage?: FunnelStage;
}

export interface CohortAnalysis {
  cohort: string; // e.g., "2024-W45" for week cohorts
  totalUsers: number;
  registrations: number;
  profileCompletes: number;
  applications: number;
  retentionDay7?: number;
  retentionDay30?: number;
}

export interface ABTestResult {
  variant: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  winner: boolean;
}
