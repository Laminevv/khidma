/**
 * Client-side image compression using the native Canvas API.
 * Resizes images that exceed the target dimensions and compresses
 * to JPEG at the specified quality. This avoids hitting Vercel's
 * 4.5MB serverless function payload limit with smartphone photos.
 *
 * - PDFs are returned as-is (no compression possible).
 * - Images already under maxSizeBytes are returned as-is.
 * - Maintains aspect ratio during resize.
 * - HEIC/HEIF files (iPhone) are converted to JPEG via heic2any.
 * - Graceful mobile fallback with Arabic error for RAM/format failures.
 */

const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1920
const DEFAULT_QUALITY = 0.82
const DEFAULT_MAX_SIZE_BYTES = 3.5 * 1024 * 1024 // 3.5MB — safe under Vercel's 4.5MB limit

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeBytes?: number
}

/**
 * Custom error class for compression failures that should be
 * shown to the user as-is (e.g. device-specific issues).
 */
export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageCompressionError'
  }
}

// HEIC/HEIF MIME types and file extensions
const HEIC_MIMES = ['image/heic', 'image/heif']
const HEIC_EXTENSIONS = ['.heic', '.heif']

function isHeicFile(file: File): boolean {
  if (HEIC_MIMES.includes(file.type.toLowerCase())) return true
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  // Some browsers report HEIC as '' or 'application/octet-stream'
  return ext ? HEIC_EXTENSIONS.includes(ext) : false
}

/**
 * Convert a HEIC/HEIF file to JPEG using heic2any (dynamically imported).
 * Returns a new File with .jpg extension and image/jpeg MIME type.
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Dynamic import so heic2any is only downloaded when actually needed
    const heic2any = (await import('heic2any')).default

    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })

    // heic2any can return a single Blob or an array
    const resultBlob = Array.isArray(blob) ? blob[0] : blob

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([resultBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch (err) {
    console.error('[compress-image] HEIC conversion failed:', err)
    throw new ImageCompressionError(
      'صيغة الصورة (HEIC) غير مدعومة على هذا الجهاز. حوّل الصورة إلى JPG أو استخدم الحاسوب.'
    )
  }
}

/**
 * Draw an image to Canvas and export as JPEG.
 * Wrapped in a strict try/catch to handle mobile RAM crashes.
 */
function canvasCompress(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  originalName: string
): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    try {
      let { width, height } = img

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new ImageCompressionError(
          'حدث خطأ أثناء معالجة الصورة في هاتفك، جرب صورة أخرى أو استخدم الحاسوب.'
        ))
        return
      }

      // Use high-quality downscaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          // Free canvas memory immediately
          canvas.width = 0
          canvas.height = 0

          if (!blob) {
            reject(new ImageCompressionError(
              'حدث خطأ أثناء معالجة الصورة في هاتفك، جرب صورة أخرى أو استخدم الحاسوب.'
            ))
            return
          }

          const baseName = originalName.replace(/\.[^.]+$/, '')
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    } catch (err) {
      console.error('[compress-image] Canvas compression crashed:', err)
      reject(new ImageCompressionError(
        'حدث خطأ أثناء معالجة الصورة في هاتفك، جرب صورة أخرى أو استخدم الحاسوب.'
      ))
    }
  })
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  } = options

  // Skip compression for non-image files (PDFs)
  if (!file.type.startsWith('image/') && !isHeicFile(file)) {
    return file
  }

  try {
    // ── Step 1: Convert HEIC/HEIF to JPEG first ──────────────
    let workingFile = file
    if (isHeicFile(file)) {
      workingFile = await convertHeicToJpeg(file)
      // After HEIC conversion, check if it's already small enough
      if (workingFile.size <= maxSizeBytes) {
        return workingFile
      }
    }

    // Skip if already small enough
    if (workingFile.size <= maxSizeBytes) {
      return workingFile
    }

    // ── Step 2: Canvas resize + JPEG compression ─────────────
    return await new Promise<File>((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(workingFile)

      img.onload = async () => {
        URL.revokeObjectURL(url)
        try {
          const result = await canvasCompress(img, maxWidth, maxHeight, quality, workingFile.name)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new ImageCompressionError(
          'حدث خطأ أثناء معالجة الصورة في هاتفك، جرب صورة أخرى أو استخدم الحاسوب.'
        ))
      }

      img.src = url
    })
  } catch (err) {
    // Re-throw our own errors (they already have Arabic messages)
    if (err instanceof ImageCompressionError) {
      throw err
    }
    // Catch any other unexpected crash (OOM, etc.)
    console.error('[compress-image] Unexpected error:', err)
    throw new ImageCompressionError(
      'حدث خطأ أثناء معالجة الصورة في هاتفك، جرب صورة أخرى أو استخدم الحاسوب.'
    )
  }
}
