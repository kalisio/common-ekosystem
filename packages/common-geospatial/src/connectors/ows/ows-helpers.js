// Internal helpers of the OGC Web Services (OWS) connectors: WMS, WFS, WMTS
// and WCS. Not exported from the ows/ barrel. It holds what those protocols
// share through OWS Common: exception reports, capabilities reading, KVP
// request assembly and bounding boxes. Helpers shared with the other
// connectors live in ../helpers.js. Documents are read through
// '@kalisio/common-core/io/xml' and traversed with the common-core dom utility.

import { is, optional } from '@kalisio/common-core/predicates'
import { dom, url } from '@kalisio/common-core/utilities'
import { xml } from '@kalisio/common-core/io/xml'
import { isValidBBox } from '../../foundation/index.js'
import { ERROR_CODES, failure } from '../helpers.js'

const { attribute, child, text } = dom

// --- Exceptions ---------------------------------------------------------------

// Servers often answer a failed request with HTTP 200 and an exception
// document: <ServiceExceptionReport> (WMS 1.x) or <ows:ExceptionReport>
// (OWS 1.1/2.0: WMTS, WFS 2.0, WCS 1.1+). Raise it with the server message
// instead of letting it surface as an invalid capabilities document.
export function assertNoException (document) {
  const report = child(document, 'ServiceExceptionReport') ?? child(document, 'ExceptionReport')
  if (!report) return
  const exception = child(report, 'ServiceException') ?? child(report, 'Exception')
  const error = failure(ERROR_CODES.OWS_EXCEPTION, text(child(exception, 'ExceptionText')) || text(exception) || 'OWS exception')
  const exceptionCode = attribute(exception, 'code') ?? attribute(exception, 'exceptionCode')
  if (exceptionCode) error.exceptionCode = exceptionCode
  throw error
}

// --- Capabilities -------------------------------------------------------------

// Options accepted by getCapabilities() and discover() of every OWS connector:
// - version: protocol version to request, among the supported ones;
// - capabilities: a pre-fetched capabilities DOM Document (discover() only);
// - searchParams: extra query parameters (API keys, vendor parameters);
// - request: transport options for the common-core request operator
//   (headers, signal, timeout, retries, ...).
export const READ_OPTIONS_SCHEMA = {
  version: optional(is.nonEmptyString),
  // nodeType 9 is DOCUMENT_NODE, with the native DOM as with @xmldom/xmldom.
  capabilities: optional((value) => is.object(value) && value.nodeType === 9),
  searchParams: optional(is.plainObject),
  request: optional(is.plainObject)
}

// Fetch a GetCapabilities document as a DOM, raising exception reports.
export async function readCapabilities (input, { service, version, searchParams, request } = {}) {
  const requestUrl = owsRequestUrl(input, { service, request: 'GetCapabilities', version, searchParams })
  const document = await xml.read(requestUrl, { request, output: 'dom' })
  assertNoException(document)
  return document
}

// --- Request assembly ---------------------------------------------------------

const RESERVED_PARAMETERS = ['service', 'request', 'version']

// Decode a query component, leaving a malformed one ('%E0%A4%A') as written.
function decode (component) {
  try {
    return decodeURIComponent(component)
  } catch {
    return component
  }
}

const isReserved = (name) => RESERVED_PARAMETERS.includes(decode(name).toLowerCase())

// Build an OWS KVP request URL. KVP parameter names are case-insensitive, so
// SERVICE, REQUEST and VERSION are normalized whatever their spelling in the
// base URL or in searchParams, and appear once, upper-cased:
// - SERVICE and REQUEST are always the connector's;
// - VERSION is the requested version; without one, a version written in the
//   base URL is kept, as the explicit choice of whoever wrote that URL, and
//   the server picks its own otherwise. A version in searchParams is ignored:
//   it must be requested through the version option.
// Other parameters of the base URL keep their position and encoding.
export function owsRequestUrl (base, { service, request, version, searchParams = {} } = {}) {
  const hashIndex = base.indexOf('#')
  const fragment = hashIndex < 0 ? '' : base.slice(hashIndex)
  const beforeFragment = hashIndex < 0 ? base : base.slice(0, hashIndex)
  const queryIndex = beforeFragment.indexOf('?')
  const path = queryIndex < 0 ? beforeFragment : beforeFragment.slice(0, queryIndex)
  const pairs = queryIndex < 0 ? [] : beforeFragment.slice(queryIndex + 1).split('&').filter(Boolean)
  let baseVersion
  const kept = pairs.filter((pair) => {
    const separator = pair.indexOf('=')
    const name = separator < 0 ? pair : pair.slice(0, separator)
    const value = separator < 0 ? '' : pair.slice(separator + 1)
    if (!isReserved(name)) return true
    if (decode(name).toLowerCase() === 'version' && value) baseVersion = decode(value)
    return false
  })
  const cleaned = `${path}${kept.length ? `?${kept.join('&')}` : ''}${fragment}`
  const extra = Object.fromEntries(Object.entries(searchParams).filter(([name]) => !isReserved(name)))
  return url.build(cleaned, {
    ...extra,
    SERVICE: service,
    REQUEST: request,
    VERSION: version ?? baseVersion
  })
}

// --- Bounding boxes -----------------------------------------------------------

// Read an OWS Common bounding box (<WGS84BoundingBox> or <BoundingBox>, used
// by WMTS and WFS 1.1/2.0), whose corners are 'x y [z]' strings:
//   <LowerCorner>-5 42</LowerCorner><UpperCorner>8 51</UpperCorner>
// into [minX, minY, maxX, maxY], or [minX, minY, minZ, maxX, maxY, maxZ] in 3D
// (the foundation bbox layout), or undefined when malformed. Coordinates are
// kept in the axis order of the declaring CRS, neither swapped nor
// reprojected: for a WGS84BoundingBox (CRS84) that is [west, south, east, north].
// The box is checked with isValidBBox(): minY <= maxY and minZ <= maxZ, but
// minX > maxX is kept, as OWS Common allows for boxes crossing the antimeridian.
export function readOwsBBox (box) {
  const corner = (name) => {
    const value = text(child(box, name))
    if (!value) return undefined
    const coordinates = value.split(/\s+/).map(Number)
    return coordinates.every(Number.isFinite) ? coordinates : undefined
  }
  const lower = corner('LowerCorner')
  const upper = corner('UpperCorner')
  if (!lower || !upper || lower.length !== upper.length) return undefined
  const bbox = [...lower, ...upper]
  return isValidBBox(bbox) ? bbox : undefined
}
