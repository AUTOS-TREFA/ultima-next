'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';
import { checkIsAdmin, isAdminDomain } from '../constants/adminEmails';
import { getEmailRedirectUrl } from '../config';
import { GoogleIcon } from '../components/icons';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { session, profile, isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        // Solo redirigir cuando tenemos sesion Y el auth ya cargo
        if (!authLoading && session) {
            // Check if user is admin by email or profile role
            if (isAdmin || checkIsAdmin(session.user?.email)) {
                router.replace('/escritorio/admin/marketing');
            } else if (profile?.role === 'sales') {
                router.replace('/escritorio/ventas/dashboard');
            } else if (profile) {
                // Usuario normal - no deberia estar en admin login
                router.replace('/escritorio');
            }
        }
    }, [session, profile, isAdmin, router, authLoading]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciales invalidas. Por favor, verifica tu email y contrasena.');
            setLoading(false);
        } else {
            sessionStorage.setItem('justLoggedIn', 'true');

            // Check if user is admin by email (faster than waiting for profile)
            if (data.user && checkIsAdmin(data.user.email)) {
                router.push('/escritorio/admin/marketing');
                return;
            }

            // Fetch user profile to determine role-based redirect
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push('/escritorio/admin/marketing');
                } else if (profile?.role === 'sales') {
                    router.push('/escritorio/ventas/dashboard');
                } else {
                    router.push('/escritorio');
                }
            } else {
                router.push('/escritorio');
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getEmailRedirectUrl(),
                queryParams: {
                    // Restringir a dominio autostrefa.mx
                    hd: 'autostrefa.mx',
                }
            },
        });

        if (error) {
            setError('No pudimos completar el inicio de sesion con Google. Por favor intenta de nuevo.');
            setGoogleLoading(false);
        }
        // La redireccion se manejara automaticamente despues del callback
    };

    // Show loading while auth is checking
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <img className="mx-auto h-12 w-auto" src="/images/trefalogo.png" alt="TREFA" />
                <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
                    Acceso de Administrador
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Portal exclusivo para el equipo de TREFA
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
                    {/* Google Sign In - Primary option for autostrefa.mx domain */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || loading}
                            className="flex w-full items-center justify-center gap-3 rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            {googleLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <GoogleIcon className="h-5 w-5" />
                            )}
                            <span>{googleLoading ? 'Conectando...' : 'Iniciar con cuenta @autostrefa.mx'}</span>
                        </button>
                        <p className="mt-2 text-xs text-center text-gray-500">
                            Usa tu cuenta de Google corporativa
                        </p>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">O usa email y contrasena</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Correo Electronico
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contrasena
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
                            Volver al sitio principal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
