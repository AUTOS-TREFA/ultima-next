import { Metadata } from 'next';
import FaqPage from '@/page-components/faqs';

// This page requires force-dynamic because the parent layout uses contexts
// that depend on runtime data fetching
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes | TREFA',
  description: 'Respuestas a las preguntas mas frecuentes sobre financiamiento automotriz, compra y venta de autos seminuevos en TREFA.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <FaqPage />;
}
