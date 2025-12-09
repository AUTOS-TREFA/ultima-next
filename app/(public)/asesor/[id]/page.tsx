'use client';

import AsesorProfilePage from '@/page-components/AsesorProfilePage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <AsesorProfilePage id={params.id} />;
}
