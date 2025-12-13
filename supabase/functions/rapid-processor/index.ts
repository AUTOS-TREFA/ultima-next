import { createClient } from "npm:@supabase/supabase-js@2.33.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const BUCKET = "fotos_airtable";
const CACHE_TTL_MS = 3600_000; // 1 hour (was 1 min - reduces DB queries)

// Cloudflare CDN URL for optimized image delivery (reduces Supabase egress by 70-90%)
const IMAGE_CDN_URL = "https://images.trefa.mx";
const SUPABASE_STORAGE_BASE = "https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public";

// Placeholder images by carroceria/clasificacionid (using CDN URLs with Supabase fallback)
const DEFAULT_PLACEHOLDER_IMAGE = `${IMAGE_CDN_URL}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`;
const DEFAULT_PLACEHOLDER_FALLBACK = `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`;

const PLACEHOLDER_IMAGES: Record<string, string> = {
  "suv": `${IMAGE_CDN_URL}/fotos_airtable/app/suv-2Artboard-12-trefa.png`,
  "pick-up": `${IMAGE_CDN_URL}/fotos_airtable/app/pickup-2Artboard-12-trefa-1.png`,
  "pickup": `${IMAGE_CDN_URL}/fotos_airtable/app/pickup-2Artboard-12-trefa-1.png`,
  "sedan": `${IMAGE_CDN_URL}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`,
  "sedán": `${IMAGE_CDN_URL}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`,
  "hatchback": `${IMAGE_CDN_URL}/fotos_airtable/app/hbArtboard-12-trefa.png`,
  "motos": `${IMAGE_CDN_URL}/fotos_airtable/app/motos-placeholder.png`,
  "moto": `${IMAGE_CDN_URL}/fotos_airtable/app/motos-placeholder.png`,
};

