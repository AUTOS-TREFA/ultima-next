import { supabase } from '../../supabaseClient';

// Types for Consignment Listings
export interface ConsignmentListing {
  id: string;
  user_id: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'sold' | 'expired' | 'paused';

  // Vehicle info
  brand: string;
  model: string;
  year: number;
  version?: string;
  mileage?: number;
  price: number;
  negotiable: boolean;
  description?: string;
  transmission?: string;
  fuel_type?: string;
  exterior_color?: string;
  interior_color?: string;

  // Location
  state?: string;
  city?: string;

  // Tracking
  view_count: number;
  contact_count: number;
  favorite_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  expires_at?: string;

  // Admin
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  is_featured: boolean;
  featured_until?: string;
  commission_rate?: number;
}

export interface ConsignmentListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url?: string;
  position: number;
  image_type: 'exterior' | 'interior' | 'engine' | 'documents' | 'other';
  is_primary: boolean;
  created_at: string;
}

export interface ConsignmentListingView {
  id: string;
  listing_id: string;
  viewer_id?: string;
  session_id?: string;
  source?: string;
  viewed_at: string;
}

export interface ConsignmentListingContact {
  id: string;
  listing_id: string;
  contacter_id?: string;
  contact_type: 'whatsapp' | 'phone' | 'email' | 'message';
  message?: string;
  phone?: string;
  email?: string;
  name?: string;
  is_read: boolean;
  created_at: string;
}

export interface ConsignmentStats {
  total_listings: number;
  active_listings: number;
  pending_listings: number;
  sold_listings: number;
  total_views: number;
  total_contacts: number;
  views_last_7_days: number;
  contacts_last_7_days: number;
}

export interface AdminConsignmentStats {
  total_listings: number;
  pending_approval: number;
  approved_active: number;
  sold: number;
  rejected: number;
  total_users_selling: number;
  avg_listing_price: number;
  total_revenue_potential: number;
}

