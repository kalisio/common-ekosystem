import { is, assert, conform, optional } from '@kalisio/common-core/predicates'
import { byte } from '@kalisio/common-core/utilities'

const SUPPORTED_FORMATS = ['png', 'jpeg', 'webp']

const FROM_SVG_OPTIONS_SCHEMA = {
  format: optional(v => SUPPORTED_FORMATS.includes(v)),
  quality: optional(v => is.inRange(v, 0, 1))
}

export const image = {

  async resolve (img) {
    assert.that(img, is.defined, 'img must be defined')
    if (img instanceof Blob) return img
    if (is.string(img)) {
      const res = await fetch(img)
      return res.blob()
    }
    throw new Error('unsupported browser image')
  },

  async metadata (img) {
    const blob = await image.resolve(img)
    const bitmap = await createImageBitmap(blob)
    const result = {
      width: bitmap.width,
      height: bitmap.height,
      size: blob.size,
      format: blob.type.split('/')[1] ?? null
    }
    bitmap.close()
    return result
  },

  async resize (img, width, height, quality = 0.8) {
    assert.all([
      { value: width, validator: is.positiveInteger, message: 'width must be a positive integer' },
      { value: height, validator: is.positiveInteger, message: 'height must be a positive integer' },
      { value: quality, validator: (v) => is.inRange(v, 0, 1), message: 'quality must be a number within the range [0,1]' }
    ])
    const blob = await image.resolve(img)
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high'
    })
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D context not available')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    return canvas.convertToBlob({
      type: blob.type || 'image/png',
      quality
    })
  },

  async toDataURL (img) {
    const blob = await image.resolve(img)
    const buffer = await blob.arrayBuffer()
    const base64 = byte.toBase64(buffer)
    return `data:${blob.type};base64,${base64}`
  },

  async fromSVG (svg, options = {}) {
    assert.all([
      {
        value: svg,
        validator: is.defined,
        message: 'svg must be defined'
      },
      {
        value: options,
        validator: v => conform.schema(v, FROM_SVG_OPTIONS_SCHEMA),
        message: 'invalid options'
      }
    ])
    const { format = 'png', quality = 1 } = options
    const mimeType = `image/${format}`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('invalid SVG'))
        img.src = url
      })
      const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D context not available')
      ctx.drawImage(img, 0, 0)
      return canvas.convertToBlob({ type: mimeType, quality })
    } finally {
      URL.revokeObjectURL(url)
    }
  }

}
