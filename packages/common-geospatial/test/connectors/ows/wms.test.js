import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '@kalisio/common-core/io/xml'
import { wms } from '../../../src/connectors/index.js'
import { reprojectPosition } from '../../../src/foundation/index.js'

vi.mock('@kalisio/common-core/io/xml', async (importOriginal) => {
  const { xml } = await importOriginal()
  return { xml: { ...xml, read: vi.fn() } }
})

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, '../fixtures', name), 'utf-8')
const parse = (name) => xml.parse(fixture(name), { output: 'dom' })

describe('wms.discover', () => {
  it('decodes a WMS 1.3.0 capabilities document', async () => {
    const capabilities = await parse('wms-1.3.0.xml')
    const result = await wms.discover('https://example.com/wms', { capabilities })

    expect(result.version).toBe('1.3.0')
    // Alternate GetMap endpoint advertised by the server.
    expect(result.mapUrl).toBe('https://alt.example.com/wms?')
    // Named layers only, flattened; the unnamed root group is excluded.
    expect(result.layers.map((layer) => layer.id)).toEqual(['roads', 'zones', 'rivers'])
  })

  it('decodes layer metadata, styles and dimensions', async () => {
    const capabilities = await parse('wms-1.3.0.xml')
    const { layers } = await wms.discover('https://example.com/wms', { capabilities })
    const roads = layers.find((layer) => layer.id === 'roads')

    expect(roads.title).toBe('Roads')
    expect(roads.description).toBe('Road network')
    expect(roads.extent).toEqual([-5, 42, 8, 51])
    expect(roads.styles).toEqual([
      { id: 'default', title: 'Default style', legendUrl: 'https://example.com/legend/roads.png' }
    ])
    expect(roads.dimensions).toEqual([
      { name: 'time', units: 'ISO8601', default: '2020-01-01', values: '2020-01-01/2020-12-31/P1M' }
    ])
  })

  it('inherits CRS and extent from ancestor layers', async () => {
    const capabilities = await parse('wms-1.3.0.xml')
    const { layers } = await wms.discover('https://example.com/wms', { capabilities })
    const roads = layers.find((layer) => layer.id === 'roads')
    const rivers = layers.find((layer) => layer.id === 'rivers')

    // roads adds its own CRS on top of the inherited ones.
    expect(roads.crs).toEqual(['EPSG:4326', 'EPSG:3857', 'EPSG:2154'])
    // rivers declares neither CRS nor extent: both come from the root group.
    expect(rivers.crs).toEqual(['EPSG:4326', 'EPSG:3857'])
    expect(rivers.extent).toEqual([-10, 40, 10, 55])
  })

  it('reprojects a projected BoundingBox to a WGS84 extent', async () => {
    const capabilities = await parse('wms-1.3.0.xml')
    const { layers } = await wms.discover('https://example.com/wms', { capabilities })
    const [west, south, east, north] = layers.find((layer) => layer.id === 'zones').extent

    // EPSG:2154 (Lambert-93) box reprojected via the foundation projection API,
    // not a hand-rolled formula. Loose bounds keep the assertion robust.
    expect(west).toBeGreaterThan(1)
    expect(west).toBeLessThan(east)
    expect(east).toBeLessThan(4)
    expect(south).toBeGreaterThan(45)
    expect(south).toBeLessThan(north)
    expect(north).toBeLessThan(48)
  })

  it('handles the WMS 1.1.x capabilities root and its extent/dimension shapes', async () => {
    const capabilities = await parse('wms-1.1.1.xml')
    const result = await wms.discover('https://example.com/wms', { capabilities })

    expect(result.version).toBe('1.1.1')
    expect(result.mapUrl).toBe('https://legacy.example.com/wms?')
    const parcels = result.layers.find((layer) => layer.id === 'parcels')
    // SRS instead of CRS, LatLonBoundingBox instead of EX_GeographicBoundingBox.
    expect(parcels.crs).toEqual(['EPSG:4326', 'EPSG:3857'])
    expect(parcels.extent).toEqual([-3, 43, 7, 50])
    // Time carried by a sibling <Extent>, no <Dimension> values.
    expect(parcels.dimensions).toEqual([
      { name: 'time', default: '2019', values: '2018,2019,2020' }
    ])
  })

  it('throws on a document that is not WMS capabilities', async () => {
    const capabilities = await xml.parse('<root/>', { output: 'dom' })
    await expect(wms.discover('https://example.com/wms', { capabilities }))
      .rejects.toThrow(/not a WMS capabilities document/)
  })
})

