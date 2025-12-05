import DashboardLayout from '@/components/DashboardLayout';
import { InventoryProvider } from '@/context/VehicleContext';

// Force dynamic rendering for this route segment since it depends on auth context
export const dynamic = 'force-dynamic';

export default function EscritorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </InventoryProvider>
  );
}
