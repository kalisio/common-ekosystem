import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { is, assert, conform, optional } from '@kalisio/common-core/predicates'
import { byte } from '@kalisio/common-core/utilities'

const SUPPORTED_FORMATS = ['png', 'jpeg', 'jpg', 'webp', 'avif', 'tiff']

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

const FROM_SVG_OPTIONS_SCHEMA = {
  format: optional(v => SUPPORTED_FORMATS.includes(v)),
  quality: optional(v => is.inRange(v, 0, 1))
}

export const image = {

  SUPPORTED_FORMATS,

  async resolve (img) {
    assert.that(img, is.defined, 'img must be defined')
    if (Buffer.isBuffer(img)) return img
    if (is.string(img)) {
      if (img.startsWith('data:')) {
        const comma = img.indexOf(',')
        if (comma === -1) throw new Error('invalid data URL')
        const header = img.slice(5, comma)
        const data = img.slice(comma + 1)
        if (!header.includes('base64')) {
          throw new Error('only base64 data URLs are supported')
        }
        return Buffer.from(byte.fromBase64Bytes(data))
      }
      return readFile(img)
    }
    throw new Error('unsupported node image')
  },

  async metadata (img) {
    const buffer = await image.resolve(img)
    const meta = await sharp(buffer).metadata()
    return { ...meta, size: meta.size ?? buffer.byteLength }
  },

  async resize (img, width, height, quality = 0.8) {
    assert.all([
      { value: width, validator: is.positiveInteger, message: 'width must be a positive integer' },
      { value: height, validator: is.positiveInteger, message: 'height must be a positive integer' },
      { value: quality, validator: (v) => is.inRange(v, 0, 1), message: 'quality must be a number within the range [0,1]' }
    ])
    const buffer = await image.resolve(img)
    const { format } = await sharp(buffer).metadata()
    return sharp(buffer)
      .resize(width, height)
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  },

  async toDataURL (img) {
    const buffer = await image.resolve(img)
    const { format } = await sharp(buffer).metadata()
    const base64 = buffer.toString('base64')
    return `data:image/${format};base64,${base64}`
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
    return sharp(Buffer.from(svg))
      .toFormat(format, getSharpFormatOptions(format, quality))
      .toBuffer()
  }

}
