'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApplicationService } from '@/services/ApplicationService';
import type { ApplicationListItem } from '@/types/types';

interface Application extends ApplicationListItem {
    car_info?: {
        _vehicleTitle?: string;
    };
}

import {
    LayoutDashboard,
    User,
    FileText,
    LogOut,
    Building2,
    Settings,
    Car,
    ChevronLeft,
    ChevronRight,
    Users,
    ListChecks,
    Heart,
    BriefcaseIcon,
    Camera,
    WrenchIcon,
    CalendarIcon,
    FileEdit,
    Loader2,
    BookOpen,
    ShoppingCart,
    UserCog,
    TrendingUp,
    TrendingDown,
    Grid3x3,
    HelpCircle,
    DollarSign,
    BarChart3,
    Route,
    Shield,
    Mail
} from 'lucide-react';

// @ts-ignore
import SurveyInvitation from './SurveyInvitation';
// @ts-ignore
import BetaSurveyInvitation from './BetaSurveyInvitation';

interface SidebarContentProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isSurveyVisible: boolean;
    setIsSurveyVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isBetaSurveyVisible: boolean;
    setIsBetaSurveyVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

// Custom NavLink component for Next.js
interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string | ((props: { isActive: boolean }) => string);
    end?: boolean;
    title?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, className, end = false, title }) => {
    const pathname = usePathname();
    const isActive = end ? pathname === href : pathname.startsWith(href);

    const computedClassName = typeof className === 'function'
        ? className({ isActive })
        : className;

    return (
        <Link href={href} className={computedClassName} title={title}>
            {children}
        </Link>
    );
};


