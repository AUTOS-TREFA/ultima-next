import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VehicleService from '@/services/VehicleService';
import { VehicleStructuredData } from '@/components/StructuredData';
import { getVehicleImage } from '@/utils/getVehicleImage';
import { formatPrice, formatMileage } from '@/utils/formatters';
import VehicleDetailPageV2 from '@/page-components/VehicleDetailPageV2';

interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

/**
 * Genera metadata dinamica para SEO optimizado de cada vehiculo
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vehicle = await VehicleService.getVehicleBySlug(params.slug);

  if (!vehicle) {
    return {
      title: 'Vehiculo no encontrado',
      description: 'El vehiculo que buscas no esta disponible',
    };
  }

  const title = vehicle.titulo || vehicle.title;
  const imageUrl = getVehicleImage(vehicle);
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://trefa.mx${imageUrl}`;

  const description = vehicle.metadescripcion ||
    vehicle.descripcion ||
    `${vehicle.marca} ${vehicle.modelo} ${vehicle.autoano || vehicle.year}. ${formatPrice(vehicle.precio || vehicle.price)}. ${formatMileage(vehicle.kilometraje || vehicle.kms)}. ${vehicle.transmision}. ${vehicle.combustible}. Con financiamiento disponible en TREFA.`;

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
    description: description.slice(0, 160),
    keywords: keywords,
    authors: [{ name: 'TREFA' }],
    openGraph: {
      title: title,
      description: description.slice(0, 200),
      type: 'website',
      url: `https://trefa.mx/autos-v2/${params.slug}`,
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
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description.slice(0, 200),
      images: [absoluteImageUrl],
      site: '@trefa',
      creator: '@trefa',
    },
    alternates: {
      canonical: `https://trefa.mx/autos-v2/${params.slug}`,
    },
    robots: {
      index: !vehicle.vendido,
      follow: true,
      googleBot: {
        index: !vehicle.vendido,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const revalidate = 3600;
export const dynamicParams = true;

/**
 * Server Component - Version 2 con diseno shadcn
 */
export default async function Page({ params }: PageProps) {
  const vehicle = await VehicleService.getVehicleBySlug(params.slug);

  if (!vehicle) {
    notFound();
  }

  const url = `https://trefa.mx/autos-v2/${params.slug}`;

  return (
    <>
      <VehicleStructuredData vehicle={vehicle} url={url} />
      <VehicleDetailPageV2 slug={params.slug} />
    </>
  );
}
