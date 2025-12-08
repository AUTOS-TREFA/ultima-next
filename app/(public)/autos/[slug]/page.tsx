import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VehicleDetailPage from '@/page-components/VehicleDetailPage';
import { VehicleStructuredData } from '@/components/StructuredData';
import VehicleService from '@/services/VehicleService';
import { getVehicleImage } from '@/utils/getVehicleImage';
import { formatPrice, formatMileage } from '@/utils/formatters';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

/**
 * Genera metadata dinámica para SEO optimizado de cada vehículo
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vehicle = await VehicleService.getVehicleBySlug(params.slug);

  if (!vehicle) {
    return {
      title: 'Vehículo no encontrado',
      description: 'El vehículo que buscas no está disponible',
    };
  }

  const title = vehicle.titulo || vehicle.title;
  const imageUrl = getVehicleImage(vehicle);
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://trefa.mx${imageUrl}`;

  // Descripción optimizada para SEO
  const description = vehicle.metadescripcion ||
    vehicle.descripcion ||
    `${vehicle.marca} ${vehicle.modelo} ${vehicle.autoano || vehicle.year}. ${formatPrice(vehicle.precio || vehicle.price)}. ${formatMileage(vehicle.kilometraje || vehicle.kms)}. ${vehicle.transmision}. ${vehicle.combustible}. Con financiamiento disponible en TREFA.`;

  // Keywords relevantes para SEO
  const keywords = [
    vehicle.marca,
    vehicle.modelo,
    vehicle.autoano?.toString() || vehicle.year?.toString(),
    vehicle.transmision,
    vehicle.combustible,
    vehicle.carroceria,
    'auto seminuevo',
    'financiamiento',
    'Monterrey',
    'TREFA',
  ].filter(Boolean).join(', ');

  return {
    title: `${title} | TREFA`,
    description: description.slice(0, 160), // Google trunca en ~160 caracteres
    keywords: keywords,
    authors: [{ name: 'TREFA' }],

    // Open Graph para redes sociales
    openGraph: {
      title: title,
      description: description.slice(0, 200),
      type: 'product',
      url: `https://trefa.mx/autos/${params.slug}`,
      siteName: 'TREFA',
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'es_MX',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description.slice(0, 200),
      images: [absoluteImageUrl],
      site: '@trefa',
      creator: '@trefa',
    },

    // Alternate para otros idiomas/regiones
    alternates: {
      canonical: `https://trefa.mx/autos/${params.slug}`,
    },

    // Robots meta tags
    robots: {
      index: !vehicle.vendido, // No indexar si ya está vendido
      follow: true,
      googleBot: {
        index: !vehicle.vendido,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Metadata adicional
    other: {
      'price:amount': (vehicle.precio || vehicle.price)?.toString() || '',
      'price:currency': 'MXN',
      'product:brand': vehicle.marca,
      'product:availability': vehicle.vendido ? 'out of stock' : 'in stock',
      'product:condition': 'used',
    },
  };
}

/**
 * Genera rutas estáticas para ISR (Incremental Static Regeneration)
 * Next.js pre-renderizará las páginas más populares y regenerará bajo demanda
 */
export async function generateStaticParams() {
  try {
    const slugs = await VehicleService.getAllVehicleSlugs();

    // Retornar los primeros 100 slugs para pre-renderizar
    // El resto se generarán bajo demanda (ISR)
    return slugs.slice(0, 100).map((vehicle) => ({
      slug: vehicle.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for vehicles:', error);
    return [];
  }
}

/**
 * Configuración de revalidación para ISR
 * Las páginas se regenerarán cada 1 hora
 */
export const revalidate = 3600; // 1 hora en segundos

/**
 * Configuración de generación dinámica
 * Permite generar páginas bajo demanda para slugs no pre-renderizados
 */
export const dynamicParams = true;

/**
 * Server Component - Wrapper optimizado para SEO
 *
 * Este componente:
 * 1. Genera metadata dinámica para cada vehículo
 * 2. Añade datos estructurados (JSON-LD) para rich snippets
 * 3. Implementa ISR para performance óptima
 * 4. Renderiza el VehicleDetailPage (client component) que mantiene
 *    TODO el tracking (Pixel, GTM, Analytics) intacto
 */
export default async function Page({ params }: PageProps) {
  // Obtener datos del vehículo en el servidor
  const vehicle = await VehicleService.getVehicleBySlug(params.slug);

  // Si no existe, mostrar 404
  if (!vehicle) {
    notFound();
  }

  const url = `https://trefa.mx/autos/${params.slug}`;

  return (
    <>
      {/* Datos estructurados para SEO (JSON-LD) */}
      <VehicleStructuredData vehicle={vehicle} url={url} />

      {/* Client component que mantiene TODO el tracking intacto */}
      <VehicleDetailPage slug={params.slug} />
    </>
  );
}
