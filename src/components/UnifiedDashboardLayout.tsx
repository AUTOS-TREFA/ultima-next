'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Car,
    User,
    FileText,
    HelpCircle,
    LogOut,
    ChevronDown,
    BarChart3,
    Users,
    Building2,
    ShoppingCart,
    Briefcase,
    Home,
    ClipboardCheck,
    TrendingUp,
    Settings,
    Facebook,
    Activity,
    MessageSquare,
    Menu,
    Target,
    HandCoins,
    Scroll,
    Plus,
    Search,
    Bell,
    ChevronRight,
    Store,
    Package,
    DollarSign,
    Sparkles,
    Rocket,
    ImagePlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuSkeleton,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types for navigation items
type UserRole = 'admin' | 'sales' | 'user' | 'marketing';

interface NavItem {
    to: string;
    label: string;
    icon: React.ElementType;
    end?: boolean;
    roles?: UserRole[];
    badge?: string;
}

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: NavItem[];
    roles?: UserRole[];
    defaultOpen?: boolean;
}

// ========== SIMPLIFIED NAVIGATION CONFIGURATION ==========

// Main essentials for all users (Inventario moved to header button)
const essentialItems: NavItem[] = [
    { to: '/escritorio', label: 'Mi Escritorio', icon: Home, roles: ['admin', 'sales', 'user'], end: true },
    { to: '/escritorio/aplicacion', label: 'Nueva Solicitud', icon: Plus, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/seguimiento', label: 'Mis Solicitudes', icon: FileText, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/perfilacion-bancaria', label: 'Perfilamiento Bancario', icon: Building2, roles: ['admin', 'sales', 'user'] },
];

// Sell Your Car Group
const sellCarGroup: NavGroup = {
    label: 'Vende tu Auto',
    icon: HandCoins,
    roles: ['admin', 'sales', 'user'],
    defaultOpen: false,
    items: [
        { to: '/escritorio/vende-tu-auto', label: 'Venta Directa', icon: DollarSign, roles: ['admin', 'sales', 'user'] },
        { to: '/escritorio/marketplace', label: 'Marketplace', icon: Store, roles: ['admin', 'sales', 'user'] },
    ],
};

// Admin Main Items (Simplified - only most used)
// Note: "Editar Autos" is now a dedicated button at the top of the Admin section
const adminMainItems: NavItem[] = [
    { to: '/escritorio/admin/marketing', label: 'Dashboard General', icon: LayoutDashboard, roles: ['admin'] },
    { to: '/escritorio/admin/crm', label: 'Leads', icon: Target, roles: ['admin'] },
    { to: '/escritorio/admin/usuarios', label: 'Asesores', icon: Users, roles: ['admin'] },
    { to: '/escritorio/admin/marketplace', label: 'Marketplace Admin', icon: Store, roles: ['admin'] },
    { to: '/escritorio/admin/compras', label: 'Compras', icon: ShoppingCart, roles: ['admin'] },
];

// Admin Analytics Group
const adminAnalyticsGroup: NavGroup = {
    label: 'Analytics',
    icon: BarChart3,
    roles: ['admin'],
    items: [
        { to: '/escritorio/admin/marketing-analytics', label: 'Marketing', icon: TrendingUp, roles: ['admin'] },
        { to: '/escritorio/admin/business-analytics', label: 'Inventario', icon: Car, roles: ['admin'] },
        { to: '/escritorio/dashboard', label: 'Ventas', icon: DollarSign, roles: ['admin'] },
        { to: '/escritorio/admin/solicitudes', label: 'Solicitudes', icon: FileText, roles: ['admin'] },
        { to: '/escritorio/admin/documentos-analytics', label: 'Documentos', icon: ClipboardCheck, roles: ['admin'] },
    ],
};

