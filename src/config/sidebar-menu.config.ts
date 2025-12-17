/**
 * Sidebar Menu Configuration
 *
 * Centralized configuration for the dashboard sidebar menu.
 * All menu items, groups, and role-based access are defined here.
 */

import {
    LayoutDashboard,
    Car,
    User,
    FileText,
    HelpCircle,
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
    Target,
    HandCoins,
    Scroll,
    Plus,
    Store,
    Package,
    DollarSign,
    Eye,
    type LucideIcon,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'user' | 'sales' | 'admin' | 'marketing';

export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
    roles: UserRole[];
    badge?: string;
    external?: boolean;
}

export interface NavGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    items: NavItem[];
    roles: UserRole[];
    defaultOpen?: boolean;
}

export interface SidebarConfig {
    commonItems: NavItem[];
    adminFirstLevelItems: NavItem[];
    sellerGroup: NavGroup;
    dashboardsGroup: NavGroup;
    toolsGroup: NavGroup;
    salesItems: NavItem[];
    secondaryItems: NavItem[];
}

// ============================================================================
// COMMON ITEMS (ALL ROLES)
// ============================================================================

export const commonNavItems: NavItem[] = [
    {
        to: '/escritorio',
        label: 'Escritorio',
        icon: LayoutDashboard,
        roles: ['admin', 'sales', 'user'],
        end: true
    },
    {
        to: '/autos',
        label: 'Inventario',
        icon: Car,
        roles: ['admin', 'sales', 'user']
    },
    {
        to: '/escritorio/profile',
        label: 'Mi Perfil',
        icon: User,
        roles: ['admin', 'sales', 'user']
    },
    {
        to: '/escritorio/seguimiento',
        label: 'Solicitudes',
        icon: FileText,
        roles: ['admin', 'sales', 'user']
    },
    {
        to: '/escritorio/aplicacion',
        label: 'Nueva solicitud',
        icon: Plus,
        roles: ['admin', 'sales', 'user']
    },
];

// ============================================================================
// ADMIN FIRST LEVEL ITEMS (DIRECT ACCESS)
// ============================================================================

export const adminFirstLevelItems: NavItem[] = [
    {
        to: '/escritorio/admin/marketing',
        label: 'Dashboard General',
        icon: LayoutDashboard,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/crm',
        label: 'Leads y CRM',
        icon: Target,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/usuarios',
        label: 'Asesores',
        icon: Users,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/customer-journeys',
        label: 'Customer Journeys',
        icon: Route,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/bancos',
        label: 'Portal Bancario',
        icon: Building2,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/compras',
        label: 'Compras',
        icon: ShoppingCart,
        roles: ['admin']
    },
    {
        to: '/escritorio/admin/marketplace',
        label: 'Marketplace',
        icon: Store,
        roles: ['admin'],
        badge: 'Nuevo'
    },
    {
        to: '/changelog',
        label: 'Changelog',
        icon: Scroll,
        roles: ['admin']
    },
];

// ============================================================================
// SELLER GROUP (ALL USERS - COLLAPSIBLE)
// ============================================================================

export const sellerNavGroup: NavGroup = {
    id: 'seller',
    label: 'Vende tu Auto',
    icon: HandCoins,
    roles: ['admin', 'sales', 'user'],
    defaultOpen: false,
    items: [
        {
            to: '/escritorio/vende-tu-auto',
            label: 'Vender mi auto',
            icon: DollarSign,
            roles: ['admin', 'sales', 'user']
        },
        {
            to: '/escritorio/marketplace',
            label: 'Consignación',
            icon: Store,
            roles: ['admin', 'sales', 'user'],
            badge: 'Nuevo'
        },
        {
            to: '/escritorio/mis-vehiculos',
            label: 'Mis Autos',
            icon: Package,
            roles: ['admin', 'sales', 'user']
        },
    ],
};

// ============================================================================
// ADMIN DASHBOARDS GROUP (COLLAPSIBLE)
// ============================================================================

