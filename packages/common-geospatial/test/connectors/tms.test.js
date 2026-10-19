import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '@kalisio/common-core/io/xml'
import { reprojectPosition } from '../../src/foundation/index.js'
import { tms } from '../../src/connectors/index.js'

vi.mock('@kalisio/common-core/io/xml', async (importOriginal) => {
  const { xml } = await importOriginal()
  return { xml: { ...xml, read: vi.fn() } }
})

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, 'fixtures', name), 'utf-8')
const parse = (text) => xml.parse(text, { output: 'dom' })

const ROOT = 'https://example.com/tms/1.0.0/'
const ROADS = 'https://example.com/tms/1.0.0/roads%40EPSG%3A900913%40png'
const DEM = 'https://example.com/tms/1.0.0/dem%40EPSG%3A4326%40jpeg'

// Inline documents for the edge cases.
const service = (...hrefs) => `<TileMapService version="1.0.0"><Title>Inline</Title><TileMaps>${
  hrefs.map((href) => `<TileMap href="${href}"/>`).join('')}</TileMaps></TileMapService>`
const tileMap = ({ version = '1.0.0', format = 'width="256" height="256" mime-type="image/png" extension="png"', tileSets = '' } = {}) =>
  `<TileMap version="${version}"><Title>Inline map</Title><SRS>EPSG:3857</SRS><TileFormat ${format}/><TileSets profile="global-mercator">${tileSets}</TileSets></TileMap>`
const tileSet = (href, order, unitsPerPixel = '1') => `<TileSet href="${href}" order="${order}" units-per-pixel="${unitsPerPixel}"/>`

// Serve documents by URL, ignoring query parameters, and record requests.
function serve (documents) {
  xml.read.mockReset()
  xml.read.mockImplementation(async (source) => {
    const target = new URL(source)
    target.search = ''
    if (!(target.href in documents)) throw new Error(`unexpected request ${source}`)
    return parse(documents[target.href])
  })
}
const requested = () => xml.read.mock.calls.map(([source]) => source)

// Discover a single inline TileMap listed by a TileMapService at ROOT.
async function discoverOne (tileMapDocument, href = 'map/') {
  const [layer] = (await tms.discover(ROOT, {
    service: await parse(service(href)),
    details: { [href]: await parse(tileMapDocument) }
  })).layers
  return layer
}

describe('tms.discover', () => {
  beforeEach(() => serve({
    [ROOT]: fixture('tms-service.xml'),
    [ROADS]: fixture('tms-roads.xml'),
    [DEM]: fixture('tms-dem.xml')
  }))

  it('reads the TileMapService, then each TileMap', async () => {
    const result = await tms.discover(ROOT)
    expect(requested()).toEqual([ROOT, ROADS, DEM])
    expect(result).toMatchObject({ version: '1.0.0', title: 'Demo TMS' })
    expect(result.layers.map((layer) => layer.id)).toEqual(['roads@EPSG:900913@png', 'dem@EPSG:4326@jpeg'])
  })

  it('decodes TileMap metadata', async () => {
    const [roads, dem] = (await tms.discover(ROOT)).layers
    expect(roads).toMatchObject({
      title: 'Roads',
      description: 'Road network',
      crs: 'EPSG:3857',
      scheme: 'tms',
      profile: 'global-mercator',
      origin: [-20037508.34, -20037508.34],
      format: { mimeType: 'image/png', extension: 'png', width: 256, height: 256 }
    })
    const [west, south, east, north] = roads.extent
    expect([west, south, east, north].map((value) => Math.round(value))).toEqual([-5, 42, 8, 51])
    expect(dem).toMatchObject({ crs: 'EPSG:4326', profile: 'global-geodetic', extent: [-180, -90, 180, 90] })
  })

  it('keeps TileSet metadata, sorted by order, and builds the tile URL template', async () => {
    const [roads] = (await tms.discover(ROOT)).layers
    expect(roads.tileSets).toEqual([
      { href: `${ROADS}/0`, order: 0, unitsPerPixel: 156543.03392804097 },
      { href: `${ROADS}/1`, order: 1, unitsPerPixel: 78271.51696402048 },
      { href: `${ROADS}/2`, order: 2, unitsPerPixel: 39135.75848201024 }
    ])
    expect(roads).toMatchObject({ tileUrl: `${ROADS}/{z}/{x}/{y}.png`, minZoom: 0, maxZoom: 2 })
  })
  it('appends searchParams to every request and to tile URLs, and forwards request options', async () => {
    const signal = new AbortController().signal
    const [roads] = (await tms.discover(ROOT, { searchParams: { apikey: 'secret' }, request: { signal, timeout: 5000 } })).layers
    expect(requested().every((source) => new URL(source).searchParams.get('apikey') === 'secret')).toBe(true)
    expect(xml.read.mock.calls.every(([, options]) => options.request.signal === signal && options.output === 'dom')).toBe(true)
    expect(roads.tileUrl).toBe(`${ROADS}/{z}/{x}/{y}.png?apikey=secret`)
  })
  it('ignores empty searchParams', async () => {
    const [roads] = (await tms.discover(ROOT, { searchParams: {} })).layers
    expect(requested()).toEqual([ROOT, ROADS, DEM])
    expect(roads.tileUrl).toBe(`${ROADS}/{z}/{x}/{y}.png`)
  })
  it('propagates the failure of a single TileMap', async () => {
    xml.read.mockImplementation(async (source) => {
      if (source === ROOT) return parse(fixture('tms-service.xml'))
      throw Object.assign(new Error('Not Found'), { code: 'READ_FAILED' })
    })
    await expect(tms.discover(ROOT)).rejects.toMatchObject({ code: 'READ_FAILED' })
  })
})

