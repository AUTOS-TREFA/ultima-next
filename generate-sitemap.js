import https from 'https';
import fs from 'fs';
import { URL } from 'url';

// Configuration
const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';
const EDGE_FUNCTION_NAME = 'v1/rapid-processor';
const SITE_URL = 'https://trefa.mx';
const SITEMAP_PATH = './public/sitemap.xml';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily', title: 'TREFA | La Agencia de Autos Seminuevos Mejor Calificada del País' },
  { path: '/autos', priority: '0.9', changefreq: 'daily', title: 'Inventario de Autos Seminuevos - TREFA' },
  { path: '/vender-mi-auto', priority: '0.8', changefreq: 'weekly', title: 'Vender Mi Auto - TREFA Agencia de Autos Seminuevos' },
  { path: '/promociones', priority: '0.7', changefreq: 'weekly', title: 'Promociones en Autos Seminuevos - TREFA' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly', title: 'Preguntas Frecuentes - TREFA Autos Seminuevos' },
  { path: '/kit-trefa', priority: '0.6', changefreq: 'monthly', title: 'Kit TREFA - Agencia de Autos Seminuevos' },
  { path: '/politica-de-privacidad', priority: '0.5', changefreq: 'yearly', title: 'Política de Privacidad - TREFA' },
  { path: '/vacantes', priority: '0.6', changefreq: 'weekly', title: 'Vacantes - Trabaja en TREFA Autos Seminuevos' },
  { path: '/acceder', priority: '0.7', changefreq: 'monthly', title: 'Acceder - Portal TREFA' },
];

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fetchAllVehicles() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/functions/${EDGE_FUNCTION_NAME}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch vehicles. Status: ${res.statusCode}, Body: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function generateSitemap() {
  console.log('Starting sitemap generation...');
  try {
    const response = await fetchAllVehicles();
    console.log('Received raw response:', JSON.stringify(response, null, 2)); // Debugging line
    const vehicles = response.data || response.vehicles || response;

    if (!Array.isArray(vehicles)) {
      throw new Error('Fetched data is not an array. Aborting sitemap generation.');
    }

    console.log(`Fetched ${vehicles.length} vehicles.`);

    const now = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Add static routes
    STATIC_ROUTES.forEach(route => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Add vehicle listings with enhanced metadata
    vehicles.forEach(vehicle => {
      if (vehicle.slug) {
        // Calculate priority based on vehicle status and recency
        let priority = 0.8;
        if (vehicle.ordenstatus === 'Disponible') {
          priority = 0.85;
        } else if (vehicle.ordenstatus === 'Vendido') {
          priority = 0.6;
        }

        // Use vehicle's updated_at or created_at for lastmod
        const lastmod = vehicle.updated_at || vehicle.created_at || now;

        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/autos/${vehicle.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;

        // Add image sitemap for vehicle photos
        if (vehicle.feature_image) {
          const imageUrl = Array.isArray(vehicle.feature_image)
            ? vehicle.feature_image[0]?.url
            : typeof vehicle.feature_image === 'string'
            ? vehicle.feature_image
            : null;

          if (imageUrl) {
            const vehicleTitle = vehicle.titulo || vehicle.title || vehicle.Auto || 'Auto Seminuevo';
            const imageTitle = `${vehicleTitle} en Venta`;
            const imageCaption = `${vehicleTitle} - TREFA | Agencia de Autos Seminuevos`;

            xml += `    <image:image>\n`;
            xml += `      <image:loc>${imageUrl}</image:loc>\n`;
            xml += `      <image:title>${escapeXml(imageTitle)}</image:title>\n`;
            xml += `      <image:caption>${escapeXml(imageCaption)}</image:caption>\n`;
            xml += `    </image:image>\n`;
          }
        }

        // Add additional images from gallery if available
        if (vehicle.images && Array.isArray(vehicle.images)) {
          const vehicleTitle = vehicle.titulo || vehicle.title || vehicle.Auto || 'Auto Seminuevo';
          vehicle.images.slice(0, 5).forEach(img => { // Limit to 5 images per URL
            const imgUrl = img.url || img;
            if (imgUrl && typeof imgUrl === 'string') {
              xml += `    <image:image>\n`;
              xml += `      <image:loc>${imgUrl}</image:loc>\n`;
              xml += `      <image:title>${escapeXml(vehicleTitle + ' en Venta')}</image:title>\n`;
              xml += `      <image:caption>${escapeXml(vehicleTitle + ' - Inventario de Autos Seminuevos TREFA')}</image:caption>\n`;
              xml += `    </image:image>\n`;
            }
          });
        }

        xml += '  </url>\n';
      }
    });

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`✅ Sitemap successfully generated at ${SITEMAP_PATH}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();
