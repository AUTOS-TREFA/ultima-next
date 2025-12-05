// supabase/functions/rapid-vehicles-sync/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.27.0";
// Env / defaults
const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RAPID_PROCESSOR_URL = Deno.env.get("RAPID_PROCESSOR_URL");
const RAPID_PROCESSOR_KEY = Deno.env.get("RAPID_PROCESSOR_KEY");
const SERVICE_ACCESS_TOKEN = Deno.env.get("SERVICE_ACCESS_TOKEN") || "local-dev-token";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pemgwyymodlwabaexxrb.supabase.co";
// Public bucket to use when entries are filenames only. Adjust if needed.
const PUBLIC_BUCKET = Deno.env.get("PUBLIC_BUCKET") || "fotos_airtable";
if (!SUPABASE_DB_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_DB_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
}
const supabaseAdmin = createClient(SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
/**
 * Normalize a single entry into a public URL or null.
 * Rules:
 * - If value starts with http(s) return as-is.
 * - If value already contains the SUPABASE storage public prefix, return that (avoid double-prefix).
 * - If value is like 'bucket/path/file.jpg' and first segment equals PUBLIC_BUCKET, build URL once.
 * - If value is a plain filename, prepend PUBLIC_BUCKET.
 */ function toPublicUrl(entry) {
  if (!entry && entry !== 0) return null;
  const s = String(entry).trim();
  if (s === "") return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // If it already contains the full storage path
  const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/`;
  if (s.startsWith(storagePrefix)) return s;
  // If entry already begins with bucket + "/" (e.g., "fotos_airtable/attiev...")
  if (s.startsWith(`${PUBLIC_BUCKET}/`)) {
    return `${SUPABASE_URL}/storage/v1/object/public/${s}`;
  }
  // If entry contains "/" and first part looks like a bucket
  if (s.includes("/")) {
    const parts = s.split("/");
    // if first part equals PUBLIC_BUCKET, treat as bucket path
    if (parts[0] === PUBLIC_BUCKET) {
      return `${SUPABASE_URL}/storage/v1/object/public/${s}`;
    }
    // If it looks like "some/folder/file.jpg" but not starting with bucket, still build using bucket+entry
    return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${s}`;
  }
  // Plain filename -> assume bucket/filename
  return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${s}`;
}
/**
 * Normalize arrays or single entries into array of public URLs.
 * Accepts:
 * - array of strings
 * - json objects with url/fileName property
 * - single string
 */ function normalizeToArrayEntries(field) {
  if (!field && field !== 0) return [];
  // If already an array
  if (Array.isArray(field)) {
    return field.map((item)=>{
      // If item is object with url/fileName/path/name fields, prefer those
      if (item && typeof item === "object") {
        const candidate = item.url ?? item.url_full ?? item.publicUrl ?? item.filename ?? item.file_name ?? item.path ?? item.name;
        return toPublicUrl(candidate ?? JSON.stringify(item));
      }
      return toPublicUrl(item);
    }).filter(Boolean);
  }
  // If it's an object that contains images as keys
  if (field && typeof field === "object") {
    // try to extract known properties
    const values = [];
    if (field.url) values.push(field.url);
    if (field.filename) values.push(field.filename);
    if (field.path) values.push(field.path);
    // fallback: stringify
    if (values.length === 0) values.push(JSON.stringify(field));
    return values.map(toPublicUrl).filter(Boolean);
  }
  // Otherwise treat as single string
  return [
    toPublicUrl(field)
  ].filter(Boolean);
}
console.info("rapid-vehicles-sync started");
Deno.serve(async (req)=>{
  try {
    // Basic access control for the endpoint
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401
      });
    }
    const token = authHeader.split(" ")[1];
    if (token !== SERVICE_ACCESS_TOKEN) {
      return new Response(JSON.stringify({
        error: "Forbidden"
      }), {
        status: 403
      });
    }
    // Fetch from rapid-processor
    const rapidRes = await fetch(RAPID_PROCESSOR_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${RAPID_PROCESSOR_KEY}`
      }
    });
    if (!rapidRes.ok) {
      const text = await rapidRes.text();
      console.error("Rapid processor error:", text);
      return new Response(JSON.stringify({
        error: "Failed to fetch from rapid-processor",
        details: text
      }), {
        status: 502
      });
    }
    const vehicles = await rapidRes.json();
    if (!Array.isArray(vehicles)) {
      console.error("Unexpected payload from rapid-processor", vehicles);
      return new Response(JSON.stringify({
        error: "Unexpected payload from rapid-processor"
      }), {
        status: 502
      });
    }
    // Build upsert payloads
    const upserts = vehicles.map((v)=>{
      const orden = v.ordencompra ? String(v.ordencompra) : v.id ? String(v.id) : v.record_id ? String(v.record_id) : null;
      // Prefer fotos_exterior arrays in payload; fallback to other fields.
      const fotosExterior = normalizeToArrayEntries(v.fotos_exterior ?? v.galeria_exterior ?? v.fotos ?? v.fotos_airtable ?? []);
      const fotosInterior = normalizeToArrayEntries(v.fotos_interior ?? v.galeria_interior ?? []);
      const galeriaExterior = normalizeToArrayEntries(v.galeria_exterior ?? v.fotos_exterior ?? []);
      const galeriaInterior = normalizeToArrayEntries(v.galeria_interior ?? v.fotos_interior ?? []);
      // thumbnails: prefer array then single thumbnail
      const thumbnails = normalizeToArrayEntries(v.thumbnails ?? v.thumbnail ?? v.feature_image ?? []);
      const featureImageUrl = (()=>{
        const candidates = [];
        if (v.feature_image) candidates.push(v.feature_image);
        if (v.feature_image_url) candidates.push(v.feature_image_url);
        if (v.foto_url) candidates.push(v.foto_url);
        if (fotosExterior.length) candidates.push(fotosExterior[0]);
        if (thumbnails.length) candidates.push(thumbnails[0]);
        return toPublicUrl(candidates.find(Boolean) ?? null);
      })();
      // Determine primary foto_url (first exterior, then feature, then thumbnail)
      const primaryFotoCandidates = [
        fotosExterior[0] ?? null,
        featureImageUrl,
        thumbnails[0] ?? null,
        v.foto_url ?? null
      ];
      const foto_url = toPublicUrl(primaryFotoCandidates.find(Boolean) ?? null);
      return {
        ordencompra: orden,
        title: v.title ?? null,
        precio: v.precio ?? null,
        marca: v.marca ?? null,
        modelo: v.modelo ?? null,
        autoano: v.ano ?? null,
        autokilometraje: v.kilometraje ? String(v.kilometraje) : null,
        enganche_minimo: v.enganche_minimo ?? v.eganche_minimo ?? null,
        enganche_recomendado: v.enganche_recomendado ?? null,
        ubicacion: v.ubicacion ?? null,
        motor: v.motor ?? null,
        transmision: v.transmision ?? null,
        mensualidad_minima: v.mensualidad_minima ?? null,
        mensualidad_recomendada: v.mensualidad_recomendada ?? null,
        plazomax: v.plazomax ?? null,
        thumbnail: thumbnails.length ? thumbnails[0] : null,
        thumbnails: thumbnails.length ? thumbnails : null,
        feature_image: featureImageUrl,
        foto_url: foto_url,
        fotos_exterior: fotosExterior.length ? fotosExterior : null,
        fotos_interior: fotosInterior.length ? fotosInterior : null,
        galeria_exterior: galeriaExterior.length ? galeriaExterior : null,
        galeria_interior: galeriaInterior.length ? galeriaInterior : null,
        last_synced_at: new Date().toISOString(),
        // keep raw payload for reference
        rfdm: v
      };
    }).filter((x)=>x.ordencompra !== null);
    // Upsert in batches using Supabase service role
    if (upserts.length > 0) {
      const chunkSize = 100;
      for(let i = 0; i < upserts.length; i += chunkSize){
        const chunk = upserts.slice(i, i + chunkSize);
        const { error } = await supabaseAdmin.from("inventario_cache").upsert(chunk, {
          onConflict: "ordencompra"
        });
        if (error) console.error("Upsert error chunk:", error);
      }
    }
    return new Response(JSON.stringify({
      ok: true,
      count: vehicles.length,
      upserted: upserts.length
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: String(err)
    }), {
      status: 500
    });
  }
});
