import { EtagMismatch, PMTiles, TileType } from 'pmtiles'
import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { url } from '@kalisio/common-core/utilities'
import { request } from '@kalisio/common-core/operators/request'
import { isValidBBox } from '../foundation/index.js'
import { ERROR_CODES, failure } from './helpers.js'

const TILE_TYPES = {
  [TileType.Unknown]: 'unknown',
  [TileType.Mvt]: 'mvt',
  [TileType.Mlt]: 'mlt',
  [TileType.Png]: 'png',
  [TileType.Jpeg]: 'jpeg',
  [TileType.Webp]: 'webp',
  [TileType.Avif]: 'avif'
}

const FIELD_TYPES = { number: 'number', string: 'string', boolean: 'boolean' }

const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

const isZoom = (value) => Number.isInteger(value) && value >= 0
const VECTOR_TYPES = [TileType.Mvt, TileType.Mlt]
const nonEmptyString = (value) => typeof value === 'string' && value.trim() !== '' ? value : undefined

const isSource = (v) => v !== null && typeof v === 'object' &&
  typeof v.getBytes === 'function' && typeof v.getKey === 'function'

const OPTIONS_SCHEMA = {
  searchParams: optional(is.plainObject),
  request: optional(is.plainObject)
}

// A PMTiles Source reading byte ranges through common-core/request.
// ETags allow the PMTiles library to detect archive changes and retry.
// Weak ETags are ignored; If-Match is deliberately not sent.
function rangeSource (input, { searchParams, request: init = {} }) {
  const target = searchParams && Object.keys(searchParams).length > 0
    ? url.build(input, searchParams)
    : input
  let mustReload = false
  const read = (range, signal, reload) => {
    const headers = new Headers(init.headers)
    headers.set('Range', range)
    return request({
      ...init,
      headers,
      signal,
      ...(reload ? { cache: 'reload' } : {})
    }).fetch(target)
  }
  return {
    getKey: () => target,
    async getBytes (offset, length, signal, etag) {
      const signals = [init.signal, signal].filter(Boolean)
      const combined = signals.length > 1 ? AbortSignal.any(signals) : signals[0]
      let response = await read(`bytes=${offset}-${offset + length - 1}`, combined, mustReload)
      // A small archive may be shorter than the initial requested range.
      if (offset === 0 && response.status === 416) {
        const contentRange = response.headers.get('Content-Range')
        const size = Number(contentRange?.startsWith('bytes */') ? contentRange.slice(8) : NaN)
        if (!is.positiveInteger(size) || size >= length) {
          throw failure('HTTP_ERROR', 'PMTiles 416 response without valid archive size')
        }
        response = await read(`bytes=0-${size - 1}`, combined, true)
      }
      let responseEtag = response.headers.get('ETag')
      if (responseEtag?.startsWith('W/')) responseEtag = null
      if (response.status === 416 || (etag && responseEtag && responseEtag !== etag)) {
        mustReload = true
        throw new EtagMismatch(`PMTiles archive changed: ETag ${responseEtag} instead of ${etag}`)
      }
      if (!response.ok) {
        const error = failure('HTTP_ERROR', `PMTiles range request failed: HTTP ${response.status}`)
        error.status = response.status
        throw error
      }
      // A server ignoring Range may return the entire archive with HTTP 200.
      // Reject oversized responses before reading their bodies.
      if (response.status === 200) {
        const header = response.headers.get('Content-Length')
        const size = header === null ? NaN : Number(header)
        if (!is.positiveInteger(size) || size > length) {
          await response.body?.cancel()
          throw failure('HTTP_ERROR', 'PMTiles server does not support HTTP byte serving')
        }
      }
      return {
        data: await response.arrayBuffer(),
        etag: responseEtag ?? undefined,
        cacheControl: response.headers.get('Cache-Control') ?? undefined,
        expires: response.headers.get('Expires') ?? undefined
      }
    }
  }
}

