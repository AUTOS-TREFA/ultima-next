'use client';

import AdminCandidatesPage from '@/page-components/AdminCandidatesPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <AdminCandidatesPage id={params.id} />;
}
