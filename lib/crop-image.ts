/**
 * Utility to crop an image given crop area parameters from react-easy-crop.
 * Returns a Blob of the cropped image as JPEG.
 */
export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function getCroppedImg(
  imageSrc: string,
  cropArea: CropArea
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      // Output a square image at a reasonable resolution
      const outputSize = Math.min(cropArea.width, 512)
      canvas.width = outputSize
      canvas.height = outputSize

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        outputSize,
        outputSize
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          // Free canvas memory
          canvas.width = 0
          canvas.height = 0
          resolve(blob)
        },
        'image/jpeg',
        0.9
      )
    }

    image.onerror = () => {
      reject(new Error('Failed to load image for cropping'))
    }

    image.src = imageSrc
  })
}