const SidebarContent: React.FC<SidebarContentProps> = ({
    isCollapsed,
    onToggle,
}) => {
    const { user, profile, signOut, isAdmin, isSales, isMarketing } = useAuth();
    const [drafts, setDrafts] = useState<Application[]>([]);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

    useEffect(() => {
        if (user && !isCollapsed) {
            setIsLoadingDrafts(true);
            ApplicationService.getUserApplications(user.id)
                .then(apps => {
                    setDrafts(apps.filter(app => app.status === 'draft'));
                })
                .catch(console.error)
                .finally(() => setIsLoadingDrafts(false));
        }
    }, [user, isCollapsed]);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    const navItems = [
        // Regular user items
        ...(!isAdmin && !isSales && !isMarketing ? [
            { to: '/escritorio', label: 'Resumen', icon: LayoutDashboard, end: true }
        ] : []),
        // Marketing users only see their profile and FAQs in the main section
        ...(!isMarketing ? [
            { to: '/escritorio/profile', label: 'Perfil', icon: User },
            { to: '/escritorio/favoritos', label: 'Favoritos', icon: Heart },
            { to: '/escritorio/seguimiento', label: 'Solicitudes', icon: FileText },
            { to: '/escritorio/citas', label: 'Citas', icon: CalendarIcon },
            { to: '/escritorio/vende-tu-auto', label: 'Vender', icon: DollarSign },
            { to: '/escritorio/autos', label: 'Inventario', icon: Car },
        ] : [
            { to: '/escritorio/profile', label: 'Perfil', icon: User },
        ]),
        // Help/FAQ for everyone at the end
        { to: '/faq', label: 'FAQs', icon: HelpCircle },
    ];

    const adminNavItems = [
        { to: '/escritorio/admin/marketing', label: 'Dashboard General', icon: BarChart3 },
        { to: '/escritorio/admin/customer-journeys', label: 'Customer Journeys', icon: Route },
        { to: '/escritorio/admin/marketing-analytics', label: 'Analytics', icon: TrendingUp },
        { to: '/bancos/dashboard', label: 'Portal Bancario', icon: Building2 },
        { to: '/escritorio/admin/config', label: 'Configuración', icon: Settings },
    ];

    const salesNavItems = [
        { to: '/escritorio/ventas/dashboard', label: 'Dashboard Ventas', icon: LayoutDashboard },
        { to: '/escritorio/ventas/crm', label: 'CRM / Leads', icon: Users },
        { to: '/escritorio/ventas/performance', label: 'Rendimiento', icon: TrendingUp },
    ];

    const userRoleText = isAdmin ? 'Administrador' : isSales ? 'Ventas' : isMarketing ? 'Marketing' : 'Usuario';

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className={`p-4 border-b flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
                 <Link href="/" className="flex items-center">
                    <img src="/images/icono.png" alt="TREFA" className={`w-auto transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-10'}`} />
                 </Link>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            href={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-base font-medium ${
                                    isActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-50/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                                }`
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'} flex-shrink-0 text-gray-600 ${!isCollapsed ? 'mr-3' : ''}`} />
                            <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.65rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Admin Section */}
                {isAdmin && (
                    <div className="mt-6 pt-6 border-t">
                        {!isCollapsed && (
                            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                                <Settings className="w-4 h-4 mr-2" />
                                Administración
                            </h3>
                        )}
                        <nav className="space-y-2">
                            {adminNavItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    href={item.to}
                                    className={({ isActive }) =>
                                        `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                            isActive
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-gray-50/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                                        }`
                                    }
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 text-gray-600 ${!isCollapsed ? 'mr-3' : ''}`} />
                                    <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Marketing Section - Visible to Marketing and Admins */}
                {(isMarketing || isAdmin) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        {!isCollapsed && (
                            <h3 className="px-3 mb-3 text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Marketing
                            </h3>
                        )}
                        <nav className="space-y-2">
                            <NavLink
                                href="/escritorio/marketing"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'Marketing Hub' : undefined}
                            >
                                <BarChart3 className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Marketing Hub</span>
                            </NavLink>
                            <NavLink
                                href="/escritorio/marketing/analytics"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'Analytics' : undefined}
                            >
                                <TrendingUp className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Analytics</span>
                            </NavLink>
                            <NavLink
                                href="/escritorio/marketing/customer-journeys"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'Customer Journeys' : undefined}
                            >
                                <Route className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Customer Journeys</span>
                            </NavLink>
                            <NavLink
                                href="/escritorio/marketing/constructor"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'Landing Page Builder' : undefined}
                            >
                                <Grid3x3 className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Landing Pages</span>
                            </NavLink>
                            <NavLink
                                href="/escritorio/marketing/crm"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'CRM Demo' : undefined}
                            >
                                <Users className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>CRM (Demo)</span>
                            </NavLink>
                            <NavLink
                                href="/escritorio/documentos-analytics"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                    }`
                                }
                                title={isCollapsed ? 'Documents Analytics' : undefined}
                            >
                                <FileText className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Documents Analytics</span>
                            </NavLink>
                        </nav>
                    </div>
                )}

                {/* Sales Section - Visible to Sales and Admins */}
                {(isSales || isAdmin) && !isMarketing && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        {!isCollapsed && (
                            <h3 className="px-3 mb-3 text-xs font-semibold text-[#FF6801] uppercase tracking-wider flex items-center">
                                <BriefcaseIcon className="w-4 h-4 mr-2" />
                                Asesores
                            </h3>
                        )}
                        <nav className="space-y-2">
                            {salesNavItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    href={item.to}
                                    className={({ isActive }) =>
                                        `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                            isActive
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-50/50 text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                                        }`
                                    }
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                    <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>{item.label}</span>
                                </NavLink>
                            ))}
                            {/* Mis Solicitudes - for sales to see their applications */}
                            <NavLink
                                href="/escritorio/ventas/mis-solicitudes"
                                className={({ isActive }) =>
                                    `flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                        isActive
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-50/50 text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                                    }`
                                }
                                title={isCollapsed ? 'Mis Solicitudes' : undefined}
                            >
                                <FileText className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.6rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>Mis Solicitudes</span>
                            </NavLink>
                        </nav>
                    </div>
                )}

                {!isCollapsed && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                            <FileEdit className="w-4 h-4 mr-2" />
                            Borradores
                        </h3>
                        <div className="mt-2 space-y-1">
                            {isLoadingDrafts ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400"/></div>
                            ) : drafts.length > 0 ? (
                                drafts.map(draft => (
                                    <Link
                                        key={draft.id}
                                        href={`/escritorio/aplicacion/${draft.id}`}
                                        className="block text-sm text-gray-600 p-3 rounded-lg hover:bg-gray-100"
                                    >
                                        {draft.car_info?._vehicleTitle || 'Borrador sin auto'}
                                    </Link>
                                ))
                            ) : (
                                <p className="p-3 text-sm text-gray-400">No hay borradores.</p>
                            )}
                        </div>
                    </div>
                )}

                {!isCollapsed && (
                     <div className="mt-6 pt-6 border-t">
                        <NavLink
                            href="/escritorio/encuesta"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-lg transition-colors text-base font-medium ${
                                    isActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-50/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                        >
                            <ListChecks className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                            <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Encuesta</span>
                        </NavLink>
                    </div>
                )}
            </div>
            <div className="p-4 border-t flex-shrink-0">
                 <NavLink
                    href="/escritorio/profile"
                    className={`flex items-center mb-4 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
                 >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-600" />
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">
                                {profile?.first_name && profile?.last_name
                                    ? `${profile.first_name} ${profile.last_name}`
                                    : profile?.first_name || user?.email}
                            </p>
                            <p className="text-xs text-gray-500">{userRoleText}</p>
                        </div>
                    )}
                </NavLink>

                {/* Cerrar Sesión */}
                <button
                    onClick={handleSignOut}
                    title={isCollapsed ? 'Cerrar Sesión' : undefined}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 mb-2 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
                </button>

                {/* Privacy Policy */}
                <Link
                    href="/privacy"
                    title={isCollapsed ? 'Política de Privacidad' : undefined}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors mb-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-sm ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">Política de Privacidad</span>}
                </Link>

                {/* Reportar Errores */}
                <Link
                    href="/contacto"
                    title={isCollapsed ? 'Reportar Errores' : undefined}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors mb-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-sm ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">Reportar Errores</span>}
                </Link>
            </div>
            <div className="p-2 border-t flex-shrink-0">
                 <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default SidebarContent;