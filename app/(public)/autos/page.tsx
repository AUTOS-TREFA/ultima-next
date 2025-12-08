import { Metadata } from 'next';
import VehicleListPage from '@/page-components/VehicleListPage';
import { OrganizationStructuredData } from '@/components/StructuredData';

// Revalidar cada 15 minutos para inventario actualizado
export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Inventario de Autos Seminuevos Certificados | TREFA',
  description: 'Explora nuestro inventario completo de autos seminuevos certificados. Encuentra SUVs, Sedanes, Hatchbacks y Pick Ups con financiamiento disponible. Inspección de 150 puntos y garantía certificada en Monterrey.',
  keywords: 'inventario autos seminuevos, SUV seminueva, Sedan usado, Hatchback seminuevo, Pick Up usada, financiamiento automotriz, Monterrey, autos certificados, TREFA',
  authors: [{ name: 'TREFA' }],

  // Open Graph para redes sociales
  openGraph: {
    title: 'Inventario de Autos Seminuevos | TREFA',
    description: 'Autos seminuevos certificados con financiamiento. Inspección de 150 puntos y garantía.',
    type: 'website',
    url: 'https://trefa.mx/autos',
    siteName: 'TREFA',
    locale: 'es_MX',
    images: [
      {
        url: 'https://trefa.mx/images/inventory-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Inventario TREFA - Autos Seminuevos',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Inventario de Autos | TREFA',
    description: 'Autos seminuevos certificados con financiamiento en Monterrey',
    images: ['https://trefa.mx/images/inventory-og.jpg'],
    site: '@trefa',
  },

  alternates: {
    canonical: 'https://trefa.mx/autos',
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
};

/**
 * Página de inventario de vehículos - Server Component optimizado
 *
 * Incluye:
 * - Metadata optimizada para búsquedas de inventario
 * - Revalidación cada 15 minutos para inventario actualizado
 * - Datos estructurados de organización
 * - Preserva TODO el tracking (Pixel, GTM, Analytics) en el client component
 */
export default function Page() {
  return (
    <>
      {/* Datos estructurados para la organización */}
      <OrganizationStructuredData url="https://trefa.mx/autos" />

      {/* Client component con filtros interactivos y tracking completo */}
      <VehicleListPage />
    </>
  );
}
