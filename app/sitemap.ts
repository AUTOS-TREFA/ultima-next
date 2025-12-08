import { MetadataRoute } from 'next';
import VehicleService from '@/services/VehicleService';

/**
 * Sitemap dinámico para Next.js 14
 *
 * Genera automáticamente un sitemap.xml con todas las páginas del sitio,
 * incluyendo todos los vehículos del inventario.
 *
 * Este archivo se actualiza automáticamente cada vez que se hace build
 * o cuando se regenera la página (ISR).
 *
 * Accesible en: https://trefa.mx/sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trefa.mx';

  // Páginas estáticas principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/autos`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/financiamientos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marcas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/conocenos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politica-de-privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/vacantes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/vender-mi-auto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/promociones`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Obtener todos los vehículos del inventario
  try {
    const vehicleSlugs = await VehicleService.getAllVehicleSlugs();

    const vehiclePages: MetadataRoute.Sitemap = vehicleSlugs.map((vehicle) => ({
      url: `${baseUrl}/autos/${vehicle.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    // Combinar páginas estáticas y dinámicas
    return [...staticPages, ...vehiclePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // En caso de error, retornar solo las páginas estáticas
    return staticPages;
  }
}
