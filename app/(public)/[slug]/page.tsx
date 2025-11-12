'use client';

export const dynamic = 'force-dynamic';

import DynamicLandingPage from '@/page-components/DynamicLandingPage';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <DynamicLandingPage slug={params.slug} />;
}
