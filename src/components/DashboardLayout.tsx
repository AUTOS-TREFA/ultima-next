


'use client';

import React, { useState, useRef, useEffect } from 'react';



import { usePathname } from 'next/navigation';
import Link from 'next/link';



import {



    Menu,



    X,



} from 'lucide-react';



import BottomNav from './BottomNav';



import SidebarContent from './SidebarContent';

import TopMenu from './TopMenu';



import useSEO from '../hooks/useSEO';



import { useAuth } from '../context/AuthContext';







interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {



    useSEO({



        title: 'Escritorio | TREFA',



        description: 'Administra tus solicitudes de financiamiento, guarda tus autos favoritos y da seguimiento a tus trámites en el portal de clientes de TREFA.',



        keywords: 'escritorio trefa, portal de clientes, mis solicitudes, financiamiento automotriz'



    });







    const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile



    const { profile } = useAuth();
    // Admin and sales users get compact sidebar by default for more dashboard space
    const isAdminOrSales = profile?.role === 'admin' || profile?.role === 'sales';
    const [isCollapsed, setIsCollapsed] = useState(isAdminOrSales); // For desktop



    const [isSurveyVisible, setIsSurveyVisible] = useState(true); // New state



    const [isBetaSurveyVisible, setIsBetaSurveyVisible] = useState(true); // New state



    const { user } = useAuth();



    const pathname = usePathname();



    const noPadding = pathname?.endsWith('/encuesta');



    const mainContentRef = useRef<HTMLElement>(null);











    useEffect(() => {



        if (mainContentRef.current) {



            mainContentRef.current.scrollTo(0, 0);



        }



    }, [pathname]);







    // Tutorial functionality commented out - not currently in use
    // const handleCloseTutorial = () => {
    //     if (user) {
    //         const tutorialShownKey = `tutorialShown_${user.id}`;
    //         localStorage.setItem(tutorialShownKey, 'true');
    //     }
    //     // setShowTutorial(false);
    // };







    return (



        <div className="flex h-screen bg-gray-100 overflow-x-hidden">



            {/* Desktop Sidebar */}



            <aside className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out relative z-20 ${isCollapsed ? 'w-28' : 'w-64'}`}>



                <SidebarContent



                    isCollapsed={isCollapsed}



                    onToggle={() => setIsCollapsed(!isCollapsed)}



                    isSurveyVisible={isSurveyVisible}



                    setIsSurveyVisible={setIsSurveyVisible}



                    isBetaSurveyVisible={isBetaSurveyVisible}



                    setIsBetaSurveyVisible={setIsBetaSurveyVisible}



                />



            </aside>



            {/* Mobile Sidebar */}



            <div className={`fixed inset-0 z-40 flex lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>



                {/* Overlay */}



                <div 



                    className={`absolute inset-0 bg-black/60 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}



                    onClick={() => setSidebarOpen(false)}



                ></div>



                {/* Drawer */}



                <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white/80 backdrop-blur-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>



                    <div className={`absolute top-0 right-0 -mr-12 pt-2 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>



                        <button



                            type="button"



                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"



                            onClick={() => setSidebarOpen(false)}



                        >



                            <span className="sr-only">Cerrar menú</span>



                            <X className="h-6 w-6 text-white" aria-hidden="true" />



                        </button>



                    </div>



                    {/* The mobile sidebar should always be full width, so we pass hardcoded props */}



                    <SidebarContent



                        isCollapsed={false}



                        onToggle={() => setSidebarOpen(false)}



                        isSurveyVisible={isSurveyVisible}



                        setIsSurveyVisible={setIsSurveyVisible}



                        isBetaSurveyVisible={isBetaSurveyVisible}



                        setIsBetaSurveyVisible={setIsBetaSurveyVisible}



                    />



                </div>



            </div>



            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Mobile Hamburger Menu Button */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Abrir menú</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <Link href="/escritorio" className="flex items-center">
                        <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-6" />
                    </Link>
                    <div className="w-10"></div> {/* Spacer for center alignment */}
                </div>

                {/* Top Menu for Admin/Sales */}
                <TopMenu />

                <main ref={mainContentRef} className="flex-1 relative overflow-y-auto focus:outline-none">



                    <div className={`py-8 px-4 sm:px-6 lg:px-8 ${noPadding ? '' : 'pb-24 lg:pb-8'}`}>



                        {children}



                    </div>



                </main>



            </div>



            <BottomNav />



            {/* <EbookCta /> */}



        </div>



    );



};







export default DashboardLayout;