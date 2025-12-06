'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/types';

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
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUserId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[AuthContext] Error reloading profile:', error.message);
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
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[AuthContext] Error signing out:', error);
                // Force local logout even if server signout fails
            }

            // Clear local state regardless of server response
            setSession(null);
            setUser(null);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            localStorage.clear(); // Clear all localStorage items
            console.log('[AuthContext] Signed out successfully');
        } catch (error) {
            console.error('[AuthContext] Unexpected error during sign out:', error);
            // Force local logout even on unexpected errors
            setSession(null);
            setUser(null);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            localStorage.clear();
        }
    };

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
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

        // If not in cache, fetch from Supabase
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[AuthContext] Error fetching profile:', error.message);
                setProfile(null);
                sessionStorage.removeItem('userProfile');
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

            // Profile doesn't exist (PGRST116 error), create it
            console.log('[AuthContext] Profile not found, creating new profile...');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.error('[AuthContext] Cannot create profile: user not found');
                return null;
            }

            // Determine role based on email
            const adminEmails = [
                'marianomorales@outlook.com',
                'mariano.morales@autostrefa.mx',
                'genauservices@gmail.com',
                'alejandro.trevino@autostrefa.mx',
                'evelia.castillo@autostrefa.mx',
                'fernando.trevino@autostrefa.mx'
            ];
            const role = adminEmails.includes(user.email || '') ? 'admin' : 'user';

            // Retrieve tracking data from sessionStorage
            const leadSourceDataStr = sessionStorage.getItem('leadSourceData');
            const leadSourceData = leadSourceDataStr ? JSON.parse(leadSourceDataStr) : {};

            // Merge user metadata with tracking data
            const combinedMetadata = {
                ...user.user_metadata,
                ...leadSourceData,
                captured_at: new Date().toISOString(),
            };

            // Determine primary source (priority: fbclid > utm_source > rfdm > source > ordencompra)
            let primarySource = null;
            if (leadSourceData.fbclid) {
                primarySource = `facebook_${leadSourceData.fbclid.substring(0, 10)}`;
            } else if (leadSourceData.utm_source) {
                primarySource = leadSourceData.utm_source;
            } else if (leadSourceData.rfdm) {
                primarySource = `rfdm_${leadSourceData.rfdm}`;
            } else if (leadSourceData.source) {
                primarySource = leadSourceData.source;
            } else if (leadSourceData.ordencompra) {
                primarySource = `ordencompra_${leadSourceData.ordencompra}`;
            }

            const newProfile = {
                id: userId,
                email: user.email,
                first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
                last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
                phone: user.phone || null,
                role: role,
                metadata: combinedMetadata,
                source: primarySource,
                // Save all tracking fields to dedicated columns
                utm_source: leadSourceData.utm_source || null,
                utm_medium: leadSourceData.utm_medium || null,
                utm_campaign: leadSourceData.utm_campaign || null,
                utm_term: leadSourceData.utm_term || null,
                utm_content: leadSourceData.utm_content || null,
                rfdm: leadSourceData.rfdm || null,
                referrer: leadSourceData.referrer || null,
                fbclid: leadSourceData.fbclid || null,
                landing_page: leadSourceData.landing_page || null,
            };

            const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (createError) {
                console.error('[AuthContext] Error creating profile:', createError.message);
                setProfile(null);
                return null;
            }

            console.log(`[AuthContext] Profile created successfully with role: ${role}`);
            setProfile(createdProfile as Profile);
            sessionStorage.setItem('userProfile', JSON.stringify(createdProfile));
            return createdProfile as Profile;

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
                            await fetchProfile(currentUser.id);
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
                                await fetchProfile(currentUser.id);
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

    const isAdmin = profile?.role === 'admin';
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
