import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { json } from '@kalisio/common-core/io/json'
import { ogcApiFeatures } from '../../../src/connectors/index.js'
import { CONFORMANCE } from '../../../src/connectors/ogc-api/features.js'

vi.mock('@kalisio/common-core/io/json', () => ({ json: { read: vi.fn() } }))

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(readFileSync(join(here, '../fixtures', name), 'utf-8'))
const ROOT = 'https://example.com/api'
const LANDING = {
  ...fixture('landing.json'),
  title: 'Demo features API',
  description: 'Hydrography and roads'
}

// Serve fixtures by URL and record what was requested.
function serve (routes) {
  json.read.mockImplementation(async (source) => {
    if (!(source in routes)) throw new Error(`unexpected request ${source}`)
    return routes[source]
  })
}

const requested = () => json.read.mock.calls.map(([source]) => source)
// Features Core conformance, required by discover().
const CORE = { conformsTo: [CONFORMANCE.core] }
// A minimal landing page advertising the collections at their normative path.
const DATA_LANDING = { links: [{ href: 'collections', rel: 'data', type: 'application/json' }] }

beforeEach(() => {
  json.read.mockReset()
})

describe('ogcApiFeatures.discover', () => {
  beforeEach(() => serve({
    [ROOT]: LANDING,
    'https://example.com/api/conformance?f=json': fixture('conformance.json'),
    // Relative 'collections?f=json' resolved under the root, not beside it.
    'https://example.com/api/collections?f=json': fixture('collections.json')
  }))
  it('follows the landing page links', async () => {
    const result = await ogcApiFeatures.discover(ROOT)
    expect(requested()).toEqual([
      ROOT,
      'https://example.com/api/conformance?f=json',
      'https://example.com/api/collections?f=json'
    ])
    expect(result.title).toBe('Demo features API')
    expect(result.description).toBe('Hydrography and roads')
    expect(result.conformsTo).toContain(CONFORMANCE.core)
    expect(result.collections.map((collection) => collection.id)).toEqual(['rivers', 'buildings', 'parcels'])
  })
  it('decodes collection metadata', async () => {
    const { collections } = await ogcApiFeatures.discover(ROOT)
    const [rivers, buildings, parcels] = collections
    expect(rivers).toEqual({
      id: 'rivers',
      title: 'Rivers',
      description: 'River network',
      itemType: 'feature',
      extent: [-5, 42, 8, 51],
      interval: ['2020-01-01T00:00:00Z', null],
      // '#/crs' expands to the CRS list of the collections document.
      crsUris: [
        'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
        'http://www.opengis.net/def/crs/EPSG/0/3857',
        'http://www.opengis.net/def/crs/EPSG/0/2154'
      ],
      crs: ['WGS84', 'EPSG:3857', 'EPSG:2154'],
      storageCrsUri: 'http://www.opengis.net/def/crs/EPSG/0/2154',
      storageCrs: 'EPSG:2154',
      // GeoJSON items link, resolved against the collections URL.
      itemsUrl: 'https://example.com/api/collections/rivers/items?f=json',
      links: expect.any(Array)
    })
    // Defaults, and a CRS84h box reduced to 2D.
    expect(buildings).toMatchObject({ title: 'buildings', itemType: 'feature', extent: [1, 43, 3, 44] })
    // A non-CRS84 box needs the CRS extension: no extent rather than a wrong one.
    expect(parcels.extent).toBeUndefined()
  })
  it('skips round-trips for pre-fetched documents', async () => {
    await ogcApiFeatures.discover(ROOT, {
      landingPage: LANDING,
      conformance: fixture('conformance.json'),
      collections: fixture('collections.json')
    })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('rejects a collections document without collections', async () => {
    serve({ 'https://example.com/api/collections': { links: [] } })
    await expect(ogcApiFeatures.getCollections(ROOT)).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('ogcApiFeatures.discover documents', () => {
  const landing = { title: 'API', links: [{ href: 'collections', rel: 'data', type: 'application/json' }] }
  const conformance = { conformsTo: [CONFORMANCE.core] }
  it('rejects a landing page without links', async () => {
    for (const document of [{ title: 'No links' }, [], 'html']) {
      serve({ [ROOT]: document })
      await expect(ogcApiFeatures.discover(ROOT)).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'not an OGC API landing page' })
    }
    serve({})
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: { title: 'No links' } })).rejects.toMatchObject({ message: 'not an OGC API landing page' })
  })
  it('rejects a pre-fetched conformance document without conformsTo', async () => {
    serve({})
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: landing, conformance: {}, collections: { collections: [] } }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
  it('rejects a landing page without a JSON data link', async () => {
    serve({})
    const htmlOnly = { links: [{ href: 'collections?f=html', rel: 'data', type: 'text/html' }] }
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: htmlOnly, conformance, collections: { collections: [] } }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'OGC API landing page without data link' })
  })
  it('rejects a collection without id', async () => {
    serve({})
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: landing, conformance, collections: { collections: [{ title: 'No id' }] } }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'OGC API collection without id' })
  })
  it('falls back to the id for an empty title, and keeps no empty description', async () => {
    serve({})
    const { title, collections } = await ogcApiFeatures.discover(ROOT, {
      landingPage: { ...landing, title: ' ' },
      conformance,
      collections: { collections: [{ id: 'roads', title: '', description: '' }] }
    })
    expect(title).toBeUndefined()
    expect(collections).toEqual([{ id: 'roads', title: 'roads', itemType: 'feature' }])
  })
})

