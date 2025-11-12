import { supabase } from '../../supabaseClient';

export interface DashboardMetrics {
    // Application Metrics
    totalApplications: number;
    pendingApplications: number;
    processedApplications: number;
    approvedApplications: number;
    completedLast24Hours: number; // NEW: Applications approved or completed in last 24 hours
    submittedWithDocuments: number; // Applications with status 'submitted' that have documents
    submittedWithoutDocuments: number; // Applications with status 'submitted' without documents

    // Website Lead Metrics (from profiles - users who registered on website)
    websiteLeads: {
        total: number;
        contacted: number;
        uncontacted: number;
    };

    // Kommo CRM Lead Metrics (from kommo_leads table)
    kommoLeads: {
        total: number;
        active: number; // not deleted
        deleted: number;
    };

    // Legacy fields (for backward compatibility - will show website leads)
    totalLeads: number;
    contactedLeads: number;
    uncontactedLeads: number;

    // Source Attribution (for website leads)
    sourceBreakdown: {
        facebook: number;
        google: number;
        bot: number;
        other: number;
        direct: number;
    };

    // Performance Metrics
    conversionRate: number;
    approvalRate: number;

    // Recent Activity
    recentApplications: any[];
    recentLeads: any[];
    recentKommoLeads: any[]; // NEW: Recent Kommo leads

    // To-dos and Actions
    pendingReminders: number;
    tasksToday: number;
}

export interface TrendComparisons {
    leadsChange: number;
    leadsChangePercent: number;
    applicationsChange: number;
    applicationsChangePercent: number;
    conversionChange: number;
    conversionChangePercent: number;
    approvalChange: number;
    approvalChangePercent: number;
}

export interface DashboardFilters {
    startDate?: Date;
    endDate?: Date;
    source?: 'all' | 'facebook' | 'google' | 'bot' | 'direct' | 'other';
    status?: 'all' | 'pending' | 'contacted' | 'uncontacted' | 'approved';
}

