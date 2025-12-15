'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/types';
import { checkIsAdmin } from '../constants/adminEmails';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isSales: boolean;
    isMarketing: boolean;
    signOut: () => Promise<void>;
    reloadProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const reloadProfile = useCallback(async (): Promise<Profile | null> => {
        const currentUserId = user?.id;
        if (!currentUserId) {
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }

        sessionStorage.removeItem('userProfile'); // Clear cache before fetching

        try {
            // Use RPC function with SECURITY DEFINER to bypass RLS
            const { data, error } = await supabase.rpc('get_my_profile', {
                user_id: currentUserId
            });

            if (error) {
                console.error('[AuthContext] Error reloading profile via RPC:', error.message);
                setProfile(null);
                return null;
            }

            if (data) {
                // Validate role before caching
                if (data.role && ['user', 'sales', 'admin', 'marketing'].includes(data.role)) {
                    console.log('[AuthContext] Profile reloaded from Supabase with role:', data.role);
                    setProfile(data as Profile);
                    sessionStorage.setItem('userProfile', JSON.stringify(data));
                    return data as Profile;
                } else {
                    console.error('[AuthContext] Invalid role in profile data:', data.role);
                    setProfile(null);
                    sessionStorage.removeItem('userProfile');
                    return null;
                }
            }

            // If no data, ensure profile is cleared
            setProfile(null);
            return null;

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error("[AuthContext] Unexpected error in reloadProfile:", errorMessage);
            setProfile(null);
            return null;
        }
    }, [user?.id]); // Only depend on user.id, not the whole user object

    const signOut = async () => {
        try {
            console.log('[AuthContext] Signing out...');

            // Clear local state FIRST to ensure immediate UI update
            setSession(null);
            setUser(null);
            setProfile(null);

            // Clear all storage
            sessionStorage.clear();
            localStorage.clear();

            // Clear any auth-related cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // Sign out from Supabase (local scope to only sign out current browser)
            const { error } = await supabase.auth.signOut({ scope: 'local' });

            if (error) {
                console.error('[AuthContext] Error signing out from Supabase:', error);
            }

            console.log('[AuthContext] Signed out successfully');
        } catch (error) {
            console.error('[AuthContext] Unexpected error during sign out:', error);
            // Force local logout even on unexpected errors
            setSession(null);
            setUser(null);
            setProfile(null);
            sessionStorage.clear();
            localStorage.clear();
        }
    };

    const fetchProfile = useCallback(async (userId: string, authUser?: User | null): Promise<Profile | null> => {
        // Try to get from cache first
        try {
            const cachedProfile = sessionStorage.getItem('userProfile');
            if (cachedProfile) {
                const parsed = JSON.parse(cachedProfile);
                // Enhanced validation: check user ID and role validity
                if (parsed.id === userId && parsed.role && ['user', 'sales', 'admin', 'marketing'].includes(parsed.role)) {
                    console.log('[AuthContext] Profile loaded from sessionStorage cache with role:', parsed.role);
                    setProfile(parsed);
                    return parsed;
                } else {
                    // Invalid cache - clear it
                    console.warn('[AuthContext] Invalid cached profile detected, clearing cache');
                    sessionStorage.removeItem('userProfile');
                }
            }
        } catch (e) {
            console.warn("[AuthContext] Could not read profile from sessionStorage.", e);
            sessionStorage.removeItem('userProfile'); // Clear corrupted cache
        }

        // Use the authUser passed from the session event, or try to get it as fallback
        let userForProfile = authUser;
        if (!userForProfile) {
            console.log('[AuthContext] No authUser provided, attempting getUser() as fallback...');
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            userForProfile = fetchedUser;
        }

        // Retrieve tracking data from sessionStorage
        const leadSourceDataStr = sessionStorage.getItem('leadSourceData');
        const leadSourceData = leadSourceDataStr ? JSON.parse(leadSourceDataStr) : {};

        // Merge user metadata with tracking data
        const combinedMetadata = {
            ...(userForProfile?.user_metadata || {}),
            ...leadSourceData,
            captured_at: new Date().toISOString(),
        };

        try {
            // Use get_or_create_profile RPC with SECURITY DEFINER to bypass RLS
            // This function will return existing profile or create a new one
            console.log('[AuthContext] Fetching/creating profile via RPC for user:', userId);
            const { data, error } = await supabase.rpc('get_or_create_profile', {
                p_user_id: userId,
                p_email: userForProfile?.email || null,
                p_first_name: userForProfile?.user_metadata?.first_name || userForProfile?.user_metadata?.full_name?.split(' ')[0] || null,
                p_last_name: userForProfile?.user_metadata?.last_name || userForProfile?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
                p_phone: userForProfile?.phone || null,
                p_metadata: combinedMetadata
            });

            if (error) {
                console.error('[AuthContext] Error fetching/creating profile via RPC:', error.message);

                // Fallback: try safe_upsert_profile as backup
                console.log('[AuthContext] Trying safe_upsert_profile as fallback...');
                const newProfile = {
                    id: userId,
                    email: userForProfile?.email,
                    first_name: userForProfile?.user_metadata?.first_name || userForProfile?.user_metadata?.full_name?.split(' ')[0] || null,
                    last_name: userForProfile?.user_metadata?.last_name || userForProfile?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
                    phone: userForProfile?.phone || null,
                    metadata: combinedMetadata,
                    utm_source: leadSourceData.utm_source || null,
                    utm_medium: leadSourceData.utm_medium || null,
                    utm_campaign: leadSourceData.utm_campaign || null,
                    rfdm: leadSourceData.rfdm || null,
                    referrer: leadSourceData.referrer || null,
                    fbclid: leadSourceData.fbclid || null,
                    landing_page: leadSourceData.landing_page || null,
                };

                const { data: fallbackData, error: fallbackError } = await supabase.rpc('safe_upsert_profile', {
                    profile_data: newProfile
                });

                if (fallbackError) {
                    console.error('[AuthContext] Fallback RPC also failed:', fallbackError.message);
                    setProfile(null);
                    sessionStorage.removeItem('userProfile');
                    return null;
                }

                if (fallbackData) {
                    console.log('[AuthContext] Profile fetched via fallback RPC with role:', fallbackData.role);
                    setProfile(fallbackData as Profile);
                    sessionStorage.setItem('userProfile', JSON.stringify(fallbackData));
                    return fallbackData as Profile;
                }

                setProfile(null);
                return null;
            }

            if (data) {
                // Validate role before caching
                if (data.role && ['user', 'sales', 'admin', 'marketing'].includes(data.role)) {
                    console.log('[AuthContext] Profile fetched from Supabase with role:', data.role);
                    setProfile(data as Profile);
                    sessionStorage.setItem('userProfile', JSON.stringify(data));
                    return data as Profile;
                } else {
                    console.error('[AuthContext] Invalid role in fetched profile:', data.role);
                    setProfile(null);
                    sessionStorage.removeItem('userProfile');
                    return null;
                }
            }

            // No profile returned - this shouldn't happen with get_or_create_profile
            console.warn('[AuthContext] No profile returned from RPC');
            setProfile(null);
            return null;

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            console.error("[AuthContext] Unexpected error in fetchProfile:", errorMessage);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }
    }, []); // No dependencies - stable function

    useEffect(() => {
        setLoading(true);

        // Safety timeout to prevent eternal loading states
        const loadingTimeout = setTimeout(() => {
            console.warn('[AuthContext] Loading timeout reached - forcing loading to false');
            setLoading(false);
        }, 10000); // 10 second timeout

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                try {
                    console.log('[AuthContext] Auth state change:', event);

                    if (event === 'INITIAL_SESSION') {
                        setSession(session);
                        const currentUser = session?.user ?? null;
                        setUser(currentUser);
                        if (currentUser) {
                            // Pass the user object to avoid race conditions
                            await fetchProfile(currentUser.id, currentUser);
                        } else {
                            setProfile(null);
                            sessionStorage.removeItem('userProfile');
                        }
                        clearTimeout(loadingTimeout); // Clear timeout on success
                        setLoading(false);
                    } else if (event === 'SIGNED_IN') {
                        console.log('[AuthContext] SIGNED_IN event - checking if profile needs refresh');
                        setSession(session);
                        const currentUser = session?.user ?? null;
                        setUser(currentUser);
                        if (currentUser) {
                            // Check if we already have a valid cached profile with correct role
                            const cachedProfile = sessionStorage.getItem('userProfile');
                            let needsRefresh = true;

                            if (cachedProfile) {
                                try {
                                    const parsed = JSON.parse(cachedProfile);
                                    if (parsed.id === currentUser.id && parsed.role && ['user', 'sales', 'admin', 'marketing'].includes(parsed.role)) {
                                        console.log('[AuthContext] Valid cached profile exists with role:', parsed.role, '- skipping refresh');
                                        needsRefresh = false;
                                        setProfile(parsed);
                                    }
                                } catch (e) {
                                    console.warn('[AuthContext] Failed to parse cached profile');
                                }
                            }

                            if (needsRefresh) {
                                console.log('[AuthContext] Refreshing profile from database');
                                // Update last_sign_in_at in profiles table
                                await supabase
                                    .from('profiles')
                                    .update({ last_sign_in_at: new Date().toISOString() })
                                    .eq('id', currentUser.id);
                                // Pass the user object to avoid race conditions
                                await fetchProfile(currentUser.id, currentUser);
                            }
                        }
                    } else if (event === 'SIGNED_OUT') {
                        setSession(null);
                        setUser(null);
                        setProfile(null);
                        sessionStorage.removeItem('userProfile');
                    }
                } catch (error) {
                    console.error('[AuthContext] Error in auth state change handler:', error);
                } finally {
                    // Ensure loading is always set to false eventually
                    clearTimeout(loadingTimeout);
                    setLoading(false);
                }
            }
        );

        return () => {
            clearTimeout(loadingTimeout);
            subscription?.unsubscribe();
        };
    }, [fetchProfile]); // fetchProfile is now stable (no dependencies)

    // Listen for profile updates from ProfileService
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent<Profile>) => {
            console.log('[AuthContext] Profile update event received');
            if (event.detail && event.detail.id === user?.id) {
                setProfile(event.detail);
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
        };
    }, [user?.id]);

    useEffect(() => {
        // Only run once when profile is first loaded and needs agent assignment
        // Use ref to track if assignment is in progress or already done
        const profileId = profile?.id;
        const profileRole = profile?.role;
        const profileAsesorId = profile?.asesor_asignado_id;

        // Skip if no profile, already has advisor, or not a user
        if (!profile || profileRole !== 'user' || profileAsesorId) {
            return;
        }

        // Use a flag in sessionStorage to prevent duplicate assignments
        const assignmentKey = `advisor_assignment_${profileId}`;
        if (sessionStorage.getItem(assignmentKey)) {
            return; // Already attempted assignment for this profile
        }

        const assignAgent = async () => {
            try {
                // Mark that we're attempting assignment
                sessionStorage.setItem(assignmentKey, 'in_progress');

                const { data: agentId, error: rpcError } = await supabase.rpc('get_next_sales_agent');
                if (rpcError) {
                    console.error('[AuthContext] Error assigning sales agent:', rpcError);
                    sessionStorage.removeItem(assignmentKey); // Allow retry on error
                } else if (agentId) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ asesor_asignado_id: agentId })
                        .eq('id', profileId);
                    if (updateError) {
                        console.error('[AuthContext] Error updating profile with agent ID:', updateError);
                        sessionStorage.removeItem(assignmentKey); // Allow retry on error
                    } else {
                        // Update profile locally without triggering reloadProfile to avoid loops
                        const updatedProfile = { ...profile, asesor_asignado_id: agentId };
                        // Update sessionStorage BEFORE updating state to prevent race conditions
                        sessionStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                        setProfile(updatedProfile);
                        sessionStorage.setItem(assignmentKey, 'completed');
                        console.log('[AuthContext] Agent assigned and profile cache updated');
                    }
                }
            } catch (e) {
                console.error("[AuthContext] Unexpected error in agent assignment effect:", e);
                sessionStorage.removeItem(assignmentKey); // Allow retry on error
            }
        };
        assignAgent();
    }, [profile?.id, profile?.role, profile?.asesor_asignado_id]); // Only depend on specific primitive values

    // Check admin status by both role and email
    const isAdmin = profile?.role === 'admin' || checkIsAdmin(user?.email);
    const isSales = profile?.role === 'sales';
    const isMarketing = profile?.role === 'marketing';

    const value = {
        session,
        user,
        profile,
        loading,
        isAdmin,
        isSales,
        isMarketing,
        signOut,
        reloadProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
