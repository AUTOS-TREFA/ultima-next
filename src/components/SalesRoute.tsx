'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component that only allows access to users with 'sales' or 'admin' role.
 * Admins can access all sales routes for oversight purposes.
 */
interface SalesRouteProps {
    children: React.ReactNode;
}

const SalesRoute: React.FC<SalesRouteProps> = ({ children }) => {
    const { isAdmin, isSales, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Allow both sales and admin roles
    if (!isSales && !isAdmin) {
        redirect('/escritorio');
    }

    return <>{children}</>;
};

export default SalesRoute;
