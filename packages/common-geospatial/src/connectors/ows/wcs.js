import { assert, conform } from '@kalisio/common-core/predicates'
import { dom } from '@kalisio/common-core/utilities'
import { isValidBBox } from '../../foundation/index.js'
import { assertSupportedVersion, ERROR_CODES, failure, resolveHref } from '../helpers.js'
import { assertNoException, READ_OPTIONS_SCHEMA, readCapabilities } from './ows-helpers.js'

const { attribute, child, children, text } = dom

const SERVICE = 'WCS'
const VERSIONS = ['1.0.0']
const DEFAULT_VERSION = '1.0.0'
const METHODS = { Get: 'GET', Post: 'POST' }

const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

// Exception reports are also checked here, for documents passed through
// options.capabilities, which do not go through readCapabilities().
function decodeCapabilities (document, baseUrl) {
  assertNoException(document)
  const root = child(document, 'WCS_Capabilities')
  // WCS 1.1 and 2.0 root at <Capabilities>, with another structure.
  const other = child(document, 'Capabilities')
  if (!root && other) assertSupportedVersion(SERVICE, attribute(other, 'version'), VERSIONS)
  if (!root) throw invalid('not a WCS capabilities document')
  assertSupportedVersion(SERVICE, attribute(root, 'version'), VERSIONS)
  // Service, Capability and ContentMetadata are mandatory; Service only
  // carries descriptive metadata, so only the other two are required here.
  // A service may advertise POST only: no GET endpoint is not an error.
  const capability = child(root, 'Capability')
  if (!capability) throw invalid('missing WCS Capability element')
  const contents = child(root, 'ContentMetadata')
  if (!contents) throw invalid('missing WCS ContentMetadata element')
  const coverageEndpoints = decodeGetCoverage(capability, baseUrl)
  const result = {
    version: attribute(root, 'version'),
    coverageEndpoints,
    layers: children(contents, 'CoverageOfferingBrief').map(decodeOffering)
  }
  const get = coverageEndpoints.find((endpoint) => endpoint.method === 'GET')
  if (get) result.coverageUrl = get.href
  const contentMetadataHref = attribute(contents, 'href')
  if (contentMetadataHref) result.contentMetadataUrl = resolveHref(contentMetadataHref, baseUrl)
  const title = text(child(child(root, 'Service'), 'label'))
  if (title) result.title = title
  return result
}

// GetCoverage endpoints, across all DCPType and HTTP elements, in document
// order: <Get> or <Post> holding an <OnlineResource>, hrefs resolved against
// the capabilities URL.
function decodeGetCoverage (capability, baseUrl) {
  const getCoverage = child(child(capability, 'Request'), 'GetCoverage')
  return children(getCoverage, 'DCPType')
    .flatMap((dcp) => children(dcp, 'HTTP'))
    .flatMap((http) => children(http))
    .filter((element) => METHODS[element.localName])
    .map((element) => ({ href: attribute(child(element, 'OnlineResource'), 'href'), method: METHODS[element.localName] }))
    .filter((endpoint) => endpoint.href)
    .map((endpoint) => ({ ...endpoint, href: resolveHref(endpoint.href, baseUrl) }))
}

function decodeOffering (node) {
  const id = text(child(node, 'name'))
  if (!id) throw invalid('WCS CoverageOfferingBrief without name')
  const layer = { id, title: text(child(node, 'label')) || id }
  const description = text(child(node, 'description'))
  if (description) layer.description = description
  const envelope = child(node, 'lonLatEnvelope')
  const extent = decodeEnvelope(envelope)
  if (extent) layer.extent = extent
  // Optional time bounds of the envelope, kept as written.
  const timePositions = children(envelope, 'timePosition').map(text).filter(Boolean)
  if (timePositions.length > 0) layer.timePositions = timePositions
  return layer
}

// lonLatEnvelope holds exactly two gml:pos, the lower and upper corners, as
// 'lon lat'. Both must have the same dimension; a third coordinate (height) is
// tolerated and ignored, for a 2D extent. The box is checked with
// isValidBBox(): south <= north, while west > east is kept across the
// antimeridian. Anything else gives no extent.
function decodeEnvelope (envelope) {
  const positions = children(envelope, 'pos')
    .map((pos) => (text(pos) ?? '').split(/\s+/).filter(Boolean).map(Number))
  if (positions.length !== 2) return undefined
  const [lower, upper] = positions
  if (lower.length !== upper.length || ![2, 3].includes(lower.length)) return undefined
  if (!lower.every(Number.isFinite) || !upper.every(Number.isFinite)) return undefined
  const bbox = [lower[0], lower[1], upper[0], upper[1]]
  return isValidBBox(bbox) ? bbox : undefined
}

export const wcs = {

  async getCapabilities (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { version = DEFAULT_VERSION, searchParams, request } = options
    assertSupportedVersion(SERVICE, version, VERSIONS)
    return readCapabilities(input, { service: SERVICE, version, searchParams, request })
  },

  async discover (input, options = {}) {
    assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
    const { capabilities, ...rest } = options
    const document = capabilities ?? await wcs.getCapabilities(input, rest)
    return decodeCapabilities(document, input)
  }
}
