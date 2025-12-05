'use client';

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { BankService } from '../services/BankService';
import { Loader2 } from 'lucide-react';

/**
 * BankRoute Component
 * Protects routes that should only be accessible to approved bank representatives or admins
 */
interface BankRouteProps {
  children: React.ReactNode;
}

const BankRoute: React.FC<BankRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBankRep, setIsBankRep] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkBankRepAuth();
  }, []);

  const checkBankRepAuth = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user is admin first
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const adminEmails = [
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'alejandro.trevino@autostrefa.mx',
        'fernando.trevino@autostrefa.mx',
        'alejandro.gallardo@autostrefa.mx',
        'lizeth.juarez@autostrefa.mx'
      ];

      if (profile && adminEmails.includes(profile.email)) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check if user is a bank representative
      const bankProfile = await BankService.getBankRepProfile();

      if (!bankProfile) {
        setLoading(false);
        return;
      }

      setIsBankRep(true);
      setIsApproved(bankProfile.is_approved && bankProfile.is_active);
    } catch (error) {
      console.error('Error checking bank rep auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated at all - redirect to bank login
  if (!isAuthenticated) {
    redirect('/bancos');
  }

  // Admin bypass - allow access without bank rep check
  if (isAdmin) {
    return <>{children}</>;
  }

  // Authenticated but not a bank rep - redirect to regular user dashboard
  if (!isBankRep) {
    redirect('/escritorio');
  }

  // Bank rep but not approved - show pending message
  if (!isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta pendiente de aprobación</h2>
          <p className="text-gray-600 mb-6">Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por correo cuando tu cuenta sea aprobada.</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/bancos';
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // All checks passed - render the protected content
  return <>{children}</>;
};

export default BankRoute;
