// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Airtable Script: Upload Vehicle Images to Cloudflare R2
// Version: 2.0.0 - Optimized & Secured (2025-10-26)
// Purpose: Uploads images from Airtable attachments to R2 via Edge Function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━ Configuration ━━━
const SUPABASE_URL = "https://pemgwyymodlwabaexxrb.supabase.co";
// TODO: Update with service_role key from Supabase Dashboard > Settings > API for project pemgwyymodlwabaexxrb
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";
const R2_BUCKET_NAME = "trefa-images";
const R2_ACCOUNT_ID = "a5de5a4fb11ab70d53e850749ece3cf7";
const SUPABASE_BUCKET_NAME = "fotos_airtable";

// Upload retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// File validation
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ━━━ Initialize ━━━
const tabla = base.getTable("Inventario");
const config = input.config();
const recordId = Array.isArray(config.recordId) ? config.recordId[0] : config.recordId;

// ━━━ Helper Functions ━━━
function log(msg) {
  if (typeof output !== "undefined" && typeof output.text === "function") {
    output.text(msg);
  } else {
    console.log(msg);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validateAttachment(att) {
  if (!att || !att.url) {
    return { valid: false, error: 'No URL' };
  }

  // Check file size
  const sizeInMB = (att.size || 0) / (1024 * 1024);
  if (sizeInMB > MAX_FILE_SIZE_MB) {
    return { valid: false, error: `File too large (${sizeInMB.toFixed(2)}MB > ${MAX_FILE_SIZE_MB}MB)` };
  }

  // Check file type
  const fileType = (att.type || '').toLowerCase();
  if (fileType && !ALLOWED_TYPES.includes(fileType)) {
    return { valid: false, error: `Invalid type: ${fileType}` };
  }

  return { valid: true };
}

// ━━━ R2 Upload with Retry Logic ━━━
async function uploadToR2WithRetry(recordId, file, prefix, filename, attempt = 1) {
  const path = `airtable/${recordId}/${prefix}/${filename}`;

  try {
    log(`📤 [Attempt ${attempt}/${MAX_RETRIES}] Uploading ${filename}...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        path: path,
        fileUrl: file.url,
        contentType: file.type || "image/jpeg",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const publicUrl = result.publicUrl || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${path}`;

    log(`✅ Uploaded to R2: ${filename}`);
    return publicUrl;
  } catch (err) {
    log(`❌ R2 upload error (attempt ${attempt}): ${err.message}`);

    // Retry logic
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      log(`⏳ Retrying in ${delay}ms...`);
      await sleep(delay);
      return uploadToR2WithRetry(recordId, file, prefix, filename, attempt + 1);
    }

    log(`⚠️  Max retries reached for ${filename}`);
    return null;
  }
}

// ━━━ Supabase Storage Fallback ━━━
async function uploadToSupabase(recordId, file, prefix, filename) {
  try {
    log(`📥 Downloading ${filename} for Supabase fallback...`);
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const encodedRecordId = encodeURIComponent(recordId);
    const encodedPrefix = encodeURIComponent(prefix);
    const encodedFilename = encodeURIComponent(filename);
    const path = `${encodedRecordId}/${encodedPrefix}/${encodedFilename}`;

    log(`📤 Uploading to Supabase Storage...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${path}`, {
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

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${recordId}/${prefix}/${encodedFilename}`;
    log(`✅ Uploaded to Supabase: ${filename}`);
    return publicUrl;
  } catch (err) {
    log(`❌ Supabase upload error: ${err.message}`);
    return null;
  }
}

// ━━━ Check if Files Already Exist in R2 ━━━
async function listR2Files(recordId, prefix) {
  try {
    const folderPath = `airtable/${recordId}/${prefix}`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-list`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ prefix: folderPath }),
    });

    if (!response.ok) {
      log(`⚠️  R2 list returned ${response.status}, checking Supabase...`);
      return [];
    }

    const files = await response.json();
    return files.map(file => ({
      url: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${file.key}`,
      key: file.key,
      filename: file.key.split('/').pop()
    }));
  } catch (err) {
    log(`⚠️  R2 list error: ${err.message}`);
    return [];
  }
}

// ━━━ Check if Files Exist in Supabase Storage ━━━
async function listSupabaseFiles(recordId, prefix) {
  try {
    const folderPath = `${recordId}/${prefix}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET_NAME}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ prefix: `${folderPath}/`, limit: 100, offset: 0 }),
    });

    if (!response.ok) return [];

    const files = await response.json();
    return files
      .filter((file) => file.name && !file.name.endsWith("/"))
      .map((file) => ({
        url: `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${recordId}/${prefix}/${encodeURIComponent(file.name)}`,
        key: file.name,
        filename: file.name
      }));
  } catch (err) {
    log(`❌ Supabase list error: ${err.message}`);
    return [];
  }
}