// Supabase fallback URLs (used if CDN fails)
const PLACEHOLDER_IMAGES_FALLBACK: Record<string, string> = {
  "suv": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/suv-2Artboard-12-trefa.png`,
  "pick-up": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/pickup-2Artboard-12-trefa-1.png`,
  "pickup": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/pickup-2Artboard-12-trefa-1.png`,
  "sedan": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`,
  "sedán": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`,
  "hatchback": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/hbArtboard-12-trefa.png`,
  "motos": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/motos-placeholder.png`,
  "moto": `${SUPABASE_STORAGE_BASE}/fotos_airtable/app/motos-placeholder.png`,
};
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  },
  realtime: {
    enabled: false
  }
});
let cachedAll = null;
let cachedOne = new Map();

// Cache invalidation tracking
let lastCacheInvalidation = Date.now();
/* ================================
   🔧 HELPERS
================================== */
/**
 * Converts Supabase Storage URLs to Cloudflare CDN URLs
 * This dramatically reduces Supabase egress costs and improves performance
 * Falls back to original URL if not a Supabase storage URL
 */
function convertToCdnUrl(url: string | null | undefined): string {
  if (!url) return "";

  // If already using CDN or R2, return as-is
  if (url.startsWith(IMAGE_CDN_URL) || url.includes('.r2.cloudflarestorage.com')) {
    return url;
  }

  // Convert Supabase Storage URL to CDN URL
  const pathMatch = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
  if (pathMatch) {
    return `${IMAGE_CDN_URL}/${pathMatch[1]}`;
  }

  // If not a Supabase URL, return as-is
  return url;
}

// Get placeholder image based on carroceria/clasificacionid
function getPlaceholderImage(clasificacionid: any, carroceria: any): string {
  // Try clasificacionid first
  if (clasificacionid) {
    let clasificacion = '';
    if (Array.isArray(clasificacionid)) {
      clasificacion = clasificacionid[0] || '';
    } else if (typeof clasificacionid === 'string') {
      clasificacion = clasificacionid;
    }

    const normalized = clasificacion.toLowerCase().replace(/ /g, '-');
    if (PLACEHOLDER_IMAGES[normalized]) {
      return PLACEHOLDER_IMAGES[normalized];
    }
  }

  // Try carroceria as fallback
  if (carroceria) {
    let carroceriaValue = '';
    if (Array.isArray(carroceria)) {
      carroceriaValue = carroceria[0] || '';
    } else if (typeof carroceria === 'string') {
      carroceriaValue = carroceria;
    }

    const normalized = carroceriaValue.toLowerCase().replace(/ /g, '-');
    if (PLACEHOLDER_IMAGES[normalized]) {
      return PLACEHOLDER_IMAGES[normalized];
    }
  }

  return DEFAULT_PLACEHOLDER_IMAGE;
}

function looksLikePath(s) {
  if (!s) return false;
  const t = String(s).trim();
  if (t.length === 0) return false;
  if (t.startsWith("{") || t.startsWith("[") || t.startsWith('"')) return false;
  if (t.toLowerCase().includes("error") || t.toLowerCase().includes("#error")) return false;
  if (t.includes("/") || /\.[a-zA-Z0-9]{2,5}$/.test(t)) return true;
  return false;
}
function normalizePathsField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field.map(String).map((s)=>s.trim()).filter(looksLikePath);
  if (typeof field === "string") {
    const trimmed = field.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).map((s)=>s.trim()).filter(looksLikePath);
      if (typeof parsed === "string") return looksLikePath(parsed) ? [
        parsed.trim()
      ] : [];
      if (typeof parsed === "object" && parsed !== null) {
        return Object.values(parsed).map(String).map((s)=>s.trim()).filter(looksLikePath);
      }
    } catch  {
      if (trimmed.includes(",")) {
        return trimmed.split(",").map((s)=>s.trim()).filter(looksLikePath);
      }
      return looksLikePath(trimmed) ? [
        trimmed
      ] : [];
    }
  }
  if (typeof field === "object") {
    try {
      return Object.values(field).map(String).map((s)=>s.trim()).filter(looksLikePath);
    } catch  {
      return [];
    }
  }
  return [];
}
// Build public URL - now supports R2 URLs stored directly in database
function buildPublicUrl(bucket, path) {
  if (!path || typeof path !== "string" || !path.trim()) return null;

  // If path is already a full URL (R2, Supabase, or Airtable), return it as-is
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Legacy: Build Supabase Storage URL for old records
  const cleaned = decodeURIComponent(path).replace(/^\/+/, "");
  const segments = cleaned.split("/").map((seg)=>encodeURIComponent(seg));
  const encodedPath = segments.join("/");
  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}
/* ================================
   🚗 PROCESSOR
================================== */ function transformVehicle(row) {
  const recordId = row.record_id ?? null;
  const featureRaw = row.feature_image ?? null;
  const fotosExteriorRaw = row.fotos_exterior_url ?? null;
  const fotosInteriorRaw = row.fotos_interior_url ?? null;

  const fotosExterior = normalizePathsField(fotosExteriorRaw);
  const fotosInterior = normalizePathsField(fotosInteriorRaw);

  // Build public URLs for all images and convert to CDN URLs
  let feature_public = looksLikePath(featureRaw) ? convertToCdnUrl(buildPublicUrl(BUCKET, String(featureRaw).trim())) : null;
  const galeriaExterior = fotosExterior.map((p)=>convertToCdnUrl(buildPublicUrl(BUCKET, p))).filter(Boolean);
  const galeriaInterior = fotosInterior.map((p)=>convertToCdnUrl(buildPublicUrl(BUCKET, p))).filter(Boolean);

  // If no feature_image, try to use first exterior image
  if (!feature_public && galeriaExterior.length > 0) {
    feature_public = galeriaExterior[0];
  }

  // If still no image, use placeholder based on carroceria/clasificacionid
  if (!feature_public) {
    feature_public = getPlaceholderImage(row.clasificacionid || row.ClasificacionID, row.carroceria);
  }

  const { id: _originalId, ...rest } = row;
  return {
    id: recordId,
    record_id: recordId,
    ...rest,
    raw_feature_image: featureRaw,
    raw_fotos_exterior: fotosExteriorRaw,
    raw_fotos_interior: fotosInteriorRaw,
    public_urls: {
      feature_image: feature_public,
      galeriaExterior,
      galeriaInterior
    },
    thumbnail: feature_public,
    galeriaExterior,
    galeriaInterior
  };
}
/* ================================
   📦 FETCH FUNCTIONS
================================== */
// Parse filters from URL search params
function parseFilters(searchParams) {
  const filters = {};

  // Array filters
  if (searchParams.has('marca')) filters.marca = searchParams.getAll('marca');
  if (searchParams.has('autoano')) filters.autoano = searchParams.getAll('autoano').map(Number);
  if (searchParams.has('transmision')) filters.transmision = searchParams.getAll('transmision');
  if (searchParams.has('combustible')) filters.combustible = searchParams.getAll('combustible');
  if (searchParams.has('garantia')) filters.garantia = searchParams.getAll('garantia');
  if (searchParams.has('carroceria')) filters.carroceria = searchParams.getAll('carroceria');
  if (searchParams.has('ubicacion')) filters.ubicacion = searchParams.getAll('ubicacion');
  if (searchParams.has('promociones')) filters.promociones = searchParams.getAll('promociones');

  // Range filters
  if (searchParams.has('minPrice')) filters.minPrice = Number(searchParams.get('minPrice'));
  if (searchParams.has('maxPrice')) filters.maxPrice = Number(searchParams.get('maxPrice'));
  if (searchParams.has('enganchemin')) filters.enganchemin = Number(searchParams.get('enganchemin'));
  if (searchParams.has('maxEnganche')) filters.maxEnganche = Number(searchParams.get('maxEnganche'));

  // Boolean filters
  if (searchParams.has('hideSeparado')) filters.hideSeparado = searchParams.get('hideSeparado') === 'true';

  // Text search
  if (searchParams.has('search')) filters.search = searchParams.get('search');

  // Ordering
  if (searchParams.has('orderby')) filters.orderby = searchParams.get('orderby');

  // Pagination
  filters.page = Number(searchParams.get('page') || '1');
  filters.pageSize = Number(searchParams.get('pageSize') || '20');

  return filters;
}

// Build Supabase query with filters
async function buildFilteredQuery(filters) {
  let query = supabase.from("inventario_cache").select("*", { count: 'exact' });

  // Base filter - always show only Comprado
  query = query.ilike("ordenstatus", "Comprado");

  // Hide separado vehicles if requested
  if (filters.hideSeparado) {
    query = query.or('separado.eq.false,separado.is.null');
  }

  // Array filters (IN queries)
  if (filters.marca?.length > 0) {
    query = query.in('marca', filters.marca);
  }
  if (filters.autoano?.length > 0) {
    query = query.in('autoano', filters.autoano);
  }
  if (filters.transmision?.length > 0) {
    query = query.in('transmision', filters.transmision);
  }
  if (filters.combustible?.length > 0) {
    query = query.in('combustible', filters.combustible);
  }
  if (filters.garantia?.length > 0) {
    query = query.in('garantia', filters.garantia);
  }
  // Carroceria filter - case-insensitive, checks both carroceria and clasificacionid fields
  if (filters.carroceria?.length > 0) {
    // Build OR conditions for each carroceria value to be case-insensitive
    // and also match against clasificacionid array
    const carroceriaConditions = filters.carroceria.map(c => {
      const lowerVal = c.toLowerCase();
      // Match carroceria field (case-insensitive) OR clasificacionid array contains the value
      return `carroceria.ilike.${lowerVal},clasificacionid.cs.["${c}"],clasificacionid.cs.["${lowerVal}"],clasificacionid.cs.["${c.toUpperCase()}"]`;
    }).join(',');
    query = query.or(carroceriaConditions);
  }
  if (filters.ubicacion?.length > 0) {
    // Map display names to DB values
    const reverseSucursalMapping = {
      'Monterrey': 'MTY',
      'Guadalupe': 'GPE',
      'Reynosa': 'TMPS',
      'Saltillo': 'COAH'
    };
    const rawSucursales = filters.ubicacion.map(s => reverseSucursalMapping[s] || s);
    query = query.in('ubicacion', rawSucursales);
  }

  // Promociones - use overlaps for JSONB array
  if (filters.promociones?.length > 0) {
    query = query.overlaps('promociones', filters.promociones);
  }

  // Range filters
  if (filters.minPrice) {
    query = query.gte('precio', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('precio', filters.maxPrice);
  }
  if (filters.enganchemin) {
    query = query.gte('enganchemin', filters.enganchemin);
  }
  if (filters.maxEnganche) {
    query = query.lte('enganchemin', filters.maxEnganche);
  }

  // Text search - use RPC for full-text search
  if (filters.search) {
    const { data: searchData, error: searchError } = await supabase.rpc('search_vehicles', {
      search_term: filters.search
    });

    if (searchError) {
      console.warn('Search RPC failed, falling back to no search:', searchError);
    } else if (Array.isArray(searchData)) {
      const vehicleIds = searchData.map((v) => v.id);
      if (vehicleIds.length === 0) {
        query = query.eq('id', -1); // No results
      } else {
        query = query.in('id', vehicleIds);
      }
    }
  }

  // Ordering
  if (filters.orderby) {
    const [field, direction] = filters.orderby.split('-');
    const fieldMap = {
      price: 'precio',
      year: 'autoano',
      mileage: 'kilometraje'
    };
    const mappedField = fieldMap[field] || field;
    query = query.order(mappedField, { ascending: direction === 'asc' });
  } else if (!filters.search) {
    // Default ordering if no search (search has its own relevance ordering)
    query = query.order('updated_at', { ascending: false });
  }

  // Pagination
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  return query;
}

async function fetchAllComprado(forceRefresh = false) {
  const now = Date.now();
  const cacheExpired = !cachedAll || now - cachedAll.ts >= CACHE_TTL_MS;
  const shouldRefresh = forceRefresh || cacheExpired;

  if (!shouldRefresh) {
    console.log("♻️ Using cached Comprado data");
    return cachedAll.data;
  }

  if (forceRefresh) {
    console.log("🔄 Force refreshing cache...");
  }

  const { data, error } = await supabase.from("inventario_cache").select("*").ilike("ordenstatus", "Comprado");
  if (error) throw new Error(error.message);
  const enriched = (data || []).map(transformVehicle);
  cachedAll = {
    ts: now,
    data: enriched
  };
  console.log(`✅ Fetched and transformed ${enriched.length} Comprado vehicles`);
  return enriched;
}

async function fetchFilteredVehicles(filters) {
  const cacheKey = JSON.stringify(filters);
  const cached = cachedOne.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    console.log(`♻️ Using cached filtered data`);
    return cached.data;
  }

  const query = await buildFilteredQuery(filters);
  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const enriched = (data || []).map(transformVehicle);
  const result = {
    vehicles: enriched,
    totalCount: count || 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil((count || 0) / filters.pageSize)
  };

  cachedOne.set(cacheKey, {
    ts: now,
    data: result
  });

  console.log(`✅ Fetched and transformed ${enriched.length} filtered vehicles (total: ${count})`);
  return result;
}
async function fetchBySlug(slug) {
  const cached = cachedOne.get(slug);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    console.log(`♻️ Using cached data for slug: ${slug}`);
    return cached.data;
  }
  const { data, error } = await supabase.from("inventario_cache").select("*").eq("slug", slug).single();
  if (error) throw new Error(error.message);
  const enriched = transformVehicle(data);
  cachedOne.set(slug, {
    ts: now,
    data: enriched
  });
  console.log(`✅ Retrieved vehicle for slug: ${slug}`);
  return enriched;
}
/* ================================
   🌐 MAIN HANDLER
================================== */ console.info("🚀 rapid-processor function started");

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req)=>{
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // POST /rapid-processor/invalidate-cache - clear all caches
    if (req.method === "POST" && pathname === "/rapid-processor/invalidate-cache") {
      console.log("🗑️ Cache invalidation requested");

      // Clear all caches
      cachedAll = null;
      cachedOne.clear();
      lastCacheInvalidation = Date.now();

      console.log("✅ All caches cleared");

      return new Response(JSON.stringify({
        success: true,
        message: "Cache invalidated successfully",
        timestamp: new Date(lastCacheInvalidation).toISOString(),
        cleared: {
          cachedAll: true,
          cachedOne_entries: 0 // Count was cleared
        }
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // GET /rapid-processor/cache-stats - get cache statistics
    if (req.method === "GET" && pathname === "/rapid-processor/cache-stats") {
      const now = Date.now();
      const cacheStats = {
        cachedAll: cachedAll ? {
          cached: true,
          age_ms: now - cachedAll.ts,
          count: cachedAll.data.length,
          expires_in_ms: Math.max(0, CACHE_TTL_MS - (now - cachedAll.ts))
        } : {
          cached: false
        },
        cachedOne: {
          count: cachedOne.size,
          entries: Array.from(cachedOne.keys()).map(key => ({
            key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
            age_ms: now - cachedOne.get(key).ts,
            expires_in_ms: Math.max(0, CACHE_TTL_MS - (now - cachedOne.get(key).ts))
          }))
        },
        lastInvalidation: new Date(lastCacheInvalidation).toISOString(),
        cacheTtlMs: CACHE_TTL_MS
      };

      return new Response(JSON.stringify(cacheStats), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // GET /rapid-processor - with or without filters
    if (req.method === "GET" && pathname === "/rapid-processor") {
      // Check if any filter parameters are present
      const hasFilters = Array.from(searchParams.keys()).length > 0;

      if (hasFilters) {
        // Use filtered query with caching
        const filters = parseFilters(searchParams);
        const result = await fetchFilteredVehicles(filters);
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, s-maxage=3600" // 1 hour cache
          }
        });
      } else {
        // Legacy behavior - return all Comprado vehicles
        const cars = await fetchAllComprado();
        return new Response(JSON.stringify({
          data: cars,
          count: cars.length
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, s-maxage=3600" // 1 hour cache
          }
        });
      }
    }

    // GET /rapid-processor/:slug - single vehicle by slug
    const slugMatch = pathname.match(/^\/rapid-processor\/([^/]+)$/);
    if (req.method === "GET" && slugMatch) {
      const slug = decodeURIComponent(slugMatch[1]);
      const car = await fetchBySlug(slug);
      if (!car) {
        return new Response(JSON.stringify({
          error: "Vehicle not found"
        }), {
          status: 404,
          headers: corsHeaders
        });
      }
      return new Response(JSON.stringify(car), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60"
        }
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders
    });
  } catch (err) {
    console.error("❌ Error in rapid-processor:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
