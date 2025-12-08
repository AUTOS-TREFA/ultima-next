const https = require('https');
const fs = require('fs');

// Configuration
const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';
const EDGE_FUNCTION_NAME = 'v1/rapid-processor';
const SITE_URL = 'https://trefa.mx';
const SITEMAP_PATH = './public/sitemap.xml';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/autos', priority: '0.9' },
  { path: '/vender-mi-auto', priority: '0.8' },
  { path: '/promociones', priority: '0.7' },
  { path: '/faq', priority: '0.6' },
  { path: '/kit-trefa', priority: '0.6' },
  { path: '/politica-de-privacidad', priority: '0.5' },
  { path: '/vacantes', priority: '0.6' },
  { path: '/acceder', priority: '0.7' },
  { path: '/sucursales', priority: '0.7' },
  { path: '/contacto', priority: '0.7' },
  { path: '/conocenos', priority: '0.7' },

];

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
    const vehicles = await fetchAllVehicles();
    console.log(`Fetched ${vehicles.length} vehicles.`);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    STATIC_ROUTES.forEach(route => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Add dynamic vehicle routes
    vehicles.forEach(vehicle => {
      if (vehicle.slug) {
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/autos/${vehicle.slug}</loc>\n`;
        xml += '    <priority>0.8</priority>\n';
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