export class AnalyticsService {
    /**
     * Fetch comprehensive dashboard metrics
     * @param userId - If provided (sales role), filter by assigned sales rep
     * @param role - User role to determine data scope
     * @param filters - Optional filters for date range, source, and status
     */
    static async getDashboardMetrics(userId?: string, role?: string, filters?: DashboardFilters): Promise<DashboardMetrics> {
        try {
            const isAdmin = role === 'admin';
            const baseLeadQuery = supabase.from('profiles').select('*');
            const baseAppQuery = supabase.from('financing_applications').select('*');

            // Filter by sales rep if not admin
            let leadQuery = isAdmin ? baseLeadQuery : baseLeadQuery.eq('asesor_asignado_id', userId);
            let appQuery = isAdmin ? baseAppQuery : baseAppQuery.eq('sales_user_id', userId);

            // Apply date filters if provided
            if (filters?.startDate) {
                leadQuery = leadQuery.gte('created_at', filters.startDate.toISOString());
                appQuery = appQuery.gte('created_at', filters.startDate.toISOString());
            }
            if (filters?.endDate) {
                leadQuery = leadQuery.lte('created_at', filters.endDate.toISOString());
                appQuery = appQuery.lte('created_at', filters.endDate.toISOString());
            }

            // Build reminders query based on role
            let remindersQuery = supabase
                .from('lead_reminders')
                .select('*')
                .gte('reminder_date', new Date().toISOString())
                .order('reminder_date', { ascending: true });

            // For sales users, filter by agent_id. For admins, show all reminders.
            if (!isAdmin && userId) {
                remindersQuery = remindersQuery.eq('agent_id', userId);
            }

            // Fetch all data in parallel
            const [
                leadsResult,
                applicationsResult,
                remindersResult
            ] = await Promise.all([
                leadQuery,
                appQuery,
                remindersQuery
                    .then(result => result)
                    .catch(error => {
                        console.warn('[Analytics] lead_reminders table not found, skipping reminders:', error);
                        return { data: [], error: null };
                    })
            ]);

            // Try to fetch Kommo leads if the table exists
            let kommoLeadsData: any[] = [];
            try {
                let kommoLeadsQuery = supabase.from('profiles').select('kommo_data');

                // Apply date filters to Kommo data if provided
                if (filters?.startDate) {
                    kommoLeadsQuery = kommoLeadsQuery.gte('created_at', filters.startDate.toISOString());
                }
                if (filters?.endDate) {
                    kommoLeadsQuery = kommoLeadsQuery.lte('created_at', filters.endDate.toISOString());
                }

                const kommoResult = await kommoLeadsQuery.not('kommo_data', 'is', null);

                if (kommoResult.data) {
                    // Extract kommo_data from profiles
                    kommoLeadsData = kommoResult.data
                        .filter(p => p.kommo_data)
                        .map(p => p.kommo_data);
                }
            } catch (error) {
                console.warn('[Analytics] Error fetching Kommo data from profiles:', error);
            }

            let allProfiles = leadsResult.data || [];
            let applications = applicationsResult.data || [];
            const reminders = remindersResult.data || [];

            // DEBUG: Log raw data counts
            console.log(`[Analytics] Raw data counts - Profiles: ${allProfiles.length}, Applications: ${applications.length}, Reminders: ${reminders.length}`);

            // DEBUG: Log unique application statuses
            const uniqueStatuses = [...new Set(applications.map(app => app.status))];
            console.log(`[Analytics] Unique application statuses:`, uniqueStatuses);
            console.log(`[Analytics] Application status breakdown:`, {
                total: applications.length,
                draft: applications.filter(a => a.status === 'draft').length,
                submitted: applications.filter(a => a.status === 'submitted').length,
                pending: applications.filter(a => a.status === 'pending').length,
                processed: applications.filter(a => a.status === 'processed').length,
                approved: applications.filter(a => a.status === 'approved').length,
                completed: applications.filter(a => a.status === 'completed').length,
            });

            // Filter profiles to only include website leads (users who registered directly, not created by admin)
            // We identify website leads by checking if they have a role of null or 'customer' and have source data
            let leads = allProfiles.filter(profile => {
                // Exclude admin and sales users
                if (profile.role === 'admin' || profile.role === 'sales') return false;
                // Include profiles that likely registered via website (have source or came through auth)
                return true; // For now, include all non-admin/sales profiles as potential leads
            });

            // Apply source filter if provided
            if (filters?.source && filters.source !== 'all') {
                leads = leads.filter(lead => {
                    const source = lead.source?.toLowerCase() || '';
                    const metadata = lead.metadata?.utm_source?.toLowerCase() || '';

                    switch (filters.source) {
                        case 'facebook':
                            return source.includes('facebook') || source.includes('fb') || metadata.includes('facebook');
                        case 'google':
                            return source.includes('google') || metadata.includes('google');
                        case 'bot':
                            return source.includes('bot') || source.includes('whatsapp');
                        case 'direct':
                            return source.includes('direct') || source === 'Portal TREFA' || source === 'TREFA.mx';
                        case 'other':
                            return !source.includes('facebook') && !source.includes('fb') &&
                                   !source.includes('google') && !source.includes('bot') &&
                                   !source.includes('whatsapp') && !source.includes('direct') &&
                                   source !== 'Portal TREFA' && source !== 'TREFA.mx';
                        default:
                            return true;
                    }
                });
            }

            // Apply status filter if provided
            if (filters?.status && filters.status !== 'all') {
                switch (filters.status) {
                    case 'contacted':
                        leads = leads.filter(lead => lead.contactado === true);
                        break;
                    case 'uncontacted':
                        leads = leads.filter(lead => !lead.contactado);
                        break;
                    case 'pending':
                        applications = applications.filter(app => app.status === 'pending' || app.status === 'submitted');
                        break;
                    case 'approved':
                        applications = applications.filter(app => app.status === 'approved');
                        break;
                }
            }

            // Calculate application metrics
            // FIX: Changed from 'draft' to 'submitted' to count submitted applications
            const pendingApps = applications.filter(app =>
                app.status === 'pending' || app.status === 'submitted'
            );
            const processedApps = applications.filter(app =>
                app.status === 'processed' || app.status === 'reviewing'
            );
            const approvedApps = applications.filter(app =>
                app.status === 'approved'
            );

            // Calculate submitted applications in last 24 hours (excluding drafts)
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            const completedLast24Hours = applications.filter(app => {
                // Count all non-draft applications created in last 24 hours
                const isSubmitted = app.status !== 'draft';
                const createdAt = new Date(app.created_at);
                return isSubmitted && createdAt >= twentyFourHoursAgo;
            }).length;

            // Calculate submitted applications with/without documents
            const submittedApps = applications.filter(app => app.status === 'submitted');
            let submittedWithDocuments = 0;
            let submittedWithoutDocuments = 0;

            // Check document status for each submitted application
            if (submittedApps.length > 0) {
                try {
                    // Get all user_ids from submitted applications
                    const userIds = submittedApps.map(app => app.user_id).filter(Boolean);

                    // Query uploaded_documents table to find which users have uploaded documents
                    const { data: documentsData } = await supabase
                        .from('uploaded_documents')
                        .select('user_id')
                        .in('user_id', userIds);

                    // Create a Set of user_ids that have documents
                    const userIdsWithDocs = new Set(documentsData?.map(doc => doc.user_id) || []);

                    // Count applications with and without documents
                    submittedApps.forEach(app => {
                        if (app.user_id && userIdsWithDocs.has(app.user_id)) {
                            submittedWithDocuments++;
                        } else {
                            submittedWithoutDocuments++;
                        }
                    });
                } catch (error) {
                    console.error('[Analytics] Error checking document status:', error);
                    // If there's an error, count all submitted apps as without documents
                    submittedWithoutDocuments = submittedApps.length;
                }
            }

            // Calculate lead metrics
            const contactedLeads = leads.filter(lead => lead.contactado === true);
            const uncontactedLeads = leads.filter(lead => !lead.contactado);

            // Source attribution - IMPROVED MATCHING LOGIC
            // BUG FIX: Make source matching more flexible and handle empty/null values better
            // CHECK: source, utm_source, utm_medium, rfdm, and metadata fields
            const sourceBreakdown = {
                facebook: leads.filter(l => {
                    const source = String(l.source || '').toLowerCase().trim();
                    const rfdm = String(l.rfdm || '').toLowerCase().trim();
                    // Check both direct UTM fields and metadata
                    const utmSource = String(l.utm_source || l.metadata?.utm_source || '').toLowerCase().trim();
                    const utmMedium = String(l.utm_medium || l.metadata?.utm_medium || '').toLowerCase().trim();
                    const fbclid = l.metadata?.fbclid;

                    // Match Facebook in multiple ways
                    return source.includes('facebook') ||
                           source.includes('fb') ||
                           source.includes('meta') ||
                           rfdm.includes('facebook') ||
                           rfdm.includes('fb') ||
                           rfdm.includes('meta') ||
                           utmSource.includes('facebook') ||
                           utmSource.includes('fb') ||
                           utmSource.includes('meta') ||
                           utmMedium.includes('facebook') ||
                           utmMedium.includes('fb-ads') ||
                           utmMedium.includes('social') ||
                           !!fbclid; // If fbclid exists, it's from Facebook
                }).length,
                google: leads.filter(l => {
                    const source = String(l.source || '').toLowerCase().trim();
                    const rfdm = String(l.rfdm || '').toLowerCase().trim();
                    // Check both direct UTM fields and metadata
                    const utmSource = String(l.utm_source || l.metadata?.utm_source || '').toLowerCase().trim();
                    const utmMedium = String(l.utm_medium || l.metadata?.utm_medium || '').toLowerCase().trim();
                    const gclid = l.metadata?.gclid;

                    return source.includes('google') ||
                           source.includes('adwords') ||
                           source.includes('gads') ||
                           rfdm.includes('google') ||
                           rfdm.includes('adwords') ||
                           utmSource.includes('google') ||
                           utmMedium.includes('cpc') ||
                           utmMedium.includes('ppc') ||
                           utmMedium.includes('paid') ||
                           !!gclid; // If gclid exists, it's from Google Ads
                }).length,
                bot: leads.filter(l => {
                    const source = String(l.source || '').toLowerCase().trim();
                    const rfdm = String(l.rfdm || '').toLowerCase().trim();
                    // Check both direct UTM fields and metadata
                    const utmSource = String(l.utm_source || l.metadata?.utm_source || '').toLowerCase().trim();

                    return source.includes('bot') ||
                           source.includes('whatsapp') ||
                           source.includes('wa') ||
                           source.includes('chatbot') ||
                           source.includes('wechat') ||
                           source.includes('telegram') ||
                           rfdm.includes('bot') ||
                           rfdm.includes('whatsapp') ||
                           rfdm.includes('wa') ||
                           utmSource.includes('whatsapp') ||
                           utmSource.includes('bot') ||
                           utmSource.includes('wa');
                }).length,
                direct: leads.filter(l => {
                    const source = String(l.source || '').toLowerCase().trim();

                    // Match various forms of direct traffic
                    return !source || // Empty source is direct
                           source === '' ||
                           source === 'direct' ||
                           source === 'directo' ||
                           source === 'portal trefa' ||
                           source === 'trefa.mx' ||
                           source === 'trefa' ||
                           source === 'website' ||
                           source === 'web' ||
                           source === 'none' ||
                           source === '(none)' ||
                           source === 'organic';
                }).length,
                other: 0
            };

            // Calculate "other" sources (any lead not categorized above)
            sourceBreakdown.other = leads.length - (
                sourceBreakdown.facebook +
                sourceBreakdown.google +
                sourceBreakdown.bot +
                sourceBreakdown.direct
            );

            // DEBUG: Log source breakdown and sample data
            console.log(`[Analytics] Source breakdown:`, sourceBreakdown);
            console.log(`[Analytics] Sample lead sources (first 5):`, leads.slice(0, 5).map(l => ({
                source: l.source,
                rfdm: l.rfdm,
                utm_source: l.utm_source,
                utm_medium: l.utm_medium,
                utm_campaign: l.utm_campaign,
                referrer: l.referrer,
                metadata: l.metadata
            })));

            // Calculate rates
            const conversionRate = leads.length > 0
                ? (applications.length / leads.length) * 100
                : 0;

            const approvalRate = applications.length > 0
                ? (approvedApps.length / applications.length) * 100
                : 0;

            // Get recent activity (last 10)
            const recentApplications = applications
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            const recentLeads = leads
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            // Tasks/reminders for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const tasksToday = reminders.filter(r => {
                const reminderDate = new Date(r.reminder_date);
                return reminderDate >= today && reminderDate < tomorrow;
            }).length;

