import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { isValidBBox, normalizeCrsName } from '../../foundation/index.js'
import {
  MEDIA_TYPES,
  assertLandingPage,
  findLink,
  getConformance,
  getLandingPage,
  linkTarget,
  readJson,
  validateReadOptions
} from './ogc-api-helpers.js'
import { ERROR_CODES, failure, resolveHref } from '../helpers.js'

export const CONFORMANCE = {
  core: 'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
  geojson: 'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
  oas30: 'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30'
}

// Identifiers of the Core bounding box CRS. Mind the versions: CRS84 is
// published under OGC/1.3, CRS84h (with heights) under OGC/0.
const CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
const CRS84H = 'http://www.opengis.net/def/crs/OGC/0/CRS84h'
// Media types of items, in order of preference.
const ITEM_TYPES = ['application/geo+json', MEDIA_TYPES.json]
// Guard against servers whose `next` links loop or never end.
const MAX_COLLECTION_PAGES = 100

const nonEmptyString = (value) => typeof value === 'string' && value.trim() !== '' ? value : undefined
const invalid = (message) => failure(ERROR_CODES.INVALID_CAPABILITIES, message)

const DISCOVER_OPTIONS_SCHEMA = {
  landingPage: optional(is.plainObject),
  conformance: optional(is.plainObject),
  collections: optional(is.plainObject)
}

function validate (options, schema) {
  assert.that(options, (v) => conform.schema(v, schema), 'options must be a valid options object')
}

function assertCollections (document) {
  if (!is.plainObject(document) || !is.array(document.collections)) {
    throw invalid('not an OGC API Features collections document')
  }
}

// Every page of the collections, as [{ document, url }], from a pre-fetched
// first page or the server. `next` links are resolved against the URL of the
// page holding them, and each page keeps its URL, against which the links of
// its own collections must be resolved. A page seen twice, or more than
// MAX_COLLECTION_PAGES pages, makes the document invalid rather than the
// result incomplete.
async function readCollections (prefetched, collectionsUrl, transport) {
  const first = prefetched ?? await readJson(collectionsUrl, transport)
  assertCollections(first)
  const pages = [{ document: first, url: collectionsUrl }]
  const seen = new Set([collectionsUrl])
  for (let link = findLink(first.links, 'next', MEDIA_TYPES.json); link; link = findLink(pages.at(-1).document.links, 'next', MEDIA_TYPES.json)) {
    const url = resolveHref(link.href, pages.at(-1).url)
    if (seen.has(url)) throw invalid(`OGC API collections pagination loops back to ${url}`)
    if (seen.size >= MAX_COLLECTION_PAGES) throw invalid(`OGC API collections span more than ${MAX_COLLECTION_PAGES} pages`)
    seen.add(url)
    const document = await readJson(url, transport)
    assertCollections(document)
    pages.push({ document, url })
  }
  return pages
}

function decodeCollection (raw, baseUrl, sharedCrs) {
  if (!is.plainObject(raw) || !nonEmptyString(raw.id)) throw invalid('OGC API collection without id')
  const collection = { id: raw.id, title: nonEmptyString(raw.title) ?? raw.id, itemType: nonEmptyString(raw.itemType) ?? 'feature' }
  const description = nonEmptyString(raw.description)
  if (description) collection.description = description
  const extent = decodeSpatialExtent(raw.extent?.spatial)
  if (extent) collection.extent = extent
  const interval = decodeTemporalExtent(raw.extent?.temporal)
  if (interval) collection.interval = interval
  // CRS (Part 2), as for WFS: crs and storageCrs are normalized, to compare
  // and look up projections; crsUris and storageCrsUri keep the URIs as
  // advertised, to send back in the crs query parameter. Without any, Core
  // only offers CRS84.
  const uris = [...new Set((is.array(raw.crs) ? raw.crs : [])
    .flatMap((uri) => (uri === '#/crs' ? sharedCrs : [uri]))
    .filter(nonEmptyString))]
  if (uris.length > 0) {
    collection.crsUris = uris
    collection.crs = [...new Set(uris.map(normalizeCrsName))]
  }
  const storageCrs = nonEmptyString(raw.storageCrs)
  if (storageCrs) {
    collection.storageCrsUri = storageCrs
    collection.storageCrs = normalizeCrsName(storageCrs)
  }
  // The items of the collection, GeoJSON first, resolved against the
  // collections URL.
  const items = findLink(raw.links, 'items', ITEM_TYPES)
  if (items) collection.itemsUrl = resolveHref(items.href, baseUrl)
  if (is.array(raw.links)) collection.links = raw.links
  return collection
}

