import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { EtagMismatch, PMTiles } from 'pmtiles'
import { request } from '@kalisio/common-core/operators/request'
import { pmtiles } from '../../src/connectors/index.js'

vi.mock('@kalisio/common-core/operators/request', () => ({ request: vi.fn() }))

const here = dirname(fileURLToPath(import.meta.url))
// Small archive: two MVT tiles, zooms 0-1, bounds [-5, 42, 8, 51], center
// [1.5, 46.5] at zoom 0, a name, description and attribution, two layers.
const archive = readFileSync(join(here, 'fixtures/roads.pmtiles'))
const bytes = (offset, length) => archive.buffer.slice(archive.byteOffset + offset, archive.byteOffset + offset + length)
const URL = 'https://example.com/roads.pmtiles'
const source = { getKey: () => 'local', getBytes: async (offset, length) => ({ data: bytes(offset, length) }) }

// Serve byte ranges like a static file server, through request(init).fetch(url)
// as the common-core operator. Options mimic server behaviors:
// - ignoreRange: answer 200 with the whole archive;
// - okRange: answer 200, instead of 206, with exactly the requested bytes;
// - strict416: answer 416 to a range going past the end of the archive, with
//   the given Content-Range (the archive size by default);
// - etags: ETag of each successive response (the last one is repeated);
// - status: a fixed error status.
function serve ({ ignoreRange = false, okRange = false, strict416 = false, contentRange, etags = [], status, noLength = false } = {}) {
  request.mockReset()
  let count = 0
  request.mockImplementation((init) => ({
    fetch: vi.fn(async () => {
      const etag = etags[Math.min(count++, etags.length - 1)]
      const response = (code, body, extra = {}) => ({
        ok: code >= 200 && code < 300,
        status: code,
        headers: new Headers({ ...(etag ? { ETag: etag } : {}), ...(body && !noLength ? { 'Content-Length': String(body.byteLength) } : {}), ...extra }),
        arrayBuffer: async () => body
      })
      if (status) return response(status)
      const [, start, end] = /bytes=(\d+)-(\d+)/.exec(init.headers.get('Range')).map(Number)
      if (ignoreRange) return response(200, bytes(0, archive.byteLength))
      if (start >= archive.byteLength || (strict416 && end >= archive.byteLength)) {
        return response(416, undefined, { 'Content-Range': contentRange ?? `bytes */${archive.byteLength}` })
      }
      return response(okRange ? 200 : 206, bytes(start, Math.min(end, archive.byteLength - 1) - start + 1))
    })
  }))
}
const ranges = () => request.mock.calls.map(([init]) => init.headers.get('Range'))

// Discover with a given header and metadata, as the pmtiles library would
// decode them, without building an archive for each case.
const HEADER = { tileType: 1, minZoom: 0, maxZoom: 14, minLon: -5, minLat: 42, maxLon: 8, maxLat: 51, centerLon: 1.5, centerLat: 46.5, centerZoom: 6 }
async function discoverWith (header, metadata = {}) {
  const getHeader = vi.spyOn(PMTiles.prototype, 'getHeader').mockResolvedValue({ ...HEADER, ...header })
  // vector_layers is mandatory in MVT archives, as in the header above.
  const getMetadata = vi.spyOn(PMTiles.prototype, 'getMetadata').mockResolvedValue({ vector_layers: [], ...metadata })
  try {
    return await pmtiles.discover(source)
  } finally {
    getHeader.mockRestore()
    getMetadata.mockRestore()
  }
}

const expectedLayers = [
  {
    id: 'roads',
    title: 'roads',
    description: 'Road network',
    extent: [-5, 42, 8, 51],
    minZoom: 0,
    maxZoom: 1,
    properties: [
      { name: 'name', type: 'string' },
      { name: 'lanes', type: 'number' },
      { name: 'toll', type: 'boolean' },
      // 'Mixed' has no JSON Schema equivalent.
      { name: 'ref' }
    ]
  },
  // Zooms default to the archive ones.
  { id: 'labels', title: 'labels', extent: [-5, 42, 8, 51], minZoom: 0, maxZoom: 1, properties: [] }
]
const expected = {
  tileType: 'mvt',
  minZoom: 0,
  maxZoom: 1,
  extent: [-5, 42, 8, 51],
  center: [1.5, 46.5],
  centerZoom: 0,
  title: 'Roads',
  description: 'Road network of the demo area',
  attribution: '© Demo contributors',
  layers: expectedLayers
}