describe('wms.getCapabilities', () => {
  beforeEach(async () => {
    xml.read.mockReset()
    xml.read.mockResolvedValue(await parse('wms-1.3.0.xml'))
  })

  it('passes searchParams in the URL and transport options through request', async () => {
    const signal = new AbortController().signal
    await wms.getCapabilities('https://example.com/wms', {
      version: '1.3.0',
      searchParams: { apikey: 'secret' },
      request: { signal, timeout: 5000 }
    })
    const [requestUrl, options] = xml.read.mock.calls[0]
    expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
      SERVICE: 'WMS', REQUEST: 'GetCapabilities', VERSION: '1.3.0', apikey: 'secret'
    })
    expect(options).toEqual({ request: { signal, timeout: 5000 }, output: 'dom' })
  })

  it('refuses to request an unsupported or malformed version', async () => {
    await expect(wms.getCapabilities('https://example.com/wms', { version: '1.0.0' }))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
    await expect(wms.getCapabilities('https://example.com/wms', { version: 'latest' })).rejects.toThrow()
    expect(xml.read).not.toHaveBeenCalled()
  })

  it('raises exception reports served instead of capabilities', async () => {
    xml.read.mockResolvedValue(await xml.parse(
      '<ServiceExceptionReport version="1.3.0"><ServiceException code="InvalidFormat">Bad request</ServiceException></ServiceExceptionReport>',
      { output: 'dom' }))
    await expect(wms.getCapabilities('https://example.com/wms'))
      .rejects.toMatchObject({ code: 'OWS_EXCEPTION', exceptionCode: 'InvalidFormat', message: 'Bad request' })
  })
})

describe('wms.discover versions', () => {
  it('rejects capabilities of an unsupported version', async () => {
    const capabilities = await xml.parse('<WMT_MS_Capabilities version="1.0.0"><Capability/></WMT_MS_Capabilities>', { output: 'dom' })
    await expect(wms.discover('https://example.com/wms', { capabilities }))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION', message: expect.stringContaining('1.0.0') })
  })
})

describe('wms.discover projected extents', () => {
  it('skips boxes reprojectBBox cannot handle instead of failing the discovery', async () => {
    const capabilities = await xml.parse(`
      <WMS_Capabilities version="1.3.0"><Capability>
        <Layer><Name>inverted</Name><BoundingBox CRS="EPSG:2154" minx="100000" miny="7100000" maxx="1300000" maxy="6100000"/></Layer>
        <Layer><Name>wrapped</Name><BoundingBox CRS="EPSG:3857" minx="18000000" miny="0" maxx="-18000000" maxy="1000000"/></Layer>
      </Capability></WMS_Capabilities>`, { output: 'dom' })
    const layers = (await wms.discover('https://example.com/wms', { capabilities })).layers
    expect(layers.map((layer) => [layer.id, layer.extent])).toEqual([['inverted', undefined], ['wrapped', undefined]])
  })
  it('reprojects the whole BoundingBox when no geographic box is given', async () => {
    const [minX, minY, maxX, maxY] = [100000, 6100000, 1300000, 7100000]
    const capabilities = await xml.parse(`
      <WMS_Capabilities version="1.3.0"><Capability><Layer>
        <Name>parcels</Name>
        <BoundingBox CRS="EPSG:2154" minx="${minX}" miny="${minY}" maxx="${maxX}" maxy="${maxY}"/>
      </Layer></Capability></WMS_Capabilities>`, { output: 'dom' })
    const [layer] = (await wms.discover('https://example.com/wms', { capabilities })).layers
    const corners = [[minX, maxY], [maxX, maxY]].map((corner) => reprojectPosition(corner, 'EPSG:2154', 'EPSG:4326'))
    const [, topMiddle] = reprojectPosition([(minX + maxX) / 2, maxY], 'EPSG:2154', 'EPSG:4326')
    expect(topMiddle).toBeGreaterThan(Math.max(...corners.map(([, latitude]) => latitude)) + 0.1)
    expect(layer.extent[3]).toBeGreaterThanOrEqual(topMiddle - 1e-9)
  })
})

// Inline capabilities: `body` goes inside <Capability>.
const capabilitiesOf = (version, body) => xml.parse(version === '1.3.0'
  ? `<WMS_Capabilities version="1.3.0" xmlns:xlink="http://www.w3.org/1999/xlink"><Capability>${body}</Capability></WMS_Capabilities>`
  : `<WMT_MS_Capabilities version="1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink"><Capability>${body}</Capability></WMT_MS_Capabilities>`,
{ output: 'dom' })
const discoverWith = async (version, body, base = 'https://example.com/wms') =>
  wms.discover(base, { capabilities: await capabilitiesOf(version, body) })
