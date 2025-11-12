'use client';

export const dynamic = 'force-dynamic';

import AdminCandidatesPage from '@/page-components/AdminCandidatesPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AdminCandidatesPage id={params.id} />;
}