// Admin Tools Group
const adminToolsGroup: NavGroup = {
    label: 'Herramientas',
    icon: Settings,
    roles: ['admin'],
    items: [
        { to: '/escritorio/admin/bancos', label: 'Portal Bancario', icon: Building2, roles: ['admin'] },
        { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: Briefcase, roles: ['admin'] },
        { to: '/escritorio/admin/marketing-config', label: 'Integraciones', icon: Settings, roles: ['admin'] },
    ],
};

// Sales items
const salesItems: NavItem[] = [
    { to: '/escritorio/ventas/leads', label: 'Mis Leads', icon: Users, roles: ['sales'], end: true },
    { to: '/escritorio/ventas/solicitudes', label: 'Solicitudes', icon: FileText, roles: ['sales'] },
    { to: '/escritorio/ventas/performance', label: 'Mi Desempeño', icon: TrendingUp, roles: ['sales'] },
];

// Marketing items - NO access to CRM, leads, or sensitive data
// Note: "Editar Autos" is now a dedicated button at the top of the Marketing section
const marketingMainItems: NavItem[] = [
    { to: '/escritorio/marketing', label: 'Marketing Hub', icon: BarChart3, roles: ['marketing'] },
];

// Marketing Analytics Group
const marketingAnalyticsGroup: NavGroup = {
    label: 'Analytics',
    icon: BarChart3,
    roles: ['marketing'],
    items: [
        { to: '/escritorio/admin/marketing-analytics', label: 'Marketing', icon: TrendingUp, roles: ['marketing'] },
        { to: '/escritorio/admin/business-analytics', label: 'Inventario', icon: Car, roles: ['marketing'] },
    ],
};

// Marketing Tools Group
const marketingToolsGroup: NavGroup = {
    label: 'Herramientas',
    icon: Settings,
    roles: ['marketing'],
    items: [
        { to: '/escritorio/marketing/constructor', label: 'Landing Pages', icon: Scroll, roles: ['marketing'] },
        { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: Briefcase, roles: ['marketing'] },
    ],
};

// Loading skeleton component
const SidebarLoadingSkeleton: React.FC = () => (
    <>
        <SidebarHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 px-2 py-3">
                <div className="h-8 w-24 bg-gray-300 rounded animate-pulse" />
            </div>
        </SidebarHeader>
        <SidebarContent className="bg-gray-50">
            <SidebarGroup>
                <SidebarMenu>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SidebarMenuItem key={i}>
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse mx-2" />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    </>
);

