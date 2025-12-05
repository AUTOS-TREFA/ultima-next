// Analytics calculation utilities for survey data

import {
  SurveyResponse,
  QuestionAnalytics,
  NPSMetrics,
  DashboardMetrics,
  TimeSeriesData,
  LikertHeatmapData,
  SectionAnalytics
} from '../types/survey';
import { SURVEY_QUESTIONS, SURVEY_SECTIONS, getQuestionById, getLabelForValue } from './surveyQuestions';
import { format, parseISO, startOfDay, subDays, subWeeks, subMonths, isAfter, isBefore } from 'date-fns';

/**
 * Calculate NPS (Net Promoter Score) from responses
 * NPS Question ID is 'nps'
 */
export function calculateNPS(responses: SurveyResponse[]): NPSMetrics {
  const npsResponses = responses
    .map(r => r.responses['nps'])
    .filter(Boolean)
    .map(Number);

  if (npsResponses.length === 0) {
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promotersPercentage: 0,
      passivesPercentage: 0,
      detractorsPercentage: 0,
      totalResponses: 0
    };
  }

  const promoters = npsResponses.filter(score => score >= 9).length;
  const passives = npsResponses.filter(score => score >= 7 && score <= 8).length;
  const detractors = npsResponses.filter(score => score <= 6).length;
  const total = npsResponses.length;

  const promotersPercentage = (promoters / total) * 100;
  const detractorsPercentage = (detractors / total) * 100;
  const passivesPercentage = (passives / total) * 100;

  return {
    score: Math.round(promotersPercentage - detractorsPercentage),
    promoters,
    passives,
    detractors,
    promotersPercentage: Math.round(promotersPercentage),
    passivesPercentage: Math.round(passivesPercentage),
    detractorsPercentage: Math.round(detractorsPercentage),
    totalResponses: total
  };
}

/**
 * Calculate dashboard overview metrics
 */
export function calculateDashboardMetrics(responses: SurveyResponse[]): DashboardMetrics {
  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = subWeeks(now, 1);
  const monthAgo = subMonths(now, 1);

  const totalResponses = responses.length;
  const responsesToday = responses.filter(r =>
    isAfter(parseISO(r.completed_at), today)
  ).length;
  const responsesThisWeek = responses.filter(r =>
    isAfter(parseISO(r.completed_at), weekAgo)
  ).length;
  const responsesThisMonth = responses.filter(r =>
    isAfter(parseISO(r.completed_at), monthAgo)
  ).length;

  // Calculate NPS
  const npsScore = calculateNPS(responses);

  // Completion rate (all responses are complete in this system)
  const completionRate = 100;

  return {
    totalResponses,
    responsesToday,
    responsesThisWeek,
    responsesThisMonth,
    completionRate,
    npsScore
  };
}

/**
 * Calculate analytics for a specific question
 */
export function calculateQuestionAnalytics(
  questionId: string,
  responses: SurveyResponse[]
): QuestionAnalytics | null {
  const question = getQuestionById(questionId);
  if (!question) return null;

  const answers = responses
    .map(r => r.responses[questionId])
    .filter(Boolean);

  if (answers.length === 0) {
    return {
      questionId,
      question: question.question,
      section: question.section,
      type: question.type,
      totalResponses: 0,
      distribution: {},
      percentages: {},
      mostCommonAnswer: ''
    };
  }

  // Calculate distribution
  const distribution: Record<string, number> = {};
  answers.forEach(answer => {
    distribution[answer] = (distribution[answer] || 0) + 1;
  });

  // Calculate percentages
  const percentages: Record<string, number> = {};
  Object.keys(distribution).forEach(key => {
    percentages[key] = Math.round((distribution[key] / answers.length) * 100);
  });

  // Find most common answer
  const mostCommonAnswer = Object.keys(distribution).reduce((a, b) =>
    distribution[a] > distribution[b] ? a : b
  );

  // Calculate average score for numeric questions
  let averageScore: number | undefined;
  if (question.type === 'likert-4' || question.type === 'nps' || question.type === 'rating-horizontal') {
    const numericAnswers = answers.map(Number).filter(n => !isNaN(n));
    if (numericAnswers.length > 0) {
      averageScore = Math.round(
        (numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length) * 10
      ) / 10;
    }
  }

  return {
    questionId,
    question: question.question,
    section: question.section,
    type: question.type,
    totalResponses: answers.length,
    distribution,
    percentages,
    averageScore,
    mostCommonAnswer: getLabelForValue(questionId, mostCommonAnswer)
  };
}

/**
 * Calculate analytics for all questions
 */
export function calculateAllQuestionsAnalytics(
  responses: SurveyResponse[]
): QuestionAnalytics[] {
  return SURVEY_QUESTIONS.map(q =>
    calculateQuestionAnalytics(q.id, responses)
  ).filter(Boolean) as QuestionAnalytics[];
}

