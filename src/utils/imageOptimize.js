/**
 * Client-side image optimisation utilities.
 *
 * Converts uploads to WebP (where supported), scales down oversized images,
 * and rejects anything too large even after compression.  Use these helpers
 * wherever user images are accepted (cover photos, character avatars, etc.).
 */

// Prefer WebP; fall back to JPEG on browsers/environments that don't support it.
const supportsWebP = (() => {
  try {
    const c = document.createElement('canvas')
    c.width = 1; c.height = 1
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
})()

// Default limits — can be overridden per call.
const DEFAULTS = {
  maxDimension:   1400,                    // px — longest edge
  quality:        0.82,
  fallbackQuality: 0.65,
  maxInputBytes:  15 * 1024 * 1024,        // 15 MB  — reject before processing
  maxOutputBytes:  3 * 1024 * 1024,        //  3 MB  — reject after compression
}

/**
 * Optimises a File/Blob for storage.
 *
 * - Resizes if either dimension exceeds `maxDimension`
 * - Converts to WebP (or JPEG as fallback)
 * - Retries at `fallbackQuality` if output exceeds `maxOutputBytes`
 *
 * @param {File|Blob} file
 * @param {object} [options]
 * @returns {Promise<Blob>}
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxDimension   = DEFAULTS.maxDimension,
    quality        = DEFAULTS.quality,
    fallbackQuality = DEFAULTS.fallbackQuality,
    maxInputBytes  = DEFAULTS.maxInputBytes,
    maxOutputBytes = DEFAULTS.maxOutputBytes,
  } = options

  if (file.size > maxInputBytes) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
      `Maximum accepted size is ${maxInputBytes / 1024 / 1024} MB.`
    )
  }

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let targetW = width
  let targetH = height

  if (width > maxDimension || height > maxDimension) {
    const scale = Math.min(maxDimension / width, maxDimension / height)
    targetW = Math.round(width * scale)
    targetH = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width  = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const format = supportsWebP ? 'image/webp' : 'image/jpeg'
  const toBlob = (q) => new Promise((res) => canvas.toBlob(res, format, q))

  const blob = await toBlob(quality)

  if (blob && blob.size <= maxOutputBytes) return blob

  // Retry at lower quality
  const blob2 = await toBlob(fallbackQuality)
  if (blob2 && blob2.size <= maxOutputBytes) return blob2

  throw new Error(
    `Image could not be compressed to an acceptable size. ` +
    `Please use an image smaller than ${maxOutputBytes / 1024 / 1024} MB.`
  )
}

/**
 * Convenience wrapper — returns a data URL string rather than a Blob.
 * Drop-in replacement for the existing base64 cover image flow.
 *
 * @param {File|Blob} file
 * @param {object} [options]
 * @returns {Promise<string>} data URL
 */
export async function optimizeImageToDataUrl(file, options = {}) {
  const blob = await optimizeImage(file, options)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(/** @type {string} */ (reader.result))
    reader.onerror = () => reject(new Error('Could not read optimised image.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Quick check — returns true if the browser can handle createImageBitmap.
 * (All modern browsers can; IE 11 cannot.)
 */
export function canOptimize() {
  return typeof createImageBitmap === 'function'
}
