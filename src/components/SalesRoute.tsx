'use client';

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component that only allows access to users with 'sales' or 'admin' role.
 * Admins can access all sales routes for oversight purposes.
 */
const SalesRoute: React.FC = () => {
    const { isAdmin, isSales, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Allow both sales and admin roles
    if (!isSales && !isAdmin) {
        return <Navigate to="/escritorio" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default SalesRoute;
