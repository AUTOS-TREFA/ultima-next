// Comprehensive tracking analytics utilities

import {
  TrackingEvent,
  FinancingApplication,
  Profile,
  FunnelData,
  CampaignMetrics,
  ConversionMetrics,
  TimeSeriesMetrics,
  SourcePerformance,
  ForecastData,
  Recommendation,
  TrackingDashboardMetrics,
  FunnelStage
} from '@/types/tracking';
import { format, parseISO, startOfDay, subDays, differenceInDays, addDays } from 'date-fns';

/**
 * Calculate complete funnel data from tracking events
 * Uses sequential user tracking to ensure accurate, non-duplicated funnel
 *
 * Funnel sequence:
 * 1. ViewPage - User views /financiamientos landing page
 * 2. ConversionLandingPage - User registers via landing page form
 * 3. PersonalInformationComplete - User completes personal information
 * 4. ComienzaSolicitud - User starts application (reaches application page)
 * 5. LeadComplete - User submits application
 */
export function calculateFunnelData(
  events: TrackingEvent[],
  applications: FinancingApplication[]
): FunnelData[] {
  // Build user journey maps to track which users completed each stage
  const usersByStage = {
    viewedLanding: new Set<string>(),
    registered: new Set<string>(),
    completedProfile: new Set<string>(),
    startedApplication: new Set<string>(),
    submittedApplication: new Set<string>()
  };

  // Process all events and categorize users by stage
  events.forEach(event => {
    const userId = event.user_id || event.session_id;
    if (!userId) return;

    // Stage 1: Viewed landing page /financiamientos (check metadata.page, referrer, or event_name)
    if (event.event_type === 'PageView' && (
      event.metadata?.page?.includes('/financiamientos') ||
      event.referrer?.includes('/financiamientos') ||
      event.event_name?.includes('financiamientos')
    )) {
      usersByStage.viewedLanding.add(userId);
    }

    // Stage 2: Registered via ConversionLandingPage
    if (event.event_type === 'ConversionLandingPage') {
      usersByStage.registered.add(userId);
    }

    // Stage 3: Completed personal information
    if (event.event_type === 'PersonalInformationComplete') {
      usersByStage.completedProfile.add(userId);
    }

    // Stage 4: Started application (ComienzaSolicitud event)
    if (event.event_type === 'ComienzaSolicitud') {
      usersByStage.startedApplication.add(userId);
    }

    // Stage 5: Submitted application (LeadComplete)
    if (event.event_type === 'LeadComplete') {
      usersByStage.submittedApplication.add(userId);
    }
  });

  // Calculate sequential funnel: each stage must include only users who completed previous stages
  const stage1_viewed = usersByStage.viewedLanding;

  const stage2_registered = new Set(
    Array.from(usersByStage.registered).filter(u => stage1_viewed.has(u))
  );

  const stage3_profileComplete = new Set(
    Array.from(usersByStage.completedProfile).filter(u => stage2_registered.has(u))
  );

  const stage4_startedApp = new Set(
    Array.from(usersByStage.startedApplication).filter(u => stage3_profileComplete.has(u))
  );

  const stage5_submitted = new Set(
    Array.from(usersByStage.submittedApplication).filter(u => stage4_startedApp.has(u))
  );

  const stages = [
    { count: stage1_viewed.size, name: 'Visitas Landing Page', stage: 'landing_page_visit' },
    { count: stage2_registered.size, name: 'Registro Completado', stage: 'registration' },
    { count: stage3_profileComplete.size, name: 'Información Personal', stage: 'profile_complete' },
    { count: stage4_startedApp.size, name: 'Inició Solicitud', stage: 'application_started' },
    { count: stage5_submitted.size, name: 'Solicitud Enviada', stage: 'application_submitted' }
  ];

  return stages.map((stage, index) => {
    const previousCount = index > 0 ? stages[index - 1].count : stage.count;
    const conversionRate = previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
    const dropOffRate = 100 - conversionRate;
    const overallPercentage = stages[0].count > 0 ? (stage.count / stages[0].count) * 100 : 0;

    return {
      stage: stage.stage as FunnelStage,
      stageName: stage.name,
      count: stage.count,
      percentage: Math.round(overallPercentage * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dropOffRate: Math.round(dropOffRate * 10) / 10
    };
  });
}

/**
 * Calculate conversion metrics
 */
export function calculateConversionMetrics(funnelData: FunnelData[]): ConversionMetrics {
  const landing = funnelData.find(f => f.stage === 'landing_page_visit')?.count || 0;
  const registration = funnelData.find(f => f.stage === 'registration')?.count || 0;
  const profileComplete = funnelData.find(f => f.stage === 'profile_complete')?.count || 0;
  const applicationStarted = funnelData.find(f => f.stage === 'application_started')?.count || 0;
  const application = funnelData.find(f => f.stage === 'application_submitted')?.count || 0;

  return {
    totalVisits: landing,
    totalRegistrations: registration,
    totalProfileCompletes: profileComplete,
    totalBankProfilingCompletes: applicationStarted,
    totalApplications: application,
    visitToRegistrationRate: landing > 0 ? Math.round((registration / landing) * 1000) / 10 : 0,
    registrationToProfileRate: registration > 0 ? Math.round((profileComplete / registration) * 1000) / 10 : 0,
    profileToBankProfilingRate: profileComplete > 0 ? Math.round((applicationStarted / profileComplete) * 1000) / 10 : 0,
    bankProfilingToApplicationRate: applicationStarted > 0 ? Math.round((application / applicationStarted) * 1000) / 10 : 0,
    overallConversionRate: landing > 0 ? Math.round((application / landing) * 1000) / 10 : 0
  };
}

/**
 * Calculate campaign performance metrics
 * Uses unique user tracking to avoid duplication
 */
export function calculateCampaignMetrics(events: TrackingEvent[]): CampaignMetrics[] {
  const campaignMap = new Map<string, {
    campaign: string;
    source: string;
    medium: string;
    visits: Set<string>;
    registrations: Set<string>;
    profileCompletes: Set<string>;
    applications: Set<string>;
  }>();

  events.forEach(event => {
    const campaign = event.utm_campaign || 'organic';
    const source = event.utm_source || 'direct';
    const medium = event.utm_medium || 'none';
    const key = `${campaign}|${source}|${medium}`;
    const userId = event.user_id || event.session_id;

    if (!userId) return;

    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        campaign,
        source,
        medium,
        visits: new Set(),
        registrations: new Set(),
        profileCompletes: new Set(),
        applications: new Set()
      });
    }

    const metrics = campaignMap.get(key)!;

    // Track visits to landing page (check metadata.page, referrer, or event_name)
    if (event.event_type === 'PageView' && (
      event.metadata?.page?.includes('/financiamientos') ||
      event.referrer?.includes('/financiamientos') ||
      event.event_name?.includes('financiamientos')
    )) {
      metrics.visits.add(userId);
    }

    // Track registrations (ConversionLandingPage only)
    if (event.event_type === 'ConversionLandingPage') {
      metrics.registrations.add(userId);
    }

    // Track profile completes
    if (event.event_type === 'PersonalInformationComplete') {
      metrics.profileCompletes.add(userId);
    }

    // Track applications
    if (event.event_type === 'LeadComplete') {
      metrics.applications.add(userId);
    }
  });

  return Array.from(campaignMap.values()).map(metrics => ({
    campaign: metrics.campaign,
    source: metrics.source,
    medium: metrics.medium,
    visits: metrics.visits.size,
    registrations: metrics.registrations.size,
    profileCompletes: metrics.profileCompletes.size,
    applications: metrics.applications.size,
    conversionRate: metrics.visits.size > 0
      ? Math.round((metrics.applications.size / metrics.visits.size) * 1000) / 10
      : 0
  })).sort((a, b) => b.applications - a.applications);
}

