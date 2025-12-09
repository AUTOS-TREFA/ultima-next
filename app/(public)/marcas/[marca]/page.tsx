'use client';

import MarketingCategoryPage from '@/page-components/MarketingCategoryPage';

interface PageProps {
  params: { marca: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <MarketingCategoryPage marca={params.marca} />;
}
