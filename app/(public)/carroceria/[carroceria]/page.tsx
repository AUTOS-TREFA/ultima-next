import MarketingCategoryPage from '@/pages/MarketingCategoryPage';

interface PageProps {
  params: { carroceria: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <MarketingCategoryPage />;
}
