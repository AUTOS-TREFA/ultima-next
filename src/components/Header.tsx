'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserIcon, LogOutIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import MegaMenu from './MegaMenu';
import HeaderSearchBar from './HeaderSearchBar';

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const Header: React.FC = () => {
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { session, profile, signOut } = useAuth();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isListPage = pathname === '/autos';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
    };

    const handleMobileLinkClick = (path: string) => {
        setMobileMenuOpen(false);
        router.push(path);
    };

    return (
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200/80">
        <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-28 gap-x-2 lg:gap-x-4">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle mobile menu"
            >
                <MenuIcon className="w-5 h-5" />
            </button>

            {/* Left Section */}
            <div className={`flex justify-start items-center flex-shrink-0 ${!isListPage ? 'w-auto lg:w-1/3' : ''}`}>
                <div className="flex items-center">
                    <Link href="/" className="flex items-center">
                      <img
                        src={"/images/trefalogo.png"}
                        alt="TREFA"
                        className="w-auto object-contain transition-all h-3.5 sm:h-4 lg:h-9"
                      />
                    </Link>
                </div>
            </div>

            {/* Center Section (Search) */}
            {/* Show on all pages on mobile, hide on listings page on desktop (desktop has filter search) */}
            <div className={`flex-1 flex justify-center min-w-0 px-2 lg:px-2 ${isListPage ? 'lg:hidden' : ''}`}>
                <HeaderSearchBar />
            </div>

            {/* Right Section */}
            <div className={`flex justify-end items-center flex-shrink-0 ${!isListPage ? 'w-auto lg:w-1/3' : ''}`}>
                <div className="flex items-center space-x-2 lg:space-x-6">
                  <div className="hidden lg:block">
                      <button ref={menuButtonRef} onClick={() => setMegaMenuOpen(o => !o)} className="flex items-center gap-2 rounded-lg px-4 py-2 text-base font-bold transition-colors text-primary-600 border-b hover:bg-gray-100">
                          <span>Menú</span>
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                      </button>
                  </div>

                  {session ? (
                     <div className="relative hidden lg:block" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(o => !o)}
                            className="flex items-center gap-2 text-base font-semibold transition-colors text-gray-700 hover:text-primary-600"
                        >
                            <UserIcon className="w-8 h-8 rounded-full p-1.5 bg-white text-gray-500" />
                            <span className="hidden sm:inline">{profile?.first_name ? `Hola, ${profile.first_name}` : ' '}</span>
                        </button>
                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-40 bg-white">
                                <Link
                                    href="/escritorio"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 active:bg-red-100"
                                >
                                    <LogOutIcon className="w-4 h-4" /> Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                  ) : (
                    <Link
                      href="/acceder"
                      data-gtm-id="header-login-button"
                      className="hidden lg:block text-base font-semibold transition-all duration-300 px-5 py-2.5 rounded-lg text-white shadow-sm hover:shadow-md bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transform-gpu active:scale-95"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
            </div>
          </div>
          <MegaMenu
            isOpen={megaMenuOpen}
            onClose={() => setMegaMenuOpen(false)}
            triggerRef={menuButtonRef as any}
          />
        </div>

        {/* Mobile Sidebar Menu */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" style={{ top: '64px' }}>
                <div
                    className="absolute inset-0 bg-black/60"
                    onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
                    <div className="p-6 space-y-4">
                        {session ? (
                            <>
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-sm text-gray-500">Conectado como</p>
                                    <p className="font-semibold text-gray-900">{profile?.first_name || profile?.email}</p>
                                </div>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mi Escritorio
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/profile')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mi Perfil
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/favoritos')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mis Favoritos
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/seguimiento')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mis Solicitudes
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 font-semibold text-red-600 mt-4"
                                >
                                    <LogOutIcon className="w-5 h-5" /> Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleMobileLinkClick('/acceder')}
                                className="w-full text-center px-6 py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold shadow-md"
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </header>
    );
};

export default Header;