export const adminDashboardsGroup: NavGroup = {
    id: 'dashboards',
    label: 'Dashboards',
    icon: BarChart3,
    roles: ['admin'],
    defaultOpen: true,
    items: [
        {
            to: '/escritorio/admin/marketing-analytics',
            label: 'Marketing',
            icon: BarChart3,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/facebook-catalogue',
            label: 'Catalogo de Facebook',
            icon: Facebook,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/business-analytics',
            label: 'Inventario',
            icon: TrendingUp,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/solicitudes',
            label: 'Solicitudes',
            icon: FileBarChart,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/tracking-analytics',
            label: 'Tracking',
            icon: Activity,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/documentos-analytics',
            label: 'Documentos',
            icon: Upload,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/dashboard',
            label: 'Desempeno',
            icon: TrendingUp,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/survey-analytics',
            label: 'Encuesta',
            icon: FileBarChart,
            roles: ['admin']
        },
    ],
};

// ============================================================================
// ADMIN TOOLS GROUP (COLLAPSIBLE)
// ============================================================================

export const adminToolsGroup: NavGroup = {
    id: 'tools',
    label: 'Herramientas',
    icon: Settings,
    roles: ['admin'],
    items: [
        {
            to: '/escritorio/admin/vacantes',
            label: 'Vacantes',
            icon: Briefcase,
            roles: ['admin']
        },
        {
            to: '/escritorio/car-studio',
            label: 'Car Studio API',
            icon: Camera,
            roles: ['admin']
        },
        {
            to: '/bank-dashboard',
            label: 'Aprobar Bancos',
            icon: Building2,
            roles: ['admin']
        },
        {
            to: '/escritorio/marketing/homepage-editor',
            label: 'Editar Homepage',
            icon: Home,
            roles: ['admin']
        },
        {
            to: '/escritorio/marketing/constructor',
            label: 'Crear Landing Page',
            icon: Palette,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/inspections',
            label: 'Inspecciones',
            icon: ClipboardCheck,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/valuation',
            label: 'Valuacion',
            icon: TrendingUp,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/marketing-config',
            label: 'Integraciones',
            icon: Settings,
            roles: ['admin']
        },
        {
            to: '/escritorio/admin/intel',
            label: 'Intel Interna',
            icon: Database,
            roles: ['admin']
        },
    ],
};

// ============================================================================
// SALES ITEMS
// ============================================================================

export const salesNavItems: NavItem[] = [
    {
        to: '/escritorio/ventas/leads',
        label: 'Mis Leads',
        icon: Users,
        roles: ['sales']
    },
    {
        to: '/escritorio/ventas/solicitudes',
        label: 'Solicitudes',
        icon: FileText,
        roles: ['sales']
    },
    {
        to: '/escritorio/ventas/performance',
        label: 'Mi Desempeno',
        icon: TrendingUp,
        roles: ['sales']
    },
];

// ============================================================================
// SECONDARY (FOOTER) ITEMS
// ============================================================================

export const secondaryNavItems: NavItem[] = [
    {
        to: '/faq',
        label: 'Ayuda / FAQs',
        icon: HelpCircle,
        roles: ['admin', 'sales', 'user']
    },
];

// ============================================================================
// FULL CONFIGURATION EXPORT
// ============================================================================

export const sidebarConfig: SidebarConfig = {
    commonItems: commonNavItems,
    adminFirstLevelItems,
    sellerGroup: sellerNavGroup,
    dashboardsGroup: adminDashboardsGroup,
    toolsGroup: adminToolsGroup,
    salesItems: salesNavItems,
    secondaryItems: secondaryNavItems,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter navigation items by user role
 */
export function filterItemsByRole(items: NavItem[], role: UserRole): NavItem[] {
    return items.filter(item => item.roles.includes(role));
}

/**
 * Check if a nav group is visible for a given role
 */
export function isGroupVisibleForRole(group: NavGroup, role: UserRole): boolean {
    return group.roles.includes(role);
}

/**
 * Get user role from auth state
 */
export function getUserRole(isAdmin: boolean, isSales: boolean): UserRole {
    if (isAdmin) return 'admin';
    if (isSales) return 'sales';
    return 'user';
}
