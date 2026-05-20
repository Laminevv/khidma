/**
 * Client-side image compression using the native Canvas API.
 * Resizes images that exceed the target dimensions and compresses
 * to JPEG at the specified quality. This avoids hitting Vercel's
 * 4.5MB serverless function payload limit with smartphone photos.
 *
 * - PDFs are returned as-is (no compression possible).
 * - Images already under maxSizeBytes are returned as-is.
 * - Maintains aspect ratio during resize.
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
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Skip if already small enough
  if (file.size <= maxSizeBytes) {
    return file
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

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
        reject(new Error('Canvas 2D context not available'))
        return
      }

      // Use high-quality downscaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }

          // Build a new File with a .jpg extension
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      // If image can't be decoded, return original file
      resolve(file)
    }

    img.src = url
  })
}
