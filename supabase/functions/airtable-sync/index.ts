// Supabase Edge Function: Airtable Webhook → inventario_cache Sync
// This function receives a single record update from Airtable webhooks
// and syncs all vehicle data to Supabase inventario_cache table.
// Image URLs are read from Airtable text fields (populated by airtable-image-upload-optimized.js)
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
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID') || 'appbOPKYqQRW2HgyB';
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

      // If record was deleted in Airtable (404), remove from Supabase
      if (response.status === 404) {
        console.log(`🗑️ Record ${recordId} not found in Airtable. Deleting from Supabase...`);

        const { error: deleteError } = await supabase
          .from('inventario_cache')
          .delete()
          .eq('record_id', recordId);

        if (deleteError) {
          console.error('Error deleting record:', deleteError);
        } else {
          console.log(`✅ Deleted record ${recordId} from Supabase`);
        }

        return new Response(
          JSON.stringify({ message: `Record ${recordId} deleted from cache.` }),
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

    const ordenCompra = fields.OrdenCompra || record.id;

    // Read R2 image URLs directly from Airtable text fields
    // These URLs are populated by the airtable-image-upload-optimized.js automation
    // which handles uploading attachments to R2 and saving URLs back to Airtable
    console.log(`🖼️  Reading image URLs for ${ordenCompra}...`);

    const exteriorImages = getImageUrls(fields.fotos_exterior_url).join(', ') || '';
    const interiorImages = getImageUrls(fields.fotos_interior_url).join(', ') || '';

    // Check multiple possible field names for feature image (Airtable attachment or URL string)
    const featureImageArray = getImageUrls(fields.feature_image) || [];
    const featuredImageUrlArray = getImageUrls(fields.featured_image_url) || [];
    const featureImageUrlArray = getImageUrls(fields.feature_image_url) || [];

    // Use feature_image if available, then featured_image_url, then feature_image_url, then first exterior image
    let featureImage = featureImageArray.length > 0 ? featureImageArray[0] :
                       featuredImageUrlArray.length > 0 ? featuredImageUrlArray[0] :
                       featureImageUrlArray.length > 0 ? featureImageUrlArray[0] : null;

    if (!featureImage && exteriorImages) {
      const exteriorArray = exteriorImages.split(',').map(url => url.trim()).filter(Boolean);
      featureImage = exteriorArray[0] || null;
    }

    console.log(`✅ Found ${exteriorImages.split(',').filter(Boolean).length} exterior, ${interiorImages.split(',').filter(Boolean).length} interior, ${featureImage ? 1 : 0} feature image URLs`);

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

    const supabaseData = {
      record_id: record.id,
      title: titulo,
      slug: slug,
      precio: parseFloat(fields.Precio || '0'),
      marca: fields.AutoMarca || 'Sin Marca',
      modelo: fields.AutoSubmarcaVersion || '',
      transmision: transmisionValue,
      combustible: combustibleValue,
      kilometraje: getNumberField(fields.autokilometraje, fields.kilometraje),
      autoano: getNumberField(fields.AutoAno, fields.autoano),
      cilindros: getNumberField(fields.AutoCilindros, fields.cilindros),
      feature_image: featureImage,
      feature_image_url: featureImage, // Store in both columns for compatibility
      fotos_exterior_url: exteriorImages,
      fotos_interior_url: interiorImages,
      ordencompra: fields.OrdenCompra || '',
      ordenstatus: currentOrdenStatus,
      separado: !!(fields.separado || fields.Separado), // Convert any truthy value to boolean
      vendido: isVendido,
      clasificacionid: clasificacionValue,
      ubicacion: ubicacionValue,
      descripcion: fields.descripcion || '',

      // Financial fields
      enganchemin: getNumberField(fields.EngancheMin, fields.enganchemin),
      enganche_recomendado: getNumberField(fields.EngancheRecomendado, fields.enganche_recomendado),
      mensualidad_minima: getNumberField(fields.MensualidadMinima, fields.mensualidad_minima),
      mensualidad_recomendada: getNumberField(fields.MensualidadRecomendada, fields.mensualidad_recomendada),
      plazomax: getNumberField(fields.PlazoMax, fields.plazomax),

      // Additional fields
      garantia: getStringField(fields.Garantia, fields.garantia),
      titulometa: getStringField(fields.TituloMeta, fields.metadescripcion),
      AutoMotor: getStringField(fields.AutoMotor, fields.motor),
      ingreso_inventario: fields.IngresoInventario || fields.ingreso_inventario || null,
      numero_duenos: getNumberField(fields.NumeroDuenos, fields.numero_duenos),
      rezago: fields.Rezago === true || fields.rezago === true,
      promociones: promocionesValue,

      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Store full Airtable data for reference
      data: fields,
    };

    // --- 6. Upsert Data into Supabase ---
    console.log(`📤 Upserting record ${record.id} into Supabase...`);

    const { error } = await supabase
      .from('inventario_cache')
      .upsert(supabaseData, {
        onConflict: 'record_id',
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
