import AutosConOfertaPage from '@/pages/AutosConOfertaPage';

interface PageProps {
  params: { listingId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AutosConOfertaPage />;
}
