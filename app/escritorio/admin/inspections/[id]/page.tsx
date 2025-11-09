import AdminInspectionPage from '@/pages/AdminInspectionPage';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <AdminInspectionPage />;
}
