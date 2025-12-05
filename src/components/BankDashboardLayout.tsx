'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { BankService } from '@/services/BankService';
import { BANKS } from '@/types/bank';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import BankPINSetup from './BankPINSetup';
import BankOnboarding from './BankOnboarding';

interface BankDashboardLayoutProps {
  children: React.ReactNode;
}

const BankDashboardLayout: React.FC<BankDashboardLayoutProps> = ({ children }) => {
  const [bankRepProfile, setBankRepProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadBankRepProfile();
  }, []);

  const loadBankRepProfile = async () => {
    try {
      const profile = await BankService.getBankRepProfile();
      setBankRepProfile(profile);

      // Check if PIN is set
      if (profile && !profile.pin_hash) {
        setShowPINSetup(true);
      }
      // Check if onboarding is completed
      else if (profile && !profile.has_completed_onboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error loading bank rep profile:', error);
    }
  };

  const handlePINSet = async () => {
    setShowPINSetup(false);
    // Reload profile to get updated data
    const profile = await BankService.getBankRepProfile();
    setBankRepProfile(profile);
    // Show onboarding after PIN is set
    if (!profile.has_completed_onboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/bank-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/bank-dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Inventario',
      path: '/bank-dashboard/inventario',
      icon: FileText,
      badge: 'Todos'
    },
    {
      name: 'Solicitudes Pendientes',
      path: '/bank-dashboard/pendientes',
      icon: Clock,
      badge: 'pending'
    },
    {
      name: 'Solicitudes Aprobadas',
      path: '/bank-dashboard/aprobadas',
      icon: CheckCircle,
      badge: 'approved'
    },
    {
      name: 'Solicitudes Activas',
      path: '/bank-dashboard/activas',
      icon: FileText,
      badge: 'feedback'
    },
    {
      name: 'Solicitudes Rechazadas',
      path: '/bank-dashboard/rechazadas',
      icon: XCircle,
      badge: 'rejected'
    }
  ];

  const isActiveRoute = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {bankRepProfile && (
                <>
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {BANKS[bankRepProfile.bank_affiliation]?.name.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">
                      {BANKS[bankRepProfile.bank_affiliation]?.name}
                    </h2>
                    <p className="text-xs text-gray-500">Portal Bancario</p>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm",
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <Separator />
          <div className="p-4">
            {bankRepProfile && (
              <div className="mb-3 px-4 py-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Representante</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {bankRepProfile.first_name} {bankRepProfile.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{bankRepProfile.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <div className="lg:hidden sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            {bankRepProfile && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {BANKS[bankRepProfile.bank_affiliation]?.name.charAt(0) || 'B'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {BANKS[bankRepProfile.bank_affiliation]?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* PIN Setup Modal */}
      {showPINSetup && <BankPINSetup onPINSet={handlePINSet} />}

      {/* Onboarding Modal */}
      {showOnboarding && <BankOnboarding onComplete={handleOnboardingComplete} />}
    </div>
  );
};

export default BankDashboardLayout;