describe('ogcApiFeatures collections pagination', () => {
  const page = (ids, next) => ({
    collections: ids.map((id) => ({ id })),
    links: next ? [{ href: `${next}&f=html`, rel: 'next', type: 'text/html' }, { href: next, rel: 'next', type: 'application/json' }] : []
  })
  it('follows next links and gathers every page in discover()', async () => {
    serve({
      'https://example.com/api/collections': page(['a', 'b'], 'collections?offset=2'),
      'https://example.com/api/collections?offset=2': page(['c'], 'https://example.com/api/collections?offset=3'),
      'https://example.com/api/collections?offset=3': page(['d'])
    })
    const { collections } = await ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE })
    expect(collections.map((collection) => collection.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(requested()).toHaveLength(3)
  })
  it('returns the first page only, as raw, from getCollections()', async () => {
    serve({ 'https://example.com/api/collections': page(['a', 'b'], 'collections?offset=2') })
    const document = await ogcApiFeatures.getCollections(ROOT)
    expect(document).toEqual(page(['a', 'b'], 'collections?offset=2'))
    expect(requested()).toHaveLength(1)
  })
  it('reads the following pages once when given the result of getCollections()', async () => {
    serve({
      'https://example.com/api/collections': page(['a'], 'collections?offset=1'),
      'https://example.com/api/collections?offset=1': page(['b'])
    })
    const first = await ogcApiFeatures.getCollections(ROOT)
    const { collections } = await ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE, collections: first })
    // Not a, b, b.
    expect(collections.map((collection) => collection.id)).toEqual(['a', 'b'])
  })
  it('completes pre-fetched collections with their next pages', async () => {
    serve({ 'https://example.com/api/collections?offset=2': page(['c']) })
    const { collections } = await ogcApiFeatures.discover(ROOT, {
      landingPage: DATA_LANDING,
      conformance: CORE,
      collections: page(['a', 'b'], 'collections?offset=2')
    })
    expect(collections.map((collection) => collection.id)).toEqual(['a', 'b', 'c'])
  })
  it('rejects a pagination loop', async () => {
    serve({
      'https://example.com/api/collections': page(['a'], 'collections?offset=1'),
      'https://example.com/api/collections?offset=1': page(['b'], 'collections')
    })
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE })).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: expect.stringContaining('loops back') })
  })
  it('rejects an invalid next page', async () => {
    serve({
      'https://example.com/api/collections': page(['a'], 'collections?offset=1'),
      'https://example.com/api/collections?offset=1': { links: [] }
    })
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE })).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('ogcApiFeatures collections across pages', () => {
  // Second page served from another path, with relative links of its own.
  const routes = () => ({
    'https://example.com/api/collections': {
      crs: ['http://www.opengis.net/def/crs/OGC/1.3/CRS84'],
      collections: [{ id: 'a', crs: ['#/crs'], links: [{ href: 'collections/a/items', rel: 'items', type: 'application/geo+json' }] }],
      links: [{ href: 'pages/2/collections', rel: 'next', type: 'application/json' }]
    },
    'https://example.com/api/pages/2/collections': {
      crs: ['http://www.opengis.net/def/crs/EPSG/0/3857'],
      collections: [{ id: 'b', crs: ['#/crs'], links: [{ href: 'b/items', rel: 'items', type: 'application/geo+json' }] }],
      links: [{ href: '../3/collections', rel: 'next', type: 'application/json' }]
    },
    // No CRS list on this page: '#/crs' points to nothing.
    'https://example.com/api/pages/3/collections': {
      collections: [{ id: 'c', crs: ['#/crs'], links: [{ href: 'c/items', rel: 'items', type: 'application/geo+json' }] }]
    }
  })
  it('resolves the links of each collection against the URL of its own page', async () => {
    serve(routes())
    const { collections } = await ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE })
    expect(collections.map((collection) => collection.itemsUrl)).toEqual([
      'https://example.com/api/collections/a/items',
      'https://example.com/api/pages/2/b/items',
      'https://example.com/api/pages/3/c/items'
    ])
  })
  it('expands #/crs with the CRS list of the page holding the collection only', async () => {
    serve(routes())
    const { collections } = await ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: CORE })
    expect(collections.map((collection) => collection.crsUris)).toEqual([
      ['http://www.opengis.net/def/crs/OGC/1.3/CRS84'],
      ['http://www.opengis.net/def/crs/EPSG/0/3857'],
      // Never the CRS of another page.
      undefined
    ])
  })
  it('leaves the raw first page untouched in getCollections()', async () => {
    serve(routes())
    const document = await ogcApiFeatures.getCollections(ROOT)
    expect(document).toEqual(routes()['https://example.com/api/collections'])
  })
})

