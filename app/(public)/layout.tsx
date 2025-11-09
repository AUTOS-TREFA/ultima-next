import MainLayout from '@/components/MainLayout';
import { InventoryProvider } from '@/context/VehicleContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </InventoryProvider>
  );
}
