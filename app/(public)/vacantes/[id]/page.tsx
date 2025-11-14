'use client';

export const dynamic = 'force-dynamic';

import VacancyDetailPage from '@/page-components/VacancyDetailPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <VacancyDetailPage id={params.id} />;
}
