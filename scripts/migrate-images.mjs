/**
 * scripts/migrate-images.mjs
 *
 * One-time migration: convert all existing resource_media records to the
 * optimized WebP pipeline.
 *
 * IDEMPOTENT — safe to run multiple times. A record is skipped when:
 *   - storage_path already ends with .webp  AND
 *   - thumbnail_path is not null
 *
 * PROCESS PER RECORD
 *   1. Download original image from Supabase Storage
 *   2. Generate optimized full  WebP  (max 1200 px, quality 90)
 *   3. Generate thumbnail       WebP  (max  400 px, quality 80)
 *   4. Upload both to resource-images bucket
 *   5. Update resource_media row (storage_path, thumbnail_path, width,
 *      height, mime_type, file_size_bytes)
 *   6. Delete original file only after DB update confirms success
 *
 * SAFETY
 *   - Originals are never deleted before a successful upload + DB update.
 *   - Upload/DB errors are caught per-record; migration continues.
 *   - A failed record is logged and counted; originals are preserved.
 *
 * USAGE
 *   node scripts/migrate-images.mjs [--dry-run] [--batch-size=10]
 *
 *   --dry-run      Scan and report without writing anything.
 *   --batch-size   Records to process in one DB page (default: 10).
 *
 * ENVIRONMENT (loaded from .env.local automatically)
 *   NEXT_PUBLIC_SUPABASE_URL      Project URL
 *   SUPABASE_SERVICE_ROLE_KEY     Service-role secret (never exposed to browser)
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Bootstrap — load .env.local manually (no Next.js runtime here)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

function loadEnv(path) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // .env.local is optional when vars are already in the environment
  }
}

loadEnv(envPath)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n❌  Missing environment variables.\n' +
    '    Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n' +
    '    are set in .env.local or in the current environment.\n'
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const batchArg = args.find((a) => a.startsWith('--batch-size='))
const BATCH_SIZE = batchArg ? Math.max(1, parseInt(batchArg.split('=')[1], 10) || 10) : 10

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET = 'resource-images'

const FULL_MAX_WIDTH = 1200
const FULL_QUALITY = 90

const THUMB_MAX_WIDTH = 400
const THUMB_QUALITY = 80

// ---------------------------------------------------------------------------
// Supabase client (service role — admin rights)
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Image processing helpers
// ---------------------------------------------------------------------------

async function processVariant(inputBuffer, maxWidth, quality) {
  const { data, info } = await sharp(inputBuffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    fileSizeBytes: info.size,
  }
}

// ---------------------------------------------------------------------------
// Download original from Supabase Storage
// ---------------------------------------------------------------------------

async function downloadOriginal(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error) throw new Error(`Download failed for "${path}": ${error.message}`)
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

async function uploadWebp(path, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new Error(`Upload failed for "${path}": ${error.message}`)
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtBytes(bytes) {
  if (bytes === null || bytes === undefined) return 'unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fmtDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function migrate() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  NeuwGenX — Image Migration to WebP Pipeline')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (DRY_RUN) console.log('  ⚠️  DRY RUN — no files will be written\n')
  console.log(`  Batch size : ${BATCH_SIZE}`)
  console.log(`  Full image : max ${FULL_MAX_WIDTH}px wide, WebP quality ${FULL_QUALITY}`)
  console.log(`  Thumbnail  : max ${THUMB_MAX_WIDTH}px wide, WebP quality ${THUMB_QUALITY}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const globalStart = Date.now()

  let totalRecords = 0
  let alreadyMigrated = 0
  let migrated = 0
  let failed = 0
  let originalBytesTotal = 0
  let newBytesTotal = 0

  /** @type {{ id: string; resource_id: string; error: string }[]} */
  const failures = []

  let offset = 0
  let page = 1

  // Page through ALL resource_media records
  while (true) {
    process.stdout.write(`  📄 Fetching page ${page} (offset ${offset})…`)

    const { data: rows, error: fetchError } = await supabase
      .from('resource_media')
      .select('id, resource_id, storage_bucket, storage_path, thumbnail_path, file_size_bytes')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (fetchError) {
      console.error(`\n❌  DB fetch error: ${fetchError.message}`)
      process.exit(1)
    }

    if (!rows || rows.length === 0) {
      console.log(' done (no more records)\n')
      break
    }

    console.log(` ${rows.length} record(s)`)
    totalRecords += rows.length

    for (const row of rows) {
      const label = `  [${row.resource_id.slice(0, 8)}…]`

      // ── Skip already-migrated records ──────────────────────────────────
      const alreadyDone =
        typeof row.storage_path === 'string' &&
        row.storage_path.endsWith('.webp') &&
        row.thumbnail_path !== null

      if (alreadyDone) {
        console.log(`${label} ✅ already migrated — skipping`)
        alreadyMigrated++
        continue
      }

      if (!row.storage_path) {
        console.log(`${label} ⚠️  no storage_path — skipping`)
        failed++
        failures.push({ id: row.id, resource_id: row.resource_id, error: 'No storage_path' })
        continue
      }

      const bucket = row.storage_bucket || BUCKET
      const originalPath = row.storage_path
      const originalBytes = row.file_size_bytes ?? 0

      console.log(`${label} 🔄 migrating "${originalPath}"`)

      if (DRY_RUN) {
        console.log(`${label}    would generate → prompts/full/${row.resource_id}.webp`)
        console.log(`${label}                  → prompts/thumbnails/${row.resource_id}.webp`)
        migrated++
        continue
      }

      const recordStart = Date.now()

      try {
        // 1. Download original
        process.stdout.write(`${label}    ↓ downloading original…`)
        const originalBuffer = await downloadOriginal(bucket, originalPath)
        console.log(` ${fmtBytes(originalBuffer.length)}`)

        // 2. Generate optimized variants in parallel
        process.stdout.write(`${label}    ⚙  processing with Sharp…`)
        const [full, thumb] = await Promise.all([
          processVariant(originalBuffer, FULL_MAX_WIDTH, FULL_QUALITY),
          processVariant(originalBuffer, THUMB_MAX_WIDTH, THUMB_QUALITY),
        ])
        console.log(` full=${fmtBytes(full.fileSizeBytes)}, thumb=${fmtBytes(thumb.fileSizeBytes)}`)

        const fullPath = `prompts/full/${row.resource_id}.webp`
        const thumbPath = `prompts/thumbnails/${row.resource_id}.webp`

        // 3. Upload both files
        process.stdout.write(`${label}    ↑ uploading full image…`)
        await uploadWebp(fullPath, full.buffer)
        process.stdout.write(' ✓\n')

        process.stdout.write(`${label}    ↑ uploading thumbnail…`)
        await uploadWebp(thumbPath, thumb.buffer)
        process.stdout.write(' ✓\n')

        // 4. Update DB row — only after both uploads succeed
        process.stdout.write(`${label}    💾 updating resource_media…`)
        const { error: updateError } = await supabase
          .from('resource_media')
          .update({
            storage_path: fullPath,
            storage_bucket: BUCKET,
            thumbnail_path: thumbPath,
            mime_type: 'image/webp',
            file_size_bytes: full.fileSizeBytes,
            width: full.width,
            height: full.height,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`)
        }
        process.stdout.write(' ✓\n')

        // 5. Delete original only if the path changed (i.e. it's a legacy file)
        if (originalPath !== fullPath) {
          process.stdout.write(`${label}    🗑  removing original "${originalPath}"…`)
          const { error: delError } = await supabase.storage.from(bucket).remove([originalPath])
          if (delError) {
            // Not fatal — just log. The DB is already updated correctly.
            console.log(` ⚠️  delete failed (non-fatal): ${delError.message}`)
          } else {
            process.stdout.write(' ✓\n')
          }
        }

        const elapsed = fmtDuration(Date.now() - recordStart)
        console.log(`${label}    ✅ done in ${elapsed}`)

        originalBytesTotal += originalBytes
        newBytesTotal += full.fileSizeBytes
        migrated++
      } catch (err) {
        console.error(`${label}    ❌ FAILED: ${err.message}`)
        failed++
        failures.push({ id: row.id, resource_id: row.resource_id, error: err.message })
        // Continue to next record — never abort the whole run for one failure
      }
    }

    // If we got fewer rows than the batch size we've reached the end
    if (rows.length < BATCH_SIZE) break
    offset += BATCH_SIZE
    page++
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const totalDuration = fmtDuration(Date.now() - globalStart)
  const savedBytes = originalBytesTotal - newBytesTotal
  const savedPct =
    originalBytesTotal > 0 ? ((savedBytes / originalBytesTotal) * 100).toFixed(1) : '0'

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Migration complete')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Total records found   : ${totalRecords}`)
  console.log(`  Already migrated      : ${alreadyMigrated}`)
  console.log(`  Migrated this run     : ${migrated}`)
  console.log(`  Failed                : ${failed}`)
  if (!DRY_RUN && originalBytesTotal > 0) {
    console.log(`  Original size (db)    : ${fmtBytes(originalBytesTotal)}`)
    console.log(`  New full-image size   : ${fmtBytes(newBytesTotal)}`)
    console.log(`  Storage savings       : ${fmtBytes(savedBytes)} (${savedPct}%)`)
  }
  console.log(`  Duration              : ${totalDuration}`)

  if (failures.length > 0) {
    console.log('\n  ⚠️  Failed records:')
    for (const f of failures) {
      console.log(`     • resource_id=${f.resource_id}  media_id=${f.id}`)
      console.log(`       ${f.error}`)
    }
    console.log('\n  Originals for failed records were NOT modified.\n')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(failed > 0 ? 1 : 0)
}

migrate().catch((err) => {
  console.error('\n❌  Unexpected error:', err)
  process.exit(1)
})
