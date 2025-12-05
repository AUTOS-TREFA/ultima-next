import MainLayout from '@/components/MainLayout';
import { InventoryProvider } from '@/context/VehicleContext';

// Force dynamic rendering for this route segment since it depends on data fetching
export const dynamic = 'force-dynamic';

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
