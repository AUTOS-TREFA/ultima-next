'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/ApplicationService';

interface Application {
    id: string;
    status?: string;
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
    Search,
    DollarSign
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

// Custom icon components for Comprar and Vender
const ComprarIcon = ({ className }: { className?: string }) => (
    <div className="relative w-5 h-5 flex items-center justify-center">
        <Search className={`w-4 h-4 absolute ${className}`} style={{ transform: 'translate(-2px, -2px)' }} />
        <Car className={`w-3 h-3 absolute ${className}`} style={{ transform: 'translate(2px, 2px)' }} />
    </div>
);

const VenderIcon = ({ className }: { className?: string }) => (
    <div className="relative w-5 h-5 flex items-center justify-center">
        <DollarSign className={`w-4 h-4 absolute ${className}`} style={{ transform: 'translate(-2px, -2px)' }} />
        <Car className={`w-3 h-3 absolute ${className}`} style={{ transform: 'translate(2px, 2px)' }} />
    </div>
);

const SidebarContent: React.FC<SidebarContentProps> = ({
    isCollapsed,
    onToggle,
}) => {
    const { user, profile, signOut, isAdmin, isSales } = useAuth();
    const [drafts, setDrafts] = useState<Application[]>([]);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    const pathname = usePathname();

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
    };

    const navItems = [
        // Regular user items
        ...(!isAdmin && !isSales ? [
            { to: '/escritorio', label: 'Resumen', icon: LayoutDashboard, end: true, iconColor: 'text-blue-600', bgColor: 'bg-blue-50/50' }
        ] : []),
        { to: '/escritorio/profile', label: 'Mi Perfil', icon: User, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
        { to: '/escritorio/favoritos', label: 'Mis Favoritos', icon: Heart, iconColor: 'text-red-500', bgColor: 'bg-red-50/50' },
        { to: '/escritorio/seguimiento', label: 'Mis Solicitudes', icon: FileText, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
        { to: '/escritorio/perfilacion-bancaria', label: 'Perfil Bancario', icon: Building2, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
        { to: '/escritorio/citas', label: 'Citas', icon: CalendarIcon, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
        { to: '/escritorio/vende-tu-auto', label: 'Vender', icon: VenderIcon, iconColor: 'text-green-600', bgColor: 'bg-green-50/50', isCustomIcon: true },
        { to: '/escritorio/autos', label: 'Comprar', icon: ComprarIcon, iconColor: 'text-blue-600', bgColor: 'bg-blue-50/50', isCustomIcon: true },
        // Admin role specific links (items not in top menu)
        ...((isAdmin) ? [
            { to: '/escritorio/admin/vacantes', label: 'Vacantes', icon: BriefcaseIcon, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
            { to: '/escritorio/car-studio', label: 'Car Studio', icon: Camera, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
            { to: '/escritorio/admin/inspections', label: 'Inspecciones', icon: FileText, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
            { to: '/changelog', label: 'Registro de Cambios', icon: BookOpen, iconColor: 'text-gray-600', bgColor: 'bg-gray-50/50' },
        ] : []),
        // Help/FAQ for everyone at the end
        { to: '/faq', label: 'Ayuda', icon: HelpCircle, iconColor: 'text-gray-400', bgColor: 'bg-gray-50/50' },
    ];

    const userRoleText = isAdmin ? 'Administrador' : isSales ? 'Ventas' : 'Usuario';

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className={`p-4 border-b flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
                 <Link href="/" className="flex items-center">
                    <img src="/images/icono.png" alt="TREFA" className={`w-auto transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-10'}`} />
                 </Link>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                <nav className="space-y-2">
                    {navItems.map(item => {
                        const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
                        return (
                            <Link
                                key={item.to}
                                href={item.to}
                                className={`flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'} px-3 ${isCollapsed ? 'py-3' : 'py-2.5'} rounded-lg transition-colors text-sm font-medium ${
                                    isActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : `${item.bgColor || 'bg-gray-50/50'} text-gray-600 hover:bg-gray-200/50 hover:text-gray-900`
                                }`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {item.isCustomIcon ? (
                                    <item.icon className={`${item.iconColor || 'text-gray-600'} ${isCollapsed ? 'w-6 h-6' : ''} ${!isCollapsed ? 'mr-3' : ''}`} />
                                ) : (
                                    <item.icon className={`${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'} flex-shrink-0 ${item.iconColor || 'text-gray-600'} ${!isCollapsed ? 'mr-3' : ''}`} />
                                )}
                                <span className={`transition-all duration-200 ${isCollapsed ? 'text-[0.65rem] mt-1 text-center leading-tight' : 'whitespace-nowrap'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

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
                                        to={`/escritorio/aplicacion/${draft.id}`}
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
                        <Link
                            href="/escritorio/encuesta"
                            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                                pathname === '/escritorio/encuesta'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-gray-50/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <ListChecks className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                            <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Encuesta de Mejora</span>
                        </Link>
                    </div>
                )}
            </div>
            <div className="p-4 border-t flex-shrink-0">
                 <Link
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
                </Link>
                <button
                    onClick={handleSignOut}
                    title={isCollapsed ? 'Cerrar Sesión' : undefined}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-white font-semibold bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transform-gpu active:scale-95 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
                </button>
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