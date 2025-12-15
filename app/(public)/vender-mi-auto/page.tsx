import { Metadata } from 'next';
import VenderMiAutoPage from '@/page-components/VenderMiAutoPage';

export const metadata: Metadata = {
  title: 'Vende tu Auto | Cotización Gratis en Segundos | TREFA',
  description:
    '¿Cuánto vale tu auto? Descúbrelo en segundos con nuestra valuación gratuita. Recibe una oferta de compra instantánea basada en datos reales del mercado mexicano. Pago en 24 horas.',
  keywords: [
    'vender auto',
    'cuanto vale mi auto',
    'valuacion de auto',
    'cotizacion de auto',
    'venta de autos usados',
    'precio de mi auto',
    'tasacion de autos',
    'compra de autos',
    'vender carro',
    'guia autometrica',
  ],
  openGraph: {
    title: 'Vende tu Auto | Cotización Gratis en Segundos | TREFA',
    description:
      '¿Cuánto vale tu auto? Recibe una oferta de compra instantánea. Sin costo, sin compromiso, pago en 24 horas.',
    url: 'https://trefa.mx/vender-mi-auto',
    siteName: 'TREFA',
    images: [
      {
        url: 'https://trefa.mx/images/og-vender-auto.jpg',
        width: 1200,
        height: 630,
        alt: 'Vende tu auto con TREFA',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vende tu Auto | Cotización Gratis | TREFA',
    description: '¿Cuánto vale tu auto? Recibe una oferta instantánea. Pago en 24 horas.',
  },
  alternates: {
    canonical: 'https://trefa.mx/vender-mi-auto',
  },
};

export default function Page() {
  return <VenderMiAutoPage />;
}
