// Type definitions for anonymous survey analytics

export interface SurveyResponse {
  id: string;
  responses: Record<string, string>;
  coupon_code: string;
  completed_at: string;
  created_at: string;
}

export interface QuestionAnalytics {
  questionId: string;
  question: string;
  section: string;
  type: 'likert-4' | 'rating-horizontal' | 'multiple-choice' | 'nps' | 'text';
  totalResponses: number;
  distribution: Record<string, number>;
  percentages: Record<string, number>;
  averageScore?: number;
  mostCommonAnswer: string;
}

export interface SectionAnalytics {
  section: string;
  questionCount: number;
  averageScore?: number;
  completionRate: number;
  topInsights: string[];
}

export interface NPSMetrics {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  promotersPercentage: number;
  passivesPercentage: number;
  detractorsPercentage: number;
  totalResponses: number;
}

export interface DashboardMetrics {
  totalResponses: number;
  responsesToday: number;
  responsesThisWeek: number;
  responsesThisMonth: number;
  completionRate: number;
  averageTimeToComplete?: number;
  npsScore?: NPSMetrics;
}

export interface TimeSeriesData {
  date: string;
  responses: number;
  cumulativeResponses: number;
}

export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  fill?: string;
}

export interface LikertHeatmapData {
  question: string;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  average: number;
}

export interface PurchaseIntentFunnelData {
  stage: string;
  value: number;
  percentage: number;
  fill: string;
}

export interface CorrelationData {
  question1: string;
  question2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface ExportDataOptions {
  format: 'csv' | 'json' | 'pdf';
  includeRawData: boolean;
  includeAnalytics: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sections?: string[];
}

export interface FilterOptions {
  dateRange?: {
    from: Date;
    to: Date;
  };
  sections?: string[];
  questionIds?: number[];
  searchTerm?: string;
}
