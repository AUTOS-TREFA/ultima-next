'use client';

import AutosConOfertaPage from '@/page-components/AutosConOfertaPage';

interface PageProps {
  params: { listingId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <AutosConOfertaPage listingId={params.listingId} />;
}
