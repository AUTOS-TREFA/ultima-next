import { Metadata } from 'next';
import FaqPage from '@/page-components/faqs';

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
