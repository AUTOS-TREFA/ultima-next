// Airtable Script: Upload images to Cloudflare R2
// This script uploads images from Airtable attachments to R2 storage
// Updated: 2025-10-23 - Migrated from Supabase to R2 for zero egress costs

let tabla = base.getTable("Inventario");
const config = input.config();
const recordId = Array.isArray(config.recordId) ? config.recordId[0] : config.recordId;

function writeOutput(msg) {
  if (typeof output !== "undefined" && typeof output.text === "function") {
    output.text(msg);
  } else {
    console.log(msg);
  }
}

// ━━━ Cloudflare R2 Configuration ━━━
const R2_ACCOUNT_ID = "a5de5a4fb11ab70d53e850749ece3cf7";
const R2_ACCESS_KEY_ID = "2ed1b8cb268295b971d8dcd1daf5500c";
const R2_SECRET_ACCESS_KEY = "d269b7eecc3208c0220d2085862078c348b14ee03bb52291599250492a861d37";
const R2_BUCKET_NAME = "trefa-images";
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_URL = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

// ━━━ AWS Signature V4 Helper Functions ━━━
function hmacSha256(key, data) {
  // Simple HMAC-SHA256 implementation for Airtable
  // Note: Airtable doesn't have built-in crypto, so we'll use a workaround
  // This is a simplified version - in production, you'd use a proper crypto library

  // For Airtable scripts, we'll use a fetch-based approach instead
  // We'll construct the request manually with pre-signed URLs
  throw new Error("Direct S3 signing not available in Airtable - use presigned URLs");
}

// ━━━ Simplified R2 Upload using POST policy ━━━
// Since Airtable doesn't have crypto libraries, we'll use a different approach:
// 1. Use public write permissions on R2 (NOT recommended for production)
// 2. OR: Call a Cloud Function that generates presigned URLs
// 3. OR: Use the Supabase approach but store in R2 via edge function

// For this script, we'll use approach #3: Upload to Supabase edge function that proxies to R2
// This keeps your R2 credentials secure

// ━━━ Supabase Edge Function Configuration ━━━
// Deploy this edge function to handle R2 uploads securely
const SUPABASE_URL = "https://pemgwyymodlwabaexxrb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU";

// ━━━ Upload to R2 via Supabase Edge Function ━━━
async function uploadToR2(recordId, file, prefix, filename) {
  const path = `airtable/${recordId}/${prefix}/${filename}`;

  try {
    writeOutput(`📤 Uploading ${filename} to R2...`);

    // Call Supabase edge function that uploads to R2
    const uploadRes = await fetch(`${SUPABASE_URL}/functions/v1/r2-upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        path: path,
        fileUrl: file.url, // Airtable attachment URL
        contentType: file.type || "image/jpeg",
      }),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`R2 upload failed (${uploadRes.status}): ${errorText}`);
    }

    const result = await uploadRes.json();
    const publicUrl = result.publicUrl || `${R2_PUBLIC_URL}/${path}`;

    writeOutput(`✅ Uploaded to R2: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    writeOutput(`❌ R2 upload error: ${err.message}`);
    writeOutput(`⚠️  Falling back to Supabase Storage...`);
    return null;
  }
}

// ━━━ Fallback: Upload to Supabase Storage ━━━
const BUCKET_NAME = "fotos_airtable";

async function uploadToSupabase(recordId, file, prefix, filename) {
  try {
    writeOutput(`📥 Downloading ${filename}...`);
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`Failed to download (${res.status})`);

    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const encodedRecordId = encodeURIComponent(recordId);
    const encodedPrefix = encodeURIComponent(prefix);
    const encodedFilename = encodeURIComponent(filename);
    const path = `${encodedRecordId}/${encodedPrefix}/${encodedFilename}`;

    writeOutput(`📤 Uploading to Supabase Storage: ${path}...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": file.type || "image/jpeg",
        "x-upsert": "true",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: arrayBuffer,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Upload failed (${uploadRes.status}): ${errorText}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${recordId}/${prefix}/${encodedFilename}`;
    writeOutput(`✅ Uploaded to Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    writeOutput(`❌ Supabase upload error: ${err.message}`);
    return null;
  }
}

// ━━━ List files in R2 bucket ━━━
async function listR2Files(recordId, prefix) {
  try {
    const folderPath = `airtable/${recordId}/${prefix}`;

    // Call edge function to list files
    const listRes = await fetch(`${SUPABASE_URL}/functions/v1/r2-list`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ prefix: folderPath }),
    });

    if (!listRes.ok) {
      writeOutput(`⚠️  Could not list R2 files, checking Supabase instead...`);
      return [];
    }

    const files = await listRes.json();
    return files.map(file => `${R2_PUBLIC_URL}/${file.key}`);
  } catch (err) {
    writeOutput(`⚠️  R2 list error: ${err.message}`);
    return [];
  }
}

// ━━━ List files in Supabase Storage (fallback) ━━━
async function listSupabaseFiles(recordId, prefix) {
  try {
    const folderPath = `${recordId}/${prefix}`;
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ prefix: `${folderPath}/`, limit: 100, offset: 0 }),
    });

    if (!listRes.ok) return [];

    const files = await listRes.json();
    return files
      .filter((file) => file.name && !file.name.endsWith("/"))
      .map((file) => {
        const encodedFilename = encodeURIComponent(file.name);
        return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${recordId}/${prefix}/${encodedFilename}`;
      });
  } catch (err) {
    writeOutput(`❌ Error listing Supabase files: ${err.message}`);
    return [];
  }
}

