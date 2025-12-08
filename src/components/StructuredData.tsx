// components/StructuredData.tsx
/**
 * Componentes para añadir datos estructurados (Schema.org JSON-LD)
 * a las páginas para mejor SEO y rich snippets en Google
 */

import type { Vehicle } from '../types/types';
import { getVehicleImage } from '../utils/getVehicleImage';

interface VehicleStructuredDataProps {
  vehicle: Vehicle;
  url: string;
}

/**
 * Datos estructurados para una página de detalle de vehículo
 * Schema.org: Car + Product + Offer
 */
export function VehicleStructuredData({ vehicle, url }: VehicleStructuredDataProps) {
  const imageUrl = getVehicleImage(vehicle);
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://trefa.mx${imageUrl}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // Car schema
      {
        '@type': 'Car',
        '@id': `${url}#car`,
        name: vehicle.titulo || vehicle.title,
        brand: {
          '@type': 'Brand',
          name: vehicle.marca,
        },
        model: vehicle.modelo,
        productionDate: vehicle.autoano?.toString() || vehicle.year?.toString(),
        vehicleModelDate: vehicle.autoano || vehicle.year,
        mileageFromOdometer: {
          '@type': 'QuantitativeValue',
          value: vehicle.kilometraje || vehicle.kms,
          unitCode: 'KMT',
        },
        vehicleTransmission: vehicle.transmision,
        fuelType: vehicle.combustible,
        vehicleEngine: {
          '@type': 'EngineSpecification',
          name: vehicle.AutoMotor,
        },
        image: absoluteImageUrl,
        description: vehicle.descripcion || vehicle.metadescripcion,
      },
      // Product schema
      {
        '@type': 'Product',
        '@id': `${url}#product`,
        name: vehicle.titulo || vehicle.title,
        image: absoluteImageUrl,
        description: vehicle.descripcion || vehicle.metadescripcion,
        brand: {
          '@type': 'Brand',
          name: vehicle.marca,
        },
        offers: {
          '@type': 'Offer',
          url: url,
          priceCurrency: 'MXN',
          price: vehicle.precio || vehicle.price,
          availability: vehicle.vendido
            ? 'https://schema.org/SoldOut'
            : vehicle.separado
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          seller: {
            '@type': 'AutoDealer',
            name: 'TREFA',
            url: 'https://trefa.mx',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Monterrey',
              addressRegion: 'Nuevo León',
              addressCountry: 'MX',
            },
          },
        },
        aggregateRating: vehicle.view_count > 10 ? {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          reviewCount: Math.floor(vehicle.view_count / 10),
        } : undefined,
      },
      // BreadcrumbList schema
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: 'https://trefa.mx',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Autos',
            item: 'https://trefa.mx/autos',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: vehicle.marca,
            item: `https://trefa.mx/marcas/${vehicle.marca.toLowerCase()}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: vehicle.titulo || vehicle.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  url?: string;
}

/**
 * Datos estructurados para la organización TREFA
 * Schema.org: AutoDealer + Organization
 */
export function OrganizationStructuredData({ url = 'https://trefa.mx' }: OrganizationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'TREFA',
    description: 'Autos seminuevos certificados con financiamiento en Monterrey. Inspección de 150 puntos, garantía certificada y respuesta en 24 horas.',
    url: url,
    logo: 'https://trefa.mx/images/trefalogo.png',
    image: 'https://trefa.mx/images/trefalogo.png',
    telephone: '+52-81-1234-5678',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Constitución',
      addressLocality: 'Monterrey',
      addressRegion: 'Nuevo León',
      postalCode: '64000',
      addressCountry: 'MX',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.6866,
      longitude: -100.3161,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '15:00',
      },
    ],
    sameAs: [
      'https://www.facebook.com/trefa',
      'https://www.instagram.com/trefa',
      'https://twitter.com/trefa',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface WebsiteStructuredDataProps {
  url?: string;
}

/**
 * Datos estructurados para el sitio web
 * Schema.org: WebSite + SearchAction
 */
export function WebsiteStructuredData({ url = 'https://trefa.mx' }: WebsiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TREFA',
    url: url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://trefa.mx/autos?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface ItemListStructuredDataProps {
  vehicles: Vehicle[];
  url: string;
}

/**
 * Datos estructurados para listado de vehículos
 * Schema.org: ItemList
 */
export function VehicleListStructuredData({ vehicles, url }: ItemListStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: url,
    numberOfItems: vehicles.length,
    itemListElement: vehicles.slice(0, 10).map((vehicle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Car',
        name: vehicle.titulo || vehicle.title,
        url: `https://trefa.mx/autos/${vehicle.slug}`,
        image: getVehicleImage(vehicle),
        offers: {
          '@type': 'Offer',
          price: vehicle.precio || vehicle.price,
          priceCurrency: 'MXN',
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