            // Filter out draft applications from total count
            const submittedApplications = applications.filter(app => app.status !== 'draft');

            // Calculate Kommo leads metrics
            const activeKommoLeads = kommoLeadsData.filter(lead => !lead.is_deleted);
            const deletedKommoLeads = kommoLeadsData.filter(lead => lead.is_deleted);

            // Get recent Kommo leads (last 10)
            const recentKommoLeads = kommoLeadsData
                .filter(lead => !lead.is_deleted)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            return {
                totalApplications: submittedApplications.length,
                pendingApplications: pendingApps.length,
                processedApplications: processedApps.length,
                approvedApplications: approvedApps.length,
                completedLast24Hours, // NEW METRIC
                submittedWithDocuments,
                submittedWithoutDocuments,

                // Website leads metrics
                websiteLeads: {
                    total: leads.length,
                    contacted: contactedLeads.length,
                    uncontacted: uncontactedLeads.length
                },

                // Kommo CRM leads metrics
                kommoLeads: {
                    total: kommoLeadsData.length,
                    active: activeKommoLeads.length,
                    deleted: deletedKommoLeads.length
                },

                // Legacy fields for backward compatibility
                totalLeads: leads.length,
                contactedLeads: contactedLeads.length,
                uncontactedLeads: uncontactedLeads.length,

                sourceBreakdown,

                conversionRate: Math.round(conversionRate * 10) / 10,
                approvalRate: Math.round(approvalRate * 10) / 10,

                recentApplications,
                recentLeads,
                recentKommoLeads,

                pendingReminders: reminders.length,
                tasksToday
            };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching dashboard metrics:', error);
            console.error('[AnalyticsService] Error details:', JSON.stringify(error, null, 2));
            console.error('[AnalyticsService] User ID:', userId, 'Role:', role);
            throw error;
        }
    }

    /**
     * Get time-series data for charts (last 30 days)
     */
    static async getTimeSeriesData(userId?: string, role?: string): Promise<{
        labels: string[];
        leadsData: number[];
        applicationsData: number[];
    }> {
        try {
            const isAdmin = role === 'admin';
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const leadQuery = supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            const appQuery = supabase
                .from('financing_applications')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (!isAdmin && userId) {
                leadQuery.eq('asesor_asignado_id', userId);
                appQuery.eq('sales_user_id', userId);
            }

            const [leadsResult, appsResult] = await Promise.all([leadQuery, appQuery]);

            const leads = leadsResult.data || [];
            const apps = appsResult.data || [];

            // Group by date
            const dateMap = new Map<string, { leads: number; apps: number }>();

            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const dateStr = date.toISOString().split('T')[0];
                dateMap.set(dateStr, { leads: 0, apps: 0 });
            }

            leads.forEach(lead => {
                const dateStr = lead.created_at.split('T')[0];
                if (dateMap.has(dateStr)) {
                    dateMap.get(dateStr)!.leads++;
                }
            });

            apps.forEach(app => {
                const dateStr = app.created_at.split('T')[0];
                if (dateMap.has(dateStr)) {
                    dateMap.get(dateStr)!.apps++;
                }
            });

            const labels: string[] = [];
            const leadsData: number[] = [];
            const applicationsData: number[] = [];

            Array.from(dateMap.entries()).forEach(([date, data]) => {
                labels.push(new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }));
                leadsData.push(data.leads);
                applicationsData.push(data.apps);
            });

            return { labels, leadsData, applicationsData };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching time series data:', error);
            return { labels: [], leadsData: [], applicationsData: [] };
        }
    }

    /**
     * Get trend comparisons (current period vs previous period)
     * @param userId - If provided (sales role), filter by assigned sales rep
     * @param role - User role to determine data scope
     * @param days - Number of days to compare (default: 7)
     */
    static async getTrendComparisons(userId?: string, role?: string, days: number = 7): Promise<TrendComparisons> {
        try {
            const isAdmin = role === 'admin';

            // Calculate date ranges
            const now = new Date();
            const currentPeriodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
            const previousPeriodStart = new Date(now.getTime() - (2 * days * 24 * 60 * 60 * 1000));
            const previousPeriodEnd = currentPeriodStart;

            // Fetch current period data
            const currentLeadQuery = supabase
                .from('profiles')
                .select('id, created_at')
                .gte('created_at', currentPeriodStart.toISOString())
                .lte('created_at', now.toISOString());

            const currentAppQuery = supabase
                .from('financing_applications')
                .select('id, status, created_at')
                .gte('created_at', currentPeriodStart.toISOString())
                .lte('created_at', now.toISOString());

            // Fetch previous period data
            const previousLeadQuery = supabase
                .from('profiles')
                .select('id, created_at')
                .gte('created_at', previousPeriodStart.toISOString())
                .lte('created_at', previousPeriodEnd.toISOString());

            const previousAppQuery = supabase
                .from('financing_applications')
                .select('id, status, created_at')
                .gte('created_at', previousPeriodStart.toISOString())
                .lte('created_at', previousPeriodEnd.toISOString());

            // Apply role-based filtering
            if (!isAdmin && userId) {
                currentLeadQuery.eq('asesor_asignado_id', userId);
                currentAppQuery.eq('sales_user_id', userId);
                previousLeadQuery.eq('asesor_asignado_id', userId);
                previousAppQuery.eq('sales_user_id', userId);
            }

            // Execute queries in parallel
            const [
                currentLeadsResult,
                currentAppsResult,
                previousLeadsResult,
                previousAppsResult
            ] = await Promise.all([
                currentLeadQuery,
                currentAppQuery,
                previousLeadQuery,
                previousAppQuery
            ]);

            const currentLeads = currentLeadsResult.data || [];
            const currentApps = currentAppsResult.data || [];
            const previousLeads = previousLeadsResult.data || [];
            const previousApps = previousAppsResult.data || [];

            // Calculate metrics
            const currentLeadsCount = currentLeads.length;
            const previousLeadsCount = previousLeads.length;
            const currentAppsCount = currentApps.length;
            const previousAppsCount = previousApps.length;

            const currentConversion = currentLeadsCount > 0
                ? (currentAppsCount / currentLeadsCount) * 100
                : 0;
            const previousConversion = previousLeadsCount > 0
                ? (previousAppsCount / previousLeadsCount) * 100
                : 0;

            const currentApproved = currentApps.filter(app => app.status === 'approved').length;
            const previousApproved = previousApps.filter(app => app.status === 'approved').length;

            const currentApprovalRate = currentAppsCount > 0
                ? (currentApproved / currentAppsCount) * 100
                : 0;
            const previousApprovalRate = previousAppsCount > 0
                ? (previousApproved / previousAppsCount) * 100
                : 0;

            // Calculate changes and percentages
            const calculateChange = (current: number, previous: number) => {
                const change = current - previous;
                const percentChange = previous > 0 ? ((change / previous) * 100) : 0;
                return { change, percentChange };
            };

            const leadsChange = calculateChange(currentLeadsCount, previousLeadsCount);
            const appsChange = calculateChange(currentAppsCount, previousAppsCount);
            const conversionChange = calculateChange(currentConversion, previousConversion);
            const approvalChange = calculateChange(currentApprovalRate, previousApprovalRate);

            return {
                leadsChange: leadsChange.change,
                leadsChangePercent: Math.round(leadsChange.percentChange * 10) / 10,
                applicationsChange: appsChange.change,
                applicationsChangePercent: Math.round(appsChange.percentChange * 10) / 10,
                conversionChange: conversionChange.change,
                conversionChangePercent: Math.round(conversionChange.percentChange * 10) / 10,
                approvalChange: approvalChange.change,
                approvalChangePercent: Math.round(approvalChange.percentChange * 10) / 10
            };

        } catch (error) {
            console.error('[AnalyticsService] Error fetching trend comparisons:', error);
            return {
                leadsChange: 0,
                leadsChangePercent: 0,
                applicationsChange: 0,
                applicationsChangePercent: 0,
                conversionChange: 0,
                conversionChangePercent: 0,
                approvalChange: 0,
                approvalChangePercent: 0
            };
        }
    }
}