describe('tms.discover with relative URLs', () => {
  it('resolves TileMap hrefs against the TileMapService URL and TileSet hrefs against their TileMap URL', async () => {
    const MAP = 'https://example.com/tms/1.0.0/roads/'
    serve({
      [ROOT]: service('roads/', '/tms/1.0.0/rivers'),
      [MAP]: tileMap({ tileSets: tileSet('0', 0) + tileSet('1', 1) }),
      'https://example.com/tms/1.0.0/rivers': tileMap({ tileSets: tileSet('rivers/0', 0) + tileSet('rivers/1', 1) })
    })
    const [roads, rivers] = (await tms.discover(ROOT)).layers
    expect(requested()).toEqual([ROOT, MAP, 'https://example.com/tms/1.0.0/rivers'])
    expect(roads.id).toBe('roads')
    expect(roads.tileSets.map((entry) => entry.href)).toEqual([`${MAP}0`, `${MAP}1`])
    expect(roads.tileUrl).toBe(`${MAP}{z}/{x}/{y}.png`)
    // Resolved like a browser would: 'rivers/0' against '…/1.0.0/rivers'.
    expect(rivers.id).toBe('rivers')
    expect(rivers.tileUrl).toBe('https://example.com/tms/1.0.0/rivers/{z}/{x}/{y}.png')
  })
  it('accepts pre-fetched TileMaps keyed by their resolved or original href', async () => {
    const options = {
      service: await parse(service('roads/', 'rivers/')),
      details: {
        'https://example.com/tms/1.0.0/roads/': await parse(tileMap({ tileSets: tileSet('0', 0) })),
        'rivers/': await parse(tileMap({ tileSets: tileSet('0', 0) }))
      }
    }
    serve({})
    const layers = (await tms.discover(ROOT, options)).layers
    expect(xml.read).not.toHaveBeenCalled()
    expect(layers.map((layer) => layer.tileUrl)).toEqual([
      'https://example.com/tms/1.0.0/roads/{z}/{x}/{y}.png',
      'https://example.com/tms/1.0.0/rivers/{z}/{x}/{y}.png'
    ])
  })
  it('never encodes placeholders nor decodes what the URL already encodes', async () => {
    const layer = await (async () => {
      const [found] = (await tms.discover(ROOT, {
        service: await parse(service('a%7Bb%7D/')),
        details: { 'a%7Bb%7D/': await parse(tileMap({ tileSets: tileSet('0', 0) })) },
        searchParams: { key: 'secret' }
      })).layers
      return found
    })()
    expect(layer.id).toBe('a{b}')
    expect(layer.tileUrl).toBe('https://example.com/tms/1.0.0/a%7Bb%7D/{z}/{x}/{y}.png?key=secret')
  })
})