/**
 * Calculate section-level analytics
 */
export function calculateSectionAnalytics(
  section: string,
  responses: SurveyResponse[]
): SectionAnalytics {
  const sectionQuestions = SURVEY_QUESTIONS.filter(q => q.section === section);
  const questionAnalytics = sectionQuestions.map(q =>
    calculateQuestionAnalytics(q.id, responses)
  ).filter(Boolean) as QuestionAnalytics[];

  // Calculate average score for the section
  const scoresQuestions = questionAnalytics.filter(q => q.averageScore !== undefined);
  const averageScore = scoresQuestions.length > 0
    ? Math.round(
        (scoresQuestions.reduce((sum, q) => sum + (q.averageScore || 0), 0) / scoresQuestions.length) * 10
      ) / 10
    : undefined;

  // Get top insights (most common answers)
  const topInsights = questionAnalytics
    .slice(0, 3)
    .map(q => q.mostCommonAnswer)
    .filter(Boolean);

  return {
    section,
    questionCount: sectionQuestions.length,
    averageScore,
    completionRate: 100, // All sections are complete
    topInsights
  };
}

/**
 * Calculate time series data for response trends
 */
export function calculateTimeSeriesData(
  responses: SurveyResponse[],
  days: number = 30
): TimeSeriesData[] {
  const sortedResponses = [...responses].sort((a, b) =>
    new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const dateMap: Record<string, number> = {};
  const now = new Date();
  const startDate = subDays(now, days);

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = subDays(now, days - i);
    dateMap[format(date, 'yyyy-MM-dd')] = 0;
  }

  // Count responses per day
  sortedResponses.forEach(response => {
    const responseDate = parseISO(response.completed_at);
    if (isAfter(responseDate, startDate)) {
      const dateKey = format(responseDate, 'yyyy-MM-dd');
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    }
  });

  // Convert to array and calculate cumulative
  let cumulative = 0;
  return Object.keys(dateMap)
    .sort()
    .map(date => {
      cumulative += dateMap[date];
      return {
        date: format(parseISO(date), 'MMM dd'),
        responses: dateMap[date],
        cumulativeResponses: cumulative
      };
    });
}

/**
 * Calculate Likert scale heatmap data
 */
export function calculateLikertHeatmap(
  responses: SurveyResponse[]
): LikertHeatmapData[] {
  const likertQuestions = SURVEY_QUESTIONS.filter(q =>
    q.type === 'likert-4' || q.type === 'rating-horizontal'
  );

  return likertQuestions.map(question => {
    const analytics = calculateQuestionAnalytics(question.id, responses);
    if (!analytics) {
      return {
        question: question.question.substring(0, 50) + '...',
        score1: 0,
        score2: 0,
        score3: 0,
        score4: 0,
        score5: 0,
        average: 0
      };
    }

    return {
      question: question.question.substring(0, 50) + '...',
      score1: analytics.percentages['1'] || 0,
      score2: analytics.percentages['2'] || 0,
      score3: analytics.percentages['3'] || 0,
      score4: analytics.percentages['4'] || 0,
      score5: analytics.percentages['5'] || 0,
      average: analytics.averageScore || 0
    };
  });
}

/**
 * Filter responses by date range
 */
export function filterResponsesByDateRange(
  responses: SurveyResponse[],
  from?: Date,
  to?: Date
): SurveyResponse[] {
  return responses.filter(response => {
    const responseDate = parseISO(response.completed_at);
    if (from && isBefore(responseDate, from)) return false;
    if (to && isAfter(responseDate, to)) return false;
    return true;
  });
}

/**
 * Export data to CSV format
 */
export function exportToCSV(responses: SurveyResponse[]): string {
  if (responses.length === 0) return '';

  // Header row
  const headers = ['ID', 'Coupon Code', 'Completed At', ...SURVEY_QUESTIONS.map(q =>
    `Q${q.id}: ${q.question.substring(0, 50)}`
  )];

  const csvRows = [headers.join(',')];

  // Data rows
  responses.forEach(response => {
    const row = [
      response.id,
      response.coupon_code,
      response.completed_at,
      ...SURVEY_QUESTIONS.map(q => {
        const answer = response.responses[q.id] || '';
        const label = getLabelForValue(q.id, answer);
        return `"${label.replace(/"/g, '""')}"`;
      })
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Export analytics to JSON format
 */
export function exportAnalyticsToJSON(responses: SurveyResponse[]): string {
  const metrics = calculateDashboardMetrics(responses);
  const questionAnalytics = calculateAllQuestionsAnalytics(responses);
  const sectionAnalytics = SURVEY_SECTIONS.map(section =>
    calculateSectionAnalytics(section, responses)
  );

  const exportData = {
    generatedAt: new Date().toISOString(),
    metrics,
    questionAnalytics,
    sectionAnalytics,
    rawResponses: responses
  };

  return JSON.stringify(exportData, null, 2);
}
