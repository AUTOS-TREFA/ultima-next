// supabase/functions/batch-sync-airtable/index.ts
// 
// Deploy: supabase functions deploy batch-sync-airtable
// Schedule: Create a cron job in Supabase Dashboard → Database → Cron
//
// SELECT cron.schedule(
//   'sync-to-airtable',
//   '*/5 * * * *',  -- Every 5 minutes
//   $$
//   SELECT net.http_post(
//     url := 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/batch-sync-airtable',
//     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
//     body := '{}'::jsonb
//   );
//   $$
// );
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");
const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID") || "appLnI8wa41TtcZN1";
const AIRTABLE_TABLE_ID = Deno.env.get("AIRTABLE_TABLE_ID") || "tblOjECDJDZlNv8At";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CAMPOS_SUPABASE_TO_AIRTABLE = {
  ordencompra: "OrdenCompra",
  ordenstatus: "OrdenStatus",
  precio: "Precio",
  marca: "AutoMarca",
  modelo: "AutoSubmarcaVersion",
  autoano: "AutoAno",
  ingreso_inventario: "ingreso_inventario",
  separado: "Separado",
  kilometraje: "Kilometraje Compra",
  autotransmision: "autotransmision",
  en_reparacion: "En Reparación",
  ubicacion: "Ubicacion",
  utilitario: "Utilitario"
};
serve(async (req)=>{
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  try {
    // Get records updated in last 10 minutes that need sync
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: records, error } = await supabase.from("inventario_cache").select("*").or(`updated_at.gte.${tenMinutesAgo},airtable_id.is.null`).not("ordencompra", "is", null).limit(50); // Process max 50 per run
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No records to sync",
        count: 0
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`Processing ${records.length} records`);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    // Process records with delay to avoid rate limits
    for (const record of records){
      try {
        // Check if exists in Airtable
        const existing = await buscarEnAirtable(record.ordencompra);
        if (existing) {
          await actualizarEnAirtable(existing.id, record);
          updated++;
        } else {
          const newRecord = await crearEnAirtable(record);
          if (newRecord?.id) {
            // Save Airtable ID back to Supabase
            await supabase.from("inventario_cache").update({
              airtable_id: newRecord.id
            }).eq("ordencompra", record.ordencompra);
            created++;
          } else {
            skipped++;
          }
        }
        // Delay between records to respect rate limit (5 req/sec)
        await new Promise((resolve)=>setTimeout(resolve, 250));
      } catch (err) {
        console.error(`Error processing ${record.ordencompra}:`, err.message);
        errors++;
      }
    }
    return new Response(JSON.stringify({
      success: true,
      processed: records.length,
      created,
      updated,
      skipped,
      errors
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
async function buscarEnAirtable(ordenCompra) {
  const formula = encodeURIComponent(`{OrdenCompra}="${ordenCompra}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  if (response.status === 429) {
    await new Promise((resolve)=>setTimeout(resolve, 1000));
    return buscarEnAirtable(ordenCompra);
  }
  const data = await response.json();
  return data.records?.[0] || null;
}
async function crearEnAirtable(registro) {
  const fields = mapearCampos(registro);
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields
    })
  });
  if (response.status === 429) {
    await new Promise((resolve)=>setTimeout(resolve, 1000));
    return crearEnAirtable(registro);
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable create failed: ${error}`);
  }
  return response.json();
}
async function actualizarEnAirtable(recordId, registro) {
  const fields = mapearCampos(registro);
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields
    })
  });
  if (response.status === 429) {
    await new Promise((resolve)=>setTimeout(resolve, 1000));
    return actualizarEnAirtable(recordId, registro);
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable update failed: ${error}`);
  }
  return response.json();
}
function mapearCampos(registro) {
  const fields = {};
  for (const [supabaseKey, airtableKey] of Object.entries(CAMPOS_SUPABASE_TO_AIRTABLE)){
    let valor = registro[supabaseKey];
    if (valor === null || valor === undefined || valor === "") continue;
    if (supabaseKey === "kilometraje" && typeof valor === "object") {
      valor = valor.value || valor.km || valor;
    }
    if (typeof valor === "string") {
      valor = valor.replace(/^["']+|["']+$/g, "").replace(/\\"/g, '"').replace(/^["']+|["']+$/g, "").trim();
      if (valor === "") continue;
    }
    fields[airtableKey] = valor;
  }
  return fields;
}
