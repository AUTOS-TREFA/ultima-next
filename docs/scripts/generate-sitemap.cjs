/**
 * 🚀 generateSiteMap.js
 * Generates sitemap.xml by fetching vehicle data from Supabase Edge Function (rapid-processor)
 * and saves it locally in /public/sitemap.xml.
 */

import https from 'https';
import fs from 'fs';

const SITE_URL = 'https://trefa.mx';
const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';
const EDGE_FUNCTION_PATH = '/functions/v1/rapid-processor';
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

/**
 * Fetch data from Supabase Edge Function
 */
function fetchAllVehicles() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: EDGE_FUNCTION_PATH,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            if (Array.isArray(json.data)) resolve(json.data);
            else reject(new Error('Unexpected response format from Edge Function'));
          } catch (err) {
            reject(new Error('Failed to parse JSON from Supabase response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

/**
 * Generate and save the sitemap
 */
async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...');
  try {
    const vehicles = await fetchAllVehicles();
    console.log(`✅ Retrieved ${vehicles.length} vehicles from Supabase.`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static routes
    for (const route of STATIC_ROUTES) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Vehicle pages
    for (const v of vehicles) {
      if (v.slug && v.ordenstatus?.toLowerCase() === 'comprado') {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}/autos/${v.slug}</loc>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>\n`;

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`🗺️  Sitemap successfully written to ${SITEMAP_PATH}`);
  } catch (err) {
    console.error(`❌ Failed to generate sitemap: ${err.message}`);
  }
}

generateSitemap();