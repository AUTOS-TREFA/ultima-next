'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '../context/AuthContext';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState<number | null>(null); // Track which vehicle is being toggled
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchFavorites = async () => {
            setIsLoading(true);
            if (user) {
                const supabase = createBrowserSupabaseClient();
                const { data, error } = await supabase
                    .from('user_favorites')
                    .select('vehicle_id')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching favorites:', error);
                    setFavorites([]);
                } else {
                    setFavorites(data.map(fav => fav.vehicle_id));
                }
            } else {
                // User is logged out, clear local favorites
                setFavorites([]);
            }
            setIsLoading(false);
        };

        fetchFavorites();
    }, [user?.id]);

    const isFavorite = useCallback((vehicleId: number): boolean => {
        return favorites.includes(vehicleId);
    }, [favorites]);

    const toggleFavorite = useCallback(async (vehicleId: number) => {
        if (isToggling === vehicleId) return; // Prevent multiple clicks

        if (!user) {
            const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
            localStorage.setItem('loginRedirect', fullPath);
            router.push('/acceder');
            return;
        }

        setIsToggling(vehicleId);
        const supabase = createBrowserSupabaseClient();
        const isCurrentlyFavorite = favorites.includes(vehicleId);

        if (isCurrentlyFavorite) {
            setFavorites(prev => prev.filter(id => id !== vehicleId));
            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .match({ user_id: user.id, vehicle_id: vehicleId });

            if (error) {
                console.error('Error removing favorite:', error);
                setFavorites(prev => [...prev, vehicleId]); // Revert
            }
        } else {
            setFavorites(prev => [...prev, vehicleId]);
            const { error } = await supabase
                .from('user_favorites')
                .insert({ user_id: user.id, vehicle_id: vehicleId });

            if (error) {
                console.error('Error adding favorite:', error);
                setFavorites(prev => prev.filter(id => id !== vehicleId)); // Revert
            }
        }
        setIsToggling(null);
    }, [favorites, user, router, pathname, searchParams, isToggling]);

    return { favorites, isFavorite, toggleFavorite, isLoading, isToggling };
};
