'use client';

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Settings,
    ShoppingCart,
    UserCog,
    TrendingUp,
    LogOut,
    Activity
} from 'lucide-react';

const TopMenu: React.FC = () => {
    const { isAdmin, isSales, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    // Only show for admin and sales users
    if (!isAdmin && !isSales) return null;

    const menuItems = [
        { to: '/escritorio/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ...(isAdmin ? [
            { to: '/escritorio/admin/crm', label: 'Leads', icon: Users },
        ] : []),
        ...(isSales ? [
            { to: '/escritorio/ventas/crm', label: 'Leads', icon: Users },
        ] : []),
        ...(isSales || isAdmin ? [
            { to: isSales ? '/escritorio/ventas/leads' : '/escritorio/admin/leads', label: 'Mis Leads', icon: TrendingUp },
        ] : []),
        ...(isAdmin ? [
            { to: '/escritorio/marketing', label: 'Marketing Hub', icon: Settings },
            { to: '/escritorio/admin/compras', label: 'Compras', icon: ShoppingCart },
            { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: UserCog },
            { to: '/escritorio/admin/logs', label: 'Logs', icon: Activity },
        ] : []),
    ];

    return (
        <div className="bg-gradient-to-r from-[#FF6801] to-[#ff8534] border-b border-orange-600/20 shadow-md relative z-10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <div className="max-w-screen-2xl mx-auto px-6 relative">
                <div className="flex items-center justify-between h-14">
                    {/* Navigation Items */}
                    <nav className="flex items-center gap-1">
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                                            isActive
                                                ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                                                : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    <span className="drop-shadow-sm">{item.label}</span>
                                </NavLink>
                                {index < menuItems.length - 1 && (
                                    <div className="h-6 w-px bg-white/20 mx-1" />
                                )}
                            </React.Fragment>
                        ))}
                    </nav>

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
    );
};

export default TopMenu;
