// Supabase Edge Function: Airtable Webhook → inventario_cache Sync
// This function receives a single record update from Airtable webhooks
// and syncs all vehicle data to Supabase inventario_cache table.
//
// IMAGE HANDLING (Updated 2025-12):
// - Images are now managed via the "Cargar Fotos" admin page which uploads directly to R2
// - When a vehicle has use_r2_images=true, we preserve R2 images and skip Airtable image URLs
// - The airtable-image-upload-optimized.js automation should be DISABLED in Airtable
// - This reduces API calls and prevents unnecessary image re-processing
//
// Deploy with: supabase functions deploy airtable-sync

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('✅ Airtable Webhook Sync Function Initialized');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Get Environment Variables ---
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID') || 'appLnI8wa41TtcZN1';
    const airtableTableId = Deno.env.get('AIRTABLE_TABLE_ID') || 'tblOjECDJDZlNv8At';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!airtableApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables.');
    }

    // --- 1.5. Initialize Supabase Client (used throughout function) ---
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- 2. Get recordId from Request Body ---
    const body = await req.json();
    const { recordId } = body;

    if (!recordId) {
      throw new Error("Request body must contain a 'recordId'.");
    }

    console.log(`📡 Processing webhook for Airtable record: ${recordId}`);

    // --- 3. Fetch Single Record from Airtable ---
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}/${recordId}`;

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();

      // If record was deleted in Airtable (404), DO NOT delete from Supabase
      // Just log it and return - we preserve local data even if Airtable doesn't have it
      if (response.status === 404) {
        console.log(`⚠️ Record ${recordId} not found in Airtable. PRESERVING local data (no delete).`);

        return new Response(
          JSON.stringify({
            message: `Record ${recordId} not found in Airtable. Local data preserved.`,
            action: 'preserved'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      throw new Error(`Airtable API Error: ${errorData.error?.message || 'Failed to fetch data'}`);
    }

    const record = await response.json();
    console.log(`✅ Fetched record: ${record.id}`);

    // --- 4. Check OrdenStatus and Handle Business Logic ---
    const fields = record.fields;
    const ordenStatus = fields.OrdenStatus || '';

    console.log(`📋 Record status: ${ordenStatus}`);

    // If the record changed from "Comprado" to something else (e.g., "Historico", "Vendido"),
    // update it in Supabase to mark it as not active
    if (ordenStatus !== 'Comprado') {
      console.log(`⚠️ Record ${recordId} is no longer "Comprado" (status: ${ordenStatus}). Updating to Historico in Supabase...`);

      // Update the record to mark it as Historico so it won't show in listings
      const { error: updateError } = await supabase
        .from('inventario_cache')
        .update({
          ordenstatus: 'Historico',
          vendido: true,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('record_id', recordId);

      if (updateError) {
        console.error('❌ Error updating record to Historico:', updateError);
        throw new Error(`Failed to update record to Historico: ${updateError.message}`);
      }

      console.log(`✅ Updated record ${recordId} to Historico status`);

      // Invalidate cache (fire and forget)
      try {
        const rapidProcessorUrl = `${supabaseUrl}/functions/v1/rapid-processor/invalidate-cache`;
        fetch(rapidProcessorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }).catch(err => console.warn('⚠️  Cache invalidation failed:', err.message));
      } catch (e) {
        console.warn('⚠️  Cache invalidation error:', e.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Record ${recordId} updated to Historico (was: ${ordenStatus})`,
          data: {
            record_id: recordId,
            ordenstatus: 'Historico',
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Only sync records with OrdenStatus = "Comprado"
    console.log(`✅ Record is "Comprado" - proceeding with sync`);

    // --- 5. Transform Data for Supabase (Normalize Field Names) ---

    // Helper functions
    const getImageUrls = (field: any): string[] => {
      if (!field) return [];

      // If it's an array of attachment objects from Airtable
      if (Array.isArray(field) && field.length > 0 && typeof field[0] === 'object' && field[0].url) {
        return field.map((att: any) => att.url || att.thumbnails?.large?.url).filter(Boolean);
      }

      // If it's a string (comma-separated URLs or single URL)
      if (typeof field === 'string') {
        const trimmed = field.trim();
        // Filter out invalid strings like "[]", "{}", "null", etc.
        if (trimmed === '[]' || trimmed === '{}' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '') {
          return [];
        }
        return field.split(',').map((url: string) => url.trim()).filter((url: string) => {
          return url && url !== '[]' && url !== '{}' && url.startsWith('http');
        });
      }

      // If it's an array of strings
      if (Array.isArray(field)) {
        return field.map(String).filter((url: string) => {
          return url && url !== '[]' && url !== '{}' && url.startsWith('http');
        });
      }

      return [];
    };

    const getArrayField = (fieldValue: any): string[] => {
      if (!fieldValue) return [];
      if (Array.isArray(fieldValue)) return fieldValue.map(String).filter(Boolean);
      if (typeof fieldValue === 'string') {
        return fieldValue.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [String(fieldValue)];
    };

    // Get string value from field, checking multiple possible field names
    const getStringField = (primaryField: any, fallbackField: any): string => {
      if (primaryField) {
        if (Array.isArray(primaryField)) {
          return primaryField[0] || '';
        }
        return String(primaryField);
      }
      if (fallbackField) {
        if (Array.isArray(fallbackField)) {
          return fallbackField[0] || '';
        }
        return String(fallbackField);
      }
      return '';
    };

    // Get number value, checking multiple possible field names
    const getNumberField = (primaryField: any, fallbackField: any): number => {
      const value = primaryField ?? fallbackField;
      if (!value) return 0;
      if (Array.isArray(value)) {
        return parseFloat(value[0]) || 0;
      }
      return parseFloat(value) || 0;
    };

    // Build title
    const titulo = fields.AutoMarca && fields.AutoSubmarcaVersion
      ? `${fields.AutoMarca} ${fields.AutoSubmarcaVersion}`.trim()
      : fields.Auto || 'Auto sin título';

    // --- ID/OC → TRF CONVERSION ---
    // Airtable may send ID or OC format, but we now use TRF as primary key
    // Convert ID001234 → TRF001234 and OC001234 → TRF001234 automatically
    // IMPORTANT: Do NOT use record.id as fallback - reject records without valid OrdenCompra
    let rawOrdenCompra = fields.OrdenCompra;
    let legacyId: string | null = null;

    // Validate OrdenCompra exists and has valid format
    if (!rawOrdenCompra || rawOrdenCompra.trim() === '') {
      console.log(`⚠️ Record ${record.id} has no OrdenCompra - skipping sync to prevent invalid data`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Record ${record.id} skipped: missing OrdenCompra field`,
          action: 'skipped'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Reject records where OrdenCompra looks like a record_id (starts with 'rec')
    if (rawOrdenCompra.startsWith('rec')) {
      console.log(`⚠️ Record ${record.id} has invalid OrdenCompra (looks like record_id) - skipping`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Record ${record.id} skipped: OrdenCompra "${rawOrdenCompra}" appears to be a record_id`,
          action: 'skipped'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (rawOrdenCompra.startsWith('ID')) {
      legacyId = rawOrdenCompra;  // Save original ID
      rawOrdenCompra = 'TRF' + rawOrdenCompra.substring(2);  // Convert to TRF
      console.log(`🔄 Converted OrdenCompra: ${legacyId} → ${rawOrdenCompra}`);
    } else if (rawOrdenCompra.startsWith('OC')) {
      legacyId = rawOrdenCompra;  // Save original OC
      rawOrdenCompra = 'TRF' + rawOrdenCompra.substring(2);  // Convert to TRF
      console.log(`🔄 Converted OrdenCompra: ${legacyId} → ${rawOrdenCompra}`);
    }

    const ordenCompra = rawOrdenCompra;

    // --- IMAGE HANDLING ---
    // Check if this vehicle already has R2 images uploaded via "Cargar Fotos" admin page
    // If use_r2_images=true, preserve R2 images and skip Airtable image URLs
    console.log(`🖼️  Checking image handling for ${ordenCompra}...`);

    let exteriorImages = '';
    let interiorImages = '';
    let featureImage: string | null = null;
    let useR2Images = false;
    let r2FeatureImage: string | null = null;
    let r2Gallery: string[] = [];

    // Check existing record for ALL fields to preserve
    // This ensures we never overwrite valid data with empty values from Airtable
    // SAFE LOOKUP: Try by ordencompra (TRF format) first, then by legacy_id if not found
    let existingRecord = null;

    // First try: Look up by converted TRF ordencompra
    const { data: byOrdencompra } = await supabase
      .from('inventario_cache')
      .select('*')
      .eq('ordencompra', ordenCompra)
      .single();

    if (byOrdencompra) {
      existingRecord = byOrdencompra;
      console.log(`📋 Found by ordencompra: ${ordenCompra}`);
    } else if (legacyId) {
      // Second try: Look up by legacy_id (original ID format from Airtable)
      const { data: byLegacyId } = await supabase
        .from('inventario_cache')
        .select('*')
        .eq('legacy_id', legacyId)
        .single();

      if (byLegacyId) {
        existingRecord = byLegacyId;
        console.log(`📋 Found by legacy_id: ${legacyId} → updating ordencompra to ${ordenCompra}`);
      }
    }

    console.log(`📋 Existing record found: ${existingRecord ? 'YES' : 'NO'}`);

    if (existingRecord?.use_r2_images) {
      // PRESERVE R2 IMAGES - Don't overwrite with Airtable URLs
      console.log(`✅ Vehicle has R2 images (use_r2_images=true) - preserving existing images`);
      useR2Images = true;
      r2FeatureImage = existingRecord.r2_feature_image || null;
      r2Gallery = existingRecord.r2_gallery || [];
      featureImage = existingRecord.feature_image || r2FeatureImage;
      exteriorImages = existingRecord.fotos_exterior_url || '';
      interiorImages = existingRecord.fotos_interior_url || '';
      console.log(`📷 Preserved: feature=${featureImage ? '1' : '0'}, gallery=${r2Gallery.length} images`);
    } else {
      // FALLBACK: Read image URLs from Airtable text fields (legacy behavior)
      // Note: airtable-image-upload-optimized.js automation should be DISABLED
      console.log(`📥 No R2 images - reading from Airtable fields (legacy mode)`);

      const airtableExteriorImages = getImageUrls(fields.fotos_exterior_url).join(', ') || '';
      const airtableInteriorImages = getImageUrls(fields.fotos_interior_url).join(', ') || '';

      // Check multiple possible field names for feature image
      const featureImageArray = getImageUrls(fields.feature_image) || [];
      const featuredImageUrlArray = getImageUrls(fields.featured_image_url) || [];
      const featureImageUrlArray = getImageUrls(fields.feature_image_url) || [];

      // Use feature_image if available, then featured_image_url, then feature_image_url, then first exterior image
      const airtableFeatureImage = featureImageArray.length > 0 ? featureImageArray[0] :
                         featuredImageUrlArray.length > 0 ? featuredImageUrlArray[0] :
                         featureImageUrlArray.length > 0 ? featureImageUrlArray[0] : null;

      // ✅ FIX: PRESERVE existing images if Airtable doesn't have them
      // This prevents data loss when webhook sends incomplete data
      if (airtableExteriorImages) {
        exteriorImages = airtableExteriorImages;
      } else if (existingRecord?.fotos_exterior_url) {
        exteriorImages = existingRecord.fotos_exterior_url;
        console.log(`📷 Preservando fotos_exterior_url existentes (Airtable no envió nuevas)`);
      }

      if (airtableInteriorImages) {
        interiorImages = airtableInteriorImages;
      } else if (existingRecord?.fotos_interior_url) {
        interiorImages = existingRecord.fotos_interior_url;
        console.log(`📷 Preservando fotos_interior_url existentes (Airtable no envió nuevas)`);
      }

      if (airtableFeatureImage) {
        featureImage = airtableFeatureImage;
      } else if (existingRecord?.feature_image) {
        featureImage = existingRecord.feature_image;
        console.log(`📷 Preservando feature_image existente (Airtable no envió nueva)`);
      } else if (exteriorImages) {
        // Fallback to first exterior image
        const exteriorArray = exteriorImages.split(',').map(url => url.trim()).filter(Boolean);
        featureImage = exteriorArray[0] || null;
      }

      console.log(`✅ Found ${exteriorImages.split(',').filter(Boolean).length} exterior, ${interiorImages.split(',').filter(Boolean).length} interior, ${featureImage ? 1 : 0} feature image URLs`);
    }

    // Normalize combustible field - convert to plain text (first element)
    const combustibleArray = getArrayField(fields.autocombustible || fields.combustible);
    const combustibleValue = combustibleArray.length > 0 ? combustibleArray[0] : '';

    // Normalize kilometraje field - convert to plain text (first element)
    const kilometrajeArray = getArrayField(fields.autokilometraje || fields.kilometraje);
    const kilometrajeValue = kilometrajeArray.length > 0 ? kilometrajeArray[0] : '';

    // Normalize transmision field - convert to plain text (first element)
    const transmisionArray = getArrayField(fields.autotransmision || fields.transmision);
    const transmisionValue = transmisionArray.length > 0 ? transmisionArray[0] : '';

    // Normalize ubicacion - convert to comma-separated text
    const ubicacionArray = getArrayField(fields.Ubicacion);
    const ubicacionValue = ubicacionArray.join(', ');

    // Normalize clasificacionid (carroceria) - convert to comma-separated text
    const clasificacionArray = getArrayField(fields.ClasificacionID);
    const clasificacionValue = clasificacionArray.join(', ');

    // Normalize promociones - convert to JSONB array
    const promocionesArray = getArrayField(fields.Promociones || fields.promociones);
    const promocionesValue = promocionesArray.length > 0 ? promocionesArray : null;

    // Determine vendido status based on OrdenStatus
    // A vehicle is vendido if OrdenStatus is "Historico"
    const currentOrdenStatus = fields.OrdenStatus || '';
    const isVendido = currentOrdenStatus === 'Historico' || fields.vendido === true;

    // ==========================================================================
    // SAFE DATA MAPPING - THREE UPDATE MODES:
    // ==========================================================================
    // 1. neverOverwrite: NEVER overwrite existing values (only fill if empty)
    const neverOverwrite = <T>(newValue: T | null | undefined, existingValue: T | null | undefined): T | null => {
      // If existing has value, ALWAYS keep it
      if (existingValue !== null && existingValue !== undefined && existingValue !== '' && existingValue !== 0) {
        return existingValue as T;
      }
      // Only use new value if existing is empty
      return newValue ?? null;
    };

    // 2. allowUpdate: CAN be overwritten from Airtable (but not with null/empty)
    const allowUpdate = <T>(newValue: T | null | undefined, existingValue: T | null | undefined): T | null => {
      if (newValue === null || newValue === undefined || newValue === '' || newValue === 0) {
        return (existingValue as T) ?? null;
      }
      return newValue;
    };

    // 3. updateIfNotNull: CAN update but NEVER with null value (for images)
    const updateIfNotNull = <T>(newValue: T | null | undefined, existingValue: T | null | undefined): T | null => {
      if (newValue === null || newValue === undefined || newValue === '') {
        return (existingValue as T) ?? null;
      }
      return newValue;
    };

    // Map Airtable fields to Supabase columns
    // Generate unique slug: use ligawp/slug if available, otherwise generate from title with numeric suffix
    let slug = fields.ligawp || fields.slug;
    if (!slug) {
      // Generate base slug from title
      slug = titulo.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Remove duplicate hyphens
        .trim();
    }
    slug = slug.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists and add numeric suffix if needed
    const baseSlug = slug;
    let slugExists = true;
    let counter = 0;

    while (slugExists && counter < 100) { // Max 100 attempts to find unique slug
      const { data: existingRecord, error: checkError } = await supabase
        .from('inventario_cache')
        .select('record_id')
        .eq('slug', slug)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // No record found with this slug - it's unique!
        slugExists = false;
      } else if (existingRecord && existingRecord.record_id === record.id) {
        // The existing record is this same record - it's fine
        slugExists = false;
      } else if (existingRecord) {
        // Slug exists for a different record - try with counter
        counter++;
        slug = `${baseSlug}-${counter}`;
      } else {
        // Some other error, but proceed
        slugExists = false;
      }
    }

    // Build safe data object - preserving existing values when Airtable sends empty
    const airtablePrecio = parseFloat(fields.Precio || '0');
    const airtableKilometraje = getNumberField(fields.autokilometraje, fields.kilometraje);
    const airtableAutoano = getNumberField(fields.AutoAno, fields.autoano);
    const airtableCilindros = getNumberField(fields.AutoCilindros, fields.cilindros);
    const airtableEnganchemin = getNumberField(fields.EngancheMin, fields.enganchemin);
    const airtableEngancheRec = getNumberField(fields.EngancheRecomendado, fields.enganche_recomendado);
    const airtableMensMin = getNumberField(fields.MensualidadMinima, fields.mensualidad_minima);
    const airtableMensRec = getNumberField(fields.MensualidadRecomendada, fields.mensualidad_recomendada);
    const airtablePlazomax = getNumberField(fields.PlazoMax, fields.plazomax);
    const airtableNumDuenos = getNumberField(fields.NumeroDuenos, fields.numero_duenos);

    // =========================================================================
    // BUILD SUPABASE DATA OBJECT
    // FIELD UPDATE RULES:
    // - neverOverwrite: NEVER overwrite (only fill if empty)
    // - allowUpdate: CAN be overwritten from Airtable (but not with null)
    // - updateIfNotNull: CAN update but NEVER with null value
    // =========================================================================
    const supabaseData = {
      // ALWAYS UPDATE from Airtable
      record_id: record.id,
      ordencompra: ordenCompra || existingRecord?.ordencompra || '',
      ordenstatus: currentOrdenStatus || existingRecord?.ordenstatus,
      legacy_id: legacyId || existingRecord?.legacy_id || null,

      // NEVER OVERWRITE - Only fill if empty
      title: neverOverwrite(titulo, existingRecord?.title),
      titulo: neverOverwrite(titulo, existingRecord?.titulo),
      marca: neverOverwrite(fields.AutoMarca, existingRecord?.marca),
      modelo: neverOverwrite(fields.AutoSubmarcaVersion, existingRecord?.modelo),
      transmision: neverOverwrite(transmisionValue, existingRecord?.transmision),
      autotransmision: neverOverwrite(transmisionValue, existingRecord?.autotransmision),
      combustible: neverOverwrite(combustibleValue, existingRecord?.combustible),
      carroceria: neverOverwrite(clasificacionValue, existingRecord?.carroceria),
      clasificacionid: neverOverwrite(clasificacionValue, existingRecord?.clasificacionid),
      vin: neverOverwrite(fields.VIN, existingRecord?.vin),
      titulometa: neverOverwrite(getStringField(fields.TituloMeta, fields.metadescripcion), existingRecord?.titulometa),
      precio: neverOverwrite(airtablePrecio, existingRecord?.precio),
      kilometraje: neverOverwrite(airtableKilometraje, existingRecord?.kilometraje),
      autoano: neverOverwrite(airtableAutoano, existingRecord?.autoano),
      cilindros: neverOverwrite(airtableCilindros, existingRecord?.cilindros),
      numero_duenos: neverOverwrite(airtableNumDuenos, existingRecord?.numero_duenos),
      oferta: neverOverwrite(getNumberField(fields.Oferta, fields.oferta), existingRecord?.oferta),
      reel_url: neverOverwrite(fields.Reel, existingRecord?.reel_url),

      // ALLOWED TO UPDATE from Airtable (but not with null)
      slug: allowUpdate(slug, existingRecord?.slug),
      ubicacion: allowUpdate(ubicacionValue, existingRecord?.ubicacion),
      garantia: allowUpdate(getStringField(fields.Garantia, fields.garantia), existingRecord?.garantia),
      descripcion: allowUpdate(fields.descripcion, existingRecord?.descripcion),
      AutoMotor: allowUpdate(getStringField(fields.AutoMotor, fields.motor), existingRecord?.AutoMotor),
      enganchemin: allowUpdate(airtableEnganchemin, existingRecord?.enganchemin),
      enganche_recomendado: allowUpdate(airtableEngancheRec, existingRecord?.enganche_recomendado),
      mensualidad_minima: allowUpdate(airtableMensMin, existingRecord?.mensualidad_minima),
      mensualidad_recomendada: allowUpdate(airtableMensRec, existingRecord?.mensualidad_recomendada),
      plazomax: allowUpdate(airtablePlazomax, existingRecord?.plazomax),
      promociones: promocionesValue || existingRecord?.promociones || null,
      rfdm: allowUpdate(fields.rfdm, existingRecord?.rfdm),
      liga_bot: allowUpdate(fields.ligaBot || fields.LigaBot, existingRecord?.liga_bot),
      liga_web: allowUpdate(`https://trefa.mx/autos/${slug}`, existingRecord?.liga_web),

      // IMAGE FIELDS - Update only if NOT null (never overwrite with null)
      feature_image: updateIfNotNull(featureImage, existingRecord?.feature_image),
      feature_image_url: updateIfNotNull(featureImage, existingRecord?.feature_image_url),
      fotos_exterior_url: updateIfNotNull(exteriorImages, existingRecord?.fotos_exterior_url),
      fotos_interior_url: updateIfNotNull(interiorImages, existingRecord?.fotos_interior_url),

      // ALWAYS PRESERVE R2 image fields
      ...(useR2Images && {
        use_r2_images: true,
        r2_feature_image: r2FeatureImage,
        r2_gallery: r2Gallery,
      }),

      // Boolean fields - preserve existing if Airtable doesn't send
      separado: fields.separado !== undefined || fields.Separado !== undefined
        ? !!(fields.separado || fields.Separado)
        : existingRecord?.separado ?? false,
      vendido: isVendido,
      rezago: fields.Rezago !== undefined || fields.rezago !== undefined
        ? (fields.Rezago === true || fields.rezago === true)
        : existingRecord?.rezago ?? false,
      con_oferta: fields['Con Oferta'] !== undefined
        ? fields['Con Oferta'] === true
        : existingRecord?.con_oferta ?? false,
      en_reparacion: fields['En Reparación'] ?? existingRecord?.en_reparacion ?? false,
      utilitario: fields.Utilitario ?? existingRecord?.utilitario ?? false,

      // Timestamps
      ingreso_inventario: fields.IngresoInventario || fields.ingreso_inventario || existingRecord?.ingreso_inventario,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Preserve created_at if it already exists
      ...(existingRecord?.created_at && { created_at: existingRecord.created_at }),

      // Store full Airtable data for reference (merge with existing)
      data: { ...(existingRecord?.data || {}), ...fields },
    };

    // --- 6. Upsert Data into Supabase ---
    console.log(`📤 Upserting record ${record.id} into Supabase...`);

    const { error } = await supabase
      .from('inventario_cache')
      .upsert(supabaseData, {
        onConflict: 'ordencompra',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('❌ Supabase Error:', error);
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    console.log(`✅ Successfully synced record ${record.id}`);

    // --- 7. Log sync success ---
    try {
      const syncStartTime = Date.now(); // You'd want to track this from the beginning
      await supabase.from('sync_logs').insert({
        record_id: record.id,
        sync_type: 'webhook',
        source: body.source || 'airtable_automation',
        status: 'success',
        message: `Successfully synced record ${record.id}`,
        attempt_number: body.attempt || 1,
        vehicle_title: titulo,
        ordencompra: fields.OrdenCompra,
        ordenstatus: currentOrdenStatus,
        metadata: {
          fields_synced: Object.keys(supabaseData).length,
          has_images: !!(exteriorImages || interiorImages),
          cache_invalidated: true
        }
      });
    } catch (logError) {
      console.warn('⚠️  Failed to log sync (non-critical):', logError.message);
    }

    // --- 8. Invalidate rapid-processor cache (fire and forget) ---
    try {
      const rapidProcessorUrl = `${supabaseUrl}/functions/v1/rapid-processor/invalidate-cache`;
      console.log('🔄 Invalidating rapid-processor cache...');

      // Fire and forget - don't wait for response
      fetch(rapidProcessorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }).catch(err => {
        console.warn('⚠️  Cache invalidation failed (non-critical):', err.message);
      });
    } catch (cacheError) {
      console.warn('⚠️  Cache invalidation error (non-critical):', cacheError.message);
    }

    // --- 8. Return Success Response ---
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced record ${record.id}`,
        data: {
          record_id: record.id,
          title: titulo,
          ordencompra: fields.OrdenCompra,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error occurred:', error);

    // Log error to sync_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.clone().json().catch(() => ({}));
        await supabase.from('sync_logs').insert({
          record_id: body.recordId || 'unknown',
          sync_type: 'webhook',
          source: body.source || 'airtable_automation',
          status: 'error',
          message: error.message,
          error_details: {
            name: error.name,
            stack: error.stack,
            cause: error.cause
          },
          attempt_number: body.attempt || 1,
          metadata: {
            error_type: error.name,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (logError) {
      console.warn('⚠️  Failed to log error (non-critical):', logError.message);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
