'use client';

export const dynamic = 'force-dynamic';

import VehicleDetailPage from '@/page-components/VehicleDetailPage';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <VehicleDetailPage slug={params.slug} />;
}
