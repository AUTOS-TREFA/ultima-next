// Supabase Edge Function: Pull ALL records from Airtable → inventario_cache
// This function fetches all "Comprado" records from Airtable and syncs them to Supabase
// Use this to force a full sync when needed
//
// Deploy with: supabase functions deploy pull-from-airtable

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('✅ Pull from Airtable Function Initialized');

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options = { onlyComprado: true, limit: 100 };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body, use defaults
    }

    console.log(`📡 Fetching records from Airtable (onlyComprado: ${options.onlyComprado}, limit: ${options.limit})`);

    // --- 2. Fetch ALL records from Airtable with pagination ---
    let allRecords: any[] = [];
    let offset: string | undefined = undefined;

    // Build filter formula
    const filterFormula = options.onlyComprado
      ? encodeURIComponent("{OrdenStatus}='Comprado'")
      : '';

    do {
      const url = new URL(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`);
      url.searchParams.set('pageSize', '100');
      if (filterFormula) {
        url.searchParams.set('filterByFormula', decodeURIComponent(filterFormula));
      }
      if (offset) {
        url.searchParams.set('offset', offset);
      }

      console.log(`📥 Fetching page... (offset: ${offset || 'none'})`);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;

      console.log(`   → Got ${data.records?.length || 0} records (total: ${allRecords.length})`);

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));

      // Limit check
      if (options.limit && allRecords.length >= options.limit) {
        allRecords = allRecords.slice(0, options.limit);
        break;
      }

    } while (offset);

    console.log(`✅ Fetched ${allRecords.length} total records from Airtable`);

    // --- 3. Process each record ---
    let synced = 0, skipped = 0, errors = 0;
    const errorDetails: { id: string; error: string }[] = [];

    for (const record of allRecords) {
      try {
        const fields = record.fields;
        const ordenStatus = fields.OrdenStatus || '';

        // Skip non-Comprado if filtering
        if (options.onlyComprado && ordenStatus !== 'Comprado') {
          skipped++;
          continue;
        }

        // --- ID/OC → TRF CONVERSION ---
        let rawOrdenCompra = fields.OrdenCompra || record.id;
        let legacyId: string | null = null;

        if (rawOrdenCompra && rawOrdenCompra.startsWith('ID')) {
          legacyId = rawOrdenCompra;
          rawOrdenCompra = 'TRF' + rawOrdenCompra.substring(2);
        } else if (rawOrdenCompra && rawOrdenCompra.startsWith('OC')) {
          legacyId = rawOrdenCompra;
          rawOrdenCompra = 'TRF' + rawOrdenCompra.substring(2);
        }

        const ordenCompra = rawOrdenCompra;

        // Helper functions
        const getArrayField = (fieldValue: any): string[] => {
          if (!fieldValue) return [];
          if (Array.isArray(fieldValue)) return fieldValue.map(String).filter(Boolean);
          if (typeof fieldValue === 'string') {
            return fieldValue.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          return [String(fieldValue)];
        };

        const getStringField = (primaryField: any, fallbackField?: any): string => {
          if (primaryField) {
            if (Array.isArray(primaryField)) return primaryField[0] || '';
            return String(primaryField);
          }
          if (fallbackField) {
            if (Array.isArray(fallbackField)) return fallbackField[0] || '';
            return String(fallbackField);
          }
          return '';
        };

        const getNumberField = (primaryField: any, fallbackField?: any): number => {
          const value = primaryField ?? fallbackField;
          if (!value) return 0;
          if (Array.isArray(value)) return parseFloat(value[0]) || 0;
          return parseFloat(value) || 0;
        };

        const getImageUrls = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field) && field.length > 0 && typeof field[0] === 'object' && field[0].url) {
            return field.map((att: any) => att.url || att.thumbnails?.large?.url).filter(Boolean);
          }
          if (typeof field === 'string') {
            const trimmed = field.trim();
            if (trimmed === '[]' || trimmed === '{}' || trimmed === 'null' || trimmed === '') return [];
            return field.split(',').map((url: string) => url.trim()).filter((url: string) => url.startsWith('http'));
          }
          if (Array.isArray(field)) {
            return field.map(String).filter((url: string) => url.startsWith('http'));
          }
          return [];
        };

        // Build title
        const titulo = fields.AutoMarca && fields.AutoSubmarcaVersion
          ? `${fields.AutoMarca} ${fields.AutoSubmarcaVersion}`.trim()
          : fields.Auto || 'Auto sin título';

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
        } else if (legacyId) {
          // Second try: Look up by legacy_id (original ID format from Airtable)
          const { data: byLegacyId } = await supabase
            .from('inventario_cache')
            .select('*')
            .eq('legacy_id', legacyId)
            .single();

          if (byLegacyId) {
            existingRecord = byLegacyId;
            console.log(`📋 Found by legacy_id: ${legacyId} → updating to ${ordenCompra}`);
          }
        }

        // Normalize fields
        const combustibleArray = getArrayField(fields.autocombustible || fields.combustible);
        const transmisionArray = getArrayField(fields.autotransmision || fields.transmision);
        const ubicacionArray = getArrayField(fields.Ubicacion);
        const clasificacionArray = getArrayField(fields.ClasificacionID);

        // Image handling
        let exteriorImages = getImageUrls(fields.fotos_exterior_url).join(', ');
        let interiorImages = getImageUrls(fields.fotos_interior_url).join(', ');
        let featureImage = getImageUrls(fields.feature_image)[0] ||
                          getImageUrls(fields.featured_image_url)[0] ||
                          getImageUrls(fields.feature_image_url)[0] || null;

        // Preserve R2 images if they exist
        if (existingRecord?.use_r2_images) {
          exteriorImages = existingRecord.fotos_exterior_url || exteriorImages;
          interiorImages = existingRecord.fotos_interior_url || interiorImages;
          featureImage = existingRecord.feature_image || existingRecord.r2_feature_image || featureImage;
        }

        // Generate slug
        let slug = fields.ligawp || fields.slug || existingRecord?.slug;
        if (!slug) {
          slug = titulo.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        }

        // Check slug uniqueness
        if (slug) {
          const { data: slugCheck } = await supabase
            .from('inventario_cache')
            .select('ordencompra')
            .eq('slug', slug)
            .neq('ordencompra', ordenCompra)
            .limit(1);

          if (slugCheck && slugCheck.length > 0) {
            // Slug exists, add suffix
            let counter = 1;
            let newSlug = `${slug}-${counter}`;
            while (true) {
              const { data: check } = await supabase
                .from('inventario_cache')
                .select('ordencompra')
                .eq('slug', newSlug)
                .limit(1);
              if (!check || check.length === 0) {
                slug = newSlug;
                break;
              }
              counter++;
              newSlug = `${slug}-${counter}`;
              if (counter > 10) {
                slug = `${slug}-${Date.now()}`;
                break;
              }
            }
          }
        }

        // =======================================================================
        // SAFE UPDATE LOGIC
        // =======================================================================
        // DEFAULT: Never overwrite existing values (only fill if empty)
        const preserveExisting = <T>(newVal: T | null | undefined, existing: T | null | undefined): T | null => {
          // If existing has value, ALWAYS keep it
          if (existing !== null && existing !== undefined && existing !== '' && existing !== 0) {
            return existing as T;
          }
          // Only use new value if existing is empty
          return newVal ?? null;
        };

        // ALLOWED TO UPDATE: These fields CAN be overwritten from Airtable
        const allowUpdate = <T>(newVal: T | null | undefined, existing: T | null | undefined): T | null => {
          if (newVal === null || newVal === undefined || newVal === '' || newVal === 0) {
            return (existing as T) ?? null;
          }
          return newVal;
        };

        // NEVER NULL: These fields can be updated but NEVER with null
        const updateIfNotNull = <T>(newVal: T | null | undefined, existing: T | null | undefined): T | null => {
          if (newVal === null || newVal === undefined || newVal === '') {
            return (existing as T) ?? null;  // Keep existing if new is null
          }
          return newVal;  // Update with new value
        };

        // Build upsert data
        // =====================================================================
        // FIELD UPDATE RULES:
        // - preserveExisting: NEVER overwrite (only fill if empty)
        // - allowUpdate: CAN be overwritten from Airtable (but not with null)
        // - updateIfNotNull: CAN update but NEVER with null value
        // =====================================================================
        const supabaseData = {
          // ALWAYS UPDATE from Airtable
          record_id: record.id,  // allowUpdate
          ordencompra: ordenCompra,
          legacy_id: legacyId || existingRecord?.legacy_id || null,
          ordenstatus: ordenStatus || existingRecord?.ordenstatus,

          // NEVER OVERWRITE - Only fill if empty
          title: preserveExisting(titulo, existingRecord?.title),
          titulo: preserveExisting(titulo, existingRecord?.titulo),
          marca: preserveExisting(fields.AutoMarca, existingRecord?.marca),
          modelo: preserveExisting(fields.AutoSubmarcaVersion, existingRecord?.modelo),
          autotransmision: preserveExisting(transmisionArray[0], existingRecord?.autotransmision),
          combustible: preserveExisting(combustibleArray[0], existingRecord?.combustible),
          carroceria: preserveExisting(clasificacionArray.join(', '), existingRecord?.carroceria),
          clasificacionid: preserveExisting(clasificacionArray.join(', '), existingRecord?.clasificacionid),
          vin: preserveExisting(fields.VIN, existingRecord?.vin),
          precio: preserveExisting(parseFloat(fields.Precio) || 0, existingRecord?.precio),
          kilometraje: preserveExisting(getNumberField(fields.autokilometraje, fields.kilometraje), existingRecord?.kilometraje),
          autoano: preserveExisting(getNumberField(fields.AutoAno, fields.autoano), existingRecord?.autoano),
          cilindros: preserveExisting(getNumberField(fields.AutoCilindros), existingRecord?.cilindros),
          numero_duenos: preserveExisting(getNumberField(fields.NumeroDuenos), existingRecord?.numero_duenos),
          reel_url: preserveExisting(fields.Reel, existingRecord?.reel_url),

          // ALLOWED TO UPDATE from Airtable (but not with null)
          slug: allowUpdate(slug, existingRecord?.slug),
          ubicacion: allowUpdate(ubicacionArray.join(', '), existingRecord?.ubicacion),
          garantia: allowUpdate(getStringField(fields.Garantia, fields.garantia), existingRecord?.garantia),
          descripcion: allowUpdate(fields.descripcion, existingRecord?.descripcion),
          AutoMotor: allowUpdate(getStringField(fields.AutoMotor, fields.motor), existingRecord?.AutoMotor),
          enganchemin: allowUpdate(getNumberField(fields.EngancheMin, fields.enganchemin), existingRecord?.enganchemin),
          enganche_recomendado: allowUpdate(getNumberField(fields.EngancheRecomendado), existingRecord?.enganche_recomendado),
          mensualidad_minima: allowUpdate(getNumberField(fields.MensualidadMinima), existingRecord?.mensualidad_minima),
          mensualidad_recomendada: allowUpdate(getNumberField(fields.MensualidadRecomendada), existingRecord?.mensualidad_recomendada),
          plazomax: allowUpdate(getNumberField(fields.PlazoMax), existingRecord?.plazomax),
          promociones: fields.Promociones || fields.promociones || existingRecord?.promociones || null,
          rfdm: allowUpdate(fields.rfdm, existingRecord?.rfdm),
          liga_bot: allowUpdate(fields.ligaBot || fields.LigaBot, existingRecord?.liga_bot),
          liga_web: allowUpdate(`https://trefa.mx/autos/${slug}`, existingRecord?.liga_web),

          // IMAGE FIELDS - Update only if NOT null (never overwrite with null)
          feature_image: updateIfNotNull(featureImage, existingRecord?.feature_image),
          feature_image_url: updateIfNotNull(featureImage, existingRecord?.feature_image_url),
          fotos_exterior_url: updateIfNotNull(exteriorImages, existingRecord?.fotos_exterior_url),
          fotos_interior_url: updateIfNotNull(interiorImages, existingRecord?.fotos_interior_url),

          // ALWAYS PRESERVE R2 fields
          use_r2_images: existingRecord?.use_r2_images || false,
          r2_feature_image: existingRecord?.r2_feature_image || null,
          r2_gallery: existingRecord?.r2_gallery || null,

          // Boolean fields - preserve existing if Airtable doesn't send
          separado: fields.separado ?? fields.Separado ?? existingRecord?.separado ?? false,
          vendido: fields.vendido ?? existingRecord?.vendido ?? false,
          rezago: fields.Rezago ?? fields.rezago ?? existingRecord?.rezago ?? false,
          con_oferta: fields['Con Oferta'] ?? existingRecord?.con_oferta ?? false,
          en_reparacion: fields['En Reparación'] ?? existingRecord?.en_reparacion ?? false,
          utilitario: fields.Utilitario ?? existingRecord?.utilitario ?? false,
          // Exhibicion field from Airtable controls visibility on /autos page
          // If checked in Airtable → true in Supabase (visible)
          // If unchecked in Airtable → false in Supabase (hidden from listings)
          exhibicion_inventario: (fields.Exhibicion !== undefined || fields.exhibicion !== undefined)
            ? !!(fields.Exhibicion || fields.exhibicion)
            : existingRecord?.exhibicion_inventario ?? true,

          // Timestamps
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),

          // Full data (merge with existing)
          data: { ...(existingRecord?.data || {}), ...fields },
        };

        // Upsert
        const { error: upsertError } = await supabase
          .from('inventario_cache')
          .upsert(supabaseData, {
            onConflict: 'ordencompra',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw upsertError;
        }

        synced++;
        if (synced % 10 === 0) {
          console.log(`   → Synced ${synced}/${allRecords.length}`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 100));

      } catch (err: any) {
        errors++;
        errorDetails.push({ id: record.id, error: err.message });
        console.error(`❌ Error syncing ${record.id}: ${err.message}`);
      }
    }

    console.log(`\n✅ Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);

    // --- 4. Return Response ---
    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${synced} records from Airtable`,
        stats: {
          total: allRecords.length,
          synced,
          skipped,
          errors,
        },
        errorDetails: errorDetails.slice(0, 10), // First 10 errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
