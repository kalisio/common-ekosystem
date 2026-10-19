import { assert, conform } from '@kalisio/common-core/predicates'
import { dom } from '@kalisio/common-core/utilities'
import { normalizeCrsName } from '../../foundation/index.js'
import { assertSupportedVersion, ERROR_CODES, failure, resolveHref, zoomTemplate } from '../helpers.js'
import {
  assertNoException,
  READ_OPTIONS_SCHEMA,
  readCapabilities,
  readOwsBBox
} from './ows-helpers.js'

const { attribute, child, children, text } = dom

const SERVICE = 'WMTS'
const VERSIONS = ['1.0.0']
const DEFAULT_VERSION = '1.0.0'
const ENCODINGS = ['KVP', 'REST']

const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

// GetEncoding constraint values, as servers spell them: the WMTS standard
// writes 'KVP', 'RESTful' and 'SOAP'. SOAP is not supported here.
const ENCODING_NAMES = { kvp: 'KVP', rest: 'REST', restful: 'REST' }

const PLACEHOLDER = /\{[^{}]*\}/g
const TOKEN = /__wmts_placeholder_(\d+)__/g

// Resolve a ResourceURL template against the capabilities URL. URL resolution
// would encode its placeholders ({TileMatrix}, {TileRow}…), so they are
// swapped for tokens made of unreserved characters before resolving, then
// restored. A template starting with a placeholder is thus resolved like any
// relative path, against the directory of the capabilities URL. An absolute
// template is kept as written.
function resolveTemplate (template, base) {
  const placeholders = []
  const tokenized = template.replace(PLACEHOLDER, (placeholder) => `__wmts_placeholder_${placeholders.push(placeholder) - 1}__`)
  if (URL.canParse(tokenized)) return template
  return resolveHref(tokenized, base).replace(TOKEN, (_, index) => placeholders[Number(index)])
}

const toNumber = (value) => {
  if (value === undefined || value.trim() === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

// Tile and matrix sizes are strictly positive integers; tile row and column
// indexes are positive integers or zero.
const toPositiveInteger = (node) => {
  const number = toNumber(text(node))
  return Number.isInteger(number) && number > 0 ? number : undefined
}

const toIndex = (node) => {
  const number = toNumber(text(node))
  return Number.isInteger(number) && number >= 0 ? number : undefined
}

// Copy defined values only, so decoded objects carry no undefined keys.
const defined = (entries) => Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined))