const getMap = (href) => `<Request><GetMap><DCPType><HTTP><Get><OnlineResource xlink:href="${href}"/></Get></HTTP></DCPType></GetMap></Request>`

describe('wms.discover malformed documents', () => {
  it.each(['1.3.0', '1.1.1'])('rejects a WMS %s document without Capability', async (version) => {
    const root = version === '1.3.0' ? 'WMS_Capabilities' : 'WMT_MS_Capabilities'
    const capabilities = await xml.parse(`<${root} version="${version}"><Service><Title>No capability</Title></Service></${root}>`, { output: 'dom' })
    await expect(wms.discover('https://example.com/wms', { capabilities }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'missing WMS Capability element' })
  })
})

describe('wms.discover inheritance of styles and dimensions', () => {
  it('adds styles and replaces dimensions by name in WMS 1.3.0', async () => {
    const { layers } = await discoverWith('1.3.0', `
      <Layer>
        <Title>Root</Title>
        <Style><Name>default</Name><Title>Default</Title></Style>
        <Dimension name="time" units="ISO8601" default="2020-01-01">2020-01-01/2020-12-31/P1D</Dimension>
        <Layer>
          <Name>group</Name>
          <Style><Name>night</Name><Title>Night</Title></Style>
          <Dimension name="elevation" units="m" default="0">0,100</Dimension>
          <Layer>
            <Name>leaf</Name>
            <Dimension name="TIME" default="2020-06-01">2020-06-01/2020-06-30/P1D</Dimension>
          </Layer>
        </Layer>
      </Layer>`)
    const [group, leaf] = layers
    expect(group.styles.map((style) => style.id)).toEqual(['default', 'night'])
    expect(group.dimensions).toEqual([
      { name: 'time', units: 'ISO8601', default: '2020-01-01', values: '2020-01-01/2020-12-31/P1D' },
      { name: 'elevation', units: 'm', default: '0', values: '0,100' }
    ])
    expect(leaf.styles.map((style) => style.id)).toEqual(['default', 'night'])
    // The leaf replaces the inherited time dimension, keeping its units.
    expect(leaf.dimensions).toEqual([
      { name: 'TIME', units: 'ISO8601', default: '2020-06-01', values: '2020-06-01/2020-06-30/P1D' },
      { name: 'elevation', units: 'm', default: '0', values: '0,100' }
    ])
  })
  it('completes a 1.1.1 Dimension declared by a parent with the Extent of a child', async () => {
    const { layers } = await discoverWith('1.1.1', `
      <Layer>
        <Title>Root</Title>
        <SRS>EPSG:4326</SRS>
        <Style><Name>default</Name><Title>Default</Title></Style>
        <Dimension name="time" units="ISO8601"/>
        <Layer>
          <Name>parcels</Name>
          <Extent name="time" default="2019">2018,2019,2020</Extent>
        </Layer>
      </Layer>`)
    const [parcels] = layers
    expect(parcels.styles).toEqual([{ id: 'default', title: 'Default' }])
    expect(parcels.dimensions).toEqual([{ name: 'time', units: 'ISO8601', default: '2019', values: '2018,2019,2020' }])
  })
})

describe('wms.discover axis order', () => {
  const extentOf = async (version, box) => (await discoverWith(version, `<Layer><Name>layer</Name>${box}</Layer>`)).layers[0].extent
  const expectExtent = (extent) => {
    expect(extent).toHaveLength(4)
    ;[-5, 42, 8, 51].forEach((value, index) => expect(extent[index]).toBeCloseTo(value, 9))
  }
  it('reads EPSG:4326 boxes latitude first in WMS 1.3.0', async () => {
    expectExtent(await extentOf('1.3.0', '<BoundingBox CRS="EPSG:4326" minx="42" miny="-5" maxx="51" maxy="8"/>'))
    expectExtent(await extentOf('1.3.0', '<BoundingBox CRS="urn:ogc:def:crs:EPSG::4326" minx="42" miny="-5" maxx="51" maxy="8"/>'))
  })
  it('reads CRS:84 boxes longitude first in WMS 1.3.0', async () => {
    expectExtent(await extentOf('1.3.0', '<BoundingBox CRS="CRS:84" minx="-5" miny="42" maxx="8" maxy="51"/>'))
  })
  it('reads EPSG:4326 boxes longitude first in WMS 1.1.1', async () => {
    expectExtent(await extentOf('1.1.1', '<BoundingBox SRS="EPSG:4326" minx="-5" miny="42" maxx="8" maxy="51"/>'))
  })
})

