'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    HelpCircle,
    Users,
    BarChart3,
    Route,
    Building2,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    DollarSign,
    MessageSquare,
    TrendingUp,
    FileText,
    Database,
    Settings,
    Wrench,
    Home,
    Palette,
    Camera,
    ClipboardCheck,
    UserCheck,
    Activity,
    LayoutList,
    Megaphone,
    Image,
    Facebook,
    BarChart2,
    FileBarChart,
    ScrollText,
    Upload,
    Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
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

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, isAdmin, isSales, signOut } = useAuth();
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default abierta
    const [isToolsExpanded, setIsToolsExpanded] = useState(false); // Dropdown de Herramientas
    const [isOtherPagesExpanded, setIsOtherPagesExpanded] = useState(false); // Dropdown de Otras Páginas

    // Toggle sidebar manually
    const toggleSidebar = () => {
        setIsSidebarExpanded(!isSidebarExpanded);
    };

    // Unified navigation items based on role
    const getNavItems = () => {
        if (isAdmin) {
            return [
                { to: '/escritorio/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
                { to: '/escritorio', label: 'Escritorio', icon: Home },
                { to: '/escritorio/admin/marketing-analytics', label: 'Marketing', icon: BarChart3 },
                { to: '/escritorio/admin/business-analytics', label: 'Indicadores', icon: TrendingUp },
                { to: '/escritorio/admin/marketing', label: 'Secciones', icon: Settings },
                { to: '/escritorio/admin/usuarios', label: 'Asesores', icon: Users },
                { to: '/escritorio/admin/compras', label: 'Compras', icon: DollarSign },
                { to: '/escritorio/admin/customer-journeys', label: 'Customer Journeys', icon: Route },
                { to: '/intel', label: 'Intel Interna', icon: Database },
            ];
        } else if (isSales) {
            return [
                { to: '/escritorio/ventas/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
                { to: '/escritorio/ventas/crm', label: 'CRM', icon: Users },
                { to: '/escritorio/ventas/performance', label: 'Performance', icon: BarChart3 },
            ];
        }
        return [];
    };

    const portalBancarioItem = { to: '/escritorio/admin/bancos', label: 'Portal Bancario', icon: Building2 };

    const toolsItems = [
        { to: '/escritorio/car-studio', label: 'Car Studio API', icon: Camera },
        { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: ClipboardCheck },
        { to: '/escritorio/admin/usuarios', label: 'Aprobar Cuentas', icon: UserCheck },
        { to: '/escritorio/admin/survey-analytics', label: 'Resultados de Encuesta', icon: MessageSquare },
        { to: '/escritorio/marketing/constructor', label: 'Landing Pages', icon: Palette },
        { to: '/escritorio/marketing/homepage-editor', label: 'Editor de Página de Inicio', icon: Home },
        { to: '/escritorio/admin/valuation', label: 'Valuación', icon: TrendingUp },
        { to: '/changelog', label: 'Registro de Cambios', icon: FileText },
    ];

    const otherPagesItems = [
        { to: '/escritorio/admin/crm', label: 'CRM Unificado', icon: Users },
        { to: '/escritorio/admin/solicitudes', label: 'Analytics de Solicitudes', icon: FileBarChart },
        { to: '/escritorio/admin/documentos-analytics', label: 'Analytics de Documentos', icon: Upload },
        { to: '/escritorio/admin/facebook-catalogue', label: 'Catálogo de Facebook', icon: Facebook },
        { to: '/escritorio/admin/tracking-analytics', label: 'Analytics de Tracking', icon: Activity },
        { to: '/escritorio/admin/marketing-config', label: 'Config de Marketing', icon: Settings },
        { to: '/escritorio/admin/r2-images', label: 'Gestor de Imágenes R2', icon: Image },
        { to: '/escritorio/admin/logs', label: 'Logs del Sistema', icon: ScrollText },
        { to: '/escritorio/admin/config', label: 'Configuración Admin', icon: Settings },
        { to: '/escritorio/admin/airtable', label: 'Config de Airtable', icon: Database },
        { to: '/escritorio/admin/inspections', label: 'Inspecciones', icon: ClipboardCheck },
        { to: '/escritorio/aplicacion', label: 'Aplicación de Financiamiento', icon: FileText },
        { to: '/escritorio/seguimiento', label: 'Seguimiento de Solicitudes', icon: LayoutList },
        { to: '/escritorio/profile', label: 'Perfil de Usuario', icon: UserCheck },
        { to: '/escritorio/ejemplo', label: 'Dashboard Ejemplo', icon: Smartphone },
    ];

    const navItems = getNavItems();

    const secondaryNav = [
        { to: '/faq', label: 'Ayuda', icon: HelpCircle },
    ];

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    // Generate breadcrumbs from current path
    const generateBreadcrumbs = () => {
        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Inicio', href: '/' }];

        const allNavItems = [...navItems, ...secondaryNav];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const navItem = allNavItems.find(item => item.to === currentPath);

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

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
            {/* Unified Sidebar (Left) - Visible for admin and sales */}
            {(isAdmin || isSales) && (
                <motion.aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r shadow-sm sm:flex",
                        !isSidebarExpanded ? "!bg-gray-800" : "bg-background"
                    )}
                    initial={false}
                    animate={{ width: isSidebarExpanded ? "256px" : "60px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <nav className="flex flex-col gap-3 px-2 py-4 h-full">
                        {/* Logo + Toggle */}
                        <div className="flex items-center justify-between px-1 mb-2">
                            {isSidebarExpanded ? (
                                <Link to="/" className="flex items-center gap-2">
                                    <img
                                        src="/images/trefalogo.png"
                                        alt="TREFA"
                                        className="h-7 w-auto object-contain"
                                    />
                                </Link>
                            ) : (
                                <div className="w-full flex justify-center">
                                    <img
                                        src="/images/trefalogo.png"
                                        alt="TREFA"
                                        className="h-6 w-auto object-contain"
                                    />
                                </div>
                            )}
                            {isSidebarExpanded && (
                                <button
                                    onClick={toggleSidebar}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        isAdmin ? "hover:bg-accent" : "hover:bg-accent"
                                    )}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {!isSidebarExpanded && (
                            <button
                                onClick={toggleSidebar}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors flex justify-center",
                                    "hover:bg-white/10 text-white"
                                )}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}

                        <Separator className={cn(!isSidebarExpanded ? "bg-white/20" : "")} />

                        {/* User Profile Card */}
                        {isSidebarExpanded && (
                            <div className="flex items-center gap-2 rounded-lg border bg-card p-2 mx-1">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                        {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-none truncate">
                                        {profile?.first_name || 'Usuario'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isAdmin ? 'Admin' : isSales ? 'Ventas' : 'Usuario'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex-1 space-y-0.5 overflow-y-auto px-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to, item.end);

                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        className={cn(
                                            "flex items-center rounded-lg text-xs font-medium transition-all",
                                            isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                            active
                                                ? isSidebarExpanded
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-white/20 text-white"
                                                : isSidebarExpanded
                                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    : "text-white hover:bg-white/10"
                                        )}
                                        title={!isSidebarExpanded ? item.label : undefined}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {isSidebarExpanded && (
                                            <span className="whitespace-nowrap truncate">{item.label}</span>
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Portal Bancario (solo para admin) */}
                            {isAdmin && (
                                <Link
                                    href={portalBancarioItem.to}
                                    className={cn(
                                        "flex items-center rounded-lg text-xs font-medium transition-all",
                                        isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                        isActiveLink(portalBancarioItem.to)
                                            ? isSidebarExpanded
                                                ? "bg-accent text-accent-foreground"
                                                : "bg-white/20 text-white"
                                            : isSidebarExpanded
                                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                : "text-white hover:bg-white/10"
                                    )}
                                    title={!isSidebarExpanded ? portalBancarioItem.label : undefined}
                                >
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    {isSidebarExpanded && (
                                        <span className="whitespace-nowrap truncate">{portalBancarioItem.label}</span>
                                    )}
                                </Link>
                            )}

                            {/* Herramientas Dropdown (solo para admin) */}
                            {isAdmin && (
                                <div className="space-y-0.5">
                                    <button
                                        onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                                        className={cn(
                                            "w-full flex items-center rounded-lg text-xs font-medium transition-all",
                                            isSidebarExpanded ? "px-2.5 py-2 gap-2.5 justify-start" : "justify-center py-2",
                                            isSidebarExpanded
                                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                : "text-white hover:bg-white/10"
                                        )}
                                        title={!isSidebarExpanded ? "Herramientas" : undefined}
                                    >
                                        <Wrench className="h-4 w-4 shrink-0" />
                                        {isSidebarExpanded && (
                                            <>
                                                <span className="whitespace-nowrap truncate flex-1 text-left">Herramientas</span>
                                                {isToolsExpanded ? (
                                                    <ChevronUp className="h-3 w-3 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 shrink-0" />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {/* Submenu de Herramientas */}
                                    {isToolsExpanded && isSidebarExpanded && (
                                        <div className="ml-4 space-y-0.5 border-l-2 border-border pl-2">
                                            {toolsItems.map((tool) => {
                                                const ToolIcon = tool.icon;
                                                const isActiveTool = isActiveLink(tool.to, false);

                                                return (
                                                    <Link
                                                        key={tool.to}
                                                        href={tool.to}
                                                        className={cn(
                                                            "flex items-center rounded-lg text-xs font-medium transition-all px-2 py-1.5 gap-2",
                                                            isActiveTool
                                                                ? "bg-accent text-accent-foreground"
                                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                        )}
                                                    >
                                                        <ToolIcon className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="whitespace-nowrap truncate text-[11px]">{tool.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Otras Páginas Dropdown (solo para admin) */}
                            {isAdmin && (
                                <div className="space-y-0.5">
                                    <button
                                        onClick={() => setIsOtherPagesExpanded(!isOtherPagesExpanded)}
                                        className={cn(
                                            "w-full flex items-center rounded-lg text-xs font-medium transition-all",
                                            isSidebarExpanded ? "px-2.5 py-2 gap-2.5 justify-start" : "justify-center py-2",
                                            isSidebarExpanded
                                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                : "text-white hover:bg-white/10"
                                        )}
                                        title={!isSidebarExpanded ? "Otras Páginas" : undefined}
                                    >
                                        <LayoutList className="h-4 w-4 shrink-0" />
                                        {isSidebarExpanded && (
                                            <>
                                                <span className="whitespace-nowrap truncate flex-1 text-left">Otras Páginas</span>
                                                {isOtherPagesExpanded ? (
                                                    <ChevronUp className="h-3 w-3 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 shrink-0" />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {/* Submenu de Otras Páginas */}
                                    {isOtherPagesExpanded && isSidebarExpanded && (
                                        <div className="ml-4 space-y-0.5 border-l-2 border-border pl-2 max-h-64 overflow-y-auto">
                                            {otherPagesItems.map((page) => {
                                                const PageIcon = page.icon;
                                                const isActivePage = isActiveLink(page.to, false);

                                                return (
                                                    <Link
                                                        key={page.to}
                                                        href={page.to}
                                                        className={cn(
                                                            "flex items-center rounded-lg text-xs font-medium transition-all px-2 py-1.5 gap-2",
                                                            isActivePage
                                                                ? "bg-accent text-accent-foreground"
                                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                        )}
                                                    >
                                                        <PageIcon className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="whitespace-nowrap truncate text-[11px]">{page.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Separator className={cn(!isSidebarExpanded && isAdmin ? "bg-white/20" : "")} />

                        {/* Help */}
                        {secondaryNav.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to);

                            return (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    className={cn(
                                        "flex items-center rounded-lg text-xs font-medium transition-all mx-1",
                                        isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                        active
                                            ? isSidebarExpanded
                                                ? "bg-accent text-accent-foreground"
                                                : isAdmin ? "bg-white/20 text-white" : "bg-accent"
                                            : isSidebarExpanded
                                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                : isAdmin ? "text-white hover:bg-white/10" : "text-muted-foreground hover:bg-accent"
                                    )}
                                    title={!isSidebarExpanded ? item.label : undefined}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {isSidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                                </Link>
                            );
                        })}

                        {/* Sign Out */}
                        <button
                            onClick={() => signOut()}
                            className={cn(
                                "flex items-center rounded-lg text-xs font-medium transition-all mx-1",
                                isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                isSidebarExpanded
                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    : "text-white hover:bg-white/10"
                            )}
                            title={!isSidebarExpanded ? "Cerrar Sesión" : undefined}
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {isSidebarExpanded && <span className="whitespace-nowrap">Cerrar Sesión</span>}
                        </button>
                    </nav>
                </motion.aside>
            )}

            {/* Main Content - Responsive padding based on sidebar state */}
            <motion.div
                className="flex flex-col sm:gap-4"
                animate={{
                    paddingLeft: (isAdmin || isSales) ? (isSidebarExpanded ? "256px" : "60px") : "0px"
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
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
                                                <Link href={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Mobile Header - Logo and Hamburger (admins only) */}
                    <div className="flex items-center gap-2 sm:hidden">
                        {(isAdmin || isSales) && (
                            <button
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="p-2 hover:bg-accent rounded-lg"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        )}
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-6 w-auto object-contain"
                            />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 items-start gap-4 p-4 sm:p-6 md:gap-8 pb-20 sm:pb-4 w-full max-w-full overflow-x-hidden">
                    {children}
                </main>

                {/* Bottom Navigation - Mobile Only */}
                <BottomNav />
            </motion.div>

            {/* Mobile Sidebar for Admins/Sales (triggered by hamburger) */}
            {(isAdmin || isSales) && (
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
                                            href={item.to}
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

                                {/* Portal Bancario (mobile - solo admin) */}
                                {isAdmin && (
                                    <Link
                                        href={portalBancarioItem.to}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            isActiveLink(portalBancarioItem.to)
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Building2 className="h-4 w-4" />
                                        {portalBancarioItem.label}
                                    </Link>
                                )}

                                {/* Herramientas (mobile - solo admin) */}
                                {isAdmin && (
                                    <>
                                        <div className="pt-2 pb-1 px-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Herramientas</p>
                                        </div>
                                        {toolsItems.map((tool) => {
                                            const ToolIcon = tool.icon;
                                            const isActiveTool = isActiveLink(tool.to, false);

                                            return (
                                                <Link
                                                    key={tool.to}
                                                    href={tool.to}
                                                    onClick={() => setIsMobileSidebarOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                                        isActiveTool
                                                            ? "bg-accent text-accent-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <ToolIcon className="h-4 w-4" />
                                                    {tool.label}
                                                </Link>
                                            );
                                        })}
                                    </>
                                )}

                                {/* Otras Páginas (mobile - solo admin) */}
                                {isAdmin && (
                                    <>
                                        <div className="pt-2 pb-1 px-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Otras Páginas</p>
                                        </div>
                                        {otherPagesItems.map((page) => {
                                            const PageIcon = page.icon;
                                            const isActivePage = isActiveLink(page.to, false);

                                            return (
                                                <Link
                                                    key={page.to}
                                                    href={page.to}
                                                    onClick={() => setIsMobileSidebarOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                                        isActivePage
                                                            ? "bg-accent text-accent-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <PageIcon className="h-4 w-4" />
                                                    {page.label}
                                                </Link>
                                            );
                                        })}
                                    </>
                                )}
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
                                            href={item.to}
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
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </nav>
                    </aside>
                </>
            )}

            {/* Use the shared BottomNav component */}
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