// Exception reports are also checked here, for documents passed through
// options.capabilities, which do not go through readCapabilities().
function decodeCapabilities (document, baseUrl) {
  assertNoException(document)
  const root = child(document, 'Capabilities')
  const contents = child(root, 'Contents')
  // <Capabilities> is also the WCS 1.1 root: require the WMTS namespace, or
  // tile matrix sets when a static file omits namespaces.
  if (!root || !(/\/wmts\//.test(root.namespaceURI ?? '') || child(contents, 'TileMatrixSet'))) {
    throw invalid('not a WMTS capabilities document')
  }
  assertSupportedVersion(SERVICE, attribute(root, 'version'), VERSIONS)
  if (!contents) throw invalid('missing WMTS Contents element')
  const tileEndpoints = decodeGetTile(root, baseUrl)
  const layers = children(contents, 'Layer').map((node) => decodeLayer(node, baseUrl))
  const encodings = new Set(tileEndpoints.flatMap((endpoint) => endpoint.encodings))
  if (layers.some((layer) => layer.resourceUrls.some((resource) => resource.resourceType === 'tile'))) encodings.add('REST')
  const result = {
    version: attribute(root, 'version'),
    tileEndpoints,
    encodings: ENCODINGS.filter((name) => encodings.has(name)),
    layers,
    tileMatrixSets: children(contents, 'TileMatrixSet').map(decodeTileMatrixSet)
  }
  // No KVP endpoint advertised, no tileUrl: the capabilities URL is not
  // assumed to serve tiles.
  const kvp = tileEndpoints.find((endpoint) => endpoint.encodings.includes('KVP'))
  if (kvp) result.tileUrl = kvp.href
  const title = text(child(child(root, 'ServiceIdentification'), 'Title'))
  if (title) result.title = title
  return result
}

// Every GetTile endpoint, across all DCP and HTTP elements, with the encodings
// its GetEncoding constraint allows, normalized ('RESTful' as 'REST', case
// ignored), and its href resolved against the capabilities URL. An endpoint
// without constraint is assumed to be KVP; one allowing no supported encoding
// (SOAP only) is left out.
function decodeGetTile (root, baseUrl) {
  const operation = children(child(root, 'OperationsMetadata'), 'Operation')
    .find((node) => attribute(node, 'name') === 'GetTile')
  const gets = children(operation, 'DCP')
    .flatMap((dcp) => children(dcp, 'HTTP'))
    .flatMap((http) => children(http, 'Get'))
  const endpoints = []
  for (const get of gets) {
    const href = attribute(get, 'href')
    if (!href) continue
    const constraint = children(get, 'Constraint').find((node) => attribute(node, 'name')?.toLowerCase() === 'getencoding')
    const allowed = constraint
      ? children(child(constraint, 'AllowedValues'), 'Value').map((value) => ENCODING_NAMES[text(value)?.toLowerCase()]).filter(Boolean)
      : ['KVP']
    if (allowed.length > 0) endpoints.push({ href: resolveHref(href, baseUrl), encodings: [...new Set(allowed)] })
  }
  return endpoints
}

function decodeLayer (node, baseUrl) {
  const id = text(child(node, 'Identifier'))
  if (!id) throw invalid('WMTS layer without Identifier')
  const layer = {
    id,
    title: text(child(node, 'Title')) || id,
    formats: children(node, 'Format').map(text).filter(Boolean),
    styles: children(node, 'Style').map((style) => decodeStyle(style, baseUrl)).filter((style) => style.id),
    dimensions: children(node, 'Dimension').map(decodeDimension).filter((dimension) => dimension.name),
    tileMatrixSets: children(node, 'TileMatrixSetLink').map(decodeTileMatrixSetLink),
    // Every ResourceURL, tile and FeatureInfo alike, in document order: a
    // format may be listed for several resource types.
    resourceUrls: children(node, 'ResourceURL')
      .filter((resource) => attribute(resource, 'template'))
      .map((resource) => defined({
        format: attribute(resource, 'format'),
        resourceType: attribute(resource, 'resourceType'),
        template: resolveTemplate(attribute(resource, 'template'), baseUrl)
      }))
  }
  const description = text(child(node, 'Abstract'))
  if (description) layer.description = description
  // WGS84BoundingBox is CRS84: longitude first, no reprojection needed. It is
  // 2D by definition; a 3D one is reduced to its horizontal extent.
  const extent = readOwsBBox(child(node, 'WGS84BoundingBox'))
  if (extent) layer.extent = extent.length === 6 ? [extent[0], extent[1], extent[3], extent[4]] : extent
  return layer
}

function decodeStyle (node, baseUrl) {
  const id = text(child(node, 'Identifier'))
  const style = { id, title: text(child(node, 'Title')) || id }
  if (attribute(node, 'isDefault') === 'true') style.default = true
  const legendUrl = attribute(child(node, 'LegendURL'), 'href')
  if (legendUrl) style.legendUrl = resolveHref(legendUrl, baseUrl)
  return style
}

// Everything a Dimension declares; values are kept as written, as they may be
// instants, intervals or lists.
function decodeDimension (node) {
  // <Current> is an element in WMTS (an attribute in WMS 1.3.0).
  const current = text(child(node, 'Current'))?.toLowerCase()
  return defined({
    name: text(child(node, 'Identifier')),
    title: text(child(node, 'Title')) || undefined,
    description: text(child(node, 'Abstract')) || undefined,
    units: text(child(node, 'UOM')) || undefined,
    unitSymbol: text(child(node, 'UnitSymbol')) || undefined,
    default: text(child(node, 'Default')) || undefined,
    current: current === 'true' || current === '1' ? true : current === 'false' || current === '0' ? false : undefined,
    values: children(node, 'Value').map(text).filter(Boolean)
  })
}

// A layer link to a tile matrix set, with the tile ranges the layer covers at
// each level when the server restricts them. Every field of a limit is
// mandatory; a missing or invalid one, or a range whose minimum exceeds its
// maximum, makes the document invalid rather than the limits incomplete.
function decodeTileMatrixSetLink (node) {
  const id = text(child(node, 'TileMatrixSet'))
  if (!id) throw invalid('WMTS TileMatrixSetLink without TileMatrixSet')
  const link = { id }
  const limits = children(child(node, 'TileMatrixSetLimits'), 'TileMatrixLimits').map((limit) => {
    const tileMatrix = text(child(limit, 'TileMatrix'))
    if (!tileMatrix) throw invalid(`WMTS TileMatrixLimits without TileMatrix in ${link.id}`)
    const decoded = { tileMatrix }
    for (const field of ['MinTileRow', 'MaxTileRow', 'MinTileCol', 'MaxTileCol']) {
      const value = toIndex(child(limit, field))
      if (value === undefined) throw invalid(`WMTS TileMatrixLimits ${tileMatrix} of ${link.id}: invalid ${field}`)
      decoded[field[0].toLowerCase() + field.slice(1)] = value
    }
    if (decoded.minTileRow > decoded.maxTileRow || decoded.minTileCol > decoded.maxTileCol) {
      throw invalid(`WMTS TileMatrixLimits ${tileMatrix} of ${link.id}: minimum above maximum`)
    }
    return decoded
  })
  if (limits.length > 0) link.limits = limits
  return link
}

// The CRS and every TileMatrix. The matrix identifiers are the reference: tile
// requests address a level by its TileMatrix identifier.
//
// `zoom` (see zoomTemplate in ../helpers.js) is purely syntactic: it only
// says that the identifiers are a common prefix followed by consecutive
// integers, so that a level can be written '<prefix>{z}'. It does not mean
// that these levels match the zoom levels of an XYZ or Web Mercator grid:
// 'EPSG:4326:0' is not zoom 0 of a MapLibre map. Whether a set fits a given
// tile grid depends on its CRS, scales, origin and tile sizes, which callers
// must check against the matrices themselves.
function decodeTileMatrixSet (node) {
  const id = text(child(node, 'Identifier'))
  if (!id) throw invalid('WMTS TileMatrixSet without Identifier')
  const supportedCrs = text(child(node, 'SupportedCRS'))
  if (!supportedCrs) throw invalid(`WMTS TileMatrixSet ${id} without SupportedCRS`)
  const matrices = children(node, 'TileMatrix').map((matrix) => decodeTileMatrix(matrix, id))
  if (matrices.length === 0) throw invalid(`WMTS TileMatrixSet ${id} without TileMatrix`)
  const set = defined({
    id,
    crs: normalizeCrsName(supportedCrs),
    wellKnownScaleSet: text(child(node, 'WellKnownScaleSet')) || undefined,
    matrices
  })
  const zoom = zoomTemplate(matrices.map((matrix) => matrix.id))
  if (zoom) set.zoom = zoom
  return set
}

// Every field of a TileMatrix is mandatory: a missing or invalid one makes the
// document invalid rather than the matrix incomplete. TopLeftCorner is kept in
// the axis order of SupportedCRS (latitude first for an EPSG:4326 URN).
function decodeTileMatrix (node, setId) {
  const id = text(child(node, 'Identifier'))
  if (!id) throw invalid(`WMTS TileMatrix without Identifier in ${setId}`)
  const fail = (field) => { throw invalid(`WMTS TileMatrix ${id} of ${setId}: invalid ${field}`) }
  const scaleDenominator = toNumber(text(child(node, 'ScaleDenominator')))
  if (!(scaleDenominator > 0)) fail('ScaleDenominator')
  const topLeftCorner = (text(child(node, 'TopLeftCorner')) ?? '').split(/\s+/).filter(Boolean).map(Number)
  if (topLeftCorner.length < 2 || topLeftCorner.length > 3 || !topLeftCorner.every(Number.isFinite)) fail('TopLeftCorner')
  const matrix = { id, scaleDenominator, topLeftCorner }
  for (const field of ['TileWidth', 'TileHeight', 'MatrixWidth', 'MatrixHeight']) {
    const value = toPositiveInteger(child(node, field))
    if (value === undefined) fail(field)
    matrix[field[0].toLowerCase() + field.slice(1)] = value
  }
  return matrix
}

export const wmts = {

  async getCapabilities (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { version = DEFAULT_VERSION, searchParams, request } = options
    assertSupportedVersion(SERVICE, version, VERSIONS)
    return readCapabilities(input, { service: SERVICE, version, searchParams, request })
  },

  async discover (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { capabilities, ...rest } = options
    const document = capabilities ?? await wmts.getCapabilities(input, rest)
    return decodeCapabilities(document, input)
  }

}
