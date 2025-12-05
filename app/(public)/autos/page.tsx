import { Metadata } from 'next';
import VehicleListPage from '@/page-components/VehicleListPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inventario de Autos Seminuevos',
  description: 'Explora nuestro inventario de autos seminuevos certificados. Encuentra SUVs, Sedanes, Hatchbacks y Pick Ups con financiamiento disponible.',
  openGraph: {
    title: 'Inventario de Autos | TREFA',
    description: 'Autos seminuevos certificados con financiamiento',
  },
};

export default function Page() {
  return <VehicleListPage />;
}