// Accept either an archive URL or a custom PMTiles Source.
function open (input, options) {
  assert.all([
    {
      value: input,
      validator: (v) => is.nonEmptyString(v) || isSource(v),
      message: 'input must be an archive URL or a pmtiles source'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  return new PMTiles(isSource(input) ? input : rangeSource(input, options))
}

// Bounds are expressed in WGS84.
// Legacy metadata bounds are used when the header bounds are all zero.
function decodeExtent (header, metadata) {
  const fromHeader = [header.minLon, header.minLat, header.maxLon, header.maxLat]
  const bounds = typeof metadata?.bounds === 'string'
    ? metadata.bounds.split(',').map(Number)
    : metadata?.bounds
  if (fromHeader.every((value) => value === 0) && isValidBBox(bounds)) {
    return [...bounds]
  }
  return isValidBBox(fromHeader) ? fromHeader : undefined
}

// Center and zoom are independent of the archive bounds.
// A zero center can fall back to legacy metadata.
function decodeCenter (header, metadata) {
  const legacy = typeof metadata?.center === 'string'
    ? metadata.center.split(',').map(Number)
    : metadata?.center
  const useLegacy = header.centerLon === 0 && header.centerLat === 0 &&
    Array.isArray(legacy) && legacy.length >= 2 &&
    Number.isFinite(legacy[0]) && Number.isFinite(legacy[1])
  const [lon, lat, zoom] = useLegacy
    ? legacy
    : [header.centerLon, header.centerLat, header.centerZoom]
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined
  const center = { center: [lon, lat] }
  if (isZoom(zoom)) center.centerZoom = zoom
  return center
}

function decodeLayers (header, metadata) {
  if (!VECTOR_TYPES.includes(header.tileType)) return []
  if (header.tileType === TileType.Mvt && !Array.isArray(metadata?.vector_layers)) {
    throw invalid('PMTiles MVT archive without vector_layers metadata')
  }
  const layers = Array.isArray(metadata?.vector_layers) ? metadata.vector_layers : []
  const extent = decodeExtent(header, metadata)
  return layers.map((layer) => {
    if (!nonEmptyString(layer?.id)) {
      throw invalid('PMTiles vector layer without id')
    }
    const minZoom = layer.minzoom ?? header.minZoom
    const maxZoom = layer.maxzoom ?? header.maxZoom
    if (!isZoom(minZoom) || !isZoom(maxZoom) || minZoom > maxZoom) {
      throw invalid(`PMTiles vector layer ${layer.id} has invalid zoom levels ${minZoom}-${maxZoom}`)
    }
    const decoded = {
      id: layer.id,
      title: layer.id,
      minZoom,
      maxZoom,
      properties: Object.entries(layer.fields ?? {}).map(([name, type]) => {
        const mapped = FIELD_TYPES[String(type).toLowerCase()]
        return mapped ? { name, type: mapped } : { name }
      })
    }
    if (extent) decoded.extent = extent
    if (nonEmptyString(layer.description)) {
      decoded.description = layer.description
    }
    return decoded
  })
}

export const pmtiles = {

  async getHeader (input, options = {}) {
    return open(input, options).getHeader()
  },

  async getMetadata (input, options = {}) {
    return open(input, options).getMetadata()
  },

  async discover (input, options = {}) {
    const archive = open(input, options)
    const header = await archive.getHeader()
    const metadata = await archive.getMetadata()
    if (!isZoom(header.minZoom) || !isZoom(header.maxZoom) || header.minZoom > header.maxZoom) {
      throw invalid(`PMTiles header has invalid zoom levels ${header.minZoom}-${header.maxZoom}`)
    }
    const result = {
      tileType: TILE_TYPES[header.tileType],
      minZoom: header.minZoom,
      maxZoom: header.maxZoom,
      layers: decodeLayers(header, metadata)
    }
    const extent = decodeExtent(header, metadata)
    if (extent) result.extent = extent
    const center = decodeCenter(header, metadata)
    if (center) Object.assign(result, center)
    for (const [key, name] of [
      ['title', 'name'],
      ['description', 'description'],
      ['attribution', 'attribution']
    ]) {
      const value = nonEmptyString(metadata?.[name])
      if (value) result[key] = value
    }
    return result
  }

}
