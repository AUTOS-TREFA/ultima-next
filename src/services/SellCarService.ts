import { supabase } from '@/lib/supabase/client';
import type { UserVehicleForSale } from '../types/types';

export const SellCarService = {
  /**
   * Fetches all vehicle sale listings for a given user.
   * @param userId - The ID of the authenticated user.
   * @returns An array of the user's vehicle sale listings.
   */
  async getSellListings(userId: string): Promise<UserVehicleForSale[]> {
    const { data, error } = await supabase
      .from('user_vehicles_for_sale')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sell listings:', error);
      throw new Error('No se pudieron obtener tus vehículos en venta.');
    }
    return data || [];
  },

  /**
   * Creates or updates a vehicle sale listing.
   * @param listingData - The data for the listing. Must include the user_id.
   * @returns The created or updated listing object.
   */
  async createOrUpdateSellListing(listingData: Partial<UserVehicleForSale>): Promise<UserVehicleForSale> {
    if (!listingData.user_id) {
        throw new Error("User ID is required to save a listing.");
    }

    const { data, error } = await supabase
      .from('user_vehicles_for_sale')
      .upsert(listingData) // upsert will create if `id` is missing, update if it exists
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating sell listing:', error);
      throw new Error('No se pudo guardar la información de tu vehículo.');
    }
    return data;
  },

  /**
   * Fetches all purchase leads with user profile information.
   * Admin-only function to get all vehicles users want to sell.
   * @returns An array of all sell car leads with enriched user data.
   */
  async getAllPurchaseLeads(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_purchase_leads_for_dashboard');

    if (error) {
      console.error('Error fetching purchase leads:', error);
      throw new Error('No se pudieron obtener los leads de compra.');
    }
    return data || [];
  },

  /**
   * Fetches dashboard statistics for the Compras dashboard.
   * @returns Statistics about purchase leads.
   */
  async getPurchaseDashboardStats(): Promise<any> {
    const { data, error } = await supabase.rpc('get_compras_dashboard_stats');

    if (error) {
      console.error('Error fetching compras dashboard stats:', error);
      throw new Error('No se pudieron obtener las estadísticas.');
    }
    return data[0] || {};
  },

  /**
   * Fetches a single purchase lead with full details.
   * @param listingId - The ID of the listing.
   * @returns The listing with user profile information.
   */
  async getPurchaseLeadDetails(listingId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_purchase_lead_details', { listing_id: listingId });

    if (error) {
      console.error('Error fetching purchase lead details:', error);
      throw new Error('No se pudieron obtener los detalles del lead.');
    }
    return data;
  },

  /**
   * Updates the contacted status of a purchase lead.
   * @param listingId - The ID of the listing.
   * @param contacted - Whether the lead has been contacted.
   */
  async updateContactedStatus(listingId: string, contacted: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_vehicles_for_sale')
      .update({ contacted })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating contacted status:', error);
      throw new Error('No se pudo actualizar el estado de contacto.');
    }
  },

  /**
   * Updates the assigned advisor for a purchase lead.
   * @param listingId - The ID of the listing.
   * @param advisorId - The ID of the advisor to assign.
   */
  async updateAssignedAdvisor(listingId: string, advisorId: string | null): Promise<void> {
    const { error } = await supabase
      .from('user_vehicles_for_sale')
      .update({ asesor_asignado_id: advisorId })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating assigned advisor:', error);
      throw new Error('No se pudo actualizar el asesor asignado.');
    }
  },

  /**
   * Sends a purchase lead to Kommo CRM via webhook.
   * @param listingId - The ID of the listing to send.
   * @param webhookUrl - The webhook URL to send the data to.
   */
  async sendToKommo(listingId: string, webhookUrl: string): Promise<void> {
    const leadDetails = await this.getPurchaseLeadDetails(listingId);

    if (!leadDetails) {
      throw new Error('No se encontró el lead.');
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadDetails),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error sending to Kommo:', error);
      throw new Error('No se pudo enviar el lead a Kommo.');
    }
  },

  /**
   * Deletes a purchase lead from the database.
   * @param listingId - The ID of the listing to delete.
   */
  async deletePurchaseLead(listingId: string): Promise<void> {
    const { error } = await supabase
      .from('user_vehicles_for_sale')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Error deleting purchase lead:', error);
      throw new Error('No se pudo eliminar el lead de compra.');
    }
  },

  /**
   * Updates the status of a purchase lead.
   * @param listingId - The ID of the listing.
   * @param status - The new status value.
   */
  async updateStatus(listingId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('user_vehicles_for_sale')
      .update({ status })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating status:', error);
      throw new Error('No se pudo actualizar el estado.');
    }
  },
};