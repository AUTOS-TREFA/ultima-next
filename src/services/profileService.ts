import { supabase } from '../../supabaseClient'; // ✅ import directly from your Supabase client

export const ProfileService = {
  /** Actualiza o crea un perfil público del usuario autenticado */
  async updateProfile(profileData: {
    phone?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  }, providedUserId?: string) {
    // Use provided userId or get from session
    let userId = providedUserId;

    if (!userId) {
      // Try getSession first (more reliable than getUser for immediate checks)
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;

      // Fallback to getUser if session doesn't have user
      if (!userId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('[ProfileService] Auth error:', authError.message);
        }
        userId = user?.id;
      }
    }

    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Create a user-like object for compatibility
    const user = { id: userId };

    // Check for source tracking data and include it if available (only on first save)
    let finalProfileData = { ...profileData };

    try {
      const sourceDataStr = sessionStorage.getItem('leadSourceData');
      if (sourceDataStr) {
        const sourceData = JSON.parse(sourceDataStr);

        // Check if this profile already has source tracking data
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('utm_source, first_visit_at')
          .eq('id', user.id)
          .single();

        // Only add source tracking if it hasn't been set yet
        if (!existingProfile || !existingProfile.first_visit_at) {
          finalProfileData = {
            ...finalProfileData,
            utm_source: sourceData.utm_source || null,
            utm_medium: sourceData.utm_medium || null,
            utm_campaign: sourceData.utm_campaign || null,
            utm_term: sourceData.utm_term || null,
            utm_content: sourceData.utm_content || null,
            rfdm: sourceData.rfdm || null,
            referrer: sourceData.referrer || null,
            landing_page: sourceData.landing_page || null,
            first_visit_at: sourceData.first_visit_at || new Date().toISOString(),
          };

          // Clear the session storage after successfully including it
          sessionStorage.removeItem('leadSourceData');
        }
      }
    } catch (e) {
      // If there's any error reading source tracking, just continue without it
      console.log('Could not retrieve source tracking data:', e);
    }

    // Use RPC function with SECURITY DEFINER to bypass RLS issues
    let updatedProfile = null;
    const maxRetries = 3;
    const retryDelayMs = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // First try the RPC function (SECURITY DEFINER bypasses RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('safe_upsert_profile', {
        profile_data: { id: user.id, ...finalProfileData }
      });

      if (!rpcError && rpcData) {
        updatedProfile = rpcData;
        console.log('[ProfileService] Profile upsert via RPC successful');
        break;
      }

      // If RPC fails, try direct upsert as fallback
      if (rpcError) {
        console.warn('[ProfileService] RPC failed, trying direct upsert:', rpcError.message);
      }

      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, ...finalProfileData, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (!upsertError) {
        updatedProfile = data;
        console.log('[ProfileService] Profile upsert via direct query successful');
        break;
      }

      // Check if this is an RLS/auth timing error - retry
      const isAuthError = upsertError.code === '42501' || // RLS violation
                          upsertError.code === 'P0001' ||  // Custom auth check failed
                          upsertError.message?.includes('row-level security') ||
                          upsertError.message?.includes('no autenticado');

      if (isAuthError && attempt < maxRetries) {
        console.warn(`[ProfileService] Auth/RLS issue (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
        continue;
      }

      // For other errors or final retry, throw
      console.error('Error upserting profile:', upsertError);
      throw new Error(`Error al actualizar el perfil: ${upsertError.message}`);
    }

    if (!updatedProfile) {
      // If all retries failed, try to fetch existing profile as fallback
      console.warn('[ProfileService] Upsert failed after retries, attempting fallback fetch...');
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        updatedProfile = existingProfile;
        console.log('[ProfileService] Fallback fetch successful');
      } else {
        throw new Error('No se pudo obtener el perfil actualizado después de guardar.');
      }
    }

    // Update sessionStorage cache to keep in sync with database
    try {
      sessionStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✅ Profile cache updated in sessionStorage');
    } catch (e) {
      console.warn('Could not update sessionStorage cache:', e);
      // Non-critical error - don't throw, profile was successfully updated in DB
    }

    // Dispatch custom event to notify AuthContext of profile update
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));

    return updatedProfile;
  },

  /** Obtiene el perfil público de un usuario por ID usando RPC para evitar problemas de RLS */
  async getProfile(userId: string) {
    // Use RPC function with SECURITY DEFINER to bypass RLS
    const { data: profile, error } = await supabase.rpc('get_my_profile', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching profile via RPC:', error.message, {
        code: error.code,
        details: error.details,
      });

      // Fallback to direct query if RPC fails
      console.log('[ProfileService] Attempting direct query as fallback...');
      const { data: directProfile, error: directError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (directError && directError.code !== 'PGRST116') {
        console.error('Error fetching profile directly:', directError.message);
        throw new Error(`Could not fetch profile: ${directError.message}`);
      }

      return directProfile;
    }

    return profile;
  },

  /** Asigna un asesor disponible a un usuario (balancea por last_assigned_at) */
  async assignAdvisorToUser(userId: string) {
    try {
      const { data, error } = await supabase.rpc('assign_advisor', {
        user_id_to_assign: userId
      });

      if (error) {
        console.error('Error calling assign_advisor function:', error);
        throw new Error('Could not assign advisor via RPC.');
      }

      console.log('Successfully assigned advisor via RPC:', data);
      return data; // The RPC should return the assigned advisor's ID
    } catch (rpcError) {
      console.error('Caught exception in assignAdvisorToUser:', rpcError);
      throw rpcError;
    }
  },

  /** Sube la foto de perfil del usuario */
  async uploadProfilePicture(userId: string, file: File) {
    const extension = file.name.split('.').pop();
    const path = `public/avatars/${userId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(path, file, { upsert: false }); // Use upsert: false to ensure a new file is created

    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      throw new Error('Could not upload profile picture.');
    }

    const { data } = supabase.storage.from('profile-pictures').getPublicUrl(path);
    return data.publicUrl;
  },
};