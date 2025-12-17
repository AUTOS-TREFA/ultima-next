'use client';

import SeguimientoDetailPage from '@/page-components/SeguimientoDetailPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <SeguimientoDetailPage />;
}
