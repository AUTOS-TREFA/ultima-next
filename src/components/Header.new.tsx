'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, ChevronDown, LayoutDashboard, User, Heart, FileText, Car, Settings, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MegaMenu from './MegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const { session, profile, signOut } = useAuth();
    const menuButtonRef = React.useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isListPage = pathname === '/autos';
    const isSalesUser = profile?.role === 'sales';

    const handleSignOut = async () => {
        await signOut();
    };

    const MobileNav = () => (
        <nav className="grid gap-2 text-lg font-medium">
            <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
                <img
                    src="/images/trefalogo.png"
                    alt="TREFA"
                    className="h-8 w-auto object-contain"
                />
            </Link>
            {session ? (
                <>
                    <Link
                        href="/escritorio"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/escritorio/profile"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                        <User className="h-5 w-5" />
                        Mi Perfil
                    </Link>
                    <Link
                        href="/escritorio/favoritos"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                        <Heart className="h-5 w-5" />
                        Favoritos
                    </Link>
                    <Link
                        href="/escritorio/seguimiento"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                        <FileText className="h-5 w-5" />
                        Solicitudes
                    </Link>
                    <Link
                        href="/autos"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                        <Car className="h-5 w-5" />
                        Inventario
                    </Link>
                </>
            ) : (
                <Link
                    href="/acceder"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Iniciar Sesión
                </Link>
            )}
        </nav>
    );

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <img
                        src="/images/trefalogo.png"
                        alt="TREFA"
                        className="h-8 w-auto object-contain transition-all"
                    />
                    <span className="sr-only">TREFA</span>
                </Link>
            </nav>

            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <MobileNav />
                </SheetContent>
            </Sheet>

            {/* Search Bar - Center */}
            <div className={cn(
                "flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4",
                isListPage && "md:hidden"
            )}>
                <div className="ml-auto flex-1 sm:flex-initial">
                    <HeaderSearchBar />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    {/* Menu Button */}
                    <Button
                        ref={menuButtonRef}
                        onClick={() => setMegaMenuOpen(o => !o)}
                        variant="ghost"
                        size="sm"
                        className="font-semibold"
                    >
                        Menú
                        <ChevronDown className={cn(
                            "ml-1 h-4 w-4 transition-transform duration-200",
                            megaMenuOpen && "rotate-180"
                        )} />
                    </Button>

                    {/* Notifications */}
                    {session && (
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notificaciones</span>
                        </Button>
                    )}

                    {/* User Menu */}
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 relative">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                            {profile?.first_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden lg:inline-block font-semibold text-sm">
                                        {profile?.first_name || 'Mi Cuenta'}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.first_name || 'Usuario'}</p>
                                        <p className="text-xs leading-none text-muted-foreground truncate">
                                            {profile?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isSalesUser ? (
                                    <DropdownMenuItem asChild>
                                        <Link href="/escritorio/ventas/crm" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Mis Leads</span>
                                        </Link>
                                    </DropdownMenuItem>
                                ) : (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/escritorio" className="cursor-pointer">
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                <span>Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/escritorio/profile" className="cursor-pointer">
                                                <User className="mr-2 h-4 w-4" />
                                                <span>Mi Perfil</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/escritorio/settings" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Configuración</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="sm">
                            <Link href="/acceder" data-gtm-id="header-login-button">
                                Iniciar Sesión
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* MegaMenu */}
            <MegaMenu
                isOpen={megaMenuOpen}
                onClose={() => setMegaMenuOpen(false)}
                triggerRef={menuButtonRef}
            />
        </header>
    );
};

export default Header;
