// supabase/functions/batch-sync-airtable/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY")!;
const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID") || "appbOPKYqQRW2HgyB";
const AIRTABLE_TABLE_ID = Deno.env.get("AIRTABLE_TABLE_ID") || "tblOjECDJDZlNv8At";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CAMPOS_SUPABASE_TO_AIRTABLE: Record<string, string> = {
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
  utilitario: "Utilitario",
};

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: records, error } = await supabase
      .from("inventario_cache")
      .select("*")
      .or(`updated_at.gte.${tenMinutesAgo},airtable_id.is.null`)
      .not("ordencompra", "is", null)
      .limit(50);
    
    if (error) throw new Error(`Supabase query failed: ${error.message}`);

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No records to sync", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${records.length} records`);

    let created = 0, updated = 0, skipped = 0, errors = 0;

    for (const record of records) {
      try {
        const existing = await buscarEnAirtable(record.ordencompra);

        if (existing) {
          // ✅ FIX: NO actualizar registros existentes para evitar sobrescribir datos completos
          // Solo guardar el airtable_id en Supabase si no lo tiene
          console.log(`Record ${record.ordencompra} already exists in Airtable (${existing.id}), skipping update to preserve data`);
          if (!record.airtable_id) {
            await supabase
              .from("inventario_cache")
              .update({ airtable_id: existing.id })
              .eq("ordencompra", record.ordencompra);
            console.log(`  → Saved airtable_id ${existing.id} to Supabase`);
          }
          skipped++;
        } else {
          // Crear nuevo registro solo si no existe en Airtable
          const newRecord = await crearEnAirtable(record);
          if (newRecord?.id) {
            await supabase
              .from("inventario_cache")
              .update({ airtable_id: newRecord.id })
              .eq("ordencompra", record.ordencompra);
            created++;
            console.log(`  → Created new record in Airtable: ${newRecord.id}`);
          } else {
            skipped++;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        console.error(`Error processing ${record.ordencompra}:`, err.message);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: records.length, created, updated, skipped, errors }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function buscarEnAirtable(ordenCompra: string): Promise<any> {
  const formula = encodeURIComponent(`{OrdenCompra}="${ordenCompra}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return buscarEnAirtable(ordenCompra);
  }
  const data = await response.json();
  return data.records?.[0] || null;
}

async function crearEnAirtable(registro: Record<string, any>): Promise<any> {
  const fields = mapearCampos(registro);
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return crearEnAirtable(registro);
  }
  if (!response.ok) throw new Error(`Airtable create failed: ${await response.text()}`);
  return response.json();
}

async function actualizarEnAirtable(recordId: string, registro: Record<string, any>): Promise<any> {
  const fields = mapearCampos(registro);
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return actualizarEnAirtable(recordId, registro);
  }
  if (!response.ok) throw new Error(`Airtable update failed: ${await response.text()}`);
  return response.json();
}

function mapearCampos(registro: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [supabaseKey, airtableKey] of Object.entries(CAMPOS_SUPABASE_TO_AIRTABLE)) {
    let valor = registro[supabaseKey];
    if (valor === null || valor === undefined || valor === "") continue;
    if (supabaseKey === "kilometraje" && typeof valor === "object") valor = valor.value || valor.km || valor;
    if (typeof valor === "string") {
      valor = valor.replace(/^["']+|["']+$/g, "").replace(/\\"/g, '"').trim();
      if (valor === "") continue;
    }
    fields[airtableKey] = valor;
  }
  return fields;
}
