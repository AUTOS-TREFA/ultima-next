import { Metadata } from 'next';
import AboutPage from '@/page-components/AboutPage';

// This page requires force-dynamic because the parent layout uses contexts
// that depend on runtime data fetching
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conocenos | TREFA - Autos Seminuevos en Monterrey',
  description: 'Conoce a TREFA, la agencia de autos seminuevos que esta transformando la forma de comprar y vender vehiculos en Monterrey.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <AboutPage />;
}
