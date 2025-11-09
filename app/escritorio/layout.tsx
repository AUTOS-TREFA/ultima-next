import DashboardLayout from '@/components/DashboardLayout';
import { InventoryProvider } from '@/context/VehicleContext';

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