export const ConsignmentService = {
  // ============================================================================
  // USER METHODS - For sellers managing their own listings
  // ============================================================================

  /**
   * Get all consignment listings for the current user
   */
  async getMyListings(userId: string): Promise<ConsignmentListing[]> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user consignment listings:', error);
      throw new Error('No se pudieron obtener tus vehiculos en consignacion.');
    }
    return data || [];
  },

  /**
   * Get a single listing by ID (owned by user)
   */
  async getMyListingById(userId: string, listingId: string): Promise<ConsignmentListing | null> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching consignment listing:', error);
      throw new Error('No se pudo obtener el listado.');
    }
    return data;
  },

  /**
   * Create a new consignment listing (as draft)
   */
  async createListing(userId: string, listingData: Partial<ConsignmentListing>): Promise<ConsignmentListing> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .insert({
        ...listingData,
        user_id: userId,
        status: 'draft',
        view_count: 0,
        contact_count: 0,
        favorite_count: 0,
        negotiable: listingData.negotiable ?? true,
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consignment listing:', error);
      throw new Error('No se pudo crear el listado.');
    }
    return data;
  },

  /**
   * Update an existing listing (only owner can update)
   */
  async updateListing(userId: string, listingId: string, updates: Partial<ConsignmentListing>): Promise<ConsignmentListing> {
    // First verify ownership
    const existing = await this.getMyListingById(userId, listingId);
    if (!existing) {
      throw new Error('No tienes permiso para editar este listado.');
    }

    // Don't allow updating certain fields
    const { id, user_id, status, view_count, contact_count, favorite_count, admin_notes, rejection_reason, reviewed_by, ...allowedUpdates } = updates as any;

    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating consignment listing:', error);
      throw new Error('No se pudo actualizar el listado.');
    }
    return data;
  },

  /**
   * Submit a draft listing for approval
   */
  async submitForApproval(userId: string, listingId: string): Promise<ConsignmentListing> {
    const existing = await this.getMyListingById(userId, listingId);
    if (!existing) {
      throw new Error('Listado no encontrado.');
    }
    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      throw new Error('Solo puedes enviar borradores o listados rechazados para aprobacion.');
    }

    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        status: 'pending_approval',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting listing for approval:', error);
      throw new Error('No se pudo enviar el listado para aprobacion.');
    }
    return data;
  },

  /**
   * Pause/Unpause an active listing
   */
  async toggleListingPause(userId: string, listingId: string): Promise<ConsignmentListing> {
    const existing = await this.getMyListingById(userId, listingId);
    if (!existing) {
      throw new Error('Listado no encontrado.');
    }

    const newStatus = existing.status === 'active' ? 'paused' :
                      existing.status === 'paused' ? 'active' : null;

    if (!newStatus) {
      throw new Error('Solo puedes pausar/reactivar listados activos.');
    }

    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling listing pause:', error);
      throw new Error('No se pudo cambiar el estado del listado.');
    }
    return data;
  },

  /**
   * Delete a draft listing
   */
  async deleteDraftListing(userId: string, listingId: string): Promise<void> {
    const existing = await this.getMyListingById(userId, listingId);
    if (!existing) {
      throw new Error('Listado no encontrado.');
    }
    if (existing.status !== 'draft') {
      throw new Error('Solo puedes eliminar borradores.');
    }

    const { error } = await supabase
      .from('consignment_listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting draft listing:', error);
      throw new Error('No se pudo eliminar el borrador.');
    }
  },

  /**
   * Get user's consignment statistics
   */
  async getMyStats(userId: string): Promise<ConsignmentStats> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('id, status, view_count, contact_count')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('No se pudieron obtener las estadisticas.');
    }

    const listings = data || [];
    const stats: ConsignmentStats = {
      total_listings: listings.length,
      active_listings: listings.filter(l => l.status === 'active').length,
      pending_listings: listings.filter(l => l.status === 'pending_approval').length,
      sold_listings: listings.filter(l => l.status === 'sold').length,
      total_views: listings.reduce((sum, l) => sum + (l.view_count || 0), 0),
      total_contacts: listings.reduce((sum, l) => sum + (l.contact_count || 0), 0),
      views_last_7_days: 0, // Would need a separate query
      contacts_last_7_days: 0, // Would need a separate query
    };

    return stats;
  },

  // ============================================================================
  // IMAGE METHODS
  // ============================================================================

  /**
   * Get all images for a listing
   */
  async getListingImages(listingId: string): Promise<ConsignmentListingImage[]> {
    const { data, error } = await supabase
      .from('consignment_listing_images')
      .select('*')
      .eq('listing_id', listingId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching listing images:', error);
      throw new Error('No se pudieron obtener las imagenes.');
    }
    return data || [];
  },

  /**
   * Add an image to a listing
   */
  async addListingImage(
    userId: string,
    listingId: string,
    storagePath: string,
    publicUrl: string,
    imageType: ConsignmentListingImage['image_type'] = 'exterior',
    isPrimary: boolean = false
  ): Promise<ConsignmentListingImage> {
    // Verify ownership
    const listing = await this.getMyListingById(userId, listingId);
    if (!listing) {
      throw new Error('No tienes permiso para agregar imagenes a este listado.');
    }

    // Get current max position
    const { data: existingImages } = await supabase
      .from('consignment_listing_images')
      .select('position')
      .eq('listing_id', listingId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existingImages?.[0]?.position ?? -1) + 1;

    // If this is primary, unset other primaries
    if (isPrimary) {
      await supabase
        .from('consignment_listing_images')
        .update({ is_primary: false })
        .eq('listing_id', listingId);
    }

    const { data, error } = await supabase
      .from('consignment_listing_images')
      .insert({
        listing_id: listingId,
        storage_path: storagePath,
        public_url: publicUrl,
        position: nextPosition,
        image_type: imageType,
        is_primary: isPrimary || nextPosition === 0, // First image is primary by default
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding listing image:', error);
      throw new Error('No se pudo agregar la imagen.');
    }
    return data;
  },

  /**
   * Delete an image from a listing
   */
  async deleteListingImage(userId: string, listingId: string, imageId: string): Promise<void> {
    // Verify ownership
    const listing = await this.getMyListingById(userId, listingId);
    if (!listing) {
      throw new Error('No tienes permiso para eliminar imagenes de este listado.');
    }

    const { error } = await supabase
      .from('consignment_listing_images')
      .delete()
      .eq('id', imageId)
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error deleting listing image:', error);
      throw new Error('No se pudo eliminar la imagen.');
    }
  },

  /**
   * Set primary image for a listing
   */
  async setPrimaryImage(userId: string, listingId: string, imageId: string): Promise<void> {
    // Verify ownership
    const listing = await this.getMyListingById(userId, listingId);
    if (!listing) {
      throw new Error('No tienes permiso para modificar este listado.');
    }

    // Unset all primaries
    await supabase
      .from('consignment_listing_images')
      .update({ is_primary: false })
      .eq('listing_id', listingId);

    // Set new primary
    const { error } = await supabase
      .from('consignment_listing_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error setting primary image:', error);
      throw new Error('No se pudo establecer la imagen principal.');
    }
  },

  // ============================================================================
  // VIEW & CONTACT TRACKING
  // ============================================================================

  /**
   * Record a view for a listing
   */
  async recordView(listingId: string, viewerId?: string, sessionId?: string, source?: string): Promise<void> {
    const { error } = await supabase
      .from('consignment_listing_views')
      .insert({
        listing_id: listingId,
        viewer_id: viewerId,
        session_id: sessionId,
        source: source,
      });

    if (error) {
      console.error('Error recording view:', error);
      // Don't throw - view tracking shouldn't break the page
    }
  },

  /**
   * Record a contact for a listing
   */
  async recordContact(
    listingId: string,
    contactType: ConsignmentListingContact['contact_type'],
    contacterId?: string,
    contactInfo?: { name?: string; phone?: string; email?: string; message?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('consignment_listing_contacts')
      .insert({
        listing_id: listingId,
        contacter_id: contacterId,
        contact_type: contactType,
        name: contactInfo?.name,
        phone: contactInfo?.phone,
        email: contactInfo?.email,
        message: contactInfo?.message,
        is_read: false,
      });

    if (error) {
      console.error('Error recording contact:', error);
      // Don't throw - contact tracking shouldn't break the flow
    }
  },

  /**
   * Get contacts for a user's listings
   */
  async getMyContacts(userId: string): Promise<ConsignmentListingContact[]> {
    const { data: listings } = await supabase
      .from('consignment_listings')
      .select('id')
      .eq('user_id', userId);

    if (!listings || listings.length === 0) return [];

    const listingIds = listings.map(l => l.id);

    const { data, error } = await supabase
      .from('consignment_listing_contacts')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('No se pudieron obtener los contactos.');
    }
    return data || [];
  },

  /**
   * Mark a contact as read
   */
  async markContactAsRead(userId: string, contactId: string): Promise<void> {
    // Get the contact first to verify ownership through listing
    const { data: contact } = await supabase
      .from('consignment_listing_contacts')
      .select('listing_id')
      .eq('id', contactId)
      .single();

    if (!contact) return;

    // Verify listing ownership
    const listing = await this.getMyListingById(userId, contact.listing_id);
    if (!listing) {
      throw new Error('No tienes permiso para modificar este contacto.');
    }

    const { error } = await supabase
      .from('consignment_listing_contacts')
      .update({ is_read: true })
      .eq('id', contactId);

    if (error) {
      console.error('Error marking contact as read:', error);
      throw new Error('No se pudo marcar el contacto como leido.');
    }
  },

  // ============================================================================
  // PUBLIC METHODS - For viewing approved listings
  // ============================================================================

  /**
   * Get all approved and active consignment listings (for /autos integration)
   */
  async getActiveListings(): Promise<ConsignmentListing[]> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('*')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active consignment listings:', error);
      throw new Error('No se pudieron obtener los listados.');
    }
    return data || [];
  },

  /**
   * Get a single public listing by ID (must be active)
   */
  async getPublicListing(listingId: string): Promise<(ConsignmentListing & { images: ConsignmentListingImage[] }) | null> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching public listing:', error);
      throw new Error('No se pudo obtener el listado.');
    }

    if (!data) return null;

    // Get images
    const images = await this.getListingImages(listingId);

    return { ...data, images };
  },

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get all listings for admin review
   */
  async getAllListingsForAdmin(status?: string): Promise<ConsignmentListing[]> {
    let query = supabase
      .from('consignment_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all listings for admin:', error);
      throw new Error('No se pudieron obtener los listados.');
    }
    return data || [];
  },

  /**
   * Get pending approval listings for admin
   */
  async getPendingApprovalListings(): Promise<ConsignmentListing[]> {
    return this.getAllListingsForAdmin('pending_approval');
  },

  /**
   * Approve a listing (admin only)
   */
  async approveListing(adminId: string, listingId: string, expiresInDays: number = 30): Promise<ConsignmentListing> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        reviewed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error approving listing:', error);
      throw new Error('No se pudo aprobar el listado.');
    }
    return data;
  },

  /**
   * Reject a listing (admin only)
   */
  async rejectListing(adminId: string, listingId: string, reason: string): Promise<ConsignmentListing> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting listing:', error);
      throw new Error('No se pudo rechazar el listado.');
    }
    return data;
  },

  /**
   * Feature/Unfeature a listing (admin only)
   */
  async toggleFeatureListing(listingId: string, featured: boolean, featuredDays?: number): Promise<ConsignmentListing> {
    const updateData: any = {
      is_featured: featured,
      updated_at: new Date().toISOString(),
    };

    if (featured && featuredDays) {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + featuredDays);
      updateData.featured_until = featuredUntil.toISOString();
    } else if (!featured) {
      updateData.featured_until = null;
    }

    const { data, error } = await supabase
      .from('consignment_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling featured listing:', error);
      throw new Error('No se pudo cambiar el estado destacado.');
    }
    return data;
  },

  /**
   * Get admin dashboard stats
   */
  async getAdminStats(): Promise<AdminConsignmentStats> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .select('id, status, price, user_id');

    if (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('No se pudieron obtener las estadisticas.');
    }

    const listings = data || [];
    const uniqueUsers = new Set(listings.map(l => l.user_id));
    const activeListings = listings.filter(l => l.status === 'active' || l.status === 'approved');
    const avgPrice = activeListings.length > 0
      ? activeListings.reduce((sum, l) => sum + (l.price || 0), 0) / activeListings.length
      : 0;

    return {
      total_listings: listings.length,
      pending_approval: listings.filter(l => l.status === 'pending_approval').length,
      approved_active: activeListings.length,
      sold: listings.filter(l => l.status === 'sold').length,
      rejected: listings.filter(l => l.status === 'rejected').length,
      total_users_selling: uniqueUsers.size,
      avg_listing_price: avgPrice,
      total_revenue_potential: activeListings.reduce((sum, l) => sum + (l.price || 0), 0),
    };
  },

  /**
   * Add admin notes to a listing
   */
  async addAdminNotes(listingId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('consignment_listings')
      .update({
        admin_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (error) {
      console.error('Error adding admin notes:', error);
      throw new Error('No se pudieron guardar las notas.');
    }
  },

  /**
   * Mark a listing as sold
   */
  async markAsSold(listingId: string, soldByAdmin: boolean = false): Promise<ConsignmentListing> {
    const { data, error } = await supabase
      .from('consignment_listings')
      .update({
        status: 'sold',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error marking listing as sold:', error);
      throw new Error('No se pudo marcar el listado como vendido.');
    }
    return data;
  },
};

export default ConsignmentService;
