'use client';

export const dynamic = 'force-dynamic';

import MarketingCategoryPage from '@/page-components/MarketingCategoryPage';

interface PageProps {
  params: { marca: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <MarketingCategoryPage />;
}
