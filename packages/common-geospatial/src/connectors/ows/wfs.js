import { assert, conform } from '@kalisio/common-core/predicates'
import { dom } from '@kalisio/common-core/utilities'
import { normalizeCrsName } from '../../foundation/index.js'
import { assertSupportedVersion, ERROR_CODES, failure, resolveHref } from '../helpers.js'
import {
  assertNoException,
  READ_OPTIONS_SCHEMA,
  readCapabilities,
  readOwsBBox
} from './ows-helpers.js'

const { attribute, child, children, text } = dom

const SERVICE = 'WFS'
const VERSIONS = ['1.1.0', '2.0.0', '2.0.2']
const METHODS = { Get: 'GET', Post: 'POST' }

const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

// Exception reports are also checked here, for documents passed through
// options.capabilities, which do not go through readCapabilities().
function decodeCapabilities (document, baseUrl) {
  assertNoException(document)
  const root = child(document, 'WFS_Capabilities')
  if (!root) throw invalid('not a WFS capabilities document')
  assertSupportedVersion(SERVICE, attribute(root, 'version'), VERSIONS)
  const featureEndpoints = decodeGetFeature(root, baseUrl)
  const formats = outputFormats(root)
  const result = {
    version: attribute(root, 'version'),
    featureEndpoints,
    outputFormats: formats,
    // FeatureTypeList is optional in WFS 2.0 (a service may only offer stored
    // queries): without it, the service has no layers.
    layers: children(child(root, 'FeatureTypeList'), 'FeatureType').map(decodeFeatureType)
  }
  const get = featureEndpoints.find((endpoint) => endpoint.method === 'GET')
  if (get) result.featureUrl = get.href
  const outputFormat = findGeoJsonFormat(formats)
  if (outputFormat) result.outputFormat = outputFormat
  const title = text(child(child(root, 'ServiceIdentification'), 'Title'))
  if (title) result.title = title
  return result
}

// GetFeature endpoints, across all DCP and HTTP elements, in document order:
// GET for KVP requests, POST for XML requests and complex filters. Hrefs are
// resolved against the capabilities URL.
function decodeGetFeature (root, baseUrl) {
  const operation = children(child(root, 'OperationsMetadata'), 'Operation')
    .find((node) => attribute(node, 'name') === 'GetFeature')
  return children(operation, 'DCP')
    .flatMap((dcp) => children(dcp, 'HTTP'))
    .flatMap((http) => children(http))
    .filter((element) => METHODS[element.localName] && attribute(element, 'href'))
    .map((element) => ({ href: resolveHref(attribute(element, 'href'), baseUrl), method: METHODS[element.localName] }))
}

function decodeFeatureType (node) {
  const id = text(child(node, 'Name'))
  if (!id) throw invalid('WFS FeatureType without Name')
  const layer = { id, title: text(child(node, 'Title')) || id }
  const description = text(child(node, 'Abstract'))
  if (description) layer.description = description
  // DefaultCRS / OtherCRS in WFS 2.0, DefaultSRS / OtherSRS in WFS 1.1.0; the
  // default comes first. NoCRS / NoSRS types have none.
  // - defaultCrs and crs are normalized, to compare and look up projections;
  // - srsNames keeps the identifiers as advertised, to send back in SRSNAME:
  //   the spelling matters, as servers such as GeoServer return latitude first
  //   for urn:ogc:def:crs:EPSG::4326 but longitude first for EPSG:4326.
  const defaultCrs = text(child(node, 'DefaultCRS') ?? child(node, 'DefaultSRS'))
  const others = [...children(node, 'OtherCRS'), ...children(node, 'OtherSRS')].map(text).filter(Boolean)
  const srsNames = [...new Set([defaultCrs, ...others].filter(Boolean))]
  if (defaultCrs) layer.defaultCrs = normalizeCrsName(defaultCrs)
  const crs = [...new Set(srsNames.map(normalizeCrsName))]
  if (crs.length > 0) layer.crs = crs
  if (srsNames.length > 0) layer.srsNames = srsNames
  // Output formats specific to this feature type; the service ones apply
  // otherwise.
  const formats = children(child(node, 'OutputFormats'), 'Format').map(text).filter(Boolean)
  if (formats.length > 0) layer.outputFormats = formats
  // WGS84BoundingBox is CRS84: longitude first, no reprojection needed. It is
  // 2D by definition; a 3D one is reduced to its horizontal extent.
  const extent = readOwsBBox(child(node, 'WGS84BoundingBox'))
  if (extent) layer.extent = extent.length === 6 ? [extent[0], extent[1], extent[3], extent[4]] : extent
  return layer
}

