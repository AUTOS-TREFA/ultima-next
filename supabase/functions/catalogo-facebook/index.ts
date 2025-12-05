import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
let cachedCsv: string | null = null;
let cacheTimestamp = 0;

// Base URL for your website
const BASE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://trefa.mx";

// Cloudflare CDN URL for optimized image delivery (reduces Supabase egress by 70-90%)
const IMAGE_CDN_URL = "https://images.trefa.mx";
const SUPABASE_STORAGE_BASE = "https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public";

// Placeholder images by carroceria/clasificacionid (using CDN URLs)
const DEFAULT_PLACEHOLDER_IMAGE = `${IMAGE_CDN_URL}/fotos_airtable/app/sedan-2Artboard-12-trefa.png`;

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

/**
 * Converts Supabase Storage URLs to Cloudflare CDN URLs
 * This dramatically reduces Supabase egress costs and improves performance
 */
function convertToCdnUrl(url: string | null | undefined): string {
  if (!url) return "";

  // If already using CDN, return as-is
  if (url.startsWith(IMAGE_CDN_URL)) {
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

interface InventarioRow {
  id: number;
  record_id: string;
  title: string | null;
  description: string | null;
  descripcion: string | null;
  precio: number | null;
  oferta: number | null;
  con_oferta: boolean | null;
  marca: string | null;
  modelo: string | null;
  autoano: number | null;
  vin: string | null;
  feature_image: string | null;
  feature_image_url: string | null;
  fotos_exterior_url: any;
  fotos_interior_url: any;
  additional_image_link: string | null;
  slug: string | null;
  ordenstatus: string | null;
  vendido: boolean | null;
  separado: boolean | null;
  carroceria: string | null;
  combustible: string | null;
  autotransmision: string | null;
  kilometraje: any;
  ubicacion: string | null;
  clasificacionid: string | null;
}

interface FacebookProduct {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  brand: string;
  gtin?: string;
  sale_price?: string;
  additional_image_link?: string;
  item_group_id?: string;
  custom_label_0?: string;
  custom_label_1?: string;
  custom_label_2?: string;
  custom_label_3?: string;
  custom_label_4?: string;
}

function getPlaceholderImage(clasificacionid: string | null, carroceria: string | null): string {
  // Try clasificacionid first
  if (clasificacionid) {
    const normalized = clasificacionid.toLowerCase().replace(/ /g, '-');
    if (PLACEHOLDER_IMAGES[normalized]) {
      return PLACEHOLDER_IMAGES[normalized];
    }
  }

  // Try carroceria as fallback
  if (carroceria) {
    const normalized = carroceria.toLowerCase().replace(/ /g, '-');
    if (PLACEHOLDER_IMAGES[normalized]) {
      return PLACEHOLDER_IMAGES[normalized];
    }
  }

  return DEFAULT_PLACEHOLDER_IMAGE;
}

function determineAvailability(
  ordenstatus: string | null,
  vendido: boolean | null,
  separado: boolean | null
): string {
  if (vendido) return "out of stock";
  if (separado) return "preorder";
  if (ordenstatus === "Comprado") return "in stock";
  return "out of stock";
}

function formatPrice(precio: number | null, currency = "MXN"): string {
  if (!precio) return `0.00 ${currency}`;
  return `${precio.toFixed(2)} ${currency}`;
}

function extractAdditionalImages(
  fotosExterior: any,
  fotosInterior: any,
  additionalImageLink: string | null
): string {
  const images: string[] = [];

  // Add from additional_image_link if available (convert to CDN)
  if (additionalImageLink) {
    images.push(convertToCdnUrl(additionalImageLink));
  }

  // Extract from fotos_exterior_url (JSONB array) and convert to CDN
  if (fotosExterior && Array.isArray(fotosExterior)) {
    fotosExterior.slice(0, 10).forEach((foto: any) => {
      const url = typeof foto === "string" ? foto : foto?.url;
      if (url) images.push(convertToCdnUrl(url));
    });
  }

  // Extract from fotos_interior_url (JSONB array) and convert to CDN
  if (fotosInterior && Array.isArray(fotosInterior)) {
    fotosInterior.slice(0, 10).forEach((foto: any) => {
      const url = typeof foto === "string" ? foto : foto?.url;
      if (url) images.push(convertToCdnUrl(url));
    });
  }

  // Facebook allows up to 20 additional images
  return images.slice(0, 20).join(",");
}

function transformToFacebookProduct(row: InventarioRow): FacebookProduct {
  const product: FacebookProduct = {
    id: row.record_id || String(row.id),
    title: (row.title || `${row.marca} ${row.modelo} ${row.autoano}`)
      .substring(0, 200)
      .trim(),
    description: (
      row.description ||
      row.descripcion ||
      `${row.marca} ${row.modelo} ${row.autoano} - Vehículo seminuevo en excelente estado`
    )
      .substring(0, 5000)
      .trim(),
    availability: determineAvailability(
      row.ordenstatus,
      row.vendido,
      row.separado
    ),
    condition: "used", // All vehicles are used/pre-owned
    price: formatPrice(row.precio),
    link: row.slug
      ? `${BASE_URL}/autos/${row.slug}`
      : `${BASE_URL}/autos/${row.id}`,
    image_link: convertToCdnUrl(
      row.feature_image ||
      row.feature_image_url ||
      getPlaceholderImage(row.clasificacionid, row.carroceria)
    ),
    brand: (row.marca || "").substring(0, 100),
  };

  // Optional fields
  if (row.vin) {
    product.gtin = row.vin;
  }

  if (row.con_oferta && row.oferta && row.oferta < (row.precio || 0)) {
    product.sale_price = formatPrice(row.oferta);
  }

  const additionalImages = extractAdditionalImages(
    row.fotos_exterior_url,
    row.fotos_interior_url,
    row.additional_image_link
  );
  if (additionalImages) {
    product.additional_image_link = additionalImages;
  }

  // Group by brand + model + year for variants
  if (row.marca && row.modelo && row.autoano) {
    product.item_group_id = `${row.marca}-${row.modelo}-${row.autoano}`
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  // Custom labels for additional categorization
  if (row.carroceria) product.custom_label_0 = row.carroceria;
  if (row.combustible) product.custom_label_1 = row.combustible;
  if (row.autotransmision) product.custom_label_2 = row.autotransmision;
  if (row.ubicacion) product.custom_label_3 = row.ubicacion;

  // Add mileage to custom label if available
  if (row.kilometraje) {
    let km = "";
    if (typeof row.kilometraje === "object" && row.kilometraje?.value) {
      km = `${row.kilometraje.value} km`;
    } else if (typeof row.kilometraje === "number") {
      km = `${row.kilometraje} km`;
    }
    if (km) product.custom_label_4 = km;
  }

  return product;
}

function escapeCsvCell(value: string | undefined): string {
  if (!value) return "";
  const escaped = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(value)) {
    return `"${escaped}"`;
  }
  return escaped;
}

function productsToCsv(products: FacebookProduct[]): string {
  if (products.length === 0) return "";

  // Define the exact field order for Facebook Catalogue
  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "gtin",
    "sale_price",
    "additional_image_link",
    "item_group_id",
    "custom_label_0",
    "custom_label_1",
    "custom_label_2",
    "custom_label_3",
    "custom_label_4",
  ];

  const lines = [headers.join(",")];

  for (const product of products) {
    const row = headers.map((header) =>
      escapeCsvCell(product[header as keyof FacebookProduct])
    );
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

async function generateCsv(): Promise<string> {
  console.log("Fetching inventory data from inventario_cache...");

  const { data, error } = await supabase
    .from("inventario_cache")
    .select(
      `
      id,
      record_id,
      title,
      description,
      descripcion,
      precio,
      oferta,
      con_oferta,
      marca,
      modelo,
      autoano,
      vin,
      feature_image,
      feature_image_url,
      fotos_exterior_url,
      fotos_interior_url,
      additional_image_link,
      slug,
      ordenstatus,
      vendido,
      separado,
      carroceria,
      combustible,
      autotransmision,
      kilometraje,
      ubicacion,
      clasificacionid
    `
    )
    .eq("ordenstatus", "Comprado") // Only include purchased inventory
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching inventory:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn("No inventory data found");
    return "";
  }

  console.log(`Transforming ${data.length} vehicles to Facebook format...`);

  const products = data.map((row) =>
    transformToFacebookProduct(row as InventarioRow)
  );
  const csv = productsToCsv(products);

  console.log(`Generated CSV with ${products.length} products`);
  return csv;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("force") === "true";

  try {
    // Check cache
    const now = Date.now();
    if (
      !forceRefresh &&
      cachedCsv &&
      now - cacheTimestamp < CACHE_TTL
    ) {
      console.log("Serving cached CSV");
      return new Response(cachedCsv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="catalogo-facebook.csv"',
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Generate fresh CSV
    console.log("Generating fresh CSV...");
    const csv = await generateCsv();

    // Update cache
    cachedCsv = csv;
    cacheTimestamp = Date.now();

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="catalogo-facebook.csv"',
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate Facebook catalogue CSV",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
