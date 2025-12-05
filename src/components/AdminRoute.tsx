'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { isAdmin, isSales, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAdmin && !isSales) {
        redirect('/escritorio');
    }

    return <>{children}</>;
};

export default AdminRoute;