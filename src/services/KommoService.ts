import { config } from '@/config';

/**
 * SAFETY NOTE: This service is designed to be READ-ONLY for existing Kommo data.
 * It will ONLY create NEW leads and will NEVER modify existing leads, pipelines, or stages.
 * All update operations are commented out and require explicit admin approval to enable.
 *
 * OAuth Security: All token management happens server-side via Supabase Edge Function.
 * Tokens are never exposed to the browser.
 *
 * ⚠️ CRITICAL POLICY: MANUAL OPERATION ONLY ⚠️
 * - Sending data TO Kommo MUST be manual, lead-by-lead only
 * - NO automation, NO bulk operations, NO scheduled jobs
 * - Only triggered by explicit user button clicks in Admin/Sales profile pages
 * - Violating this policy could result in duplicate leads and data corruption
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface KommoContact {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    responsible_user_id: number;
    created_by: number;
    created_at: number;
    updated_at: number;
    custom_fields_values?: KommoCustomField[];
}

export interface KommoLead {
    id: number;
    name: string;
    price: number;
    responsible_user_id: number;
    group_id: number;
    status_id: number;
    pipeline_id: number;
    loss_reason_id?: number;
    created_by: number;
    updated_by: number;
    created_at: number;
    updated_at: number;
    closed_at?: number;
    closest_task_at?: number;
    is_deleted: boolean;
    custom_fields_values?: KommoCustomField[];
    score?: number;
    account_id: number;
    labor_cost?: number;
    _embedded?: {
        tags?: KommoTag[];
        contacts?: KommoContact[];
        companies?: KommoCompany[];
    };
}

export interface KommoPipeline {
    id: number;
    name: string;
    sort: number;
    is_main: boolean;
    is_unsorted_on: boolean;
    is_archive: boolean;
    account_id: number;
    _embedded: {
        statuses: KommoStatus[];
    };
}

export interface KommoStatus {
    id: number;
    name: string;
    sort: number;
    is_editable: boolean;
    pipeline_id: number;
    color: string;
    type: number;
    account_id: number;
}

export interface KommoTag {
    id: number;
    name: string;
    color?: string;
}

export interface KommoCompany {
    id: number;
    name: string;
    responsible_user_id: number;
    created_at: number;
    updated_at: number;
}

export interface KommoCustomField {
    field_id: number;
    field_name: string;
    field_code?: string;
    field_type: string;
    values: Array<{
        value: string | number | boolean;
        enum_id?: number;
        enum_code?: string;
    }>;
}

export interface KommoTokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token: string;
}

export interface KommoLeadsListResponse {
    _page: number;
    _links: {
        self: { href: string };
        next?: { href: string };
    };
    _embedded: {
        leads: KommoLead[];
    };
}

export interface KommoPipelinesResponse {
    _total_items: number;
    _embedded: {
        pipelines: KommoPipeline[];
    };
}

// ============================================
// CONFIGURATION
// ============================================

const { subdomain } = config.kommo;

// Edge Function URL for secure OAuth token management
const OAUTH_EDGE_FUNCTION_URL = `${config.supabase.url}/functions/v1/kommo-oauth`;

// ============================================
// KOMMO SERVICE CLASS
// ============================================

class KommoService {
    // Safety flag - must be explicitly set to true to allow ANY write operations
    private static readonly ALLOW_WRITES = true;

    // Safety flag - when true, only allows creating NEW leads (never updating existing ones)
    private static readonly SAFE_MODE = true;

    // ============================================
    // TOKEN MANAGEMENT (OAuth 2.0) - Server-Side via Edge Function
    // ============================================

    /**
     * Makes an authenticated API request to Kommo via Edge Function
     * All OAuth token management happens server-side for security
     */
    private static async apiRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        console.log(`[Kommo API] ${method} ${endpoint}`);

        try {
            const response = await fetch(`${OAUTH_EDGE_FUNCTION_URL}?action=api-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': config.supabase.anonKey,
                },
                body: JSON.stringify({
                    endpoint,
                    method,
                    body,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Kommo API Error]:', {
                    status: response.status,
                    endpoint,
                    error: errorData,
                });

                // If it's a Kommo API error, handle it
                if (errorData.details) {
                    this.handleApiError(response.status, errorData.details);
                }

                throw new Error(errorData.error || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('[Kommo API] Request failed:', error);
            throw error;
        }
    }

    /**
     * Handles API errors with detailed error messages
     */
    private static handleApiError(status: number, errorData: any): never {
        let errorMessage = `Error de Kommo API (${status})`;

        switch (status) {
            case 401:
                errorMessage = 'Error de autenticación (401): El token de acceso es inválido o ha expirado.';
                break;
            case 403:
                errorMessage = 'Error de permisos (403): No tienes permisos suficientes para esta operación.';
                break;
            case 404:
                errorMessage = 'Recurso no encontrado (404): El lead, pipeline o recurso solicitado no existe.';
                break;
            case 422:
                errorMessage = `Error de validación (422): ${errorData?.detail || errorData?.title || 'Datos inválidos'}`;
                break;
            case 429:
                errorMessage = 'Límite de tasa excedido (429): Demasiadas solicitudes. Por favor, intenta más tarde.';
                break;
            default:
                errorMessage = `Error de Kommo API (${status}): ${errorData?.detail || errorData?.title || 'Error desconocido'}`;
        }

        throw new Error(errorMessage);
    }

    // ============================================
    // READ-ONLY OPERATIONS (SAFE)
    // ============================================

    /**
     * SAFE: Retrieves all leads with optional filters
     * This is READ-ONLY and will not modify any data
     */
    static async getLeads(params?: {
        limit?: number;
        page?: number;
        query?: string;
        filter?: {
            statuses?: number[];
            pipeline_id?: number;
            responsible_user_id?: number;
            created_at?: { from: number; to: number };
        };
    }): Promise<KommoLeadsListResponse> {
        try {
            let endpoint = '/leads';
            const queryParams: string[] = [];

            if (params?.limit) queryParams.push(`limit=${params.limit}`);
            if (params?.page) queryParams.push(`page=${params.page}`);
            if (params?.query) queryParams.push(`query=${encodeURIComponent(params.query)}`);

            if (params?.filter) {
                if (params.filter.statuses) {
                    params.filter.statuses.forEach(status => {
                        queryParams.push(`filter[statuses][0][status_id]=${status}`);
                    });
                }
                if (params.filter.pipeline_id) {
                    queryParams.push(`filter[statuses][0][pipeline_id]=${params.filter.pipeline_id}`);
                }
                if (params.filter.responsible_user_id) {
                    queryParams.push(`filter[responsible_user_id]=${params.filter.responsible_user_id}`);
                }
            }

            if (queryParams.length > 0) {
                endpoint += `?${queryParams.join('&')}`;
            }

            const response = await this.apiRequest<KommoLeadsListResponse>(endpoint);
            console.log(`[Kommo] Retrieved ${response._embedded?.leads?.length || 0} leads`);

            return response;
        } catch (error) {
            console.error('[Kommo] Failed to get leads:', error);
            throw error;
        }
    }

    /**
     * SAFE: Retrieves a single lead by ID
     * This is READ-ONLY and will not modify any data
     */
    static async getLeadById(leadId: number): Promise<KommoLead> {
        try {
            const response = await this.apiRequest<KommoLeadsListResponse>(
                `/leads/${leadId}`
            );

            return response._embedded.leads[0];
        } catch (error) {
            console.error(`[Kommo] Failed to get lead ${leadId}:`, error);
            throw error;
        }
    }

    /**
     * SAFE: Retrieves all pipelines and their stages
     * This is READ-ONLY and will not modify any data
     */
    static async getPipelines(): Promise<KommoPipeline[]> {
        try {
            const response = await this.apiRequest<KommoPipelinesResponse>('/leads/pipelines');
            console.log(`[Kommo] Retrieved ${response._embedded?.pipelines?.length || 0} pipelines`);

            return response._embedded.pipelines;
        } catch (error) {
            console.error('[Kommo] Failed to get pipelines:', error);
            throw error;
        }
    }

    /**
     * SAFE: Retrieves a specific pipeline by ID
     * This is READ-ONLY and will not modify any data
     */
    static async getPipelineById(pipelineId: number): Promise<KommoPipeline> {
        try {
            const response = await this.apiRequest<KommoPipeline>(`/leads/pipelines/${pipelineId}`);
            return response;
        } catch (error) {
            console.error(`[Kommo] Failed to get pipeline ${pipelineId}:`, error);
            throw error;
        }
    }

    /**
     * SAFE: Gets all tags from leads
     * This is READ-ONLY and will not modify any data
     */
    static async getTags(): Promise<KommoTag[]> {
        try {
            // Note: Kommo doesn't have a direct tags endpoint
            // Tags are retrieved from leads with the 'with' parameter
            const response = await this.apiRequest<KommoLeadsListResponse>(
                '/leads?with=tags&limit=250'
            );

            const tagsMap = new Map<number, KommoTag>();

            response._embedded?.leads?.forEach(lead => {
                lead._embedded?.tags?.forEach(tag => {
                    if (!tagsMap.has(tag.id)) {
                        tagsMap.set(tag.id, tag);
                    }
                });
            });

            const tags = Array.from(tagsMap.values());
            console.log(`[Kommo] Found ${tags.length} unique tags`);

            return tags;
        } catch (error) {
            console.error('[Kommo] Failed to get tags:', error);
            throw error;
        }
    }

    /**
     * SAFE: Searches for leads by email or phone
     * This is READ-ONLY and will not modify any data
     *
     * Strategy: Search contacts first (by phone/email), then get associated leads
     */
    static async searchLeadByContact(email?: string, phone?: string): Promise<KommoLead | null> {
        try {
            if (!email && !phone) {
                throw new Error('Either email or phone must be provided');
            }

            // Search by phone first (more reliable), fallback to email
            const searchQuery = phone || email;

            console.log(`[Kommo] Searching contacts for: ${searchQuery}`);

            // Step 1: Search contacts (not leads) using query parameter
            interface ContactsResponse {
                _embedded?: {
                    contacts?: Array<{
                        id: number;
                        name: string;
                        _links?: {
                            self?: { href: string };
                        };
                    }>;
                };
            }

            const contactsResponse = await this.apiRequest<ContactsResponse>(
                `/contacts?query=${encodeURIComponent(searchQuery!)}`
            );

            const contacts = contactsResponse._embedded?.contacts || [];

            if (contacts.length === 0) {
                console.log(`[Kommo] No contact found for: ${searchQuery}`);
                return null;
            }

            console.log(`[Kommo] Found ${contacts.length} contact(s), searching their leads...`);

            // Step 2: Get leads for the first matching contact
            const contactId = contacts[0].id;
            const leadsResponse = await this.apiRequest<KommoLeadsListResponse>(
                `/leads?filter[contacts][0]=${contactId}`
            );

            const leads = leadsResponse._embedded?.leads || [];

            if (leads.length === 0) {
                console.log(`[Kommo] Contact found but no associated leads for contact ID: ${contactId}`);
                return null;
            }

            console.log(`[Kommo] Found ${leads.length} lead(s) for contact ID: ${contactId}`);
            return leads[0]; // Return the first/most recent lead
        } catch (error) {
            console.error('[Kommo] Failed to search lead:', error);
            throw error;
        }
    }

    // ============================================
    // WRITE OPERATIONS (PROTECTED)
    // ============================================

    /**
     * PROTECTED: Creates a NEW lead in Kommo
     * SAFETY: This will ONLY create new leads. It will NEVER update existing leads.
     * SAFETY: Before creating, it checks if a lead with the same email/phone exists.
     */
    static async createLead(leadData: {
        name: string;
        price?: number;
        pipeline_id?: number;
        status_id?: number;
        responsible_user_id?: number;
        contact?: {
            first_name?: string;
            last_name?: string;
            email?: string;
            phone?: string;
        };
        custom_fields?: Array<{
            field_id: number;
            values: Array<{ value: string | number }>;
        }>;
        tags?: string[];
    }): Promise<KommoLead> {
        // SAFETY CHECK: Ensure writes are allowed
        if (!this.ALLOW_WRITES) {
            throw new Error(
                'SAFETY: Write operations are disabled. Set ALLOW_WRITES = true to enable lead creation.'
            );
        }

        try {
            // SAFETY CHECK: If in safe mode, check if lead already exists
            if (this.SAFE_MODE && leadData.contact) {
                const { email, phone } = leadData.contact;
                const existingLead = await this.searchLeadByContact(email, phone);

                if (existingLead) {
                    console.warn('[Kommo] SAFETY: Lead already exists, skipping creation:', {
                        existingLeadId: existingLead.id,
                        email,
                        phone,
                    });
                    throw new Error(
                        `SAFETY: A lead with this email/phone already exists (ID: ${existingLead.id}). ` +
                        'This service will not modify existing leads.'
                    );
                }
            }

            // Prepare lead payload
            const payload: any[] = [{
                name: leadData.name,
                price: leadData.price || 0,
            }];

            if (leadData.pipeline_id) {
                payload[0].pipeline_id = leadData.pipeline_id;
            }

            if (leadData.status_id) {
                payload[0].status_id = leadData.status_id;
            }

            if (leadData.responsible_user_id) {
                payload[0].responsible_user_id = leadData.responsible_user_id;
            }

            if (leadData.custom_fields && leadData.custom_fields.length > 0) {
                payload[0].custom_fields_values = leadData.custom_fields;
            }

            // Add contact if provided
            if (leadData.contact) {
                payload[0]._embedded = {
                    contacts: [{
                        first_name: leadData.contact.first_name || '',
                        last_name: leadData.contact.last_name || '',
                        custom_fields_values: [],
                    }],
                };

                if (leadData.contact.email) {
                    payload[0]._embedded.contacts[0].custom_fields_values.push({
                        field_code: 'EMAIL',
                        values: [{ value: leadData.contact.email, enum_code: 'WORK' }],
                    });
                }

                if (leadData.contact.phone) {
                    payload[0]._embedded.contacts[0].custom_fields_values.push({
                        field_code: 'PHONE',
                        values: [{ value: leadData.contact.phone, enum_code: 'WORK' }],
                    });
                }
            }

            // Add tags if provided
            if (leadData.tags && leadData.tags.length > 0) {
                payload[0]._embedded = payload[0]._embedded || {};
                payload[0]._embedded.tags = leadData.tags.map(tag => ({ name: tag }));
            }

            console.log('[Kommo] Creating new lead:', leadData.name);

            const response = await this.apiRequest<KommoLeadsListResponse>(
                '/leads',
                'POST',
                payload
            );

            const createdLead = response._embedded.leads[0];
            console.log('[Kommo] Lead created successfully:', createdLead.id);

            return createdLead;
        } catch (error) {
            console.error('[Kommo] Failed to create lead:', error);
            throw error;
        }
    }

    /**
     * DISABLED: Update operations are completely disabled for safety
     * To enable, you must:
     * 1. Set ALLOW_WRITES = true
     * 2. Remove this safety block
     * 3. Uncomment the implementation below
     */
    static async updateLead(leadId: number, updates: any): Promise<void> {
        throw new Error(
            'SAFETY: Update operations are completely disabled to protect existing Kommo data. ' +
            'This service is designed to only CREATE new leads, never modify existing ones. ' +
            'If you need to update leads, use the Kommo interface directly.'
        );

        /*
        // IMPLEMENTATION COMMENTED OUT FOR SAFETY
        if (!this.ALLOW_WRITES) {
            throw new Error('Write operations are disabled');
        }

        const payload = [{ id: leadId, ...updates }];
        await this.apiRequest('/leads', 'PATCH', payload);
        console.log(`[Kommo] Lead ${leadId} updated`);
        */
    }

    /**
     * DISABLED: Delete operations are completely disabled for safety
     */
    static async deleteLead(leadId: number): Promise<void> {
        throw new Error(
            'SAFETY: Delete operations are completely disabled to protect existing Kommo data. ' +
            'If you need to delete leads, use the Kommo interface directly.'
        );
    }

    // ============================================
    // COMPREHENSIVE SYNC OPERATION
    // ============================================

    /**
     * Comprehensive sync operation for TREFA leads
     * - Checks if lead exists in Kommo by phone number
     * - If exists: Returns Kommo data (pipeline, stage, assigned user)
     * - If not exists: Creates new lead in Kommo with TREFA.mx source tag
     */
    /**
     * ⚠️ CRITICAL: MANUAL OPERATION ONLY ⚠️
     * This function MUST only be called from user-initiated button clicks.
     * DO NOT call this from:
     * - Loops or batch operations
     * - Automated triggers or webhooks
     * - Scheduled jobs or cron tasks
     * - useEffect hooks or automatic lifecycle methods
     *
     * Each call creates or searches for ONE lead in Kommo CRM.
     */
    static async syncLeadWithKommo(profile: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        rfc?: string;
        source?: string;
    }): Promise<{
        success: boolean;
        action: 'found' | 'created' | 'error';
        message: string;
        kommoData?: {
            kommo_id: number;
            pipeline_id: number;
            pipeline_name: string;
            status_id: number;
            status_name: string;
            responsible_user_id: number;
            price: number;
            tags: string[];
        };
    }> {
        try {
            // Log every call for audit trail
            console.log('[Kommo Sync] MANUAL SYNC initiated for profile:', profile.id);
            // Check if phone number exists
            if (!profile.phone || profile.phone.trim() === '') {
                return {
                    success: false,
                    action: 'error',
                    message: 'No se puede sincronizar: el lead no tiene número de teléfono'
                };
            }

            console.log('[Kommo Sync] Searching for lead with phone:', profile.phone);

            // Search for existing lead by phone number
            const existingLead = await this.searchLeadByContact(profile.email, profile.phone);

            if (existingLead) {
                console.log('[Kommo Sync] Found existing lead in Kommo:', existingLead.id);

                // Get pipeline details to get names
                const pipeline = await this.getPipelineById(existingLead.pipeline_id);
                const status = pipeline._embedded.statuses.find(s => s.id === existingLead.status_id);

                return {
                    success: true,
                    action: 'found',
                    message: `Lead encontrado en Kommo (ID: ${existingLead.id})`,
                    kommoData: {
                        kommo_id: existingLead.id,
                        pipeline_id: existingLead.pipeline_id,
                        pipeline_name: pipeline.name,
                        status_id: existingLead.status_id,
                        status_name: status?.name || 'Desconocido',
                        responsible_user_id: existingLead.responsible_user_id,
                        price: existingLead.price,
                        tags: existingLead._embedded?.tags?.map(t => t.name) || []
                    }
                };
            }

            // Lead doesn't exist - create new one
            console.log('[Kommo Sync] Lead not found, creating new lead in Kommo');

            const newLead = await this.createLead({
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || `Lead TREFA ${profile.id}`,
                price: 0,
                contact: {
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    email: profile.email,
                    phone: profile.phone
                },
                tags: ['TREFA.mx', profile.source || 'Portal Web'],
                custom_fields: profile.rfc ? [{
                    field_id: 0, // You'll need to find the actual RFC field ID in Kommo
                    values: [{ value: profile.rfc }]
                }] : undefined
            });

            console.log('[Kommo Sync] New lead created in Kommo:', newLead.id);

            // Get pipeline details
            const pipeline = await this.getPipelineById(newLead.pipeline_id);
            const status = pipeline._embedded.statuses.find(s => s.id === newLead.status_id);

            return {
                success: true,
                action: 'created',
                message: `Lead creado en Kommo exitosamente (ID: ${newLead.id})`,
                kommoData: {
                    kommo_id: newLead.id,
                    pipeline_id: newLead.pipeline_id,
                    pipeline_name: pipeline.name,
                    status_id: newLead.status_id,
                    status_name: status?.name || 'Leads Entrantes',
                    responsible_user_id: newLead.responsible_user_id,
                    price: newLead.price,
                    tags: newLead._embedded?.tags?.map(t => t.name) || ['TREFA.mx']
                }
            };

        } catch (error: any) {
            console.error('[Kommo Sync] Error during sync:', error);

            // Check if it's a safety error (lead already exists)
            if (error.message && error.message.includes('SAFETY')) {
                return {
                    success: false,
                    action: 'error',
                    message: 'El lead ya existe en Kommo. Usa la búsqueda manual para verificar.'
                };
            }

            return {
                success: false,
                action: 'error',
                message: `Error al sincronizar con Kommo: ${error.message || 'Error desconocido'}`
            };
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Returns a summary of all pipelines and their stages
     * Useful for understanding the current funnel structure
     */
    static async getPipelinesSummary(): Promise<string> {
        try {
            const pipelines = await this.getPipelines();

            let summary = '=== KOMMO PIPELINES SUMMARY ===\n\n';

            pipelines.forEach(pipeline => {
                summary += `Pipeline: ${pipeline.name} (ID: ${pipeline.id})\n`;
                summary += `  Main: ${pipeline.is_main ? 'Yes' : 'No'} | Archive: ${pipeline.is_archive ? 'Yes' : 'No'}\n`;
                summary += `  Stages:\n`;

                pipeline._embedded.statuses.forEach(status => {
                    summary += `    - ${status.name} (ID: ${status.id}) [${status.color}]\n`;
                });

                summary += '\n';
            });

            return summary;
        } catch (error) {
            console.error('[Kommo] Failed to generate pipelines summary:', error);
            throw error;
        }
    }

    /**
     * Gets the current configuration status
     */
    static getConfigStatus(): {
        configured: boolean;
        safeMode: boolean;
        writesAllowed: boolean;
    } {
        return {
            configured: !!subdomain,
            safeMode: this.SAFE_MODE,
            writesAllowed: this.ALLOW_WRITES,
        };
    }
}

export default KommoService;
export { KommoService };