describe('wms.discover GetMap URL', () => {
  const BASE = 'https://example.com/geoserver/ows?service=WMS'
  it('resolves a relative GetMap URL against the capabilities URL', async () => {
    expect((await discoverWith('1.3.0', getMap('wms?'), BASE)).mapUrl).toBe('https://example.com/geoserver/wms?')
    expect((await discoverWith('1.1.1', getMap('/mapserv?map=demo'), BASE)).mapUrl).toBe('https://example.com/mapserv?map=demo')
  })
  it('keeps an absolute GetMap URL, and falls back to the capabilities URL', async () => {
    expect((await discoverWith('1.3.0', getMap('https://alt.example.com/wms?'), BASE)).mapUrl).toBe('https://alt.example.com/wms?')
    expect((await discoverWith('1.3.0', '<Layer><Name>layer</Name></Layer>', BASE)).mapUrl).toBe(BASE)
  })
  it('rejects a relative GetMap URL that cannot be resolved', async () => {
    await expect(discoverWith('1.3.0', getMap('wms?'), 'capabilities.xml')).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('wms.discover parsing', () => {
  const extentOf = async (version, box) => (await discoverWith(version, `<Layer><Name>layer</Name>${box}</Layer>`)).layers[0].extent
  it('rejects non finite or empty coordinates', async () => {
    for (const value of ['Infinity', '-Infinity', 'NaN', '']) {
      expect(await extentOf('1.1.1', `<LatLonBoundingBox minx="${value}" miny="42" maxx="8" maxy="51"/>`)).toBeUndefined()
      expect(await extentOf('1.3.0', `<BoundingBox CRS="CRS:84" minx="-5" miny="42" maxx="8" maxy="${value}"/>`)).toBeUndefined()
    }
    expect(await extentOf('1.3.0', `
      <EX_GeographicBoundingBox>
        <westBoundLongitude>-Infinity</westBoundLongitude><eastBoundLongitude>8</eastBoundLongitude>
        <southBoundLatitude>42</southBoundLatitude><northBoundLatitude>51</northBoundLatitude>
      </EX_GeographicBoundingBox>`)).toBeUndefined()
  })
  it('rejects geographic boxes whose south is north of their north', async () => {
    expect(await extentOf('1.3.0', `
      <EX_GeographicBoundingBox>
        <westBoundLongitude>-5</westBoundLongitude><eastBoundLongitude>8</eastBoundLongitude>
        <southBoundLatitude>51</southBoundLatitude><northBoundLatitude>42</northBoundLatitude>
      </EX_GeographicBoundingBox>`)).toBeUndefined()
    expect(await extentOf('1.1.1', '<LatLonBoundingBox minx="-5" miny="51" maxx="8" maxy="42"/>')).toBeUndefined()
  })
  it('falls back to the next box when a geographic box is invalid', async () => {
    const extent = await extentOf('1.1.1', `
      <LatLonBoundingBox minx="-5" miny="51" maxx="8" maxy="42"/>
      <BoundingBox SRS="EPSG:4326" minx="-5" miny="42" maxx="8" maxy="51"/>`)
    ;[-5, 42, 8, 51].forEach((value, index) => expect(extent[index]).toBeCloseTo(value, 9))
  })
  it('keeps geographic boxes crossing the antimeridian as they are', async () => {
    expect(await extentOf('1.3.0', `
      <EX_GeographicBoundingBox>
        <westBoundLongitude>170</westBoundLongitude><eastBoundLongitude>-170</eastBoundLongitude>
        <southBoundLatitude>-20</southBoundLatitude><northBoundLatitude>10</northBoundLatitude>
      </EX_GeographicBoundingBox>`)).toEqual([170, -20, -170, 10])
    expect(await extentOf('1.1.1', '<LatLonBoundingBox minx="170" miny="-20" maxx="-170" maxy="10"/>')).toEqual([170, -20, -170, 10])
  })
  it('splits 1.1.1 SRS elements listing several identifiers', async () => {
    const { layers } = await discoverWith('1.1.1', `
      <Layer>
        <SRS>EPSG:4326 EPSG:3857</SRS>
        <Layer><Name>layer</Name><SRS>
          EPSG:2154   EPSG:3857
        </SRS></Layer>
      </Layer>`)
    expect(layers[0].crs).toEqual(['EPSG:4326', 'EPSG:3857', 'EPSG:2154'])
  })
})
