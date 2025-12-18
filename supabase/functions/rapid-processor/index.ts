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
// Extract URL from Airtable attachment object
function extractUrlFromAttachment(att: any): string | null {
  if (!att) return null;
  if (typeof att === 'string') return att;
  if (typeof att === 'object') {
    // Airtable attachment format: { url: "...", thumbnails: { large: { url: "..." } } }
    return att.url || att.thumbnails?.large?.url || att.thumbnails?.full?.url || null;
  }
  return null;
}

function normalizePathsField(field) {
  if (!field) return [];

  // Handle array of Airtable attachment objects or URLs
  if (Array.isArray(field)) {
    return field
      .map((item) => {
        // Check if it's an Airtable attachment object
        if (typeof item === 'object' && item !== null) {
          return extractUrlFromAttachment(item);
        }
        return String(item).trim();
      })
      .filter((s) => s && looksLikePath(s));
  }

  if (typeof field === "string") {
    const trimmed = field.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              return extractUrlFromAttachment(item);
            }
            return String(item).trim();
          })
          .filter((s) => s && looksLikePath(s));
      }
      if (typeof parsed === "string") return looksLikePath(parsed) ? [
        parsed.trim()
      ] : [];
      if (typeof parsed === "object" && parsed !== null) {
        // Check if it's a single Airtable attachment
        const url = extractUrlFromAttachment(parsed);
        if (url && looksLikePath(url)) return [url];
        // Otherwise extract values
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
    // Check if it's a single Airtable attachment object
    const url = extractUrlFromAttachment(field);
    if (url && looksLikePath(url)) return [url];
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
  // Extract data from nested 'data' JSON column if individual columns are null
  // This handles cases where Airtable sync stores raw data but doesn't map to columns
  const airtableData = row.data || {};

  // Helper to get value from row or fallback to airtableData
  const getValue = (key: string, airtableKey?: string): any => {
    const val = row[key];
    if (val !== null && val !== undefined && val !== '') return val;
    if (airtableKey && airtableData[airtableKey] !== undefined) return airtableData[airtableKey];
    if (airtableData[key] !== undefined) return airtableData[key];
    return null;
  };

  // Helper to get first element from array or return as string
  const getFirstOrString = (field: any): string => {
    if (Array.isArray(field)) return field[0] || '';
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed[0] || '';
      } catch {
        return field;
      }
    }
    return field || '';
  };

  const recordId = row.record_id ?? airtableData.record_id ?? null;

  // === R2 IMAGE FIELDS (HIGHEST PRIORITY) ===
  // Check for R2 images first - these are uploaded via the admin Cargar Fotos panel
  const r2FeatureImage = row.r2_feature_image || null;
  const r2GalleryRaw = row.r2_gallery;
  let r2Gallery: string[] = [];
  if (Array.isArray(r2GalleryRaw)) {
    r2Gallery = r2GalleryRaw.filter(url => typeof url === 'string' && url.trim() !== '');
  } else if (typeof r2GalleryRaw === 'string' && r2GalleryRaw.trim() !== '') {
    try {
      const parsed = JSON.parse(r2GalleryRaw);
      if (Array.isArray(parsed)) {
        r2Gallery = parsed.filter(url => typeof url === 'string' && url.trim() !== '');
      }
    } catch {
      // If not JSON, treat as comma-separated
      r2Gallery = r2GalleryRaw.split(',').map(s => s.trim()).filter(s => s !== '');
    }
  }

  // Get image fields from row or airtableData
  // Check multiple possible field names for feature image with priority order
  // Airtable field names may vary: fotos_exterior, Fotos Exterior, fotos_exterior_archivos, etc.
  const featureRaw = getValue('feature_image') ||
    getValue('feature_image_url') ||
    airtableData.feature_image ||
    airtableData.image_link ||
    airtableData.featured_image_url ||
    airtableData.Foto ||
    airtableData['Foto Catalogo'] ||
    null;

  // Try multiple Airtable field names for exterior photos
  const fotosExteriorRaw = getValue('fotos_exterior_url') ||
    getValue('galeria_exterior') ||
    airtableData.fotos_exterior_url ||
    airtableData.fotos_exterior ||
    airtableData['fotos_exterior_archivos'] ||
    airtableData['Fotos Exterior'] ||
    airtableData.galeriaExterior ||
    airtableData['Foto Catalogo'] ||
    null;

  // Try multiple Airtable field names for interior photos
  const fotosInteriorRaw = getValue('fotos_interior_url') ||
    getValue('galeria_interior') ||
    airtableData.fotos_interior_url ||
    airtableData.fotos_interior ||
    airtableData['fotos_interior_archivos'] ||
    airtableData['Fotos Interior'] ||
    airtableData.galeriaInterior ||
    null;

  const fotosExterior = normalizePathsField(fotosExteriorRaw);
  const fotosInterior = normalizePathsField(fotosInteriorRaw);

  // Helper to extract feature image URL from various formats
  const extractFeatureImage = (raw: any): string | null => {
    if (!raw) return null;
    // If it's an array of Airtable attachments, get the first one
    if (Array.isArray(raw)) {
      const first = raw[0];
      if (first) {
        const url = extractUrlFromAttachment(first);
        if (url && looksLikePath(url)) return url;
      }
      return null;
    }
    // If it's an Airtable attachment object
    if (typeof raw === 'object') {
      const url = extractUrlFromAttachment(raw);
      if (url && looksLikePath(url)) return url;
    }
    // If it's a string
    if (typeof raw === 'string' && looksLikePath(raw.trim())) {
      return raw.trim();
    }
    return null;
  };

  // Build public URLs for all images and convert to CDN URLs
  const featureImagePath = extractFeatureImage(featureRaw);
  const legacyFeatureImage = featureImagePath ? convertToCdnUrl(buildPublicUrl(BUCKET, featureImagePath)) : null;
  const legacyGaleriaExterior = fotosExterior.map((p)=>convertToCdnUrl(buildPublicUrl(BUCKET, p))).filter(Boolean);
  const galeriaInterior = fotosInterior.map((p)=>convertToCdnUrl(buildPublicUrl(BUCKET, p))).filter(Boolean);

  // === DETERMINE FINAL IMAGE (R2 has highest priority) ===
  // Priority order: R2 feature image > R2 gallery first image > Legacy feature image > Legacy gallery first image > Placeholder
  let feature_public: string | null = null;
  let galeriaExterior: string[] = [];

  // Check R2 images first (highest priority - uploaded via admin panel)
  if (r2FeatureImage && typeof r2FeatureImage === 'string' && r2FeatureImage.trim() !== '') {
    feature_public = r2FeatureImage;
  } else if (r2Gallery.length > 0) {
    feature_public = r2Gallery[0];
  }

  // Use R2 gallery if available, otherwise legacy gallery
  if (r2Gallery.length > 0) {
    galeriaExterior = r2Gallery;
  } else {
    galeriaExterior = legacyGaleriaExterior;
  }

  // If no R2 image, fall back to legacy feature image
  if (!feature_public && legacyFeatureImage) {
    feature_public = legacyFeatureImage;
  }

  // If still no feature_image, try to use first exterior image from legacy
  if (!feature_public && legacyGaleriaExterior.length > 0) {
    feature_public = legacyGaleriaExterior[0];
  }

  // If still no image, use placeholder based on carroceria/clasificacionid
  const clasificacionid = getValue('clasificacionid', 'ClasificacionID');
  const carroceria = getValue('carroceria');
  if (!feature_public) {
    feature_public = getPlaceholderImage(clasificacionid, carroceria);
  }

  // Extract all fields with fallback to airtableData
  const title = getValue('title') || airtableData.Auto || airtableData.title ||
    `${getValue('marca', 'Marca') || ''} ${getValue('modelo', 'Modelo') || ''} ${getValue('autoano', 'AutoAno') || ''}`.trim() || 'Auto sin título';
  const marca = getValue('marca', 'Marca') || '';
  const modelo = getValue('modelo', 'Modelo') || '';
  const autoano = getValue('autoano', 'AutoAno');
  const precio = getValue('precio', 'Precio');
  const kilometraje = getFirstOrString(getValue('kilometraje', 'Kilometraje'));
  const transmision = getFirstOrString(getValue('transmision', 'Transmision'));
  const combustible = getFirstOrString(getValue('combustible', 'Combustible'));
  const garantia = getValue('garantia', 'Garantia') || '';
  const descripcion = getValue('descripcion', 'Descripcion') || '';
  const enganchemin = getValue('enganchemin', 'EngancheMin');
  const enganche_recomendado = getValue('enganche_recomendado', 'EngancheRecomendado');
  const mensualidad_minima = getValue('mensualidad_minima', 'MensualidadMinima');
  const mensualidad_recomendada = getValue('mensualidad_recomendada', 'MensualidadRecomendada');
  const plazomax = getValue('plazomax', 'PlazoMax');

  // Handle promociones from row or airtableData
  let promociones: string[] = [];
  const rawPromociones = getValue('promociones', 'Promociones');
  if (Array.isArray(rawPromociones)) {
    promociones = rawPromociones.map(String).filter(Boolean);
  } else if (typeof rawPromociones === 'string') {
    try {
      const parsed = JSON.parse(rawPromociones);
      if (Array.isArray(parsed)) {
        promociones = parsed.map(String).filter(Boolean);
      }
    } catch {
      promociones = rawPromociones.split(',').map((p: string) => p.trim()).filter(Boolean);
    }
  }

  const { id: _originalId, data: _dataColumn, ...rest } = row;
  return {
    id: recordId,
    record_id: recordId,
    ...rest,
    // Override with extracted values
    title: title,
    titulo: title,
    marca: marca,
    modelo: modelo,
    autoano: autoano,
    precio: precio,
    kilometraje: kilometraje,
    transmision: transmision,
    combustible: combustible,
    carroceria: carroceria,
    clasificacionid: clasificacionid,
    garantia: garantia,
    descripcion: descripcion,
    enganchemin: enganchemin,
    enganche_recomendado: enganche_recomendado,
    mensualidad_minima: mensualidad_minima,
    mensualidad_recomendada: mensualidad_recomendada,
    plazomax: plazomax,
    promociones: promociones,
    // Image fields
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
    galeriaInterior,
    // R2 image fields (highest priority for display)
    r2_feature_image: r2FeatureImage,
    r2_gallery: r2Gallery,
    use_r2_images: !!(r2FeatureImage || r2Gallery.length > 0)
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
    // clasificacionid is stored as comma-separated text, so use ilike with wildcards
    const carroceriaConditions = filters.carroceria.map(c => {
      const lowerVal = c.toLowerCase();
      // Match carroceria field (case-insensitive) OR clasificacionid text contains the value
      return `carroceria.ilike.%${lowerVal}%,clasificacionid.ilike.%${lowerVal}%`;
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
