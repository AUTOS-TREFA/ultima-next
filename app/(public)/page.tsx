import { Metadata } from 'next';
import HomePage from '@/page-components/HomePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TREFA - Autos Seminuevos con Financiamiento en Monterrey',
  description: 'Encuentra tu auto seminuevo ideal con financiamiento. Inspeccion de 150 puntos, garantia certificada y respuesta en 24 horas. SUVs, Sedanes, Hatchbacks y Pick Ups.',
  openGraph: {
    title: 'TREFA - Autos Seminuevos con Financiamiento',
    description: 'Encuentra tu auto seminuevo ideal con financiamiento en Monterrey',
    type: 'website',
  },
};

export default function Page() {
  return <HomePage />;
}
