'use client';

import MarketingCategoryPage from '@/page-components/MarketingCategoryPage';

interface PageProps {
  params: { carroceria: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <MarketingCategoryPage carroceria={params.carroceria} />;
}
