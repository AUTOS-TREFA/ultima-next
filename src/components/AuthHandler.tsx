'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types/types';
import { conversionTracking } from '../services/ConversionTrackingService';

// Admin email addresses that should be redirected to admin dashboard
const ADMIN_EMAILS = [
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'genauservices@gmail.com'
];

// Check if an email is an admin email
const isAdminEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export const checkApplicationProfileCompleteness = (p: Profile | null): boolean => {
    if (!p) return false;
    // Address fields (address, city, state, zip_code) are now part of the application form, not profile requirements
    const requiredApplicationFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
    return requiredApplicationFields.every(field => {
        const value = p[field];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
};

// Check if profile has basic information complete (first_name, last_name, phone, phone_verified)
export const checkBasicProfileCompleteness = (p: Profile | null): boolean => {
    if (!p) return false;
    const basicFields: (keyof Profile)[] = ['first_name', 'last_name', 'phone'];
    const hasBasicFields = basicFields.every(field => {
        const value = p[field];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
    // Also require phone_verified for complete profile
    const hasVerifiedPhone = p.phone_verified === true;
    return hasBasicFields && hasVerifiedPhone;
};

const AuthHandler: React.FC = () => {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Wait until the authentication status is fully resolved.
    if (loading) {
      return;
    }

    let redirectPath = localStorage.getItem('loginRedirect');

    // ONLY redirect if there's a pending loginRedirect OR if this is a new OAuth user
    if (session && profile && redirectPath) {
      // If no redirect path is set, determine default based on email or role
      if (!redirectPath) {
        // Check if user email is an admin email (takes priority)
        if (isAdminEmail(session.user?.email)) {
          redirectPath = '/escritorio/dashboard';
        } else if (profile.role === 'admin' || profile.role === 'sales') {
          redirectPath = '/escritorio/dashboard';
        } else {
          redirectPath = '/escritorio';
        }
      }

      // Small delay to ensure tracking event is sent before redirect
      const redirectDelay = 0;

      setTimeout(() => {
        localStorage.removeItem('loginRedirect');

        // If the user was trying to get to the application page, check if their profile is complete first.
        if (redirectPath?.startsWith('/escritorio/aplicacion')) {
          if (!checkApplicationProfileCompleteness(profile)) {
            // If not complete, force them to the profile page first.
            router.replace('/escritorio/profile');
            return;
          }
        }

        // Perform the redirect.
        if (redirectPath) {
          router.replace(redirectPath);
        }
      }, redirectDelay);
    }

    // Track InitialRegistration for new OAuth users (only once) - separate from redirect logic
    if (session && profile) {
      const isNewUser = session.user?.created_at &&
                        new Date(session.user.created_at).getTime() > (Date.now() - 10000);

      const isOAuthUser = session.user?.app_metadata?.provider === 'google' ||
                          session.user?.app_metadata?.providers?.includes('google');

      if (isNewUser && isOAuthUser && !hasTrackedRef.current) {
        console.log('🎉 New Google OAuth user detected - tracking InitialRegistration');
        conversionTracking.trackAuth.googleSignIn({
          userId: session.user.id,
          email: session.user.email
        });
        hasTrackedRef.current = true;
      }
    }
  }, [session, profile, loading, router]);

  return null;
};

export default AuthHandler;