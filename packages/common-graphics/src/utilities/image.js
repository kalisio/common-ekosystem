import { is, assert } from '@kalisio/common-core/predicates'
import { bytes } from '@kalisio/common-core/utilities'

const IS_BROWSER = typeof window !== 'undefined'
const fsPromise = IS_BROWSER ? null : import('node:fs/promises')
const sharpPromise = IS_BROWSER ? null : import('sharp')

async function resolveBrowserImage (img) {
  if (img instanceof Blob) return img
  if (is.string(img)) {
    const res = await fetch(img)
    return res.blob()
  }
  throw new Error('Unsupported browser image')
}

async function resolveNodeImage (img) {
  if (Buffer.isBuffer(img)) return img
  if (is.string(img)) {
    if (img.startsWith('data:')) {
      const base64 = img.split(',')[1]
      return Buffer.from(bytes.fromBase64Bytes(base64))
    }
    const { readFile } = await fsPromise
    return readFile(img)
  }
  throw new Error('Unsupported node image')
}

function getSharpFormatOptions (format, quality) {
  const q = Math.round(quality * 100)
  switch (format) {
    case 'jpeg':
    case 'jpg':
    case 'webp':
    case 'avif':
    case 'tiff':
      return { quality: q }
    case 'png':
      return {
        compressionLevel: Math.round((1 - quality) * 9),
        ...(quality < 0.5 && { palette: true })
      }
    default:
      return undefined
  }
}

export const image = {

  async metadata (img) {
    if (IS_BROWSER) {
      const blob = await resolveBrowserImage(img)
      const bitmap = await createImageBitmap(blob)
      const result = {
        width: bitmap.width,
        height: bitmap.height,
        size: blob.size,
        format: blob.type.split('/')[1] ?? null
      }
      bitmap.close()
      return result
    }
    // Node implementation
    const { default: sharp } = await sharpPromise
    const buffer = await resolveNodeImage(img)
    const meta = await sharp(buffer).metadata()
    return { ...meta, size: meta.size ?? buffer.byteLength }
  },

  async resize (img, width, height, quality = 0.8) {
    assert.all([
      { value: width, validator: is.positiveInteger, message: 'width must be a positive integer' },
      { value: height, validator: is.positiveInteger, message: 'height must be a positive integer' },
      { value: quality, validator: (v) => is.inRange(v, 0, 1), message: 'quality must be a number within the range [0,1]' }
    ])
    if (IS_BROWSER) {
      const blob = await resolveBrowserImage(img)
      const bitmap = await createImageBitmap(blob, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high'
      })
      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('2D context not available')
      }
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      return canvas.convertToBlob({
        type: blob.type || 'image/png',
        quality
      })
    }
    // Node implementation
    const { default: sharp } = await sharpPromise
    const buffer = await resolveNodeImage(img)
    const { format } = await sharp(buffer).metadata()
    return sharp(buffer)
      .resize(width, height)
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  },

  async toDataURL (img) {
    if (IS_BROWSER) {
      const blob = await resolveBrowserImage(img)
      const buffer = await blob.arrayBuffer()
      const base64 = bytes.toBase64(buffer)
      return `data:${blob.type};base64,${base64}`
    }
    // Node implementation
    const { default: sharp } = await sharpPromise
    const buffer = await resolveNodeImage(img)
    const { format } = await sharp(buffer).metadata()
    const base64 = buffer.toString('base64')
    return `data:image/${format};base64,${base64}`
  },

  async fromSVG (svg, { format = 'png', quality = 1 } = {}) {
    if (IS_BROWSER) {
      const mimeType = `image/${format}`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const bitmap = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      canvas.getContext('2d').drawImage(bitmap, 0, 0)
      bitmap.close()
      return canvas.convertToBlob({ type: mimeType, quality })
    }
    // Node implementation
    const { default: sharp } = await sharpPromise
    return sharp(Buffer.from(svg))
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  }

}
