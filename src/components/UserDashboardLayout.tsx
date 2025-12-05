import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    FileText,
    Heart,
    Car,
    Calendar,
    HelpCircle,
    LogOut,
    Menu,
    X,
    Building2,
    Search,
    BarChart3,
    Route,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import BottomNav from './BottomNav';
import { motion } from 'framer-motion';
import type { Profile } from '../types/types';

const UserDashboardLayout: React.FC = () => {
    const { profile, signOut, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default abierta
    const [isAdminSidebarExpanded, setIsAdminSidebarExpanded] = useState(false); // Admin sidebar collapsed by default

    // Toggle sidebar manually
    const toggleSidebar = () => {
        setIsSidebarExpanded(!isSidebarExpanded);
    };

    // Unified navigation items based on role
    const getNavItems = () => {
        if (isAdmin) {
            // Admin tiene acceso a todo: opciones de usuario + opciones de admin
            return [
                { to: '/escritorio', label: 'Mi Dashboard', icon: LayoutDashboard, end: true },
                { to: '/escritorio/profile', label: 'Mi Perfil', icon: User },
                { to: '/escritorio/dashboard', label: 'Dashboard Admin', icon: BarChart3, end: true },
                { to: '/escritorio/admin/marketing', label: 'Marketing Hub', icon: BarChart3 },
                { to: '/escritorio/admin/crm', label: 'CRM', icon: User },
                { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: User },
                { to: '/changelog', label: 'Changelog', icon: FileText },
            ];
        } else {
            // Usuario regular
            return [
                { to: '/escritorio', label: 'Escritorio', icon: LayoutDashboard, end: true },
                { to: '/escritorio/profile', label: 'Perfil', icon: User },
                { to: '/escritorio/seguimiento', label: 'Solicitudes', icon: FileText },
                { to: '/autos', label: 'Inventario', icon: Car },
                { to: '/contacto', label: 'Contacto', icon: Building2 },
            ];
        }
    };

    const navItems = getNavItems();

    const adminNavItems = [
        { to: '/escritorio/admin/marketing', label: 'Marketing Hub', icon: BarChart3 },
        { to: '/escritorio/admin/crm', label: 'CRM', icon: User },
        { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: User },
        { to: '/changelog', label: 'Changelog', icon: FileText },
    ];

    const secondaryNav = [
        { to: '/faq', label: 'Ayuda', icon: HelpCircle },
    ];

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Generate breadcrumbs from current path
    const generateBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Inicio', href: '/' }];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const navItem = [...navItems, ...secondaryNav].find(item => item.to === currentPath);

            if (navItem) {
                breadcrumbs.push({ label: navItem.label, href: currentPath });
            } else {
                // Capitalize and clean up path name
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
                breadcrumbs.push({ label, href: currentPath });
            }
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    // Required profile fields for completeness check
    const requiredFields: (keyof Profile)[] = [
        'first_name',
        'last_name',
        'mother_last_name',
        'phone',
        'birth_date',
        'homoclave',
        'fiscal_situation',
        'civil_status',
        'rfc'
    ];

    // Check if profile is complete - memoize to prevent recalculation on every render
    const isProfileComplete = useMemo(() => {
        if (!profile) return false;
        return requiredFields.every(
            field => profile[field] && String(profile[field]).trim() !== ''
        );
    }, [profile]);

    // Use ref to track if we've already attempted redirect
    const hasAttemptedRedirect = useRef(false);

    // Redirect to profile page if incomplete (but allow navigation away)
    useEffect(() => {
        // Only attempt redirect once and only if we haven't already redirected
        if (profile && !isProfileComplete &&
            location.pathname !== '/escritorio/profile' &&
            !hasAttemptedRedirect.current) {
            hasAttemptedRedirect.current = true;
            navigate('/escritorio/profile', { replace: true });
        }

        // Reset redirect flag when navigating away from profile page
        if (location.pathname === '/escritorio/profile') {
            hasAttemptedRedirect.current = false;
        }
    }, [profile, isProfileComplete, location.pathname, navigate]);

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
            {/* Unified Sidebar (Left) - Collapsible for all users */}
            <motion.aside
                className={cn(
                    "fixed inset-y-0 left-0 z-10 hidden flex-col border-r shadow-sm sm:flex",
                    !isSidebarExpanded ? "!bg-gray-800" : "bg-background"
                )}
                initial={false}
                animate={{ width: isSidebarExpanded ? "256px" : "60px" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <nav className="flex flex-col gap-4 px-4 py-6 h-full">
                    {/* Toggle Button */}
                    <div className="flex items-center justify-between h-10">
                        <Link
                            to="/"
                            className={cn("flex items-center", isSidebarExpanded ? "flex-1" : "justify-center w-full")}
                        >
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-6 w-auto object-contain"
                            />
                        </Link>
                        {isSidebarExpanded && (
                            <button
                                onClick={toggleSidebar}
                                className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    {!isSidebarExpanded && (
                        <button
                            onClick={toggleSidebar}
                            className="flex items-center justify-center h-8 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-white" />
                        </button>
                    )}

                    {/* User Profile Card */}
                    {isSidebarExpanded && (
                        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                    {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">
                                    {profile?.first_name || 'Usuario'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>
                    )}
                    {!isSidebarExpanded && (
                        <div className="flex items-center justify-center">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-white text-gray-800 font-semibold">
                                    {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}

                    <Separator />

                    {/* Main Navigation */}
                    <div className="flex-1 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to, item.end);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                        !isSidebarExpanded
                                            ? "justify-center text-white hover:bg-gray-700"
                                            : "hover:bg-accent",
                                        active && isSidebarExpanded
                                            ? "bg-accent text-accent-foreground"
                                            : active && !isSidebarExpanded
                                            ? "bg-gray-700 text-white"
                                            : isSidebarExpanded
                                            ? "text-muted-foreground hover:text-foreground"
                                            : "text-white"
                                    )}
                                    title={!isSidebarExpanded ? item.label : undefined}
                                >
                                    <Icon className={cn("h-5 w-5 shrink-0", !isSidebarExpanded && "text-white")} />
                                    {isSidebarExpanded && (
                                        <span className="whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <Separator />

                    {/* Secondary Navigation */}
                    <div className="space-y-1">
                        {secondaryNav.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                        !isSidebarExpanded
                                            ? "justify-center text-white hover:bg-gray-700"
                                            : "hover:bg-accent",
                                        active && isSidebarExpanded
                                            ? "bg-accent text-accent-foreground"
                                            : active && !isSidebarExpanded
                                            ? "bg-gray-700 text-white"
                                            : isSidebarExpanded
                                            ? "text-muted-foreground hover:text-foreground"
                                            : "text-white"
                                    )}
                                    title={!isSidebarExpanded ? item.label : undefined}
                                >
                                    <Icon className={cn("h-5 w-5 shrink-0", !isSidebarExpanded && "text-white")} />
                                    {isSidebarExpanded && (
                                        <span className="whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Sign Out Button */}
                        <button
                            onClick={() => signOut()}
                            className={cn(
                                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                !isSidebarExpanded
                                    ? "justify-center text-white hover:bg-gray-700"
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                            title={!isSidebarExpanded ? "Cerrar Sesión" : undefined}
                        >
                            <LogOut className={cn("h-5 w-5 shrink-0", !isSidebarExpanded && "text-white")} />
                            {isSidebarExpanded && (
                                <span className="whitespace-nowrap">
                                    Cerrar Sesión
                                </span>
                            )}
                        </button>
                    </div>
                </nav>
            </motion.aside>

            {/* Admin Sidebar (Right Side) - Only visible for admins */}
            {isAdmin && (
                <motion.aside
                    className="fixed inset-y-0 right-0 z-10 hidden flex-col border-l bg-background shadow-lg sm:flex"
                    initial={{ width: "60px" }}
                    animate={{ width: isAdminSidebarExpanded ? "256px" : "60px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <nav className="flex flex-col gap-4 px-2 py-6 h-full">
                        {/* Toggle Button */}
                        <button
                            onClick={() => setIsAdminSidebarExpanded(!isAdminSidebarExpanded)}
                            className="flex items-center justify-center h-10 rounded-lg hover:bg-accent transition-colors"
                        >
                            {isAdminSidebarExpanded ? (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                            )}
                        </button>

                        <Separator />

                        {/* Admin Navigation */}
                        <div className="flex-1 space-y-1">
                            {!isAdminSidebarExpanded && (
                                <p className="text-xs font-semibold text-muted-foreground text-center mb-2">
                                    Admin
                                </p>
                            )}
                            {isAdminSidebarExpanded && (
                                <p className="text-sm font-semibold text-muted-foreground px-3 mb-2">
                                    Panel Administrativo
                                </p>
                            )}
                            {adminNavItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground",
                                            !isAdminSidebarExpanded && "justify-center"
                                        )}
                                        title={!isAdminSidebarExpanded ? item.label : undefined}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {isAdminSidebarExpanded && (
                                            <span className="whitespace-nowrap">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </motion.aside>
            )}

            {/* Main Content */}
            <div className={cn(
                "flex flex-col sm:gap-4",
                isAdmin ? "sm:pl-64 sm:pr-[60px]" : "sm:pl-64"
            )}>
                {/* Top Bar with Breadcrumbs */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                    <Breadcrumb className="hidden md:flex">
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {index === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Mobile Header - Greeting and Hamburger */}
                    <div className="flex items-center justify-between w-full sm:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5 text-primary-600" />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">
                                    Hola, {profile?.first_name || 'Usuario'}!
                                </span>
                                <span className="text-xs text-gray-500">
                                    Bienvenido a tu dashboard
                                </span>
                            </div>
                        </div>
                        <Link to="/" className="flex-shrink-0">
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-6 w-auto object-contain"
                            />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-4 w-full max-w-full overflow-x-hidden">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar */}
            <>
                {/* Overlay */}
                <div
                    className={cn(
                        "fixed inset-0 z-40 bg-black/60 sm:hidden transition-opacity duration-300",
                        isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setIsMobileSidebarOpen(false)}
                />

                {/* Mobile Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-2xl sm:hidden transition-transform duration-300 overflow-y-auto",
                        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <nav className="flex flex-col gap-4 px-4 py-6">
                        {/* Close Button */}
                        <div className="flex items-center justify-between">
                            <Link
                                to="/"
                                className="flex items-center gap-2"
                                onClick={() => setIsMobileSidebarOpen(false)}
                            >
                                <img
                                    src="/images/trefalogo.png"
                                    alt="TREFA"
                                    className="h-8 w-auto object-contain"
                                />
                            </Link>
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="p-2 hover:bg-accent rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* User Profile Card */}
                        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                    {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium leading-none truncate">
                                    {profile?.first_name || 'Usuario'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Main Navigation */}
                        <div className="flex-1 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to, item.end);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <Separator />

                        {/* Secondary Navigation */}
                        <div className="space-y-1">
                            {secondaryNav.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            {/* Sign Out Button */}
                            <button
                                onClick={() => {
                                    setIsMobileSidebarOpen(false);
                                    signOut();
                                }}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-4 w-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </nav>
                </aside>
            </>

            {/* Use the shared BottomNav component */}
            <BottomNav />
        </div>
    );
};

export default UserDashboardLayout;
