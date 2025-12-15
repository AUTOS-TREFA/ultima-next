'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, ChevronDownIcon, UserIcon } from './icons';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ComprarMegaMenu from './ComprarMegaMenu';
import VenderMegaMenu from './VenderMegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import MobileHeader from './MobileHeader';
import { Button } from './ui/button';

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
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-100/60">
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
                <div className="flex items-center gap-2">
                  {/* Comprar Button */}
                  <Button
                    ref={comprarButtonRef}
                    onClick={handleComprarClick}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-semibold"
                  >
                    <TrendingDown className="w-4 h-4 mr-1.5" />
                    Comprar
                    <ChevronDownIcon className={`w-3.5 h-3.5 ml-1 transition-transform ${comprarMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                  </Button>

                  {/* Vender Button */}
                  <Button
                    ref={venderButtonRef}
                    onClick={handleVenderClick}
                    variant="outline"
                    size="sm"
                    className="text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 font-semibold"
                  >
                    <TrendingUp className="w-4 h-4 mr-1.5" />
                    Vender
                    <ChevronDownIcon className={`w-3.5 h-3.5 ml-1 transition-transform ${venderMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                  </Button>
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