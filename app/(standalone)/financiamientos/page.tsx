import { Metadata } from 'next';
import FinanciamientosPage from '@/page-components/FinanciamientosPage';
import { OrganizationStructuredData } from '@/components/StructuredData';

// Revalidar cada hora
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Financiamiento de Autos Seminuevos - Aprobación Rápida | TREFA',
  description: 'Obtén financiamiento para tu auto seminuevo con respuesta en 24 horas. Mensualidades desde $4,000. Sin checar buró. Aprobación del 95%. Solicita tu crédito automotriz en línea.',
  keywords: 'financiamiento autos, crédito automotriz, financiamiento seminuevos, préstamo auto, sin buró, aprobación rápida, mensualidades bajas, TREFA, Monterrey',
  authors: [{ name: 'TREFA' }],

  // Open Graph para redes sociales - Optimizado para conversión
  openGraph: {
    title: 'Financiamiento de Autos - Respuesta en 24hrs | TREFA',
    description: 'Mensualidades desde $4,000. Sin checar buró. Aprobación del 95%. Solicita en línea.',
    type: 'website',
    url: 'https://trefa.mx/financiamientos',
    siteName: 'TREFA',
    locale: 'es_MX',
    images: [
      {
        url: 'https://trefa.mx/images/financing-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Financiamiento TREFA - Aprobación Rápida',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Financiamiento de Autos | TREFA',
    description: 'Mensualidades desde $4,000. Sin buró. Respuesta en 24hrs.',
    images: ['https://trefa.mx/images/financing-og.jpg'],
    site: '@trefa',
  },

  alternates: {
    canonical: 'https://trefa.mx/financiamientos',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Metadata adicional para landing page de conversión
  other: {
    'og:type': 'website',
    'og:locale': 'es_MX',
  },
};

/**
 * Landing page de Financiamientos - Server Component optimizado para conversión
 *
 * Esta es una página crítica de conversión que genera eventos de:
 * - ConversionLandingPage (cuando se envía el formulario)
 * - PageView
 * - Lead (form submissions)
 *
 * Incluye:
 * - Metadata optimizada para búsquedas de financiamiento
 * - Open Graph optimizado para redes sociales
 * - Datos estructurados de organización
 * - Preserva TODO el tracking (Pixel, GTM, Analytics) en el client component
 */
export default function Page() {
  return (
    <>
      {/* Datos estructurados para la organización */}
      <OrganizationStructuredData url="https://trefa.mx/financiamientos" />

      {/*
        Client component con formulario de conversión y tracking completo
        IMPORTANTE: Este componente genera eventos de tracking críticos
        - ConversionLandingPage al enviar formulario
        - Captura UTM parameters para atribución de campañas
      */}
      <FinanciamientosPage />
    </>
  );
}
