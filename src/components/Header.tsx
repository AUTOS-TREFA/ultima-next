'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, UserIcon } from './icons';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ComprarMegaMenu from './ComprarMegaMenu';
import VenderMegaMenu from './VenderMegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import MobileHeader from './MobileHeader';

// Use absolute URL to ensure logo loads correctly across all domains
const LOGO_URL = 'https://trefa.mx/images/trefalogo.png';

const Header: React.FC = () => {
    const [comprarMenuOpen, setComprarMenuOpen] = useState(false);
    const [venderMenuOpen, setVenderMenuOpen] = useState(false);
    const { session, profile, signOut } = useAuth();
    const comprarButtonRef = useRef<HTMLButtonElement>(null);
    const venderButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const isListPage = pathname === '/autos';
    const isSalesUser = profile?.role === 'sales';

    const handleComprarClick = () => {
        setComprarMenuOpen(o => !o);
        setVenderMenuOpen(false);
    };

    const handleVenderClick = () => {
        setVenderMenuOpen(o => !o);
        setComprarMenuOpen(false);
    };

    const handleSignOut = async () => {
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

    return (
      <>
        {/* Mobile Header - Only visible on mobile */}
        <MobileHeader />

        {/* Desktop Header - Hidden on mobile */}
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-white shadow-sm">
          <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center h-[74px] gap-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                  <Link href="/" className="flex items-center">
                    <img
                      src={LOGO_URL}
                      alt="TREFA"
                      className="h-7 w-auto object-contain"
                    />
                  </Link>
              </div>

              {/* Center Section (Search) */}
              <div className={`flex-1 min-w-0 mx-4 ${isListPage ? 'lg:hidden' : ''}`}>
                  <HeaderSearchBar />
              </div>

              {/* Right Section - Desktop Menu and Auth */}
              <div className={`flex items-center flex-shrink-0 ${isListPage ? 'ml-auto' : ''}`}>
                {/* Action Buttons */}
                <div className="flex items-center gap-2.5">
                  {/* Comprar Button - Dark blue gradient */}
                  <button
                    ref={comprarButtonRef}
                    onClick={handleComprarClick}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-white font-bold text-sm bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-sm hover:shadow transition-all"
                  >
                    <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                    Comprar
                  </button>

                  {/* Vender Button - Orange gradient */}
                  <button
                    ref={venderButtonRef}
                    onClick={handleVenderClick}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-white font-bold text-sm bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-sm hover:shadow transition-all"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    Vender
                  </button>
                </div>

                {/* Separator */}
                <div className="h-6 w-px bg-gray-200 mx-4" />

                {/* Auth Section */}
                <div className="flex items-center gap-3">
                  {session ? (
                    <>
                      <Link
                        href={isSalesUser ? "/escritorio/ventas/crm" : "/escritorio"}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Salir
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/acceder"
                      data-gtm-id="header-login-button"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {/* Comprar Mega Menu */}
            <ComprarMegaMenu
              isOpen={comprarMenuOpen}
              onClose={() => setComprarMenuOpen(false)}
              triggerRef={comprarButtonRef as React.RefObject<HTMLButtonElement>}
            />

            {/* Vender Mega Menu */}
            <VenderMegaMenu
              isOpen={venderMenuOpen}
              onClose={() => setVenderMenuOpen(false)}
              triggerRef={venderButtonRef as React.RefObject<HTMLButtonElement>}
            />
          </div>
        </header>
      </>
    );
};

export default Header;