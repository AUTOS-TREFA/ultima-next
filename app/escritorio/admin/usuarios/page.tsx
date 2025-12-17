'use client';

import dynamic from 'next/dynamic';

const AdminUserManagementPage = dynamic(
  () => import('@/page-components/AdminUserManagementPage'),
  { ssr: false }
);

export default function Page() {
  return <AdminUserManagementPage />;
}