// GetFeature output formats, declared on the operation or, for some servers,
// globally on OperationsMetadata, in that order of precedence: the first
// parameter holding values wins, an empty one is skipped. OWS 1.1 (WFS 2.0)
// wraps values in <AllowedValues>; OWS 1.0 (WFS 1.1) lists them directly.
function outputFormats (root) {
  const metadata = child(root, 'OperationsMetadata')
  const getFeature = children(metadata, 'Operation').find((node) => attribute(node, 'name') === 'GetFeature')
  for (const node of [getFeature, metadata]) {
    for (const parameter of children(node, 'Parameter')) {
      if (attribute(parameter, 'name')?.toLowerCase() !== 'outputformat') continue
      const wrapped = children(child(parameter, 'AllowedValues'), 'Value')
      const values = (wrapped.length > 0 ? wrapped : children(parameter, 'Value')).map(text).filter(Boolean)
      if (values.length > 0) return values
    }
  }
  return []
}

// Media type and lower-cased parameters of a format ('application/json;
// subtype=geojson' gives application/json and { subtype: 'geojson' }). Quoted
// values ('subtype="geojson"') are unquoted; a parameter without '=' gets an
// empty value.
function parseFormat (format) {
  const [mediaType, ...parameters] = format.split(';').map((part) => part.trim().toLowerCase())
  return {
    mediaType,
    parameters: Object.fromEntries(parameters.map((parameter) => {
      const index = parameter.indexOf('=')
      if (index < 0) return [parameter, '']
      const name = parameter.slice(0, index).trim()
      const value = parameter.slice(index + 1).trim().replace(/(?:^["']|["']$)/g, '')
      return [name, value]
    }).filter(([name]) => name))
  }
}

// GeoJSON among the advertised formats, returned with the server's spelling,
// as it must be sent back. Explicit GeoJSON formats come first:
// 'application/geo+json', 'application/json; subtype=geojson' (MapServer),
// 'geojson' and the former 'application/vnd.geo+json'. Generic JSON
// ('application/json' without subtype, as GeoServer advertises it, or 'json')
// is the fallback; JSON with another subtype, such as TopoJSON, is not GeoJSON.
function findGeoJsonFormat (formats) {
  const parsed = formats.map((format) => ({ format, ...parseFormat(format) }))
  const explicit = parsed.find(({ mediaType, parameters }) =>
    ['application/geo+json', 'application/vnd.geo+json', 'geojson'].includes(mediaType) ||
    (mediaType === 'application/json' && parameters.subtype === 'geojson'))
  if (explicit) return explicit.format
  const generic = parsed.find(({ mediaType, parameters }) =>
    (mediaType === 'application/json' && parameters.subtype === undefined) || mediaType === 'json')
  return generic?.format
}

export const wfs = {
  async getCapabilities (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { version, searchParams, request } = options
    if (version) assertSupportedVersion(SERVICE, version, VERSIONS)
    return readCapabilities(input, { service: SERVICE, version, searchParams, request })
  },

  async discover (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { capabilities, ...rest } = options
    const document = capabilities ?? await wfs.getCapabilities(input, rest)
    return decodeCapabilities(document, input)
  }
}
