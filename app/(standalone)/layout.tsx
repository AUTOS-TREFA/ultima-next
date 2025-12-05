import { InventoryProvider } from '@/context/VehicleContext';

// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic';

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
