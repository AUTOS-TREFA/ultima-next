'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import AnimatedBlobs from './AnimatedBlobs';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const isExplorarPage = pathname?.startsWith('/explorar');

    if (isExplorarPage) {
        return <>{children}</>; // Render only the page content for a full-screen experience
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden relative">
            <AnimatedBlobs />
            <Header />
            <main className="flex-grow pt-24 lg:pt-28 pb-36 lg:pb-0 relative z-10">
                {children}
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default MainLayout;