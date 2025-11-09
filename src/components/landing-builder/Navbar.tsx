
'use client';

import React from 'react';
import type { BuilderType } from '../../page-components/ConstructorPage';

interface NavbarProps {
    active: BuilderType;
    setActive: (active: BuilderType) => void;
}

const NavItem: React.FC<{ title: string; isActive: boolean; onClick: () => void }> = ({ title, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6801] focus-visible:ring-opacity-75
        ${isActive
                ? 'bg-[#FF6801] text-white shadow'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
    >
        {title}
    </button>
);


export const Navbar: React.FC<NavbarProps> = ({ active, setActive }) => {
    return (
        <nav className="px-4 sm:px-8 py-4 sticky top-[89px] sm:top-[81px] bg-slate-100/80 backdrop-blur-sm z-10 border-b border-slate-200">
            <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-1 sm:gap-4 bg-slate-200/50 p-1.5 rounded-lg">
                <NavItem title="Hero" isActive={active === 'hero'} onClick={() => setActive('hero')} />
                <NavItem title="Secciones" isActive={active === 'secciones'} onClick={() => setActive('secciones')} />
                <NavItem title="Features" isActive={active === 'features'} onClick={() => setActive('features')} />
                <NavItem title="Carrusels" isActive={active === 'carrusels'} onClick={() => setActive('carrusels')} />
                <NavItem title="Comparación" isActive={active === 'comparacion'} onClick={() => setActive('comparacion')} />
                <div className="hidden sm:block w-[2px] h-6 bg-slate-300" />
                <NavItem title="Landing Page" isActive={active === 'landing'} onClick={() => setActive('landing')} />
            </div>
        </nav>
    );
};