describe('tms.discover tile URL templates', () => {
  it('uses the levels advertised by TileSet orders, whatever the URL looks like', async () => {
    const layer = await discoverOne(tileMap({ tileSets: tileSet('level10', 10) + tileSet('level11', 11) }))
    expect(layer).toMatchObject({ tileUrl: `${ROOT}map/level{z}/{x}/{y}.png`, minZoom: 10, maxZoom: 11 })
  })
  it.each([
    ['hrefs that do not end with their order', tileSet('low', 0) + tileSet('high', 1)],
    // Syntactically fine ('…/5', '…/6'), but those numbers are not the orders.
    ['hrefs whose number differs from their order', tileSet('5', 0) + tileSet('6', 1)],
    ['different prefixes', tileSet('a/0', 0) + tileSet('b/1', 1)],
    ['trailing digits that are not the order', tileSet('level10', 0) + tileSet('level11', 1)],
    ['non-consecutive levels', tileSet('0', 0) + tileSet('5', 5)],
    ['duplicate orders', tileSet('0', 0) + tileSet('0', 0)],
    ['a missing order', tileSet('0', 0) + '<TileSet href="1" units-per-pixel="1"/>'],
    ['a query in the prefix', tileSet('0?v=1', 0)]
  ])('generates no template for %s, but keeps the TileSets', async (_, tileSets) => {
    const layer = await discoverOne(tileMap({ tileSets }))
    expect(layer.tileUrl).toBeUndefined()
    expect(layer.minZoom).toBeUndefined()
    expect(layer.tileSets.length).toBeGreaterThan(0)
    expect(layer.tileSets.every((entry) => entry.href.startsWith(ROOT))).toBe(true)
  })

  it('generates no template without a tile extension', async () => {
    const layer = await discoverOne(tileMap({ format: 'mime-type="image/png"', tileSets: tileSet('0', 0) }))
    expect(layer.format).toEqual({ mimeType: 'image/png' })
    expect(layer.tileUrl).toBeUndefined()
    expect(layer.tileSets).toEqual([{ href: `${ROOT}map/0`, order: 0, unitsPerPixel: 1 }])
  })
})

describe('tms.discover extents', () => {
  it('reprojects the whole bounding box, not only its corners', async () => {
    // A wide Lambert-93 box: its parallels are arcs, so the northernmost point
    // lies in the middle of the top edge, north of both top corners.
    const [minX, minY, maxX, maxY] = [100000, 6100000, 1300000, 7100000]
    const layer = await discoverOne(`
      <TileMap version="1.0.0">
        <SRS>EPSG:2154</SRS>
        <BoundingBox minx="${minX}" miny="${minY}" maxx="${maxX}" maxy="${maxY}"/>
        <TileFormat extension="png"/>
        <TileSets/>
      </TileMap>`)
    const corners = [[minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY]]
      .map((corner) => reprojectPosition(corner, 'EPSG:2154', 'EPSG:4326'))
    const cornersNorth = Math.max(...corners.map(([, latitude]) => latitude))
    const [, topMiddle] = reprojectPosition([(minX + maxX) / 2, maxY], 'EPSG:2154', 'EPSG:4326')
    expect(topMiddle).toBeGreaterThan(cornersNorth + 0.1)
    expect(layer.extent[3]).toBeGreaterThanOrEqual(topMiddle - 1e-9)
  })
  it('gives no extent for an inverted box', async () => {
    const layer = await discoverOne(`
      <TileMap version="1.0.0"><SRS>EPSG:4326</SRS>
        <BoundingBox minx="-5" miny="51" maxx="8" maxy="42"/>
        <TileFormat extension="png"/><TileSets/>
      </TileMap>`)
    expect(layer.extent).toBeUndefined()
  })
  it('gives no extent for a box crossing the antimeridian, rather than a wrong one', async () => {
    const layer = await discoverOne(`
      <TileMap version="1.0.0"><SRS>EPSG:4326</SRS>
        <BoundingBox minx="170" miny="-20" maxx="-170" maxy="10"/>
        <TileFormat extension="png"/><TileSets/>
      </TileMap>`)
    expect(layer.extent).toBeUndefined()
  })
})

describe('tms.discover metadata validation', () => {
  it('only exposes valid numeric metadata', async () => {
    const layer = await discoverOne(`
      <TileMap version="1.0.0">
        <SRS>EPSG:3857</SRS>
        <BoundingBox minx="a" miny="0" maxx="1" maxy="1"/>
        <Origin x="-20037508.34"/>
        <TileFormat width="abc" height="-256" mime-type="image/png" extension="png"/>
        <TileSets>
          <TileSet href="0" order="0" units-per-pixel="-1"/>
          <TileSet href="1" order="1.5" units-per-pixel="nope"/>
        </TileSets>
      </TileMap>`)
    expect(layer.extent).toBeUndefined()
    expect(layer.origin).toBeUndefined()
    expect(layer.format).toEqual({ mimeType: 'image/png', extension: 'png' })
    expect(layer.profile).toBeUndefined()
    expect(layer.tileSets).toEqual([{ href: `${ROOT}map/0`, order: 0 }, { href: `${ROOT}map/1` }])
    // Title falls back to the identifier taken from the URL.
    expect(layer.title).toBe('map')
  })
})

