'use client';

import BankDashboardLayout from '@/components/BankDashboardLayout';

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BankDashboardLayout>{children}</BankDashboardLayout>;
}
