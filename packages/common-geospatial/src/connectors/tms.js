import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { dom, url } from '@kalisio/common-core/utilities'
import { xml } from '@kalisio/common-core/io/xml'
import { hasProjection, isValidBBox, normalizeCrsName, reprojectBBox } from '../foundation/index.js'
import { assertSupportedVersion, ERROR_CODES, failure, zoomTemplate } from './helpers.js'

const { attribute, child, children, text } = dom

const SERVICE = 'TMS'
const VERSIONS = ['1.0.0']

const hasEntries = (value) => is.object(value) && Object.keys(value).length > 0

const DISCOVER_OPTIONS_SCHEMA = {
  service: optional(is.object),
  details: optional(is.object),
  searchParams: optional(is.plainObject),
  request: optional(is.plainObject)
}

const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

// Resolve a possibly relative href against the URL of the document holding
// it. An absolute href is accepted even when the base is not a URL; anything
// that cannot be resolved makes the document invalid.
function resolve (href, base) {
  for (const args of [[href, base], [href]]) {
    try {
      return new URL(...args).href
    } catch {}
  }
  throw invalid(`TMS href ${href} cannot be resolved against ${base}`)
}

// TMS has no layer identifier: the last path segment of the TileMap URL
// ('roads@EPSG:900913@png' with GeoServer) is the closest thing to one.
function layerId (location) {
  const path = location.split(/[?#]/)[0]
  const segment = path.split('/').filter(Boolean).pop() ?? location
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function finite (value) {
  if (value === undefined || value === null || value.trim() === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

const positiveInteger = (value) => {
  const number = finite(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

function decodeTileMap (node, location, searchParams) {
  const version = attribute(node, 'version')
  if (version) assertSupportedVersion(SERVICE, version, VERSIONS)
  const id = layerId(location)
  const srs = text(child(node, 'SRS'))
  const layer = { id, title: text(child(node, 'Title')) || id, crs: srs ? normalizeCrsName(srs) : undefined, scheme: 'tms' }
  if (!layer.crs) delete layer.crs
  const description = text(child(node, 'Abstract'))
  if (description) layer.description = description

  // The bounding box is in the TileMap SRS, x first, reprojected to WGS84.
  // reprojectBBox() does not handle boxes crossing the antimeridian
  // (minx > maxx): rather than a wrong extent, such layers get none.
  const box = child(node, 'BoundingBox')
  const bbox = ['minx', 'miny', 'maxx', 'maxy'].map((name) => finite(attribute(box, name)))
  if (layer.crs && hasProjection(layer.crs) && isValidBBox(bbox) && bbox[0] <= bbox[2]) {
    layer.extent = reprojectBBox(bbox, layer.crs)
  }

  const origin = child(node, 'Origin')
  const originX = finite(attribute(origin, 'x'))
  const originY = finite(attribute(origin, 'y'))
  if (originX !== undefined && originY !== undefined) layer.origin = [originX, originY]

  const format = decodeTileFormat(child(node, 'TileFormat'))
  if (format) layer.format = format

  const tileSetsNode = child(node, 'TileSets')
  const profile = attribute(tileSetsNode, 'profile')
  if (profile) layer.profile = profile
  layer.tileSets = decodeTileSets(tileSetsNode, location)

  // Only the generated template carries searchParams, see discover().
  const template = tileTemplate(layer.tileSets, format?.extension)
  if (template) {
    const tileUrl = `${template.prefix}{z}/{x}/{y}.${format.extension}`
    layer.tileUrl = hasEntries(searchParams) ? url.build(tileUrl, searchParams, { preservePlaceholders: true }) : tileUrl
    layer.minZoom = template.minZoom
    layer.maxZoom = template.maxZoom
  }
  return layer
}

function decodeTileFormat (node) {
  const format = {}
  const mimeType = attribute(node, 'mime-type')
  if (mimeType) format.mimeType = mimeType
  const extension = attribute(node, 'extension')
  if (extension) format.extension = extension
  const width = positiveInteger(attribute(node, 'width'))
  if (width) format.width = width
  const height = positiveInteger(attribute(node, 'height'))
  if (height) format.height = height
  return Object.keys(format).length > 0 ? format : undefined
}

// TileSets with resolved hrefs, sorted by order; values that do not parse
// (missing href, negative or fractional order, non positive resolution) are
// left out of each entry. Hrefs are the base URLs advertised by the service,
// without searchParams: a caller building tile URLs from them, when no
// tileUrl could be generated, must add its own query parameters.
function decodeTileSets (node, location) {
  return children(node, 'TileSet').map((tileSet) => {
    const decoded = {}
    const href = attribute(tileSet, 'href')
    if (href) decoded.href = resolve(href, location)
    const order = finite(attribute(tileSet, 'order'))
    if (Number.isInteger(order) && order >= 0) decoded.order = order
    const unitsPerPixel = finite(attribute(tileSet, 'units-per-pixel'))
    if (unitsPerPixel > 0) decoded.unitsPerPixel = unitsPerPixel
    return decoded
  }).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

// A TMS tile is at '<TileSet href>/<x>/<y>.<extension>', and the zoom level of
// a TileSet is its order. zoomTemplate() only tells whether the hrefs share a
// prefix followed by consecutive integers; a {z} template is reliable only if
// each of those integers is the order of its TileSet ('…/roads/0' for order 0,
// not '…/roads/5'), the extension is known, and the prefix holds no query or
// fragment. Returns { prefix, minZoom, maxZoom }, or undefined.
function tileTemplate (tileSets, extension) {
  if (!extension || tileSets.length === 0) return undefined
  if (tileSets.some(({ href, order }) => href === undefined || order === undefined)) return undefined
  const zoom = zoomTemplate(tileSets.map(({ href }) => href))
  if (!zoom) return undefined
  const prefix = zoom.template.slice(0, -'{z}'.length)
  if (/[?#]/.test(prefix)) return undefined
  if (!tileSets.every(({ href, order }) => href === `${prefix}${order}`)) return undefined
  return { prefix, minZoom: zoom.minZoom, maxZoom: zoom.maxZoom }
}

export const tms = {

  async discover (input, options = {}) {
    assert.all([
      { value: input, validator: is.nonEmptyString, message: 'input must be a non empty string' },
      { value: options, validator: (v) => conform.schema(v, DISCOVER_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
    ])
    const { service, details = {}, searchParams, request } = options
    const read = (source) => xml.read(hasEntries(searchParams) ? url.build(source, searchParams) : source, { request, output: 'dom' })
    const root = child(service ?? await read(input), 'TileMapService')
    if (!root) throw invalid('not a TMS TileMapService document')
    // The version attribute is optional in practice; it is checked when present.
    const version = attribute(root, 'version')
    if (version) assertSupportedVersion(SERVICE, version, VERSIONS)
    const hrefs = children(child(root, 'TileMaps'), 'TileMap').map((entry) => {
      const href = attribute(entry, 'href')
      if (!href) throw invalid('TMS TileMapService lists a TileMap without href')
      return href
    })
    const layers = await Promise.all(hrefs.map(async (href) => {
      const location = resolve(href, input)
      const tileMap = child(details[location] ?? details[href] ?? await read(location), 'TileMap')
      if (!tileMap) throw invalid(`not a TMS TileMap document: ${location}`)
      return decodeTileMap(tileMap, location, searchParams)
    }))
    const result = { layers }
    if (version) result.version = version
    const title = text(child(root, 'Title'))
    if (title) result.title = title
    return result
  }

}
