'use client';

import AdminClientProfilePage from '@/page-components/AdminClientProfilePage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <AdminClientProfilePage id={params.id} />;
}
