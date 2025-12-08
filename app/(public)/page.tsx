import { Metadata } from 'next';
import HomePage from '@/page-components/HomePage';
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/StructuredData';

// Revalidar cada 30 minutos para mostrar vehículos actualizados
export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'TREFA - Autos Seminuevos con Financiamiento en Monterrey',
  description: 'Encuentra tu auto seminuevo ideal con financiamiento. Inspección de 150 puntos, garantía certificada y respuesta en 24 horas. SUVs, Sedanes, Hatchbacks y Pick Ups en Monterrey, Nuevo León.',
  keywords: 'autos seminuevos, financiamiento, Monterrey, SUV, Sedan, Hatchback, Pick Up, crédito automotriz, autos usados certificados, TREFA',
  authors: [{ name: 'TREFA' }],

  // Open Graph para redes sociales
  openGraph: {
    title: 'TREFA - Autos Seminuevos con Financiamiento en Monterrey',
    description: 'Encuentra tu auto seminuevo ideal con financiamiento. Inspección de 150 puntos, garantía certificada y respuesta en 24 horas.',
    type: 'website',
    url: 'https://trefa.mx',
    siteName: 'TREFA',
    locale: 'es_MX',
    images: [
      {
        url: 'https://trefa.mx/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TREFA - Autos Seminuevos con Financiamiento',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'TREFA - Autos Seminuevos con Financiamiento',
    description: 'Encuentra tu auto seminuevo ideal con financiamiento en Monterrey',
    images: ['https://trefa.mx/images/og-image.jpg'],
    site: '@trefa',
  },

  // Metadata adicional
  alternates: {
    canonical: 'https://trefa.mx',
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

  // Verificación de propiedad para Search Console
  verification: {
    google: 'google-site-verification-code', // Reemplazar con el código real
  },
};

/**
 * Homepage - Server Component optimizado para SEO
 *
 * Incluye:
 * - Metadata completa para SEO
 * - Datos estructurados (Schema.org) para la organización y el sitio web
 * - Revalidación cada 30 minutos para contenido actualizado
 * - Preserva TODO el tracking (Pixel, GTM, Analytics) en el client component
 */
export default function Page() {
  return (
    <>
      {/* Datos estructurados para la organización */}
      <OrganizationStructuredData />

      {/* Datos estructurados para el sitio web con SearchAction */}
      <WebsiteStructuredData />

      {/* Client component con todo el tracking intacto */}
      <HomePage />
    </>
  );
}
