import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a loading spinner while the auth state is being resolved.
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    // If loading is finished and there's still no session, redirect to login.
    localStorage.setItem('loginRedirect', location.pathname + location.search);
    return <Navigate to="/acceder" replace />;
  }

  // If loading is finished and a session exists, render the protected content.
  return <Outlet />;
};

export default ProtectedRoute;