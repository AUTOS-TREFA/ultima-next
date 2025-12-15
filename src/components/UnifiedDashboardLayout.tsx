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
    Route,
    Building2,
    ShoppingCart,
    FileBarChart,
    Briefcase,
    Camera,
    Home,
    Palette,
    ClipboardCheck,
    TrendingUp,
    Settings,
    Database,
    Facebook,
    Activity,
    Upload,
    MessageSquare,
    Menu,
    UserPlus,
    Target,
    HandCoins,
    Scroll,
    Plus,
    Search,
    Bell,
    ChevronRight,
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
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
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
interface NavItem {
    to: string;
    label: string;
    icon: React.ElementType;
    end?: boolean;
    roles?: ('admin' | 'sales' | 'user')[];
}

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: NavItem[];
    roles?: ('admin' | 'sales' | 'user')[];
}

// Navigation configuration
const commonNavItems: NavItem[] = [
    { to: '/escritorio', label: 'Escritorio', icon: LayoutDashboard, roles: ['admin', 'sales', 'user'], end: true },
    { to: '/autos', label: 'Inventario', icon: Car, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/vende-tu-auto', label: 'Vender mi auto', icon: HandCoins, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/profile', label: 'Mi Perfil', icon: User, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/seguimiento', label: 'Solicitudes', icon: FileText, roles: ['admin', 'sales', 'user'] },
    { to: '/escritorio/aplicacion', label: 'Nueva solicitud', icon: Plus, roles: ['admin', 'sales', 'user'] },
];

const adminFirstLevelItems: NavItem[] = [
    { to: '/escritorio/admin/marketing', label: 'Dashboard General', icon: LayoutDashboard, roles: ['admin'], end: true },
    { to: '/escritorio/admin/crm', label: 'Leads y CRM', icon: Target, roles: ['admin'] },
    { to: '/escritorio/admin/usuarios', label: 'Asesores', icon: Users, roles: ['admin'] },
    { to: '/escritorio/admin/customer-journeys', label: 'Customer Journeys', icon: Route, roles: ['admin'] },
    { to: '/escritorio/admin/bancos', label: 'Portal Bancario', icon: Building2, roles: ['admin'] },
    { to: '/escritorio/admin/compras', label: 'Compras', icon: ShoppingCart, roles: ['admin'] },
    { to: '/changelog', label: 'Changelog', icon: Scroll, roles: ['admin'] },
];

const adminDashboardsGroup: NavGroup = {
    label: 'Dashboards',
    icon: BarChart3,
    roles: ['admin'],
    items: [
        { to: '/escritorio/admin/marketing-analytics', label: 'Marketing', icon: BarChart3, roles: ['admin'] },
        { to: '/escritorio/admin/facebook-catalogue', label: 'Catalogo de Facebook', icon: Facebook, roles: ['admin'] },
        { to: '/escritorio/admin/business-analytics', label: 'Inventario', icon: TrendingUp, roles: ['admin'] },
        { to: '/escritorio/admin/solicitudes', label: 'Solicitudes', icon: FileBarChart, roles: ['admin'] },
        { to: '/escritorio/admin/tracking-analytics', label: 'Tracking', icon: Activity, roles: ['admin'] },
        { to: '/escritorio/admin/documentos-analytics', label: 'Documentos', icon: Upload, roles: ['admin'] },
        { to: '/escritorio/dashboard', label: 'Desempeno', icon: LayoutDashboard, roles: ['admin'] },
        { to: '/escritorio/admin/survey-analytics', label: 'Resultados de Encuesta', icon: MessageSquare, roles: ['admin'] },
    ],
};

const adminToolsGroup: NavGroup = {
    label: 'Herramientas',
    icon: Settings,
    roles: ['admin'],
    items: [
        { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: Briefcase, roles: ['admin'] },
        { to: '/escritorio/car-studio', label: 'Car Studio API', icon: Camera, roles: ['admin'] },
        { to: '/escritorio/admin/bancos', label: 'Aprobar Bancos', icon: UserPlus, roles: ['admin'] },
        { to: '/escritorio/marketing/homepage-editor', label: 'Editar Homepage', icon: Home, roles: ['admin'] },
        { to: '/escritorio/marketing/constructor', label: 'Crear Landing Page', icon: Palette, roles: ['admin'] },
        { to: '/escritorio/admin/inspections', label: 'Inspecciones Totalcheck', icon: ClipboardCheck, roles: ['admin'] },
        { to: '/escritorio/admin/valuation', label: 'Valuacion', icon: TrendingUp, roles: ['admin'] },
        { to: '/escritorio/admin/marketing-config', label: 'Integraciones', icon: Settings, roles: ['admin'] },
        { to: '/escritorio/admin/intel', label: 'Intel Interna', icon: Database, roles: ['admin'] },
    ],
};

const adminAccountGroup: NavGroup = {
    label: 'Mi cuenta',
    icon: User,
    roles: ['admin'],
    items: [
        { to: '/escritorio/profile', label: 'Editar perfil', icon: User, roles: ['admin'] },
        { to: '/escritorio/seguimiento', label: 'Mis solicitudes', icon: FileText, roles: ['admin'] },
        { to: '/escritorio', label: 'Escritorio', icon: LayoutDashboard, roles: ['admin'], end: true },
    ],
};

// Sales-specific navigation items (simplified menu)
const salesNavItems: NavItem[] = [
    { to: '/escritorio/ventas/leads', label: 'Mis Leads', icon: Users, roles: ['sales'], end: true },
    { to: '/escritorio/ventas/solicitudes', label: 'Solicitudes', icon: FileText, roles: ['sales'] },
    { to: '/escritorio/ventas/performance', label: 'Mi Desempeno', icon: TrendingUp, roles: ['sales'] },
];

const secondaryNavItems: NavItem[] = [
    { to: '/faq', label: 'Ayuda / FAQs', icon: HelpCircle, roles: ['admin', 'sales', 'user'] },
];

// Sidebar content component
const AppSidebarContent: React.FC = () => {
    const { profile, isAdmin, isSales, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const getUserRole = (): 'admin' | 'sales' | 'user' => {
        if (isAdmin) return 'admin';
        if (isSales) return 'sales';
        return 'user';
    };

    const userRole = getUserRole();

    const filterByRole = (items: NavItem[]) => {
        return items.filter(item => !item.roles || item.roles.includes(userRole));
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
            <SidebarHeader className="border-b border-gray-100/80">
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

                {/* User Profile Card - Expanded */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-100/80 bg-gray-50/50 p-3 mx-2 mb-2 group-data-[collapsible=icon]:hidden">
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
                            {isAdmin ? 'Administrador' : isSales ? 'Ventas' : 'Usuario'}
                        </p>
                    </div>
                </div>

                {/* User Avatar - Collapsed */}
                <div className="hidden group-data-[collapsible=icon]:flex justify-center mb-2">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </SidebarHeader>

            <SidebarContent className="[&>div]:py-1">
                {/* 1. General - Common Items for All Users (at the top) */}
                <SidebarGroup className="py-1">
                    <SidebarGroupLabel>General</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filterByRole(commonNavItems).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActiveLink(item.to, item.end)}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.to}>
                                                <Icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 2. Mi cuenta Dropdown */}
                {isAdmin && (
                    <SidebarGroup className="py-1">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Mi cuenta">
                                                <User className="h-4 w-4" />
                                                <span>Mi cuenta</span>
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterByRole(adminAccountGroup.items).map((item) => {
                                                    return (
                                                        <SidebarMenuSubItem key={item.to}>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={isActiveLink(item.to, item.end)}
                                                            >
                                                                <Link href={item.to}>
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
                )}

                {/* 3. Dashboards Dropdown */}
                {isAdmin && (
                    <SidebarGroup className="py-1">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible defaultOpen className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Dashboards">
                                                <BarChart3 className="h-4 w-4" />
                                                <span>Dashboards</span>
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterByRole(adminDashboardsGroup.items).map((item) => {
                                                    return (
                                                        <SidebarMenuSubItem key={item.to}>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={isActiveLink(item.to, item.end)}
                                                            >
                                                                <Link href={item.to}>
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
                )}

                {/* 4. Administracion Section - Bolder, All Caps, Smaller */}
                {isAdmin && (
                    <SidebarGroup className="py-1">
                        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider">
                            Administracion
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filterByRole(adminFirstLevelItems).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActiveLink(item.to, item.end)}
                                                tooltip={item.label}
                                            >
                                                <Link href={item.to}>
                                                    <Icon className="h-4 w-4" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* 5. Herramientas Dropdown */}
                {isAdmin && (
                    <SidebarGroup className="py-1">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Herramientas">
                                                <Settings className="h-4 w-4" />
                                                <span>Herramientas</span>
                                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {filterByRole(adminToolsGroup.items).map((item) => {
                                                    return (
                                                        <SidebarMenuSubItem key={item.to}>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={isActiveLink(item.to, item.end)}
                                                            >
                                                                <Link href={item.to}>
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
                )}

                {/* Sales-specific items */}
                {isSales && (
                    <SidebarGroup className="py-1">
                        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider">
                            Ventas
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filterByRole(salesNavItems).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActiveLink(item.to, item.end)}
                                                tooltip={item.label}
                                            >
                                                <Link href={item.to}>
                                                    <Icon className="h-4 w-4" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-100/80">
                <SidebarMenu>
                    {/* Help/FAQs */}
                    {filterByRole(secondaryNavItems).map((item) => {
                        const Icon = item.icon;
                        return (
                            <SidebarMenuItem key={item.to}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActiveLink(item.to, item.end)}
                                    tooltip={item.label}
                                >
                                    <Link href={item.to}>
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}

                    {/* Sign Out */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            tooltip="Cerrar Sesion"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar Sesion</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </>
    );
};

// Mobile sidebar content (reused in Sheet)
const MobileSidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { profile, isAdmin, isSales, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const getUserRole = (): 'admin' | 'sales' | 'user' => {
        if (isAdmin) return 'admin';
        if (isSales) return 'sales';
        return 'user';
    };

    const userRole = getUserRole();

    const filterByRole = (items: NavItem[]) => {
        return items.filter(item => !item.roles || item.roles.includes(userRole));
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
            onClose?.();
            // Force full page reload to clear all state and go to home
            window.location.href = '/';
        }
    };

    const handleNavClick = () => {
        onClose?.();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="border-b p-4 bg-white">
                <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
                    <img
                        src="/images/trefalogo.png"
                        alt="TREFA"
                        className="h-8 w-auto object-contain"
                    />
                </Link>

                {/* User Profile Card */}
                <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3 mt-4">
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
                            {isAdmin ? 'Administrador' : isSales ? 'Ventas' : 'Usuario'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {/* Admin First Level Items */}
                {isAdmin && (
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Administracion</p>
                        <nav className="space-y-1">
                            {filterByRole(adminFirstLevelItems).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        onClick={handleNavClick}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            isActiveLink(item.to, item.end)
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Admin Dashboards */}
                {isAdmin && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <BarChart3 className="h-4 w-4" />
                                <span>Dashboards</span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <nav className="space-y-1 mt-2">
                                {filterByRole(adminDashboardsGroup.items).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.to}
                                            href={item.to}
                                            onClick={handleNavClick}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent ml-2",
                                                isActiveLink(item.to, item.end)
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Admin Tools */}
                {isAdmin && (
                    <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <Settings className="h-4 w-4" />
                                <span>Herramientas</span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <nav className="space-y-1 mt-2">
                                {filterByRole(adminToolsGroup.items).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.to}
                                            href={item.to}
                                            onClick={handleNavClick}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent ml-2",
                                                isActiveLink(item.to, item.end)
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Sales-specific items */}
                {isSales && (
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ventas</p>
                        <nav className="space-y-1">
                            {filterByRole(salesNavItems).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        onClick={handleNavClick}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                            isActiveLink(item.to, item.end)
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}

                <Separator />

                {/* Common Items for All Users */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General</p>
                    <nav className="space-y-1">
                        {filterByRole(commonNavItems).map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    onClick={handleNavClick}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                        isActiveLink(item.to, item.end)
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-1 bg-white">
                {filterByRole(secondaryNavItems).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            onClick={handleNavClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                isActiveLink(item.to, item.end)
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-destructive/10 text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesion
                </button>
            </div>
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

    // Generate breadcrumbs from current path
    const generateBreadcrumbs = () => {
        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Inicio', href: '/' }];

        let currentPath = '';
        paths.forEach((path) => {
            currentPath += `/${path}`;
            // Capitalize and clean up path name
            const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
            breadcrumbs.push({ label, href: currentPath });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <SidebarProvider defaultOpen={true}>
            {/* Sidebar permanece abierto por defecto, se puede cerrar manualmente */}

            <Sidebar
                collapsible="icon"
                className={cn(
                    // Base styles
                    "border-r border-gray-100/60 transition-colors duration-300",
                    // Expanded state - subtle gray
                    "group-data-[state=expanded]:bg-gray-50/30",
                    // Collapsed state - dark gray background with white icons
                    "group-data-[state=collapsed]:!bg-gray-800 group-data-[state=collapsed]:border-gray-700",
                    // Collapsed state - white icons, proper size
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!text-white",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!w-5",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!h-5",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg]:!stroke-[1.5]",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]]:hover:bg-gray-700",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]]:hover:!text-white",
                    // Center menu items within sidebar when collapsed
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu]]:!px-0",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]]:!mx-auto",
                    // Hide all text when collapsed
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]>span]:hidden",
                    "group-data-[state=collapsed]:[&_[data-sidebar=group-label]]:hidden",
                    // Hide chevron icons in collapsed state (dropdowns don't work when collapsed)
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg.lucide-chevron-down]:!hidden",
                    "group-data-[state=collapsed]:[&_[data-sidebar=menu-button]_svg.lucide-chevron-right]:!hidden",
                    "group-data-[state=collapsed]:[&_button_svg.lucide-chevron-down]:!hidden",
                    "group-data-[state=collapsed]:[&_button_svg.lucide-chevron-right]:!hidden",
                    // Menu sub border
                    "[&_[data-sidebar=menu-sub]]:border-gray-100/60",
                    // Font sizes and padding (desktop)
                    "[&_[data-sidebar=menu-button]]:text-[13px]",
                    "[&_[data-sidebar=menu-button]]:pl-3",
                    "[&_[data-sidebar=menu-sub-button]]:text-[13px]"
                )}
            >
                <AppSidebarContent />
            </Sidebar>
            <SidebarInset className="bg-background">
                {/* Floating Header Card - Dashboard Shell 02 Style */}
                <header className="before:bg-background/60 sticky top-0 z-50 before:absolute before:inset-0 before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md">
                    <div className="bg-white relative z-[51] mx-auto mt-2 flex w-[calc(100%-1rem)] max-w-[calc(1280px-3rem)] items-center justify-between rounded-xl border border-gray-100/80 px-4 py-2 md:mt-3 md:w-[calc(100%-2rem)] md:px-6 shadow-sm">
                    {/* Left section */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                                    <Menu className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0 bg-white z-[60]">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Menu de navegacion</SheetTitle>
                                </SheetHeader>
                                <MobileSidebarContent onClose={() => setMobileMenuOpen(false)} />
                            </SheetContent>
                        </Sheet>

                        {/* Desktop Sidebar Toggle */}
                        <SidebarTrigger className="hidden md:flex h-8 w-8" />

                        {/* Separator */}
                        <Separator orientation="vertical" className="hidden md:block h-5" />

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

                        {/* Mobile Logo */}
                        <Link href="/" className="flex items-center gap-2 md:hidden">
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-5 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-1">
                        {/* Search button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Buscar</span>
                        </Button>

                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notificaciones</span>
                        </Button>

                        {/* User Avatar with Dropdown Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 p-0">
                                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                                        <AvatarFallback className="bg-primary-600 text-white text-xs font-semibold">
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
                                <DropdownMenuItem asChild>
                                    <Link href="/escritorio/perfilacion-bancaria" className="cursor-pointer">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        <span>Perfilacion Bancaria</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesion</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </div>
                </header>

                {/* Page Content - Optimized spacing */}
                <main className="mx-auto w-full max-w-7xl flex-1 px-2 py-3 md:px-4 md:py-4 overflow-x-hidden transition-all duration-300">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default UnifiedDashboardLayout;
