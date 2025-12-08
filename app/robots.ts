import { MetadataRoute } from 'next';

/**
 * Archivo robots.txt dinámico para Next.js 14
 *
 * Controla el acceso de los crawlers a las diferentes secciones del sitio.
 *
 * Accesible en: https://trefa.mx/robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://trefa.mx';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/escritorio/',
          '/admin/',
          '/api/',
          '/_next/',
          '/static/',
          '/escritorio/admin/*',
          '/escritorio/ventas/*',
          '/escritorio/aplicacion/*',
          '/escritorio/profile',
          '/escritorio/perfilacion-bancaria',
          '/bank-dashboard/*',
          '/bank-login',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/escritorio/',
          '/admin/',
          '/api/',
          '/bank-dashboard/*',
          '/bank-login',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
