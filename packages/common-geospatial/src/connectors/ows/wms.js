import { assert, conform } from '@kalisio/common-core/predicates'
import { dom } from '@kalisio/common-core/utilities'
import { hasProjection, isValidBBox, normalizeCrsName, reprojectBBox } from '../../foundation/index.js'
import { assertSupportedVersion, ERROR_CODES, failure, resolveHref } from '../helpers.js'
import { assertNoException, READ_OPTIONS_SCHEMA, readCapabilities } from './ows-helpers.js'

const { attribute, child, children, number, text } = dom

const SERVICE = 'WMS'
const VERSIONS = ['1.1.1', '1.3.0']

// Numeric attribute: finite numbers only ('', 'NaN', 'Infinity' are rejected).
function toNumber (value) {
  if (value === undefined || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

// WMS 1.3.0 follows the axis order of the EPSG registry: EPSG:4326 boxes are
// written latitude first. CRS:84 and every WMS 1.1.x SRS are longitude first.
// Other geographic EPSG codes would need the same handling; only EPSG:4326 is
// covered, being by far the most common.
function isLatLonAxisOrder (crs, version) {
  return version === '1.3.0' &&
    /^(EPSG:4326|urn:ogc:def:crs:EPSG:[\d.]*:4326|https?:\/\/www\.opengis\.net\/def\/crs\/EPSG\/\d+\/4326)$/i.test(crs.trim())
}

function decodeCapabilities (document, baseUrl) {
  // Also checked here for documents passed through options.capabilities.
  assertNoException(document)
  // WMS 1.3.x roots at <WMS_Capabilities>, WMS 1.1.x at <WMT_MS_Capabilities>.
  const root = child(document, 'WMS_Capabilities') ?? child(document, 'WMT_MS_Capabilities')
  if (!root) {
    throw failure(ERROR_CODES.INVALID_CAPABILITIES, 'not a WMS capabilities document')
  }
  const version = attribute(root, 'version')
  assertSupportedVersion(SERVICE, version, VERSIONS)
  const capability = child(root, 'Capability')
  if (!capability) {
    throw failure(ERROR_CODES.INVALID_CAPABILITIES, 'missing WMS Capability element')
  }
  return {
    version,
    mapUrl: resolveMapUrl(capability, baseUrl),
    layers: decodeLayers(children(capability, 'Layer'), { crs: [], extent: undefined, styles: [], dimensions: [] }, version)
  }
}

// The server may advertise a GetMap endpoint distinct from the capabilities
// URL, possibly relative to it; fall back to the base URL when it does not.
function resolveMapUrl (capability, baseUrl) {
  const getMap = child(child(capability, 'Request'), 'GetMap')
  const online = child(child(child(child(getMap, 'DCPType'), 'HTTP'), 'Get'), 'OnlineResource')
  const href = attribute(online, 'href')
  return href ? resolveHref(href, baseUrl) : baseUrl
}

// Merge inherited entries with the ones a layer declares: an entry with the
// same key (compared case-insensitively) is completed or replaced by the
// layer's own, others are added.
function inherit (inherited, declared, key) {
  const merged = new Map(inherited.map((entry) => [entry[key].toLowerCase(), entry]))
  for (const entry of declared) {
    const id = entry[key].toLowerCase()
    merged.set(id, { ...merged.get(id), ...entry })
  }
  return [...merged.values()]
}

// Walk the (possibly nested) Layer tree depth-first. Named layers are
// requestable and returned flat; unnamed layers are containers. Following the
// WMS inheritance rules, CRS and styles are added to the parent's, extent is
// replaced, and dimensions are replaced by name (a 1.1.x child may only
// provide the <Extent> values of a <Dimension> its parent declares).
function decodeLayers (nodes, inherited, version) {
  const layers = []
  for (const node of nodes) {
    const scope = {
      crs: decodeCrs(node, inherited.crs),
      extent: decodeExtent(node, version) ?? inherited.extent,
      styles: inherit(inherited.styles, decodeStyles(node), 'id'),
      dimensions: inherit(inherited.dimensions, decodeDimensions(node), 'name')
    }
    const name = text(child(node, 'Name'))
    if (name) layers.push(decodeLayer(node, name, scope))
    layers.push(...decodeLayers(children(node, 'Layer'), scope, version))
  }
  return layers
}

function decodeLayer (node, id, { crs, extent, styles, dimensions }) {
  const layer = {
    id,
    title: text(child(node, 'Title')) ?? id,
    crs,
    styles,
    dimensions
  }
  const description = text(child(node, 'Abstract'))
  if (description) layer.description = description
  if (extent) layer.extent = extent
  return layer
}

function decodeCrs (node, inherited) {
  // <CRS> in 1.3.x, <SRS> in 1.1.x, where one element may list several
  // identifiers separated by whitespace.
  const declared = [...children(node, 'CRS'), ...children(node, 'SRS')]
    .flatMap((element) => (text(element) ?? '').split(/\s+/))
    .filter(Boolean)
    .map(normalizeCrsName)
  return [...new Set([...inherited, ...declared])]
}

function decodeExtent (node, version) {
  // Geographic boxes are kept when isValidBBox() accepts them: finite values
  // and south <= north, while west > east remains possible across the
  // antimeridian. No reprojection is needed, so such boxes are fine here.
  // 1.3.x: EX_GeographicBoundingBox — always WGS84, explicit named bounds.
  const geographic = child(node, 'EX_GeographicBoundingBox')
  if (geographic) {
    const extent = [
      number(child(geographic, 'westBoundLongitude')),
      number(child(geographic, 'southBoundLatitude')),
      number(child(geographic, 'eastBoundLongitude')),
      number(child(geographic, 'northBoundLatitude'))
    ]
    if (isValidBBox(extent)) return extent
  }
  // 1.1.x: LatLonBoundingBox — WGS84, lon/lat carried in x/y attributes.
  const latLon = child(node, 'LatLonBoundingBox')
  if (latLon) {
    const extent = [
      toNumber(attribute(latLon, 'minx')),
      toNumber(attribute(latLon, 'miny')),
      toNumber(attribute(latLon, 'maxx')),
      toNumber(attribute(latLon, 'maxy'))
    ]
    if (isValidBBox(extent)) return extent
  }
  // Fallback: a BoundingBox in any known CRS, reprojected to WGS84. The
  // unambiguous geographic boxes above are preferred. minx/miny follow the
  // axis order of the CRS: latitude first for EPSG:4326 in WMS 1.3.0.
  for (const box of children(node, 'BoundingBox')) {
    const crs = attribute(box, 'CRS') ?? attribute(box, 'SRS')
    if (!crs) continue
    const [minA, minB, maxA, maxB] = ['minx', 'miny', 'maxx', 'maxy'].map((name) => toNumber(attribute(box, name)))
    const bbox = isLatLonAxisOrder(crs, version) ? [minB, minA, maxB, maxA] : [minA, minB, maxA, maxB]
    // reprojectBBox() rejects invalid boxes and boxes crossing the antimeridian
    // (minx > maxx): skip them rather than fail the whole discovery.
    if (!isValidBBox(bbox) || bbox[0] > bbox[2]) continue
    const name = normalizeCrsName(crs)
    if (!hasProjection(name)) continue
    return reprojectBBox(bbox, name)
  }
  return undefined
}

function decodeStyles (node) {
  const styles = []
  for (const style of children(node, 'Style')) {
    const id = text(child(style, 'Name'))
    if (!id) continue
    const decoded = { id, title: text(child(style, 'Title')) ?? id }
    const online = child(child(style, 'LegendURL'), 'OnlineResource')
    const legendUrl = attribute(online, 'href')
    if (legendUrl) decoded.legendUrl = legendUrl
    styles.push(decoded)
  }
  return styles
}

function decodeDimensions (node) {
  const dimensions = []
  // 1.1.x declares a dimension via <Dimension> but carries its values in a
  // sibling <Extent> of the same name; 1.3.x puts values inside <Dimension>.
  const extents = new Map()
  for (const extent of children(node, 'Extent')) {
    const name = attribute(extent, 'name')
    if (name) extents.set(name.toLowerCase(), extent)
  }
  for (const dimension of children(node, 'Dimension')) {
    const name = attribute(dimension, 'name')
    if (!name) continue
    const extent = extents.get(name.toLowerCase())
    extents.delete(name.toLowerCase())
    dimensions.push(decodeDimension(name, dimension, extent))
  }
  // A dimension declared only through <Extent> (legacy time layers).
  for (const [name, extent] of extents) {
    dimensions.push(decodeDimension(attribute(extent, 'name') ?? name, undefined, extent))
  }
  return dimensions
}

function decodeDimension (name, dimension, extent) {
  const decoded = { name }
  const units = attribute(dimension, 'units')
  if (units) decoded.units = units
  const value = attribute(dimension, 'default') ?? attribute(extent, 'default')
  if (value) decoded.default = value
  const values = text(dimension) || text(extent)
  if (values) decoded.values = values
  return decoded
}

export const wms = {

  async getCapabilities (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { version, searchParams, request } = options
    if (version) assertSupportedVersion(SERVICE, version, VERSIONS)
    return readCapabilities(input, { service: SERVICE, version, searchParams, request })
  },

  async discover (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { capabilities, ...rest } = options
    const document = capabilities ?? await wms.getCapabilities(input, rest)
    return decodeCapabilities(document, input)
  }

}
