import { Metadata } from 'next';
import BrandsPage from '@/page-components/BrandsPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marcas de Autos Disponibles',
  description: 'Explora todas las marcas de autos disponibles en TREFA. Honda, Toyota, Nissan, Mazda, Jeep, Kia y mas.',
  openGraph: {
    title: 'Marcas de Autos | TREFA',
    description: 'Todas las marcas de autos seminuevos disponibles',
  },
};

export default function Page() {
  return <BrandsPage />;
}