// Core bounding boxes are in CRS84 (lon/lat, four numbers) or CRS84h
// (lon/lat/height, six numbers), checked with isValidBBox(): south <= north,
// while west > east is kept across the antimeridian. A declared CRS must match
// the dimension of the box; without one, CRS84 is the default, and a six
// numbers box is still read as CRS84h rather than lost. The first box is the
// overall extent, the next ones describing finer areas; it is reduced to 2D.
// Other CRS need the CRS extension and are left out.
function decodeSpatialExtent (spatial) {
  const crs = spatial?.crs
  if (crs !== undefined && crs !== CRS84 && crs !== CRS84H) return undefined
  const box = spatial?.bbox?.[0]
  if (!isValidBBox(box)) return undefined
  if (crs === CRS84 && box.length !== 4) return undefined
  if (crs === CRS84H && box.length !== 6) return undefined
  return box.length === 6 ? [box[0], box[1], box[3], box[4]] : [...box]
}

// First interval, [start, end] with null for an open bound (Gregorian TRS).
// Bounds must be strings or null. As for the bounding box, only the first
// interval is kept: it is the overall one, the next ones being finer.
function decodeTemporalExtent (temporal) {
  const interval = temporal?.interval?.[0]
  if (!is.array(interval) || interval.length !== 2) return undefined
  const bounds = interval.map((bound) => bound ?? null)
  return bounds.every((bound) => bound === null || nonEmptyString(bound)) ? bounds : undefined
}

export const ogcApiFeatures = {

  async discover (input, options = {}) {
    validateReadOptions(input, options)
    validate(options, DISCOVER_OPTIONS_SCHEMA)
    const { landingPage, conformance, collections, ...transport } = options
    const landing = landingPage ?? await getLandingPage(input, transport)
    assertLandingPage(landing)
    const collectionsUrl = linkTarget(input, landing, 'data', MEDIA_TYPES.json, 'collections')
    const [conformanceDocument, pages] = await Promise.all([
      conformance ?? getConformance(input, { ...transport, landingPage: landing }),
      readCollections(collections, collectionsUrl, transport)
    ])
    if (!is.plainObject(conformanceDocument) || !is.array(conformanceDocument.conformsTo)) {
      throw invalid('not an OGC API conformance document')
    }
    // The connector relies on Features Core: a service that does not declare it
    // is not an OGC API Features implementation.
    if (!conformanceDocument.conformsTo.includes(CONFORMANCE.core)) {
      throw invalid('OGC API Features Core conformance is missing')
    }
    // Part 2: a collection may refer to the CRS list of the collections
    // document holding it with '#/crs', a JSON Pointer into that very page:
    // each page is interpreted on its own, and a page without such a list
    // gives such collections no CRS rather than those of another page.
    const result = {
      conformsTo: conformanceDocument.conformsTo,
      collections: pages.flatMap(({ document, url }) => {
        const sharedCrs = is.array(document.crs) ? document.crs : []
        return document.collections.map((raw) => decodeCollection(raw, url, sharedCrs))
      })
    }
    const title = nonEmptyString(landing.title)
    if (title) result.title = title
    const description = nonEmptyString(landing.description)
    if (description) result.description = description
    return result
  },

  async getCollections (input, options = {}) {
    validateReadOptions(input, options)
    const { landingPage, ...transport } = options
    const target = linkTarget(input, landingPage, 'data', MEDIA_TYPES.json, 'collections')
    const document = await readJson(target, transport)
    assertCollections(document)
    return document
  }

}
