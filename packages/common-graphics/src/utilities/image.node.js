import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { is, assert } from '@kalisio/common-core/predicates'
import { byte } from '@kalisio/common-core/utilities'

async function resolveImage (img) {
  if (Buffer.isBuffer(img)) return img
  if (is.string(img)) {
    if (img.startsWith('data:')) {
      const base64 = img.split(',')[1]
      return Buffer.from(byte.fromBase64Bytes(base64))
    }
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
    const buffer = await resolveImage(img)
    const meta = await sharp(buffer).metadata()
    return { ...meta, size: meta.size ?? buffer.byteLength }
  },

  async resize (img, width, height, quality = 0.8) {
    assert.all([
      { value: width, validator: is.positiveInteger, message: 'width must be a positive integer' },
      { value: height, validator: is.positiveInteger, message: 'height must be a positive integer' },
      { value: quality, validator: (v) => is.inRange(v, 0, 1), message: 'quality must be a number within the range [0,1]' }
    ])
    const buffer = await resolveImage(img)
    const { format } = await sharp(buffer).metadata()
    return sharp(buffer)
      .resize(width, height)
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  },

  async toDataURL (img) {
    const buffer = await resolveImage(img)
    const { format } = await sharp(buffer).metadata()
    const base64 = buffer.toString('base64')
    return `data:image/${format};base64,${base64}`
  },

  async fromSVG (svg, { format = 'png', quality = 1 } = {}) {
    return sharp(Buffer.from(svg))
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  }

}
