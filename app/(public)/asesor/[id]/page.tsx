'use client';

export const dynamic = 'force-dynamic';

import AsesorProfilePage from '@/page-components/AsesorProfilePage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AsesorProfilePage />;
}