// ━━━ Get All Uploaded URLs ━━━
async function getUploadedUrls(recordId, prefix) {
  // Check R2 first
  let files = await listR2Files(recordId, prefix);

  if (files.length > 0) {
    log(`📦 Found ${files.length} existing files in R2 for ${prefix}`);
    return files.map(f => f.url);
  }

  // Fallback to Supabase
  files = await listSupabaseFiles(recordId, prefix);

  if (files.length > 0) {
    log(`📦 Found ${files.length} existing files in Supabase for ${prefix}`);
    return files.map(f => f.url);
  }

  return [];
}

// ━━━ Upload Multiple Attachments ━━━
async function uploadAttachments(recordId, attachments, prefix) {
  const urls = [];
  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const att of attachments || []) {
    try {
      // Validate attachment
      const validation = validateAttachment(att);
      if (!validation.valid) {
        log(`⚠️  Skipping ${att.filename || att.id}: ${validation.error}`);
        skippedCount++;
        continue;
      }

      const filename = att.filename || `${att.id}.jpg`;

      // Try R2 first
      let publicUrl = await uploadToR2WithRetry(recordId, att, prefix, filename);

      // Fallback to Supabase if R2 fails
      if (!publicUrl) {
        log(`🔄 Trying Supabase fallback for ${filename}...`);
        publicUrl = await uploadToSupabase(recordId, att, prefix, filename);
      }

      if (publicUrl) {
        urls.push(publicUrl);
        uploadedCount++;
      } else {
        failedCount++;
        log(`❌ FAILED: Could not upload ${filename} to either R2 or Supabase`);
      }
    } catch (err) {
      failedCount++;
      log(`❌ Unexpected error for ${att.filename || att.id}: ${err.message}`);
    }
  }

  log(`📊 Upload summary: ${uploadedCount} uploaded, ${skippedCount} skipped, ${failedCount} failed`);
  return urls;
}

// ━━━ Process Single Record ━━━
async function handleRecord(recId) {
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`📋 Processing record: ${recId}`);
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const record = await tabla.selectRecordAsync(recId);
  if (!record) {
    log(`❌ ERROR: Record ${recId} not found`);
    return false;
  }

  const fieldMappings = [
    {
      fieldName: "Foto",
      prefix: "feature_image",
      airtableField: "feature_image",
      description: "Feature Image"
    },
    {
      fieldName: "fotos_exterior_archivos",
      prefix: "fotos_exterior",
      airtableField: "fotos_exterior_url",
      description: "Exterior Photos"
    },
    {
      fieldName: "fotos_interior_archivos",
      prefix: "fotos_interior",
      airtableField: "fotos_interior_url",
      description: "Interior Photos"
    },
  ];

  let updateData = {};
  let hasNewUploads = false;
  let totalProcessed = 0;

  for (const mapping of fieldMappings) {
    log(`\n🔍 Checking ${mapping.description} (${mapping.prefix})...`);

    // Check if files already exist
    let urls = await getUploadedUrls(recId, mapping.prefix);

    if (urls.length > 0) {
      log(`✓ Using ${urls.length} existing files`);
    } else {
      // Get attachments from Airtable
      const attachments = record.getCellValue(mapping.fieldName);

      if (!attachments || attachments.length === 0) {
        log(`⚠️  No attachments found in ${mapping.fieldName}`);
        continue;
      }

      log(`📤 Uploading ${attachments.length} new files...`);
      urls = await uploadAttachments(recId, attachments, mapping.prefix);

      if (urls.length > 0) {
        hasNewUploads = true;
        totalProcessed += urls.length;
      }
    }

    // Update Airtable field if we have URLs
    if (urls.length > 0) {
      updateData[mapping.airtableField] = urls.join(", ");
      log(`✅ ${urls.length} URLs ready for ${mapping.description}`);
    }
  }

  // Save URLs back to Airtable
  if (Object.keys(updateData).length > 0) {
    log(`\n💾 Updating Airtable with ${Object.keys(updateData).length} field(s)...`);
    await tabla.updateRecordAsync(recId, updateData);
    log(`✅ Airtable updated successfully`);
  } else {
    log(`\nℹ️  No updates needed`);
  }

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`✨ Process complete! ${hasNewUploads ? `Uploaded ${totalProcessed} new files` : 'No new uploads needed'}`);
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return hasNewUploads;
}

// ━━━ Main Execution ━━━
(async () => {
  const startTime = Date.now();

  log(`\n🚀 Airtable → R2 Image Upload Script v2.0.0`);
  log(`📅 Started: ${new Date().toLocaleString()}`);
  log(`🎯 Target: Cloudflare R2 (Supabase fallback)\n`);

  if (!recordId) {
    log(`❌ ERROR: No recordId provided in automation config`);
    return;
  }

  try {
    await handleRecord(recordId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱️  Total execution time: ${duration}s`);
    log(`✅ Script completed successfully`);
  } catch (err) {
    log(`\n❌ FATAL ERROR: ${err.message}`);
    log(`Stack: ${err.stack}`);
    throw err; // Re-throw to mark automation as failed
  }
})();