describe('pmtiles.discover', () => {
  it('rejects a vector layer without id', async () => {
    await expect(discoverWith({}, {
      vector_layers: [{ title: 'No identifier' }]
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: 'PMTiles vector layer without id'
    })
  })
  it('decodes a remote archive through range requests', async () => {
    serve()
    const result = await pmtiles.discover(URL, {
      searchParams: { key: 'secret' },
      request: { headers: { Authorization: 'Bearer x' }, timeout: 5000 }
    })
    expect(result).toEqual(expected)
    const [init] = request.mock.calls[0]
    expect(init).toMatchObject({ timeout: 5000 })
    expect(init.headers).toBeInstanceOf(Headers)
    expect(init.headers.get('Authorization')).toBe('Bearer x')
    expect(init.headers.get('Range')).toMatch(/^bytes=0-\d+$/)
    expect(request.mock.results[0].value.fetch).toHaveBeenCalledWith(`${URL}?key=secret`)
  })
  it('accepts Headers instances as request headers', async () => {
    serve()
    await pmtiles.discover(URL, {
      request: { headers: new Headers({ 'X-Api-Key': 'secret' }) }
    })
    expect(request.mock.calls.every(([init]) => init.headers.get('x-api-key') === 'secret')).toBe(true)
  })
  it('accepts any pmtiles source', async () => {
    expect(await pmtiles.discover(source)).toEqual(expected)
    expect((await pmtiles.getHeader(source)).maxZoom).toBe(1)
    expect((await pmtiles.getMetadata(source)).name).toBe('Roads')
  })
  it('rereads a small archive with its size after a 416 on the first range', async () => {
    serve({ strict416: true })
    expect(await pmtiles.discover(URL)).toEqual(expected)
    expect(ranges().slice(0, 2)).toEqual(['bytes=0-16383', `bytes=0-${archive.byteLength - 1}`])
    expect(request.mock.calls[1][0].cache).toBe('reload')
  })
  it('rejects a 416 response without a valid archive size', async () => {
    // A size at least as large as the requested range would not have caused a 416.
    for (const contentRange of ['bytes */abc', 'bytes */0', 'bytes */-5', 'bytes */1.5', 'bytes 0-10/404', 'bytes */16384', 'bytes */20000']) {
      serve({ strict416: true, contentRange })
      await expect(pmtiles.discover(URL)).rejects.toMatchObject({ code: 'HTTP_ERROR', message: 'PMTiles 416 response without valid archive size' })
      // No request with a NaN range was sent.
      expect(ranges()).toEqual(['bytes=0-16383'])
    }
  })
  it('accepts 200 responses holding exactly the requested bytes, without slicing them again', async () => {
    serve({ okRange: true })
    expect(await pmtiles.discover(URL)).toEqual(expected)
  })
  it('rejects a server ignoring Range once the archive exceeds the requested range', async () => {
    // The first read (16 kB) holds the whole archive; the metadata read does not.
    serve({ ignoreRange: true })
    await expect(pmtiles.discover(URL)).rejects.toMatchObject({ code: 'HTTP_ERROR', message: 'PMTiles server does not support HTTP byte serving' })
  })
  it('rejects a 200 response without Content-Length', async () => {
    serve({ okRange: true, noLength: true })
    await expect(pmtiles.discover(URL)).rejects.toThrow('does not support HTTP byte serving')
  })
  it('detects an archive replaced between two reads, and retries once without cache', async () => {
    // Header read with ETag v1, then v2 for everything: the library retries.
    serve({ etags: ['"v1"', '"v2"'] })
    expect(await pmtiles.discover(URL)).toEqual(expected)
    const calls = request.mock.calls
    expect(calls.length).toBeGreaterThan(2)
    expect(calls.slice(2).every(([init]) => init.cache === 'reload')).toBe(true)
  })
  it('gives up when the archive keeps changing', async () => {
    serve({ etags: ['"v1"', '"v2"', '"v3"', '"v4"', '"v5"'] })
    await expect(pmtiles.discover(URL)).rejects.toBeInstanceOf(EtagMismatch)
  })
  it('ignores weak ETags', async () => {
    serve({ etags: ['W/"v1"', 'W/"v2"'] })
    expect(await pmtiles.discover(URL)).toEqual(expected)
  })
  it('raises unsuccessful range responses', async () => {
    serve({ status: 403 })
    await expect(pmtiles.discover(URL)).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 403 })
  })
  it('propagates errors instead of returning empty results', async () => {
    const broken = { getKey: () => 'broken', getBytes: async () => ({ data: new ArrayBuffer(127) }) }
    await expect(pmtiles.discover(broken)).rejects.toThrow()
    await expect(pmtiles.discover(42)).rejects.toThrow('input must be')
  })
})

