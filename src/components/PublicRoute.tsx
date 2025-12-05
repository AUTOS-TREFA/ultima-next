'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If a session exists, redirect away from public pages.
  // This now only runs AFTER loading is complete, preventing the race condition.
  if (session) {
    redirect('/escritorio');
  }

  // If no session and loading is done, show the public page (e.g., login).
  return <>{children}</>;
};

export default PublicRoute;
