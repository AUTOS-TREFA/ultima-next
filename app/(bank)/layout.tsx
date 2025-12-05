import BankDashboardLayout from '@/components/BankDashboardLayout';

// Force dynamic rendering for this route segment since it depends on auth context
export const dynamic = 'force-dynamic';

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BankDashboardLayout>{children}</BankDashboardLayout>;
}
