'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import MegaMenu from './MegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import MobileHeader from './MobileHeader';
import { Button } from './ui/button';

// Use absolute URL to ensure logo loads correctly across all domains
const LOGO_URL = 'https://trefa.mx/images/trefalogo.png';

const Header: React.FC = () => {
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const { session, profile, signOut } = useAuth();
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const isListPage = pathname === '/autos';
    const isSalesUser = profile?.role === 'sales';

    const handleSignOut = async () => {
        await signOut();
    };

    return (
      <>
        {/* Mobile Header - Only visible on mobile */}
        <MobileHeader />

        {/* Desktop Header - Hidden on mobile */}
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200/80">
          <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center h-28 gap-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                  <Link href="/" className="flex items-center">
                    <img
                      src={LOGO_URL}
                      alt="TREFA"
                      className="h-9 w-auto object-contain"
                    />
                  </Link>
              </div>

              {/* Center Section (Search) */}
              <div className={`flex-1 min-w-0 mx-4 ${isListPage ? 'lg:hidden' : ''}`}>
                  <HeaderSearchBar />
              </div>

              {/* Right Section - Desktop Menu and Auth */}
              <div className={`flex items-center space-x-4 flex-shrink-0 ${isListPage ? 'ml-auto' : ''}`}>
                <Button
                    ref={menuButtonRef}
                    onClick={() => setMegaMenuOpen(o => !o)}
                    variant="ghost"
                    size="sm"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                >
                    <span>Menú</span>
                    <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                </Button>

                {session ? (
                   <>
                      {/* Dashboard Button */}
                      <Button asChild size="sm" className="!text-white">
                          <Link href={isSalesUser ? "/escritorio/ventas/crm" : "/escritorio"} className="!text-white">
                              Dashboard
                          </Link>
                      </Button>

                      {/* Sign Out Button */}
                      <Button
                          onClick={handleSignOut}
                          variant="destructive"
                          size="sm"
                          className="items-center gap-1.5"
                      >
                          <LogOutIcon className="w-3.5 h-3.5" />
                          Cerrar Sesión
                      </Button>
                   </>
                ) : (
                  <>
                    <Button asChild size="sm" variant="ghost" className="border-2 border-primary-600 hover:bg-primary-600 bg-white font-medium">
                        <Link href="/registro" data-gtm-id="header-register-button" style={{ color: 'rgb(79, 70, 229) !important' }} className="hover:text-white">
                            Registro
                        </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="bg-[#FF6801] hover:bg-[#E55E01] font-medium">
                        <Link href="/acceder" data-gtm-id="header-login-button" style={{ color: 'white !important' }}>
                            Iniciar Sesión
                        </Link>
                    </Button>
                  </>
                  )}
              </div>
            </div>
            <MegaMenu
              isOpen={megaMenuOpen}
              onClose={() => setMegaMenuOpen(false)}
              triggerRef={menuButtonRef as any}
            />
          </div>
        </header>
      </>
    );
};

export default Header;