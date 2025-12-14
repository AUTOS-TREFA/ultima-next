'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, ChevronDownIcon, BuyCarIcon, SellCarIcon, UserIcon } from './icons';
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
              <div className={`flex items-center space-x-4 flex-shrink-0 ${isListPage ? 'ml-auto' : ''}`}>
                {/* Comprar Button - Dark Blue */}
                <button
                    ref={comprarButtonRef}
                    onClick={handleComprarClick}
                    className="inline-flex items-center text-sm font-semibold text-blue-800 hover:text-blue-900 transition-colors"
                >
                    <BuyCarIcon className="w-4 h-4 mr-1.5" />
                    <span>Comprar</span>
                    <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${comprarMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                </button>

                {/* Vender Button - Orange */}
                <button
                    ref={venderButtonRef}
                    onClick={handleVenderClick}
                    className="inline-flex items-center text-sm font-semibold text-[#FF6801] hover:text-[#E55E01] transition-colors"
                >
                    <SellCarIcon className="w-4 h-4 mr-1.5" />
                    <span>Vender</span>
                    <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${venderMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                </button>

                {session ? (
                   <>
                      {/* Dashboard Link */}
                      <Link
                          href={isSalesUser ? "/escritorio/ventas/crm" : "/escritorio"}
                          className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                      >
                          <UserIcon className="w-4 h-4 mr-1.5" />
                          <span>Dashboard</span>
                      </Link>

                      {/* Sign Out Link */}
                      <button
                          onClick={handleSignOut}
                          className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                      >
                          <LogOutIcon className="w-4 h-4 mr-1.5" />
                          <span>Salir</span>
                      </button>
                   </>
                ) : (
                    <Link
                        href="/acceder"
                        data-gtm-id="header-login-button"
                        className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <UserIcon className="w-4 h-4 mr-1.5" />
                        <span>Ingresar</span>
                    </Link>
                  )}
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