describe('pmtiles.discover header and metadata', () => {
  it('keeps an extent crossing the antimeridian', async () => {
    const result = await discoverWith({ minLon: 170, minLat: -20, maxLon: -170, maxLat: 10, centerLon: 180, centerLat: -5 })
    expect(result.extent).toEqual([170, -20, -170, 10])
    expect(result.center).toEqual([180, -5])
  })
  it('gives no extent for invalid bounds', async () => {
    expect((await discoverWith({ minLat: 51, maxLat: 42 })).extent).toBeUndefined()
    expect((await discoverWith({ maxLat: Infinity })).extent).toBeUndefined()
  })
  it('prefers valid legacy metadata bounds to zero header bounds', async () => {
    const zero = { minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 }
    expect((await discoverWith(zero, { bounds: '-5,42,8,51' })).extent).toEqual([-5, 42, 8, 51])
    expect((await discoverWith(zero, { bounds: [-5, 42, 8, 51] })).extent).toEqual([-5, 42, 8, 51])
  })
  it('keeps zero header bounds otherwise, as they are valid', async () => {
    const zero = { minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 }
    expect((await discoverWith(zero)).extent).toEqual([0, 0, 0, 0])
    expect((await discoverWith(zero, { bounds: '-5,51,8,42' })).extent).toEqual([0, 0, 0, 0])
    // Header bounds that are set are never replaced by metadata ones.
    expect((await discoverWith({}, { bounds: '0,0,1,1' })).extent).toEqual([-5, 42, 8, 51])
  })
  it('decodes the center independently of the bounds', async () => {
    const result = await discoverWith({ minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 })
    expect(result).toMatchObject({ center: [1.5, 46.5], centerZoom: 6 })
    expect((await discoverWith({ minLat: 51, maxLat: 42 })).center).toEqual([1.5, 46.5])
  })
  it('prefers a valid legacy metadata center to a zero header center', async () => {
    const zero = { centerLon: 0, centerLat: 0, centerZoom: 0 }
    expect(await discoverWith(zero, { center: '1.5,46.5,7' })).toMatchObject({ center: [1.5, 46.5], centerZoom: 7 })
    const withoutZoom = await discoverWith(zero, { center: [2, 47] })
    expect(withoutZoom.center).toEqual([2, 47])
    expect(withoutZoom.centerZoom).toBeUndefined()
    expect(await discoverWith(zero)).toMatchObject({ center: [0, 0], centerZoom: 0 })
  })
  it('exposes the center only when it is valid', async () => {
    expect(await discoverWith({})).toMatchObject({ center: [1.5, 46.5], centerZoom: 6 })
    const noZoom = await discoverWith({ centerZoom: -1 })
    expect(noZoom.center).toEqual([1.5, 46.5])
    expect(noZoom.centerZoom).toBeUndefined()
    expect((await discoverWith({ centerLat: NaN })).center).toBeUndefined()
  })
  it('names every tile type of the specification', async () => {
    const names = ['unknown', 'mvt', 'png', 'jpeg', 'webp', 'avif', 'mlt']
    for (const [tileType, name] of names.entries()) {
      expect((await discoverWith({ tileType })).tileType).toBe(name)
    }
    // A type outside the specification stays undefined.
    expect((await discoverWith({ tileType: 42 })).tileType).toBeUndefined()
  })
  it('exposes non empty names, descriptions and attributions only', async () => {
    const result = await discoverWith({}, { name: 'Roads', description: '  ', attribution: 42 })
    expect(result.title).toBe('Roads')
    expect(result.description).toBeUndefined()
    expect(result.attribution).toBeUndefined()
  })
  it.each([
    ['a minimum above the maximum', { minZoom: 10, maxZoom: 2 }],
    ['a negative zoom', { minZoom: -1 }],
    ['a fractional zoom', { maxZoom: 12.5 }]
  ])('rejects a header with %s', async (_, header) => {
    await expect(discoverWith(header)).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: expect.stringContaining('PMTiles header') })
  })
})