describe('tms.discover hrefs', () => {
  it('rejects a TileMap entry without href', async () => {
    for (const entry of ['<TileMap title="No href"/>', '<TileMap href=""/>']) {
      const options = {
        service: await parse(`<TileMapService version="1.0.0"><TileMaps><TileMap href="map/"/>${entry}</TileMaps></TileMapService>`),
        details: { 'map/': await parse(tileMap({ tileSets: tileSet('0', 0) })) }
      }
      await expect(tms.discover(ROOT, options)).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
    }
  })
  it('rejects a TileMap href that cannot be resolved', async () => {
    const options = { service: await parse(service('http://[invalid/map')) }
    await expect(tms.discover(ROOT, options)).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
  it('rejects relative TileMap hrefs when the service location is not a URL', async () => {
    const options = { service: await parse(service('map/')) }
    await expect(tms.discover('catalog.xml', options))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: expect.stringContaining('map/') })
  })
  it('accepts absolute TileMap hrefs whatever the service location', async () => {
    const options = {
      service: await parse(service(`${ROOT}map/`)),
      details: { [`${ROOT}map/`]: await parse(tileMap({ tileSets: tileSet('0', 0) })) }
    }
    const [layer] = (await tms.discover('catalog.xml', options)).layers
    expect(layer.tileUrl).toBe(`${ROOT}map/{z}/{x}/{y}.png`)
  })
  it('rejects a TileSet href that cannot be resolved', async () => {
    await expect(discoverOne(tileMap({ tileSets: tileSet('http://[invalid/0', 0) })))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('tms.discover searchParams', () => {
  it('applies to requests and tileUrl, not to TileSet hrefs', async () => {
    serve({
      [ROOT]: fixture('tms-service.xml'),
      [ROADS]: fixture('tms-roads.xml'),
      [DEM]: fixture('tms-dem.xml')
    })
    const [roads] = (await tms.discover(ROOT, { searchParams: { apikey: 'secret' } })).layers
    expect(requested().every((source) => source.includes('apikey=secret'))).toBe(true)
    expect(roads.tileUrl).toBe(`${ROADS}/{z}/{x}/{y}.png?apikey=secret`)
    expect(roads.tileSets.map((entry) => entry.href)).toEqual([`${ROADS}/0`, `${ROADS}/1`, `${ROADS}/2`])
  })
  it('leaves TileSet hrefs as advertised when no tileUrl can be generated', async () => {
    const MAP = `${ROOT}map/`
    serve({
      [ROOT]: service('map/'),
      [MAP]: tileMap({ tileSets: tileSet('low', 0) + tileSet('high', 1) })
    })
    const [layer] = (await tms.discover(ROOT, { searchParams: { apikey: 'secret' } })).layers
    expect(requested()).toEqual([`${ROOT}?apikey=secret`, `${MAP}?apikey=secret`])
    expect(layer.tileUrl).toBeUndefined()
    expect(layer.tileSets.map((entry) => entry.href)).toEqual([`${MAP}low`, `${MAP}high`])
  })
})

describe('tms.discover errors', () => {
  it('rejects an unsupported TileMapService version', async () => {
    const options = { service: await parse('<TileMapService version="2.0.0"><TileMaps/></TileMapService>') }
    await expect(tms.discover(ROOT, options)).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })

  it('rejects an unsupported TileMap version', async () => {
    await expect(discoverOne(tileMap({ version: '2.0.0' }))).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })

  it('rejects documents that are not TMS documents', async () => {
    await expect(tms.discover(ROOT, { service: await parse('<Nothing/>') }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
    await expect(discoverOne('<Nothing/>')).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })

  it('propagates malformed XML errors', async () => {
    xml.read.mockReset()
    xml.read.mockRejectedValue(Object.assign(new Error('Invalid XML'), { code: 'PARSE_FAILED' }))
    await expect(tms.discover(ROOT)).rejects.toMatchObject({ code: 'PARSE_FAILED' })
  })

  it('validates its arguments', async () => {
    await expect(tms.discover('')).rejects.toThrow()
    await expect(tms.discover(ROOT, { searchParams: 'apikey=secret' })).rejects.toThrow()
  })
})
