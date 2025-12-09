'use client';

import DynamicLandingPage from '@/page-components/DynamicLandingPage';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <DynamicLandingPage slug={params.slug} />;
}
