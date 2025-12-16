'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOutIcon, Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import type { WordPressVehicle } from '../types/types';
import { formatPrice } from '../utils/formatters';

// Use absolute URL to ensure logo loads correctly across all domains
const LOGO_URL = 'https://trefa.mx/images/trefalogo.png';

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const MobileHeader: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<WordPressVehicle[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { session, profile, signOut } = useAuth();
    const { vehicles: allVehicles } = useVehicles();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isSalesUser = profile?.role === 'sales';

    const handleSignOut = async () => {
        setMobileMenuOpen(false);
        try {
            // Clear all storage before signOut
            sessionStorage.clear();
            localStorage.clear();
            await signOut();
        } catch (error) {
            console.error('Error during sign out:', error);
        } finally {
            // Force full page reload to clear all state and go to home
            window.location.href = '/';
        }
    };

    const handleMobileLinkClick = (path: string) => {
        setMobileMenuOpen(false);
        router.push(path);
    };

    // Auto-focus search input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Search logic
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        const handler = setTimeout(() => {
            try {
                const lowercasedQuery = query.toLowerCase();
                const filtered = allVehicles.filter(v =>
                    v.title.toLowerCase().includes(lowercasedQuery) ||
                    (v.marca && v.marca.toLowerCase().includes(lowercasedQuery)) ||
                    (v.modelo && v.modelo.toLowerCase().includes(lowercasedQuery)) ||
                    (v.autoano && v.autoano.toString().includes(lowercasedQuery))
                );
                setResults(filtered.slice(0, 5));
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query, allVehicles]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchOpen(false);
            setQuery('');
            router.push(`/autos?search=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleResultClick = (slug: string) => {
        setSearchOpen(false);
        setQuery('');
        router.push(`/autos/${slug}`);
    };

    return (
        <>
            {/* Main Mobile Header - Fixed with compact design */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-sm">
                <div className="flex items-center justify-between h-16 px-3">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <img
                            src={LOGO_URL}
                            alt="TREFA"
                            className="h-6 w-auto object-contain"
                        />
                    </Link>

                    {/* Right side buttons */}
                    <div className="flex items-center gap-2">
                        {/* Search Icon Button */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Abrir búsqueda"
                        >
                            <SearchIcon className="w-5 h-5" />
                        </button>

                        {/* Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Abrir menú"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Full-Screen Search Overlay */}
            {searchOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white">
                    {/* Search Header */}
                    <div className="flex items-center gap-3 p-3 shadow-sm">
                        <button
                            onClick={() => {
                                setSearchOpen(false);
                                setQuery('');
                                setResults([]);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                            aria-label="Cerrar búsqueda"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleSearchSubmit} className="flex-1">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar marca, modelo, año..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                                    autoComplete="off"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Search Results */}
                    <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
                        {isSearching ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {results.map(vehicle => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => handleResultClick(vehicle.slug)}
                                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        <img
                                            src={vehicle.feature_image?.[0] || '/placeholder-vehicle.webp'}
                                            alt={vehicle.title}
                                            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                                                {vehicle.title}
                                            </p>
                                            <p className="text-sm text-primary-600 font-bold mt-0.5">
                                                {formatPrice(vehicle.precio)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                                {query.length >= 2 && (
                                    <button
                                        onClick={() => {
                                            setSearchOpen(false);
                                            setQuery('');
                                            router.push(`/autos?search=${encodeURIComponent(query)}`);
                                        }}
                                        className="w-full text-center py-4 text-sm font-semibold text-primary-600 hover:bg-gray-50"
                                    >
                                        Ver todos los resultados para "{query}"
                                    </button>
                                )}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <SearchIcon className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-600 font-medium">No se encontraron resultados</p>
                                <p className="text-sm text-gray-500 mt-1">Intenta con otra búsqueda</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <SearchIcon className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-600 font-medium">Busca tu auto ideal</p>
                                <p className="text-sm text-gray-500 mt-1">Escribe marca, modelo o año</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40" style={{ top: '64px' }}>
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
                        <div className="p-6 space-y-4">
                            {session ? (
                                <>
                                    <div className="pb-4 border-b border-gray-200">
                                        <p className="text-sm text-gray-500">Conectado como</p>
                                        <p className="font-semibold text-gray-900">
                                            {profile?.first_name || profile?.email}
                                        </p>
                                    </div>
                                    {isSalesUser ? (
                                        <button
                                            onClick={() => handleMobileLinkClick('/escritorio/ventas/crm')}
                                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                        >
                                            Mis Leads
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleMobileLinkClick('/escritorio')}
                                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                        >
                                            Escritorio
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleMobileLinkClick('/autos')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Inventario
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/escritorio/profile')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Mi Perfil
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/escritorio/seguimiento')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Mis Solicitudes
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/promociones')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Promociones
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/escritorio/favoritos')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Mis Favoritos
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/vender-mi-auto')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Vender mi auto
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/faq')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Ayuda/FAQs
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 font-semibold text-red-600 mt-4"
                                    >
                                        <LogOutIcon className="w-5 h-5" /> Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Primary CTA - Blue #003161 */}
                                    <button
                                        onClick={() => handleMobileLinkClick('/acceder')}
                                        className="w-full text-center px-6 py-3 rounded-lg bg-[#003161] hover:bg-[#002850] text-white font-semibold shadow-md transition-all duration-300"
                                    >
                                        Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/autos')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Ver Inventario
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/promociones')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Promociones
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/vender-mi-auto')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Vender mi auto
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/faq')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Ayuda/FAQs
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileHeader;
