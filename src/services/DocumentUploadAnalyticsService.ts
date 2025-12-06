import { supabase } from '../../supabaseClient';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface DocumentUploadMetrics {
  totalApplicationsWithTokens: number;
  applicationsWithActivity: number;
  completeApplications: number;
  incompleteApplications: number;
  averageDocumentsPerApplication: number;
  completionRate: number;
  activityRate: number;
  recentApplications: ApplicationDocumentStatus[];
  documentTypeStats: DocumentTypeStats[];
  documentsUploadedOverTime: TimeSeriesData[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ApplicationDocumentStatus {
  id: string;
  user_id: string;
  public_upload_token: string | null;
  created_at: string;
  status: string;
  user_email: string | null;
  user_name: string | null;
  car_info: any;
  total_documents: number;
  documents_uploaded: DocumentCount[];
  completion_percentage: number;
  is_complete: boolean;
  last_upload_at: string | null;
}

interface DocumentCount {
  document_type: string;
  count: number;
}

interface DocumentTypeStats {
  document_type: string;
  total_uploaded: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

// Document types as stored in the database (both standardized and legacy formats)
const DOCUMENT_TYPE_MAPPINGS: Record<string, string[]> = {
  'ine_front': ['INE Front', 'ine_front'],
  'ine_back': ['INE Back', 'ine_back'],
  'proof_address': ['Comprobante Domicilio', 'proof_address'],
  'proof_income': ['Comprobante Ingresos', 'proof_income'],
  'constancia_fiscal': ['Constancia Fiscal', 'constancia_fiscal']
};

// Only require 4 documents for completion (not constancia_fiscal)
const REQUIRED_FOR_COMPLETION = ['ine_front', 'ine_back', 'proof_address', 'proof_income'];
const MIN_DOCS_FOR_COMPLETE = 4;

export const DocumentUploadAnalyticsService = {
  async getMetrics(
    pagination: PaginationParams = { page: 1, pageSize: 25 },
    dateRange?: { start: Date; end: Date }
  ): Promise<DocumentUploadMetrics> {
    try {
      const { page, pageSize } = pagination;
      const offset = (page - 1) * pageSize;

      // Get GLOBAL metrics using SQL for accurate counts across ALL applications
      const { data: globalMetrics, error: globalError } = await supabase.rpc('get_document_upload_global_metrics');

      let totalApplicationsWithTokens = 0;
      let globalAppsWithActivity = 0;
      let globalCompleteApps = 0;
      let globalTotalDocs = 0;

      if (globalError) {
        console.warn('Could not get global metrics via RPC, falling back to count:', globalError);
        // Fallback to simple count
        const { count: totalCount } = await supabase
          .from('financing_applications')
          .select('id', { count: 'exact', head: true })
          .not('public_upload_token', 'is', null);
        totalApplicationsWithTokens = totalCount || 0;
      } else if (globalMetrics && globalMetrics.length > 0) {
        totalApplicationsWithTokens = globalMetrics[0].total_apps_with_tokens || 0;
        globalAppsWithActivity = globalMetrics[0].apps_with_activity || 0;
        globalCompleteApps = globalMetrics[0].apps_complete || 0;
        globalTotalDocs = globalMetrics[0].total_documents || 0;
      }

      if (totalApplicationsWithTokens === 0) {
        return this.getEmptyMetrics(pagination);
      }

      // Get paginated applications with tokens
      const { data: applications, error: appsError } = await supabase
        .from('financing_applications')
        .select('id, user_id, public_upload_token, created_at, status, car_info')
        .not('public_upload_token', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        throw appsError;
      }

      if (!applications || applications.length === 0) {
        return this.getEmptyMetrics(pagination);
      }

      // Get user profiles separately to avoid FK relationship issues
      // Batch the requests if there are many user IDs to avoid "Bad Request" errors
      const userIds = Array.from(new Set(applications.map(app => app.user_id).filter(Boolean)));
      const profilesMap = new Map<string, any>();

      if (userIds.length > 0) {
        // Chunk IDs into batches of 50 to avoid query limits
        const BATCH_SIZE = 50;
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
          const batchIds = userIds.slice(i, i + BATCH_SIZE);
          const { data: batchProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .in('id', batchIds);

          if (profilesError) {
            console.warn('Could not fetch profiles batch:', profilesError);
          } else if (batchProfiles) {
            batchProfiles.forEach(p => profilesMap.set(p.id, p));
          }
        }
      }

      // Get all uploaded documents for these applications
      // Also batch this query to avoid limits
      const applicationIds = applications.map(app => app.id).filter(Boolean);
      let documents: any[] = [];

      if (applicationIds.length > 0) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < applicationIds.length; i += BATCH_SIZE) {
          const batchIds = applicationIds.slice(i, i + BATCH_SIZE);
          const { data: batchDocs, error: docsError } = await supabase
            .from('uploaded_documents')
            .select('*')
            .in('application_id', batchIds);

          if (docsError) {
            console.warn('Could not fetch documents batch:', docsError);
          } else if (batchDocs) {
            documents = [...documents, ...batchDocs];
          }
        }
      }

      // Helper function to check if a document matches a type (handles both formats)
      const matchesDocType = (docType: string, typeKey: string): boolean => {
        const mappings = DOCUMENT_TYPE_MAPPINGS[typeKey];
        if (!mappings) return false;
        return mappings.some(m => m.toLowerCase() === docType.toLowerCase());
      };

      // Calculate metrics
      const applicationDocumentStatus: ApplicationDocumentStatus[] = applications.map(app => {
        const appDocs = documents.filter(doc => doc.application_id === app.id);

        // Count documents by type (checking both old and new format names)
        const docCounts: Record<string, number> = {};
        Object.keys(DOCUMENT_TYPE_MAPPINGS).forEach(typeKey => {
          docCounts[typeKey] = appDocs.filter(d => matchesDocType(d.document_type || '', typeKey)).length;
        });

        const documents_uploaded = Object.entries(docCounts).map(([document_type, count]) => ({
          document_type,
          count
        }));

        const total_documents = appDocs.length;
        // Check only the 4 required documents for completion
        const requiredDocsUploaded = REQUIRED_FOR_COMPLETION.filter(type => docCounts[type] > 0).length;
        const completion_percentage = (requiredDocsUploaded / REQUIRED_FOR_COMPLETION.length) * 100;
        // Complete when 4 or more unique document types are uploaded
        const is_complete = requiredDocsUploaded >= MIN_DOCS_FOR_COMPLETE || total_documents >= MIN_DOCS_FOR_COMPLETE;

        const lastUpload = appDocs.length > 0
          ? appDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        // Get profile from map instead of join
        const profile = profilesMap.get(app.user_id);
        const user_name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null;

        return {
          id: app.id,
          user_id: app.user_id,
          public_upload_token: app.public_upload_token,
          created_at: app.created_at,
          status: app.status,
          user_email: profile?.email || null,
          user_name,
          car_info: app.car_info,
          total_documents,
          documents_uploaded,
          completion_percentage: Math.round(completion_percentage),
          is_complete,
          last_upload_at: lastUpload
        };
      });

      // Use GLOBAL metrics from database, not paginated results
      const applicationsWithActivity = globalAppsWithActivity;
      const completeApplications = globalCompleteApps;
      const incompleteApplications = totalApplicationsWithTokens - completeApplications;

      // Use global document count for average calculation
      const totalDocumentsGlobal = globalTotalDocs || documents.length;
      const averageDocumentsPerApplication = totalApplicationsWithTokens > 0
        ? totalDocumentsGlobal / totalApplicationsWithTokens
        : 0;

      const completionRate = totalApplicationsWithTokens > 0
        ? (completeApplications / totalApplicationsWithTokens) * 100
        : 0;

      const activityRate = totalApplicationsWithTokens > 0
        ? (applicationsWithActivity / totalApplicationsWithTokens) * 100
        : 0;

      // Get GLOBAL document type statistics from database
      let documentTypeStats: DocumentTypeStats[] = [];
      const { data: globalTypeStats, error: typeStatsError } = await supabase.rpc('get_document_type_stats');

      if (typeStatsError) {
        console.warn('Could not get global type stats:', typeStatsError);
        // Fallback to local calculation
        const documentTypeCounts: Record<string, number> = {};
        Object.keys(DOCUMENT_TYPE_MAPPINGS).forEach(typeKey => {
          documentTypeCounts[typeKey] = documents.filter(d => matchesDocType(d.document_type || '', typeKey)).length;
        });
        documentTypeStats = Object.entries(documentTypeCounts).map(([document_type, total_uploaded]) => ({
          document_type,
          total_uploaded,
          percentage: totalDocumentsGlobal > 0 ? (total_uploaded / totalDocumentsGlobal) * 100 : 0
        }));
      } else if (globalTypeStats) {
        // Map database types to our standard keys
        const typeMapping: Record<string, string> = {
          'INE Front': 'ine_front',
          'INE Back': 'ine_back',
          'Comprobante Domicilio': 'proof_address',
          'Comprobante Ingresos': 'proof_income',
          'Constancia Fiscal': 'constancia_fiscal',
          'ine_front': 'ine_front',
          'ine_back': 'ine_back',
          'proof_address': 'proof_address',
          'proof_income': 'proof_income',
          'constancia_fiscal': 'constancia_fiscal'
        };

        // Aggregate by standard type
        const aggregatedCounts: Record<string, number> = {};
        globalTypeStats.forEach((stat: any) => {
          const standardType = typeMapping[stat.document_type] || stat.document_type;
          aggregatedCounts[standardType] = (aggregatedCounts[standardType] || 0) + (stat.total_uploaded || 0);
        });

        documentTypeStats = Object.entries(aggregatedCounts).map(([document_type, total_uploaded]) => ({
          document_type,
          total_uploaded,
          percentage: totalDocumentsGlobal > 0 ? (total_uploaded / totalDocumentsGlobal) * 100 : 0
        }));
      }

      // Get GLOBAL time series data from database
      let documentsUploadedOverTime: TimeSeriesData[] = [];
      const { data: globalTimeSeries, error: timeSeriesError } = await supabase.rpc('get_documents_time_series');

      if (timeSeriesError) {
        console.warn('Could not get global time series:', timeSeriesError);
        documentsUploadedOverTime = this.getTimeSeriesData(documents);
      } else if (globalTimeSeries) {
        // Fill in missing dates with 0 for last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dateMap = new Map<string, number>();
        globalTimeSeries.forEach((item: any) => {
          const dateStr = new Date(item.upload_date).toISOString().split('T')[0];
          dateMap.set(dateStr, item.doc_count || 0);
        });

        const currentDate = new Date(thirtyDaysAgo);
        while (currentDate <= today) {
          const dateStr = currentDate.toISOString().split('T')[0];
          documentsUploadedOverTime.push({
            date: dateStr,
            count: dateMap.get(dateStr) || 0
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Sort applications by most recent activity
      const recentApplications = applicationDocumentStatus.sort((a, b) => {
        const aTime = a.last_upload_at ? new Date(a.last_upload_at).getTime() : new Date(a.created_at).getTime();
        const bTime = b.last_upload_at ? new Date(b.last_upload_at).getTime() : new Date(b.created_at).getTime();
        return bTime - aTime;
      });

      const totalPages = Math.ceil(totalApplicationsWithTokens / pageSize);

      return {
        totalApplicationsWithTokens,
        applicationsWithActivity,
        completeApplications,
        incompleteApplications,
        averageDocumentsPerApplication,
        completionRate,
        activityRate,
        recentApplications,
        documentTypeStats,
        documentsUploadedOverTime,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalCount: totalApplicationsWithTokens
        }
      };
    } catch (error) {
      console.error('Error getting document upload metrics:', error);
      throw error;
    }
  },

  getTimeSeriesData(documents: any[]): TimeSeriesData[] {
    const dateCounts: Record<string, number> = {};

    documents.forEach(doc => {
      const date = new Date(doc.created_at).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const timeSeries = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill in missing dates with 0 if needed (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filledTimeSeries: TimeSeriesData[] = [];
    const currentDate = new Date(thirtyDaysAgo);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = timeSeries.find(d => d.date === dateStr);
      filledTimeSeries.push({
        date: dateStr,
        count: existingData?.count || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledTimeSeries;
  },

  getEmptyMetrics(pagination: PaginationParams = { page: 1, pageSize: 25 }): DocumentUploadMetrics {
    return {
      totalApplicationsWithTokens: 0,
      applicationsWithActivity: 0,
      completeApplications: 0,
      incompleteApplications: 0,
      averageDocumentsPerApplication: 0,
      completionRate: 0,
      activityRate: 0,
      recentApplications: [],
      documentTypeStats: [],
      documentsUploadedOverTime: [],
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalCount: 0
      }
    };
  }
};
