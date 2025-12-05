import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component that only allows access to users with 'marketing' or 'admin' role.
 * Marketing users have restricted access to marketing tools and analytics only.
 * They cannot access sensitive customer data like financing applications or uploaded documents.
 */
const MarketingRoute: React.FC = () => {
    const { isAdmin, isMarketing, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Allow both marketing and admin roles
    if (!isMarketing && !isAdmin) {
        return <Navigate to="/escritorio" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default MarketingRoute;
