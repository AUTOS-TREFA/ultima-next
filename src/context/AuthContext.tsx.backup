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
                console.error('❌ Error reloading profile:', error.message);
                setProfile(null);
                return null;
            }

            if (data) {
                console.log('✅ Profile reloaded from Supabase and cached.');
                setProfile(data as Profile);
                sessionStorage.setItem('userProfile', JSON.stringify(data));
                return data as Profile;
            }

            // If no data, ensure profile is cleared
            setProfile(null);
            return null;

        } catch (e: any) {
            console.error("❌ Unexpected error in reloadProfile:", e.message);
            setProfile(null);
            return null;
        }
    }, [user?.id]); // Only depend on user.id, not the whole user object

    const signOut = async () => {
        try {
            console.log('🔒 Signing out...');
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('❌ Error signing out:', error);
                // Force local logout even if server signout fails
            }

            // Clear local state regardless of server response
            setSession(null);
            setUser(null);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            localStorage.clear(); // Clear all localStorage items
            console.log('✅ Signed out successfully');
        } catch (error) {
            console.error('❌ Unexpected error during sign out:', error);
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
                // Basic validation to ensure the cached profile belongs to the current user
                if (parsed.id === userId) {
                    console.log('✅ Profile loaded from sessionStorage cache.');
                    setProfile(parsed);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Could not read profile from sessionStorage.", e);
        }

        // If not in cache, fetch from Supabase
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error fetching profile:', error.message);
                setProfile(null);
                sessionStorage.removeItem('userProfile');
                return null;
            }

            if (data) {
                console.log('✅ Profile fetched from Supabase and cached.');
                setProfile(data as Profile);
                sessionStorage.setItem('userProfile', JSON.stringify(data));
                return data as Profile;
            }

            // Profile doesn't exist (PGRST116 error), create it
            console.log('⚠️ Profile not found, creating new profile...');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.error('❌ Cannot create profile: user not found');
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
            };

            const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (createError) {
                console.error('❌ Error creating profile:', createError.message);
                setProfile(null);
                return null;
            }

            console.log(`✅ Profile created successfully with role: ${role}`);
            setProfile(createdProfile as Profile);
            sessionStorage.setItem('userProfile', JSON.stringify(createdProfile));
            return createdProfile as Profile;

        } catch (e: any) {
            console.error("❌ Unexpected error in fetchProfile:", e.message);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }
    }, []); // No dependencies - stable function

    useEffect(() => {
        setLoading(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
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
                    setLoading(false);
                } else if (event === 'SIGNED_IN') {
                    setSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);
                    if (currentUser) {
                        await fetchProfile(currentUser.id);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    sessionStorage.removeItem('userProfile');
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchProfile]); // fetchProfile is now stable (no dependencies)

    useEffect(() => {
        if (profile && profile.role === 'user' && !profile.asesor_asignado_id) {
            const assignAgent = async () => {
                try {
                    const { data: agentId, error: rpcError } = await supabase.rpc('get_next_sales_agent');
                    if (rpcError) {
                        console.error('Error assigning sales agent:', rpcError);
                    } else if (agentId) {
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ asesor_asignado_id: agentId })
                            .eq('id', profile.id);
                        if (updateError) {
                            console.error('Error updating profile with agent ID:', updateError);
                        } else {
                            // Reload profile to get the latest data and update cache
                            await reloadProfile();
                        }
                    }
                } catch (e) {
                    console.error("Unexpected error in agent assignment effect:", e);
                }
            };
            assignAgent();
        }
    }, [profile, reloadProfile]);

    const isAdmin = profile?.role === 'admin';
    const isSales = profile?.role === 'sales';

    const value = {
        session,
        user,
        profile,
        loading,
        isAdmin,
        isSales,
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