/**
 * Calculate time series metrics
 * Uses unique user tracking per day
 */
export function calculateTimeSeriesMetrics(
  events: TrackingEvent[],
  days: number = 30
): TimeSeriesMetrics[] {
  const dateMap = new Map<string, {
    visits: Set<string>;
    registrations: Set<string>;
    profileCompletes: Set<string>;
    applications: Set<string>;
  }>();

  const now = new Date();
  const startDate = subDays(now, days);

  // Initialize all dates
  for (let i = 0; i <= days; i++) {
    const date = format(subDays(now, days - i), 'yyyy-MM-dd');
    dateMap.set(date, {
      visits: new Set(),
      registrations: new Set(),
      profileCompletes: new Set(),
      applications: new Set()
    });
  }

  // Process events
  events.forEach(event => {
    const eventDate = format(parseISO(event.created_at), 'yyyy-MM-dd');
    const metrics = dateMap.get(eventDate);
    if (!metrics) return;

    const userId = event.user_id || event.session_id;
    if (!userId) return;

    // Track landing page visits (check metadata.page, referrer, or event_name)
    if (event.event_type === 'PageView' && (
      event.metadata?.page?.includes('/financiamientos') ||
      event.referrer?.includes('/financiamientos') ||
      event.event_name?.includes('financiamientos')
    )) {
      metrics.visits.add(userId);
    }
    // Track registrations (ConversionLandingPage only)
    if (event.event_type === 'ConversionLandingPage') {
      metrics.registrations.add(userId);
    }
    // Track profile completes
    if (event.event_type === 'PersonalInformationComplete') {
      metrics.profileCompletes.add(userId);
    }
    // Track applications
    if (event.event_type === 'LeadComplete') {
      metrics.applications.add(userId);
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, metrics]) => ({
      date: format(parseISO(date), 'MMM dd'),
      visits: metrics.visits.size,
      registrations: metrics.registrations.size,
      profileCompletes: metrics.profileCompletes.size,
      applications: metrics.applications.size,
      conversionRate: metrics.visits.size > 0
        ? Math.round((metrics.applications.size / metrics.visits.size) * 1000) / 10
        : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate source performance
 */
export function calculateSourcePerformance(events: TrackingEvent[]): SourcePerformance[] {
  const sourceMap = new Map<string, {
    source: string;
    medium: string;
    sessions: Map<string, { firstSeen: Date; converted: boolean }>;
  }>();

  events.forEach(event => {
    const source = event.utm_source || 'direct';
    const medium = event.utm_medium || 'none';
    const key = `${source}|${medium}`;
    const sessionId = event.session_id || '';
    const timestamp = parseISO(event.created_at);

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        source,
        medium,
        sessions: new Map()
      });
    }

    const sourceData = sourceMap.get(key)!;

    if (!sourceData.sessions.has(sessionId)) {
      sourceData.sessions.set(sessionId, {
        firstSeen: timestamp,
        converted: false
      });
    }

    // Mark as converted if LeadComplete
    if (event.event_type === 'LeadComplete') {
      const session = sourceData.sessions.get(sessionId)!;
      session.converted = true;
    }
  });

  return Array.from(sourceMap.values()).map(sourceData => {
    const sessions = Array.from(sourceData.sessions.values());
    const conversions = sessions.filter(s => s.converted);
    const avgTimeToConvert = conversions.length > 0
      ? conversions.reduce((sum, s) => sum + differenceInDays(new Date(), s.firstSeen), 0) / conversions.length
      : undefined;

    return {
      source: sourceData.source,
      medium: sourceData.medium,
      visits: sessions.length,
      conversions: conversions.length,
      conversionRate: sessions.length > 0
        ? Math.round((conversions.length / sessions.length) * 1000) / 10
        : 0,
      averageTimeToConvert: avgTimeToConvert ? Math.round(avgTimeToConvert * 10) / 10 : undefined
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);
}

/**
 * Generate forecast data using simple linear regression
 */
export function generateForecast(
  timeSeriesData: TimeSeriesMetrics[],
  daysToForecast: number = 7
): ForecastData[] {
  if (timeSeriesData.length < 7) {
    return []; // Need at least 7 days of data for meaningful forecast
  }

  // Calculate linear regression for visits and conversions
  const visitsTrend = calculateLinearRegression(timeSeriesData.map(d => d.visits));
  const conversionsTrend = calculateLinearRegression(timeSeriesData.map(d => d.applications));

  // Use current date as base for forecast (safer than parsing formatted date strings)
  const now = new Date();
  const forecastData: ForecastData[] = [];

  for (let i = 1; i <= daysToForecast; i++) {
    const futureDate = addDays(now, i);
    const index = timeSeriesData.length + i;

    forecastData.push({
      date: format(futureDate, 'MMM dd'),
      predictedVisits: Math.max(0, Math.round(visitsTrend.slope * index + visitsTrend.intercept)),
      predictedConversions: Math.max(0, Math.round(conversionsTrend.slope * index + conversionsTrend.intercept)),
      confidence: Math.max(50, 95 - i * 5) // Confidence decreases with time
    });
  }

  return forecastData;
}

/**
 * Simple linear regression helper
 */
function calculateLinearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, y) => sum + y, 0);
  const sumXY = data.reduce((sum, y, i) => sum + i * y, 0);
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Generate intelligent recommendations based on data
 */
export function generateRecommendations(
  metrics: ConversionMetrics,
  campaignMetrics: CampaignMetrics[],
  funnelData: FunnelData[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check overall conversion rate
  if (metrics.overallConversionRate < 2) {
    recommendations.push({
      id: 'low-conversion',
      type: 'optimization',
      priority: 'high',
      title: 'Tasa de conversión baja detectada',
      description: `La tasa de conversión general es ${metrics.overallConversionRate}%, por debajo del objetivo de 2-5%.`,
      impact: 'Optimizar puede duplicar las conversiones',
      action: 'Revisar landing page, simplificar formularios, mejorar propuesta de valor',
      metric: 'overallConversionRate',
      currentValue: metrics.overallConversionRate,
      potentialValue: 4.0
    });
  }

  // Check visit to registration drop-off
  if (metrics.visitToRegistrationRate < 15) {
    recommendations.push({
      id: 'visit-registration-dropoff',
      type: 'optimization',
      priority: 'high',
      title: 'Alta pérdida entre visita y registro',
      description: `Solo ${metrics.visitToRegistrationRate}% de visitantes se registran.`,
      impact: 'Potencial de +${(20 - metrics.visitToRegistrationRate).toFixed(1)}% más registros',
      action: 'Optimizar CTA, reducir fricciones en formulario, agregar prueba social',
      metric: 'visitToRegistrationRate',
      currentValue: metrics.visitToRegistrationRate,
      potentialValue: 20
    });
  }

  // Check profile completion rate
  if (metrics.registrationToProfileRate < 60) {
    recommendations.push({
      id: 'profile-completion-low',
      type: 'optimization',
      priority: 'medium',
      title: 'Baja tasa de completado de perfil',
      description: `Solo ${metrics.registrationToProfileRate}% de registrados completan su perfil.`,
      impact: 'Mejorar puede incrementar conversiones en 30%',
      action: 'Simplificar formulario de perfil, agregar indicador de progreso, enviar recordatorios',
      metric: 'registrationToProfileRate',
      currentValue: metrics.registrationToProfileRate,
      potentialValue: 75
    });
  }

  // Identify top performing campaigns
  const topCampaigns = campaignMetrics.slice(0, 3);
  if (topCampaigns.length > 0 && topCampaigns[0].conversionRate > 5) {
    recommendations.push({
      id: 'scale-top-campaign',
      type: 'budget',
      priority: 'high',
      title: `Escalar campaña "${topCampaigns[0].campaign}"`,
      description: `Esta campaña tiene una tasa de conversión de ${topCampaigns[0].conversionRate}%, superior al promedio.`,
      impact: `Incrementar presupuesto puede generar ${Math.round(topCampaigns[0].applications * 0.5)} conversiones adicionales`,
      action: 'Aumentar presupuesto en 50%, duplicar audiencias similares',
      metric: 'campaignConversionRate'
    });
  }

  // Identify underperforming campaigns
  const underperforming = campaignMetrics.filter(c =>
    c.visits > 20 && c.conversionRate < 1
  );
  if (underperforming.length > 0) {
    recommendations.push({
      id: 'pause-underperforming',
      type: 'budget',
      priority: 'medium',
      title: 'Pausar campañas de bajo rendimiento',
      description: `${underperforming.length} campañas tienen tasa de conversión < 1%.`,
      impact: 'Reasignar presupuesto puede mejorar ROI en 25%',
      action: `Pausar campañas: ${underperforming.slice(0, 2).map(c => c.campaign).join(', ')}`,
      metric: 'budgetEfficiency'
    });
  }

  // Check for drop-off at specific funnel stages
  const biggestDropOff = funnelData.reduce((max, stage) =>
    stage.dropOffRate > (max?.dropOffRate || 0) ? stage : max
  , funnelData[0]);

  if (biggestDropOff && biggestDropOff.dropOffRate > 50) {
    recommendations.push({
      id: 'funnel-bottleneck',
      type: 'alert',
      priority: 'high',
      title: `Cuello de botella en: ${biggestDropOff.stageName}`,
      description: `${biggestDropOff.dropOffRate.toFixed(1)}% de usuarios se pierden en esta etapa.`,
      impact: 'Reducir drop-off a 30% puede duplicar conversiones',
      action: 'Analizar UX, simplificar paso, agregar incentivos para completar',
      metric: 'funnelDropOff',
      currentValue: biggestDropOff.dropOffRate,
      potentialValue: 30
    });
  }

  return recommendations;
}

/**
 * Calculate all dashboard metrics
 */
export function calculateTrackingDashboardMetrics(
  events: TrackingEvent[],
  applications: FinancingApplication[]
): TrackingDashboardMetrics {
  const funnelData = calculateFunnelData(events, applications);
  const conversionMetrics = calculateConversionMetrics(funnelData);
  const campaignMetrics = calculateCampaignMetrics(events);
  const timeSeriesMetrics = calculateTimeSeriesMetrics(events, 30);
  const sourcePerformance = calculateSourcePerformance(events);
  const forecast = generateForecast(timeSeriesMetrics, 7);
  const recommendations = generateRecommendations(conversionMetrics, campaignMetrics, funnelData);

  return {
    conversionMetrics,
    funnelData,
    campaignMetrics,
    timeSeriesMetrics,
    sourcePerformance,
    forecast,
    recommendations,
    topPerformingCampaigns: campaignMetrics.slice(0, 5),
    underperformingCampaigns: campaignMetrics.filter(c => c.visits > 20 && c.conversionRate < 1)
  };
}