// Sidebar content component
const AppSidebarContent: React.FC = () => {
    const { profile, user, isAdmin, isSales, isMarketing, loading, signOut } = useAuth();
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    // Close mobile sidebar when navigating
    const handleNavClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const [loadingTimeout, setLoadingTimeout] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setLoadingTimeout(true);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    const hasSession = !!user;

    if (loading && !loadingTimeout && !hasSession) {
        return <SidebarLoadingSkeleton />;
    }

    if (!hasSession && loadingTimeout) {
        return (
            <div className="flex flex-col h-full bg-gray-50 text-gray-900">
                <SidebarHeader className="border-b border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                        <img src="/images/trefalogo.png" alt="TREFA" className="h-8 w-auto object-contain" />
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                        Sesión no detectada.
                        <br />
                        <a href="/acceder" className="text-primary hover:underline">Iniciar sesión</a>
                    </p>
                </SidebarHeader>
            </div>
        );
    }

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) return pathname === path;
        return pathname.startsWith(path);
    };

    const getUserRole = (): UserRole => {
        if (isAdmin) return 'admin';
        if (isSales) return 'sales';
        if (isMarketing) return 'marketing';
        return 'user';
    };

    const userRole = getUserRole();

    const filterByRole = (items: NavItem[]) => {
        return items.filter(item => !item.roles || item.roles.includes(userRole));
    };

    const handleSignOut = async () => {
        try {
            sessionStorage.clear();
            localStorage.clear();
            await signOut();
        } catch (error) {
            console.error('Error during sign out:', error);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <>
            <SidebarHeader className="border-b border-gray-200 bg-gray-50">
                {/* Logo */}
                <div className="flex items-center gap-2 px-2 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/images/trefalogo.png"
                            alt="TREFA"
                            className="h-8 w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* User Profile - Expanded */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 border border-gray-200 p-3 mx-2 mb-2 group-data-[collapsible=icon]:hidden">
                    <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/30">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                            {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.first_name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                            {isAdmin && <><Sparkles className="w-3 h-3" /> Admin</>}
                            {isSales && <><Rocket className="w-3 h-3" /> Ventas</>}
                            {isMarketing && <><TrendingUp className="w-3 h-3" /> Marketing</>}
                            {!isAdmin && !isSales && !isMarketing && <User className="w-3 h-3" />}
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-gray-50 px-3">
                {/* Essentials */}
                <SidebarGroup className="py-1">
                    <SidebarGroupLabel className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1 px-3">
                        Esenciales
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-0.5">
                            {filterByRole(essentialItems).map((item) => {
                                const Icon = item.icon;
                                const isActive = isActiveLink(item.to, item.end);
                                return (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                            className={cn(
                                                "h-10 px-3 rounded-lg transition-all duration-150",
                                                "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                                                isActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                                            )}
                                        >
                                            <Link href={item.to} onClick={handleNavClick}>
                                                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Vende tu Auto */}
                <SidebarGroup className="py-1">
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-0.5">
                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={sellCarGroup.label}
                                            className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                                        >
                                            <HandCoins className="h-4 w-4" />
                                            <span>{sellCarGroup.label}</span>
                                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="border-l-2 border-gray-200 ml-5 mt-1 space-y-0.5">
                                            {filterByRole(sellCarGroup.items).map((item) => {
                                                const Icon = item.icon;
                                                const isActive = isActiveLink(item.to, item.end);
                                                return (
                                                    <SidebarMenuSubItem key={item.to}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={isActive}
                                                            className={cn(
                                                                "h-9 px-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150",
                                                                isActive && "text-primary bg-primary/5 font-medium"
                                                            )}
                                                        >
                                                            <Link href={item.to} onClick={handleNavClick} className="flex items-center gap-2">
                                                                <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                                                <span>{item.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <Separator className="bg-gray-200 my-2" />

                        {/* Editar Autos Quick Action Button */}
                        <div className="px-3 mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="w-full h-8 justify-start gap-2 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            >
                                <Link href="/escritorio/admin/cargar-fotos" onClick={handleNavClick}>
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    Editar Autos
                                </Link>
                            </Button>
                        </div>

                        {/* Admin Main */}
                        <SidebarGroup className="py-1">
                            <SidebarGroupLabel className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1 px-3">
                                Admin
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {filterByRole(adminMainItems).map((item) => {
                                        const Icon = item.icon;
                                        const isActive = isActiveLink(item.to, item.end);
                                        return (
                                            <SidebarMenuItem key={item.to}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.label}
                                                    className={cn(
                                                        "h-10 px-3 rounded-lg transition-all duration-150",
                                                        "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                                                        isActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                                                    )}
                                                >
                                                    <Link href={item.to} onClick={handleNavClick}>
                                                        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Analytics Dropdown */}
                        <SidebarGroup className="py-0.5">
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    <Collapsible className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip="Analytics"
                                                    className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                                                >
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span>Analytics</span>
                                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="border-l-2 border-gray-200 ml-5 mt-1 space-y-0.5">
                                                    {filterByRole(adminAnalyticsGroup.items).map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = isActiveLink(item.to, item.end);
                                                        return (
                                                            <SidebarMenuSubItem key={item.to}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive}
                                                                    className={cn(
                                                                        "h-9 px-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150",
                                                                        isActive && "text-primary bg-primary/5 font-medium"
                                                                    )}
                                                                >
                                                                    <Link href={item.to} onClick={handleNavClick}>
                                                                        <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                                                        <span>{item.label}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Tools Dropdown */}
                        <SidebarGroup className="py-0.5">
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    <Collapsible className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip="Herramientas"
                                                    className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    <span>Herramientas</span>
                                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="border-l-2 border-gray-200 ml-5 mt-1 space-y-0.5">
                                                    {filterByRole(adminToolsGroup.items).map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = isActiveLink(item.to, item.end);
                                                        return (
                                                            <SidebarMenuSubItem key={item.to}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive}
                                                                    className={cn(
                                                                        "h-9 px-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150",
                                                                        isActive && "text-primary bg-primary/5 font-medium"
                                                                    )}
                                                                >
                                                                    <Link href={item.to} onClick={handleNavClick}>
                                                                        <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                                                        <span>{item.label}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* Sales Section */}
                {isSales && (
                    <>
                        <Separator className="bg-gray-200 my-2" />
                        <SidebarGroup className="py-1">
                            <SidebarGroupLabel className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1 px-3">
                                Ventas
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {filterByRole(salesItems).map((item) => {
                                        const Icon = item.icon;
                                        const isActive = isActiveLink(item.to, item.end);
                                        return (
                                            <SidebarMenuItem key={item.to}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.label}
                                                    className={cn(
                                                        "h-10 px-3 rounded-lg transition-all duration-150",
                                                        "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                                                        isActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                                                    )}
                                                >
                                                    <Link href={item.to} onClick={handleNavClick}>
                                                        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* Marketing Section */}
                {isMarketing && (
                    <>
                        <Separator className="bg-gray-200 my-2" />

                        {/* Editar Autos Quick Action Button (Marketing) */}
                        <div className="px-3 mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="w-full h-8 justify-start gap-2 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            >
                                <Link href="/escritorio/admin/cargar-fotos" onClick={handleNavClick}>
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    Editar Autos
                                </Link>
                            </Button>
                        </div>

                        {/* Marketing Main */}
                        <SidebarGroup className="py-1">
                            <SidebarGroupLabel className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1 px-3">
                                Marketing
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {filterByRole(marketingMainItems).map((item) => {
                                        const Icon = item.icon;
                                        const isActive = isActiveLink(item.to, item.end);
                                        return (
                                            <SidebarMenuItem key={item.to}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.label}
                                                    className={cn(
                                                        "h-10 px-3 rounded-lg transition-all duration-150",
                                                        "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                                                        isActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                                                    )}
                                                >
                                                    <Link href={item.to} onClick={handleNavClick}>
                                                        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Marketing Analytics Dropdown */}
                        <SidebarGroup className="py-0.5">
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    <Collapsible className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip="Analytics"
                                                    className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                                                >
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span>Analytics</span>
                                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="border-l-2 border-gray-200 ml-5 mt-1 space-y-0.5">
                                                    {filterByRole(marketingAnalyticsGroup.items).map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = isActiveLink(item.to, item.end);
                                                        return (
                                                            <SidebarMenuSubItem key={item.to}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive}
                                                                    className={cn(
                                                                        "h-9 px-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150",
                                                                        isActive && "text-primary bg-primary/5 font-medium"
                                                                    )}
                                                                >
                                                                    <Link href={item.to} onClick={handleNavClick}>
                                                                        <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                                                        <span>{item.label}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Marketing Tools Dropdown */}
                        <SidebarGroup className="py-0.5">
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    <Collapsible className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip="Herramientas"
                                                    className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    <span>Herramientas</span>
                                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="border-l-2 border-gray-200 ml-5 mt-1 space-y-0.5">
                                                    {filterByRole(marketingToolsGroup.items).map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = isActiveLink(item.to, item.end);
                                                        return (
                                                            <SidebarMenuSubItem key={item.to}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive}
                                                                    className={cn(
                                                                        "h-9 px-3 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-150",
                                                                        isActive && "text-primary bg-primary/5 font-medium"
                                                                    )}
                                                                >
                                                                    <Link href={item.to} onClick={handleNavClick}>
                                                                        <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                                                        <span>{item.label}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 bg-gray-50 px-3 py-2">
                <SidebarMenu className="space-y-0.5">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Ayuda / FAQs"
                            className="h-10 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-150"
                        >
                            <Link href="/faq" onClick={handleNavClick}>
                                <HelpCircle className="h-4 w-4" />
                                <span>Ayuda</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            tooltip="Cerrar Sesión"
                            className="h-10 px-3 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </>
    );
};

// Mobile sidebar (simplified for now - same content)
const MobileSidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full bg-white text-gray-900 p-4">
            <p className="text-sm text-gray-600">Menu móvil - trabajo en progreso</p>
        </div>
    );
};

// Main Layout Component
const UnifiedDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const handleSignOut = async () => {
        try {
            sessionStorage.clear();
            localStorage.clear();
            await signOut();
        } catch (error) {
            console.error('Error during sign out:', error);
        } finally {
            window.location.href = '/';
        }
    };

    const generateBreadcrumbs = () => {
        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Inicio', href: '/' }];

        let currentPath = '';
        paths.forEach((path) => {
            currentPath += `/${path}`;
            const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
            breadcrumbs.push({ label, href: currentPath });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <SidebarProvider defaultOpen={true}>
            <Sidebar
                collapsible="icon"
                className={cn(
                    "border-r border-gray-200 bg-white",
                    // Collapsed state
                    "group-data-[state=collapsed]:!bg-white group-data-[state=collapsed]:border-gray-200",
                    // Icon colors when collapsed
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!text-gray-700",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!w-5",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!h-5",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]]:hover:bg-gray-100",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]]:hover:!text-gray-900",
                )}
            >
                <AppSidebarContent />
            </Sidebar>
            <SidebarInset className="bg-background">
                {/* Floating Header */}
                <header className="before:bg-background/60 sticky top-0 z-50 before:absolute before:inset-0 before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md">
                    <div className="bg-white relative z-[51] mx-auto mt-2 flex w-[calc(100%-1rem)] max-w-[calc(1280px-3rem)] items-center justify-between rounded-xl border border-gray-100/80 px-4 py-2 md:mt-3 md:w-[calc(100%-2rem)] md:px-6 shadow-sm">
                        {/* Left section */}
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="h-8 w-8" />
                            <Separator orientation="vertical" className="h-5" />

                            {/* Breadcrumbs */}
                            <Breadcrumb className="hidden md:flex">
                                <BreadcrumbList>
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={crumb.href}>
                                            {index > 0 && <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>}
                                            <BreadcrumbItem>
                                                {index === breadcrumbs.length - 1 ? (
                                                    <BreadcrumbPage className="text-sm font-medium">{crumb.label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground">{crumb.label}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </React.Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-2">
                            {/* Inventario Button */}
                            <Link href="/autos">
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50">
                                    <Car className="h-4 w-4" />
                                    <span className="hidden sm:inline">Ver Inventario</span>
                                </Button>
                            </Link>

                            <Separator orientation="vertical" className="h-5 hidden sm:block" />

                            <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                                <Search className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Bell className="h-4 w-4" />
                            </Button>

                            {/* User Avatar Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 p-0">
                                        <Avatar className="h-8 w-8 border-2 border-primary/20">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-semibold">
                                                {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-white z-[60]" align="end" forceMount>
                                    <div className="flex items-center justify-start gap-2 p-2">
                                        <div className="flex flex-col space-y-1 leading-none">
                                            <p className="font-medium">{profile?.first_name || 'Usuario'}</p>
                                            <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/escritorio/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Editar perfil</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="w-full max-w-[1600px] mx-auto flex-1 px-2 py-4 sm:px-4 md:px-6 md:py-6 overflow-x-hidden transition-all duration-300">
                    <div className="w-full overflow-x-hidden">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default UnifiedDashboardLayout;
