'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const pathname = usePathname();

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
    localStorage.setItem('loginRedirect', pathname);
    redirect('/acceder');
  }

  // If loading is finished and a session exists, render the protected content.
  return <>{children}</>;
};

export default ProtectedRoute;