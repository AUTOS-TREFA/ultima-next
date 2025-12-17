import { supabase } from '@/lib/supabase/client';
import type { Profile } from '../types/types';

/**
 * This service encapsulates functions that should only be callable by an admin or sales role.
 * RLS policies on the backend are the primary security layer. This service provides a clean
 * abstraction for the frontend.
 */
export const AdminService = {

  /**
   * Fetches all user profiles.
   * This relies on the 'get_leads_with_details' RPC function which is secured for admin/sales roles.
   */
  async getAllLeads(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_leads_for_dashboard');

    if (error) {
      console.error("Error fetching all leads:", error);
      throw new Error("Could not fetch leads. Ensure you have the required permissions.");
    }
    return data || [];
  },

  /**
   * Fetches the aggregated statistics for the CRM dashboard.
   */
  async getDashboardStats(): Promise<any> {
    const { data, error } = await supabase.rpc('get_crm_dashboard_stats');

    if (error) {
      console.error("Error fetching CRM dashboard stats:", error);
      throw new Error("Could not fetch dashboard stats.");
    }
    return data[0] || {};
  },

  /**
   * Fetches a single user's complete profile and related data.
   * @param userId The ID of the user to fetch.
   */
  async getClientProfile(userId: string): Promise<{ profile: Profile; applications: any[], tags: any[], reminders: any[], documents: any[] } | null> {
    const { data, error } = await supabase.rpc('get_secure_client_profile', { client_id: userId });

    if (error) {
      console.error("Error fetching secure client profile:", error);
      throw new Error("Could not fetch client profile. Ensure you have the required permissions.");
    }

    if (!data || !data.profile) {
        return null; // The function returns nothing if access is denied
    }

    return {
        profile: data.profile,
        applications: data.applications || [],
        tags: data.tags || [],
        reminders: data.reminders || [],
        documents: data.documents || [],
    };
  },

  async getAvailableTags(): Promise<any[]> {
    const { data, error } = await supabase.from('lead_tags').select('*').order('tag_name');
    if (error) throw error;
    return data || [];
  },

  async updateLeadTags(userId: string, tagIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase.from('lead_tag_associations').delete().eq('lead_id', userId);
    if (deleteError) throw deleteError;

    if (tagIds.length > 0) {
      const associations = tagIds.map(tagId => ({ lead_id: userId, tag_id: tagId }));
      const { error: insertError } = await supabase.from('lead_tag_associations').insert(associations);
      if (insertError) throw insertError;
    }
  },
  
  async createReminder(reminder: { lead_id: string; agent_id: string; reminder_text: string; reminder_date: string; }): Promise<void> {
    const { error } = await supabase.from('lead_reminders').insert(reminder);
    if (error) throw error;
  },
  
  async updateReminder(reminderId: string, updates: { reminder_text?: string; reminder_date?: string; is_completed?: boolean; }): Promise<void> {
    const { error } = await supabase.from('lead_reminders').update(updates).eq('id', reminderId);
    if (error) throw error;
  },

  async deleteReminder(reminderId: string): Promise<void> {
    const { error } = await supabase.from('lead_reminders').delete().eq('id', reminderId);
    if (error) throw error;
  },

  /**
   * Fetches the entire application configuration.
   */
  async getAppConfig(): Promise<any[]> {
    const { data, error } = await supabase.from('app_config').select('*');
    if (error) {
      console.error("Error fetching app config:", error);
      throw new Error("Could not fetch app configuration.");
    }
    return data || [];
  },

  /**
   * Updates a specific configuration value by its key.
   * @param key The configuration key to update.
   * @param value The new JSON value.
   */
  async updateAppConfig(key: string, value: any): Promise<void> {
    const { error } = await supabase.from('app_config').update({ value }).eq('key', key);
    if (error) {
      console.error(`Error updating config for key "${key}":`, error);
      throw new Error(`Could not update configuration for "${key}".`);
    }
  },

  /**
   * Updates the status of a document.
   * @param documentId The ID of the document to update.
   * @param status The new status (reviewing, approved, rejected).
   */
  async updateDocumentStatus(documentId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('uploaded_documents')
      .update({ status })
      .eq('id', documentId);

    if (error) {
      console.error(`Error updating document status:`, error);
      throw new Error(`Could not update document status.`);
    }
  },

  /**
   * Fetches all sales users with their analytics
   */
  async getSalesUsersWithAnalytics(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_sales_users_with_analytics');

    if (error) {
      console.error("Error fetching sales users:", error);
      throw new Error("No se pudieron obtener los usuarios de ventas. Asegúrese de tener los permisos necesarios.");
    }
    return data || [];
  },

  /**
   * Creates a new sales user
   */
  async createSalesUser(email: string, password: string, firstName: string, lastName: string, phone?: string): Promise<any> {
    const { data, error } = await supabase.rpc('create_sales_user', {
      user_email: email,
      user_password: password,
      user_first_name: firstName,
      user_last_name: lastName,
      user_phone: phone || null
    });

    if (error) {
      console.error("Error creating sales user:", error);
      throw new Error(error.message || "No se pudo crear el usuario de ventas.");
    }
    return data;
  },

  /**
   * Gets detailed analytics for a specific user
   */
  async getUserAnalyticsDetails(userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_user_analytics_details', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error fetching user analytics:", error);
      throw new Error("No se pudieron obtener las analíticas del usuario.");
    }
    return data;
  },

  /**
   * Updates the status of a sales user (enable/disable from round-robin)
   */
  async updateSalesUserStatus(userId: string, isActive: boolean): Promise<any> {
    const { data, error } = await supabase.rpc('update_sales_user_status', {
      user_id_param: userId,
      is_active: isActive
    });

    if (error) {
      console.error("Error updating user status:", error);
      throw new Error("No se pudo actualizar el estado del usuario.");
    }
    return data;
  },

  /**
   * Saves Kommo lead data to the profiles table after successful sync
   */
  async saveKommoData(leadId: string, kommoData: {
    kommo_id: number;
    pipeline_id: number;
    pipeline_name: string;
    status_id: number;
    status_name: string;
    responsible_user_id: number;
    price: number;
    tags: string[];
  }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        kommo_data: kommoData,
        kommo_last_synced: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) {
      console.error("Error saving Kommo data:", error);
      throw new Error("No se pudieron guardar los datos de Kommo.");
    }
  }
};