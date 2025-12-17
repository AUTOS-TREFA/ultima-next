'use client';

import dynamic from 'next/dynamic';

const UnifiedAdminDashboard = dynamic(
  () => import('@/page-components/UnifiedAdminDashboard'),
  { ssr: false }
);

export default function Page() {
  return <UnifiedAdminDashboard />;
}
