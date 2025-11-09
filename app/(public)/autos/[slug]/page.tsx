import VehicleDetailPage from '@/pages/VehicleDetailPage';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <VehicleDetailPage />;
}
