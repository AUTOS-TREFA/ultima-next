'use client';

import Application from '@/page-components/Application';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <Application id={params.id} />;
}