// ━━━ Get uploaded URLs (check R2 first, then Supabase) ━━━
async function getUploadedUrls(recordId, prefix) {
  // Try R2 first
  let urls = await listR2Files(recordId, prefix);

  if (urls.length > 0) {
    writeOutput(`📦 Found ${urls.length} files in R2`);
    return urls;
  }

  // Fallback to Supabase
  urls = await listSupabaseFiles(recordId, prefix);

  if (urls.length > 0) {
    writeOutput(`📦 Found ${urls.length} files in Supabase Storage`);
  }

  return urls;
}

// ━━━ Upload attachments (try R2 first, fallback to Supabase) ━━━
async function uploadAttachments(recordId, attachments, prefix) {
  const urls = [];

  for (const att of attachments || []) {
    try {
      if (!att.url) {
        writeOutput(`⚠️ Attachment ${att.id} has no URL, skipping.`);
        continue;
      }

      const filename = att.filename || `${att.id}.jpg`;

      // Try R2 first
      let publicUrl = await uploadToR2(recordId, att, prefix, filename);

      // Fallback to Supabase if R2 fails
      if (!publicUrl) {
        publicUrl = await uploadToSupabase(recordId, att, prefix, filename);
      }

      if (publicUrl) {
        urls.push(publicUrl);
      }
    } catch (err) {
      writeOutput(`❌ Upload error for ${att.id}: ${err.message}`);
    }
  }

  return urls;
}

// ━━━ Process record ━━━
async function handleRecord(recId) {
  writeOutput(`📋 Fetching record ${recId}...`);
  const record = await tabla.selectRecordAsync(recId);
  if (!record) {
    writeOutput(`❌ Record ${recId} not found.`);
    return false;
  }

  const fieldMappings = [
    { fieldName: "Foto", prefix: "feature_image", airtableField: "feature_image" },
    { fieldName: "fotos_exterior_archivos", prefix: "fotos_exterior", airtableField: "fotos_exterior_url" },
    { fieldName: "fotos_interior_archivos", prefix: "fotos_interior", airtableField: "fotos_interior_url" },
  ];

  let updateData = {};
  let hasNewUploads = false;

  for (const mapping of fieldMappings) {
    writeOutput(`🔍 Checking ${mapping.prefix}...`);
    let urls = await getUploadedUrls(recId, mapping.prefix);

    if (urls.length === 0) {
      const attachments = record.getCellValue(mapping.fieldName);
      if (!attachments || attachments.length === 0) {
        writeOutput(`⚠️ No attachments in ${mapping.fieldName}`);
        continue;
      }

      writeOutput(`📤 Uploading ${attachments.length} files from ${mapping.fieldName}...`);
      urls = await uploadAttachments(recId, attachments, mapping.prefix);
      if (urls.length > 0) {
        hasNewUploads = true;
      }
    }

    if (urls.length > 0) {
      updateData[mapping.airtableField] = urls.join(", ");
    }
  }

  if (Object.keys(updateData).length > 0) {
    await tabla.updateRecordAsync(recId, updateData);
    writeOutput(`💾 URLs updated in Airtable`);
  }

  return hasNewUploads;
}

// ━━━ Main execution ━━━
(async () => {
  writeOutput(`🚀 Starting upload process for ${recordId}...`);
  writeOutput(`📍 Target: Cloudflare R2 (with Supabase fallback)`);

  if (!recordId) return writeOutput("❌ No recordId provided.");

  const done = await handleRecord(recordId);
  writeOutput(done ? `✅ Completed successfully` : `ℹ️ No new uploads`);
})();
