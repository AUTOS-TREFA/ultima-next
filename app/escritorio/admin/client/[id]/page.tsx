'use client';

export const dynamic = 'force-dynamic';

import AdminClientProfilePage from '@/page-components/AdminClientProfilePage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AdminClientProfilePage />;
}
