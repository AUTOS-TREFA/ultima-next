import { InventoryProvider } from '@/context/VehicleContext';

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      {children}
    </InventoryProvider>
  );
}
