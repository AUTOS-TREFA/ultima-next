'use client';

import AdminInspectionPage from '@/page-components/AdminInspectionPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <AdminInspectionPage id={params.id} />;
}
