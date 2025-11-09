import AsesorProfilePage from '@/pages/AsesorProfilePage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AsesorProfilePage />;
}