describe('ogcApiFeatures conformance', () => {
  it('requires Features Core conformance', async () => {
    serve({})
    const others = { conformsTo: ['http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core'] }
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: DATA_LANDING, conformance: others, collections: { collections: [] } }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'OGC API Features Core conformance is missing' })
  })
  it('checks a fetched conformance document too', async () => {
    serve({
      'https://example.com/api/conformance': { conformsTo: [] },
      'https://example.com/api/collections': { collections: [] }
    })
    const landing = {
      links: [
        { href: 'conformance', rel: 'conformance', type: 'application/json' },
        { href: 'collections', rel: 'data', type: 'application/json' }
      ]
    }
    await expect(ogcApiFeatures.discover(ROOT, { landingPage: landing })).rejects.toMatchObject({ message: 'OGC API Features Core conformance is missing' })
  })
})

describe('ogcApiFeatures collection extents', () => {
  const extentOf = async (spatial, temporal) => {
    serve({})
    const { collections } = await ogcApiFeatures.discover(ROOT, {
      landingPage: DATA_LANDING,
      conformance: CORE,
      collections: { collections: [{ id: 'a', extent: { spatial, temporal } }] }
    })
    return collections[0]
  }
  it('keeps a box crossing the antimeridian, CRS84 by default', async () => {
    expect((await extentOf({ bbox: [[170, -20, -170, 10]] })).extent).toEqual([170, -20, -170, 10])
  })
  it('accepts the CRS84 and CRS84h identifiers only', async () => {
    expect((await extentOf({ bbox: [[-5, 42, 8, 51]], crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' })).extent).toEqual([-5, 42, 8, 51])
    expect((await extentOf({ bbox: [[-5, 42, 0, 8, 51, 10]], crs: 'http://www.opengis.net/def/crs/OGC/0/CRS84h' })).extent).toEqual([-5, 42, 8, 51])
    // CRS84h is not published under OGC/1.3, nor CRS84 elsewhere.
    expect((await extentOf({ bbox: [[-5, 42, 0, 8, 51, 10]], crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84h' })).extent).toBeUndefined()
    expect((await extentOf({ bbox: [[-5, 42, 8, 51]], crs: 'https://example.com/CRS84' })).extent).toBeUndefined()
  })
  it('requires the box dimension to match a declared CRS', async () => {
    expect((await extentOf({ bbox: [[-5, 42, 0, 8, 51, 10]], crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' })).extent).toBeUndefined()
    expect((await extentOf({ bbox: [[-5, 42, 8, 51]], crs: 'http://www.opengis.net/def/crs/OGC/0/CRS84h' })).extent).toBeUndefined()
  })
  it('reads a box without declared CRS in 2D or 3D', async () => {
    expect((await extentOf({ bbox: [[-5, 42, 8, 51]] })).extent).toEqual([-5, 42, 8, 51])
    expect((await extentOf({ bbox: [[-5, 42, 0, 8, 51, 10]] })).extent).toEqual([-5, 42, 8, 51])
  })
  it('gives no extent for an invalid box', async () => {
    expect((await extentOf({ bbox: [[-5, 51, 8, 42]] })).extent).toBeUndefined()
    expect((await extentOf({ bbox: [[-5, 42, 8]] })).extent).toBeUndefined()
    expect((await extentOf({ bbox: [[1, 43, 120, 3, 44, 0]], crs: 'http://www.opengis.net/def/crs/OGC/0/CRS84h' })).extent).toBeUndefined()
  })
  it('gives no interval for invalid bounds', async () => {
    expect((await extentOf(undefined, { interval: [['2020-01-01T00:00:00Z', 42]] })).interval).toBeUndefined()
    expect((await extentOf(undefined, { interval: [[null, '2021-01-01T00:00:00Z']] })).interval).toEqual([null, '2021-01-01T00:00:00Z'])
  })
})
