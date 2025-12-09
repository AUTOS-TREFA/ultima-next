// functions/sitemap-generator/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://autostrefa.mx";
const SITEMAP_BUCKET = "public-assets";
const RAPID_PROCESSOR_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/rapid-processor`;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async () => {
  try {
    const res = await fetch(RAPID_PROCESSOR_URL, {
      headers: { Authorization: `Bearer ${ANON_KEY}` },
    });
    const { data: vehicles } = await res.json();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `<url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>\n`;

    for (const v of vehicles) {
      if (v.slug && v.ordenstatus?.toLowerCase() === "comprado") {
        xml += `<url><loc>${SITE_URL}/autos/${v.slug}</loc><priority>0.8</priority></url>\n`;
      }
    }

    xml += `</urlset>`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(SITEMAP_BUCKET)
      .upload("sitemap.xml", new TextEncoder().encode(xml), {
        upsert: true,
        contentType: "application/xml",
      });

    if (error) throw error;
    

    // 🔔 Notify search engines
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    await Promise.all([
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
    ]);

    return new Response(JSON.stringify({ success: true, sitemapUrl }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Error generating sitemap:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});