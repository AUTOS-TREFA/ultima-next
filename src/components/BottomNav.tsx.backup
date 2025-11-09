import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    SellCarIcon,
    ChevronUpIcon,
    BuyCarIcon,
    UserIcon,
    LayoutGridIcon,
    FilterIcon,
    TagIcon,
    LayoutDashboardIcon,
    HeartIcon,
    FileTextIcon,
    LogOutIcon,
    // FIX: Changed import from HelpCircle to HelpCircleIcon to resolve module export error.
    HelpCircleIcon
} from './icons';
import { useAuth } from '../context/AuthContext';

// Links that will appear in the unfoldable menu
const menuLinks = [
    { name: 'Comprar', to: '/autos', authRequired: false, icon: BuyCarIcon },
    { name: 'Explorar', to: '/explorar', authRequired: false, icon: LayoutGridIcon },
    { name: 'Vender mi Auto', to: '/escritorio/vende-tu-auto', authRequired: true, icon: SellCarIcon },
    { name: 'Promociones', to: '/promociones', authRequired: false, icon: TagIcon },
    { name: 'Mi Escritorio', to: '/escritorio', authRequired: true, icon: LayoutDashboardIcon },
    { name: 'Mis Favoritos', to: '/escritorio/favoritos', authRequired: true, icon: HeartIcon },
    { name: 'Mis Solicitudes', to: '/escritorio/seguimiento', authRequired: true, icon: FileTextIcon },
    { name: 'Mi Perfil', to: '/escritorio/profile', authRequired: true, icon: UserIcon },
    { name: 'Ayuda / FAQ', to: '/faq', authRequired: false, icon: HelpCircleIcon },
    { name: 'Cerrar Sesión', to: '/acceder', authRequired: true, icon: LogOutIcon, isSignOut: true },
];

const BottomNav: React.FC = () => {
    const { session, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isListPage = useMemo(() => {
        const listPageRegex = /^\/(autos|marcas\/[^\/]+|carroceria\/[^\/]+)$/;
        return listPageRegex.test(location.pathname);
    }, [location.pathname]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide bottom nav when keyboard is visible (input/textarea focused)
    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                setIsKeyboardVisible(true);
                // Scroll the focused element into view with some offset
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        };

        const handleFocusOut = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                // Delay hiding to allow for focus transitions between fields
                setTimeout(() => {
                    const activeElement = document.activeElement as HTMLElement;
                    if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && activeElement.tagName !== 'SELECT') {
                        setIsKeyboardVisible(false);
                    }
                }, 100);
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const handleLinkClick = (to: string, authRequired: boolean, isSignOut?: boolean) => {
        setIsMenuOpen(false);
        if (isSignOut) {
            signOut();
            navigate('/');
            return;
        }
        if (authRequired && !session) {
            localStorage.setItem('loginRedirect', to);
            navigate('/acceder');
        } else {
            navigate(to);
        }
    };

    const handleFilterClick = () => {
        window.dispatchEvent(new CustomEvent('toggleFilterSheet'));
    };

    const baseLinkClass = "flex flex-col items-center justify-center w-full transition-colors duration-200 gap-1";
    const activeLinkClass = "text-primary-600";
    const inactiveLinkClass = "text-gray-500 hover:text-primary-500";

    const accountLink = session ? '/escritorio' : '/acceder';

    const NavItem: React.FC<{ to: string; icon: React.FC<any>; label: string; end?: boolean }> = ({ to, icon: Icon, label, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
        </NavLink>
    );

    const visibleMenuLinks = menuLinks.filter(link => !link.authRequired || session);

    return (
        <>
            <nav className={`fixed bottom-0 left-0 right-0 z-[80] bg-white border-t border-gray-200 lg:hidden transition-transform duration-300 ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}>
                <div className="max-w-md mx-auto grid grid-cols-5 justify-around items-center h-16">
                    <NavItem to="/" icon={HomeIcon} label="Inicio" end={true} />
                    <NavItem to="/vender-mi-auto" icon={SellCarIcon} label="Vender" />

                    <div className="flex justify-center">
                        <button
                            ref={buttonRef}
                            onClick={isListPage ? handleFilterClick : () => setIsMenuOpen(o => !o)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transform -translate-y-4 shadow-lg transition-all duration-300 active:scale-95 ${isMenuOpen && !isListPage ? 'bg-primary-700 rotate-[225deg]' : 'bg-primary-600'}`}
                            aria-expanded={!isListPage && isMenuOpen}
                            aria-label={isListPage ? "Abrir filtros" : "Abrir menú"}
                        >
                            {isListPage ? (
                                <FilterIcon className="w-7 h-7 text-white" />
                            ) : (
                                <ChevronUpIcon className="w-8 h-8 text-white transition-transform duration-300" />
                            )}
                        </button>
                    </div>

                    <NavItem to="/autos" icon={BuyCarIcon} label="Comprar" />
                    <NavItem to={accountLink} icon={UserIcon} label="Mi Cuenta" />
                </div>
            </nav>

            {/* Unfoldable menu - now always available but shows filter sheet on list pages */}
            {(
                <>
                    <div
                        className={`fixed inset-0 z-[75] bg-black/60 lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setIsMenuOpen(false)}
                    ></div>

                    <div
                        ref={menuRef}
                        className={`fixed bottom-0 left-0 right-0 z-[80] lg:hidden transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    >
                        <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden pt-4 pb-16">
                             <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                             <div className="p-4 max-h-[50vh] overflow-y-auto">
                                <nav>
                                    <ul className="space-y-1">
                                        {visibleMenuLinks.map(link => (
                                            <li key={link.name}>
                                                <button onClick={() => handleLinkClick(link.to, link.authRequired, (link as any).isSignOut)} className="w-full flex items-center gap-3 p-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-200/80 transition-colors">
                                                    {link.icon && <link.icon className="w-5 h-5 text-primary-600" />}
                                                    <span>{link.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default BottomNav;
