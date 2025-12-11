'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { SalesService } from '../services/SalesService';
import {
    LayoutDashboard,
    Users,
    Settings,
    ShoppingCart,
    UserCog,
    TrendingUp,
    LogOut,
    Activity,
    ClipboardList,
    BarChart3,
    FileText,
    User as UserIcon,
    Clock,
    ChevronDown,
    Camera,
    BriefcaseIcon,
    WrenchIcon,
    BookOpen
} from 'lucide-react';

const TopMenu: React.FC = () => {
    const { isAdmin, isSales, signOut, user } = useAuth();
    const pathname = usePathname();
    const [herramientasOpen, setHerramientasOpen] = useState(false);
    const herramientasRef = useRef<HTMLDivElement>(null);

    // Fetch stats for sales users
    const { data: stats } = useQuery<any, Error>({
        queryKey: ['salesDashboardStats', user?.id],
        queryFn: () => SalesService.getMyLeadsStats(user?.id || ''),
        enabled: isSales && !!user?.id,
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (herramientasRef.current && !herramientasRef.current.contains(event.target as Node)) {
                setHerramientasOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    // Only show for admin and sales users
    if (!isAdmin && !isSales) return null;

    const menuItems = [
        // Panel Administrativo (Marketing Hub) - First item for admin
        ...(isAdmin ? [
            { to: '/escritorio/marketing', label: 'Panel Administrativo', icon: LayoutDashboard },
        ] : []),
        // Leads section
        ...(isAdmin ? [
            { to: '/escritorio/admin/crm', label: 'Leads', icon: Users },
        ] : []),
        ...(isSales ? [
            { to: '/escritorio/ventas/crm', label: 'Mis Leads', icon: Users },
        ] : []),
        // Asesores - for admin
        ...(isAdmin ? [
            { to: '/escritorio/admin/usuarios', label: 'Asesores', icon: UserCog },
        ] : []),
        // Performance dashboard for sales users
        ...(isSales ? [
            { to: '/escritorio/ventas/performance', label: 'Mi Desempeño', icon: TrendingUp },
        ] : []),
    ];

    const herramientasItems = [
        { to: '/escritorio/car-studio', label: 'Car Studio', icon: Camera },
        { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: BriefcaseIcon },
        { to: '/escritorio/admin/inspections', label: 'Inspecciones', icon: FileText },
        { to: '/escritorio/admin/logs', label: 'Logs', icon: Activity },
        { to: '/changelog', label: 'Registro de Cambios', icon: BookOpen },
    ];

    return (
        <div className="bg-gradient-to-r from-[#FF6801] to-[#ff8534] border-b border-orange-600/20 shadow-md relative z-10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <div className="max-w-screen-2xl mx-auto px-6 relative">
                <div className="flex items-center justify-between h-14">
                    {/* Navigation Items */}
                    <nav className="flex items-center gap-1">
                        {menuItems.map((item, index) => {
                            const isActive = pathname.startsWith(item.to);
                            return (
                                <React.Fragment key={item.to}>
                                    <Link
                                        href={item.to}
                                        className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                                            isActive
                                                ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                                                : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-sm'
                                        }`}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        <span className="drop-shadow-sm">{item.label}</span>
                                    </Link>
                                    {index < menuItems.length - 1 && (
                                        <div className="h-6 w-px bg-white/20 mx-1" />
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Herramientas Dropdown - Only for admin */}
                        {isAdmin && (
                            <>
                                <div className="h-6 w-px bg-white/20 mx-1" />
                                <div
                                    className="relative group"
                                    ref={herramientasRef}
                                >
                                    <button
                                        onMouseEnter={() => setHerramientasOpen(true)}
                                        className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                                            herramientasOpen
                                                ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                                                : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-sm'
                                        }`}
                                    >
                                        <WrenchIcon className="w-4 h-4 mr-2" />
                                        <span className="drop-shadow-sm">Herramientas</span>
                                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${herramientasOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {herramientasOpen && (
                                        <>
                                            {/* Invisible bridge to prevent gap */}
                                            <div
                                                className="absolute top-full left-0 w-60 h-2 z-[9999]"
                                                onMouseEnter={() => setHerramientasOpen(true)}
                                                onMouseLeave={() => setHerramientasOpen(false)}
                                            />
                                            <div
                                                className="absolute top-full left-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-2 z-[9999] border border-gray-200"
                                                onMouseEnter={() => setHerramientasOpen(true)}
                                                onMouseLeave={() => setHerramientasOpen(false)}
                                            >
                                                {herramientasItems.map((item) => (
                                                    <Link
                                                        key={item.to}
                                                        href={item.to}
                                                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                                        onClick={() => setHerramientasOpen(false)}
                                                    >
                                                        <item.icon className="w-4 h-4 mr-3 text-gray-500" />
                                                        <span className="font-medium">{item.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Performance Stats for Sales Users */}
                        {isSales && stats && (
                            <div className="flex items-center gap-3 text-white/95">
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{stats.total_leads || 0}</span>
                                    <span className="text-xs opacity-90">Total</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{stats.leads_with_active_app || 0}</span>
                                    <span className="text-xs opacity-90">Activas</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md backdrop-blur-sm">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{stats.leads_needing_follow_up || 0}</span>
                                    <span className="text-xs opacity-90">Seguimiento</span>
                                </div>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-white text-[#FF6801] hover:bg-white/95 transition-all shadow-md hover:shadow-lg"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopMenu;
