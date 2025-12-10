'use client';

import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import { InventoryProvider } from '@/context/VehicleContext';

export default function EscritorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      <UnifiedDashboardLayout>
        {children}
      </UnifiedDashboardLayout>
    </InventoryProvider>
  );
}
