import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/**
 * Autométrica API Proxy
 *
 * Proxy para la API de Autométrica (valuación de vehículos)
 *
 * Endpoints soportados:
 * - /catalogo.php - Obtener catálogo de vehículos (mensual)
 * - /lineal.php - Obtener precio de un vehículo específico
 */

const AUTOMETRICA_USERNAME = Deno.env.get('AUTOMETRICA_USERNAME');
const AUTOMETRICA_PASSWORD = Deno.env.get('AUTOMETRICA_PASSWORD');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CatalogRequest {
  action: 'catalog';
}

interface PriceRequest {
  action: 'price';
  year: string | number;
  brand: string;
  subbrand: string;
  version: string;
  kilometraje: string | number;
}

type AutometricaRequest = CatalogRequest | PriceRequest;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Validate credentials
    if (!AUTOMETRICA_USERNAME || !AUTOMETRICA_PASSWORD) {
      console.error('❌ Missing Autométrica credentials');
      return new Response(JSON.stringify({
        error: 'AUTOMETRICA_USERNAME or AUTOMETRICA_PASSWORD not configured'
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body: AutometricaRequest = await req.json();
    const { action } = body;

    let url: string;
    const headers: Record<string, string> = {
      'username': AUTOMETRICA_USERNAME,
      'password': AUTOMETRICA_PASSWORD,
    };

    if (action === 'catalog') {
      // Catálogo - solo necesita autenticación
      url = 'https://ws.autometrica.mx/catalogo.php';
      console.log('📡 Requesting Autométrica catalog');
    } else if (action === 'price') {
      // Precio - necesita autenticación + datos del vehículo
      url = 'https://ws.autometrica.mx/lineal.php';

      const priceReq = body as PriceRequest;

      // Validar campos requeridos
      if (!priceReq.year || !priceReq.brand || !priceReq.subbrand || !priceReq.version) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: year, brand, subbrand, version'
        }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // Agregar datos del vehículo como headers (según documentación de Autométrica)
      headers['year'] = String(priceReq.year);
      headers['brand'] = priceReq.brand;
      headers['subbrand'] = priceReq.subbrand;
      headers['version'] = priceReq.version;
      headers['kilometraje'] = String(priceReq.kilometraje || 0);

      console.log(`📡 Requesting Autométrica price for: ${priceReq.year} ${priceReq.brand} ${priceReq.subbrand}`);
    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use "catalog" or "price"'
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Hacer la petición a Autométrica
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    console.log(`✓ Autométrica response status: ${response.status}`);

    // Manejar errores de autenticación
    if (response.status === 401) {
      return new Response(JSON.stringify({
        error: 'Autométrica authentication failed'
      }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (response.status === 400) {
      return new Response(JSON.stringify({
        error: 'Invalid request to Autométrica API'
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Autométrica proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
