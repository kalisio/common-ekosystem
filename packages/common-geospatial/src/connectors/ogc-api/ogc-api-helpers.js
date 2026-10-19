import { is, assert, conform, optional } from '@kalisio/common-core/predicates'
import { url } from '@kalisio/common-core/utilities'
import { json } from '@kalisio/common-core/io/json'
import { ERROR_CODES, failure, resolveHref } from '../helpers.js'

// Relations may be written in their short registered form ('conformance') or
// as OGC URIs; both are accepted wherever a relation is matched.
const OGC_REL_PREFIX = 'http://www.opengis.net/def/rel/ogc/1.0/'

export const MEDIA_TYPES = {
  json: 'application/json'
}

// Options accepted by every OGC API function:
// - landingPage: a pre-fetched landing page, to follow its links;
// - searchParams: extra query parameters (API keys, ...), added to every request;
// - request: transport options for the common-core request operator
//   (headers, signal, timeout, retries, ...).
const READ_OPTIONS_SCHEMA = {
  landingPage: optional(is.plainObject),
  searchParams: optional(is.plainObject),
  request: optional(is.plainObject)
}

// --- Links ---------------------------------------------------------------

function mediaType (type) {
  return typeof type === 'string' ? type.split(';')[0].trim().toLowerCase() : undefined
}

function relMatches (linkRel, rel) {
  return linkRel === rel || linkRel === OGC_REL_PREFIX + rel
}

// Find the link of relation `rel`. When `type` is given (a media type or a
// list in order of preference), a link of that type is preferred, then an
// untyped one; links of any other type (typically text/html alternates) are
// never returned. Media type parameters are ignored when matching.
export function findLink (links, rel, type) {
  if (!is.array(links)) return null
  const candidates = links.filter((link) =>
    is.plainObject(link) && is.nonEmptyString(link.href) && relMatches(link.rel, rel))
  if (type === undefined) return candidates[0] ?? null
  for (const wanted of [type].flat().map(mediaType)) {
    const match = candidates.find((link) => mediaType(link.type) === wanted)
    if (match) return match
  }
  return candidates.find((link) => link.type === undefined) ?? null
}

// The landing page is conceptually a directory: resolving 'collections'
// against 'https://host/api' must give 'https://host/api/collections', not
// 'https://host/collections' as plain RFC 3986 resolution would.
export function asDirectory (root) {
  try {
    const parsed = new URL(root)
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/'
    return parsed.href
  } catch {
    return root.endsWith('/') ? root : `${root}/`
  }
}

// Target of `rel`:
// - with a landing page, the link it advertises, of the given type; a missing
//   link makes the landing page invalid, rather than an endpoint being
//   guessed (a landing page offering only an HTML link, which findLink()
//   ignores, has no JSON resource of that kind);
// - without one, the normative path `fallback` under the API root, which
//   avoids an extra round-trip.
export function linkTarget (root, landingPage, rel, type, fallback) {
  const base = asDirectory(root)
  if (landingPage) {
    assertLandingPage(landingPage)
    const link = findLink(landingPage.links, rel, type)
    if (!link) throw failure(ERROR_CODES.INVALID_CAPABILITIES, `OGC API landing page without ${rel} link`)
    return resolveHref(link.href, base)
  }
  return resolveHref(fallback, base)
}

// --- Transport -----------------------------------------------------------

// Read a JSON resource, asking for `accept` unless the caller sets an Accept
// header: OGC API servers commonly serve HTML to clients that do not ask for
// JSON explicitly. Headers may be given as an object, a Headers instance or
// tuples; Headers compares their names case-insensitively.
// searchParams are added to every URL read, including those found in links:
// a link to another origin would receive them too, which matters when they
// hold an API key.
export function readJson (source, { searchParams, request = {} } = {}, accept = MEDIA_TYPES.json) {
  const headers = new Headers(request.headers)
  if (!headers.has('Accept')) headers.set('Accept', accept)
  const target = searchParams && Object.keys(searchParams).length > 0
    ? url.build(source, searchParams)
    : source
  return json.read(target, { request: { ...request, headers } })
}

export function validateReadOptions (input, options) {
  assert.all([
    { value: input, validator: is.nonEmptyString, message: 'input must be a non empty string' },
    { value: options, validator: (v) => conform.schema(v, READ_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
  ])
}

// --- Resources -----------------------------------------------------------

// A landing page is a JSON object listing the API resources in `links`.
export function assertLandingPage (document) {
  if (!is.plainObject(document) || !is.array(document.links)) {
    throw failure(ERROR_CODES.INVALID_CAPABILITIES, 'not an OGC API landing page')
  }
}

// Read and validate the API landing page.
export async function getLandingPage (input, options = {}) {
  validateReadOptions(input, options)
  const { searchParams, request } = options
  const document = await readJson(input, { searchParams, request })
  assertLandingPage(document)
  return document
}

// Read the conformance declaration, following the landing page link when
// provided, or using the conventional endpoint under the API root.
export async function getConformance (input, options = {}) {
  validateReadOptions(input, options)
  const { landingPage, ...transport } = options
  const target = linkTarget(input, landingPage, 'conformance', MEDIA_TYPES.json, 'conformance')
  const document = await readJson(target, transport)
  if (!is.plainObject(document) || !is.array(document.conformsTo)) {
    throw failure(ERROR_CODES.INVALID_CAPABILITIES, 'not an OGC API conformance document')
  }
  return document
}
