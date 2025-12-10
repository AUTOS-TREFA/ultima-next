'use client';

import MainLayout from '@/components/MainLayout';
import { FilterProvider } from '@/context/FilterContext';
import { InventoryProvider } from '@/context/VehicleContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FilterProvider>
      <InventoryProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </InventoryProvider>
    </FilterProvider>
  );
}
