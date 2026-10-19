import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '@kalisio/common-core/io/xml'
import { wmts } from '../../../src/connectors/index.js'

vi.mock('@kalisio/common-core/io/xml', async (importOriginal) => {
  const { xml } = await importOriginal()
  return { xml: { ...xml, read: vi.fn() } }
})

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, '../fixtures', name), 'utf-8')
const parse = (name) => xml.parse(fixture(name), { output: 'dom' })
const BASE = 'https://example.com/gwc/service/wmts'
const discover = async () => wmts.discover(BASE, { capabilities: await parse('wmts-1.0.0.xml') })

const capabilitiesOf = ({ operations = '', contents = '', withContents = true } = {}) => xml.parse(`
  <Capabilities version="1.0.0" xmlns="http://www.opengis.net/wmts/1.0"
    xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
    <ows:OperationsMetadata>${operations}</ows:OperationsMetadata>
    ${withContents ? `<Contents>${contents}</Contents>` : ''}
  </Capabilities>`, { output: 'dom' })

const discoverWith = async (parts, base = 'https://example.com/geoserver/gwc/service/wmts?SERVICE=WMTS') =>
  wmts.discover(base, { capabilities: await capabilitiesOf(parts) })

const getTile = (href) => `<ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="${href}"/></ows:HTTP></ows:DCP></ows:Operation>`
const layer = (inner, id = 'roads') => `<Layer><ows:Identifier>${id}</ows:Identifier>${inner}</Layer>`

const tileMatrix = ({ id = '0', scale = '559082264.0287178', corner = '-20037508.34 20037508.34', tileWidth = '256', tileHeight = '256', matrixWidth = '1', matrixHeight = '1' } = {}) =>
  `<TileMatrix><ows:Identifier>${id}</ows:Identifier><ScaleDenominator>${scale}</ScaleDenominator><TopLeftCorner>${corner}</TopLeftCorner>` +
  `<TileWidth>${tileWidth}</TileWidth><TileHeight>${tileHeight}</TileHeight><MatrixWidth>${matrixWidth}</MatrixWidth><MatrixHeight>${matrixHeight}</MatrixHeight></TileMatrix>`

const matrixSetOf = (...matrices) => `<TileMatrixSet><ows:Identifier>WebMercatorQuad</ows:Identifier><ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>${matrices.join('')}</TileMatrixSet>`
const matrixSet = matrixSetOf(tileMatrix())

beforeEach(() => {
  xml.read.mockReset()
})

describe('wmts.getCapabilities', () => {
  it('sends a KVP GetCapabilities request and asks for a DOM', async () => {
    xml.read.mockResolvedValue(await parse('wmts-1.0.0.xml'))
    const signal = new AbortController().signal
    await wmts.getCapabilities(BASE, { request: { signal } })
    expect(xml.read).toHaveBeenCalledOnce()
    const [requestUrl, options] = xml.read.mock.calls[0]
    expect(Object.fromEntries(new URL(requestUrl).searchParams))
      .toEqual({ SERVICE: 'WMTS', REQUEST: 'GetCapabilities', VERSION: '1.0.0' })
    expect(options).toEqual({ request: { signal }, output: 'dom' })
  })
  it('forwards additional query parameters', async () => {
    xml.read.mockResolvedValue(await parse('wmts-1.0.0.xml'))
    await wmts.getCapabilities(BASE, {
      searchParams: { apiKey: 'test-key', vendor: 'custom' }
    })
    const [requestUrl] = xml.read.mock.calls[0]
    expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
      apiKey: 'test-key',
      vendor: 'custom',
      SERVICE: 'WMTS',
      REQUEST: 'GetCapabilities',
      VERSION: '1.0.0'
    })
  })
  it('rejects unsupported versions without issuing a request', async () => {
    await expect(wmts.getCapabilities(BASE, { version: '2.0.0' }))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
    expect(xml.read).not.toHaveBeenCalled()
  })
})

describe('wmts.discover', () => {
  it('fetches capabilities when no document is provided', async () => {
    xml.read.mockResolvedValue(await parse('wmts-1.0.0.xml'))
    const service = await wmts.discover(BASE)
    expect(xml.read).toHaveBeenCalledOnce()
    expect(service.version).toBe('1.0.0')
    expect(service.layers.map((layer) => layer.id)).toEqual(['roads', 'sites'])
  })
  it('decodes the service', async () => {
    const service = await discover()
    expect(service.version).toBe('1.0.0')
    expect(service.title).toBe('Demo WMTS')
    expect(service.tileUrl).toBe('https://tiles.example.com/gwc/service/wmts?')
    expect(service.encodings).toEqual(['KVP', 'REST'])
    expect(service.layers.map((layer) => layer.id)).toEqual(['roads', 'sites'])
  })
  it('decodes layer metadata', async () => {
    const [roads, sites] = (await discover()).layers
    expect(roads).toEqual({
      id: 'roads',
      title: 'Roads',
      description: 'Road network',
      extent: [-5, 42, 8, 51],
      formats: ['image/png', 'image/jpeg'],
      styles: [
        { id: 'light', title: 'light' },
        { id: 'default', title: 'Default style', default: true, legendUrl: 'https://example.com/legend/roads.png' }
      ],
      dimensions: [
        { name: 'Time', units: 'ISO8601', default: '2020-01-01', values: ['2020-01-01', '2021-01-01'] }
      ],
      tileMatrixSets: [
        { id: 'EPSG:4326' },
        {
          id: 'EPSG:900913',
          limits: [
            { tileMatrix: 'EPSG:900913:1', minTileRow: 0, maxTileRow: 1, minTileCol: 0, maxTileCol: 1 },
            { tileMatrix: 'EPSG:900913:2', minTileRow: 1, maxTileRow: 2, minTileCol: 1, maxTileCol: 2 }
          ]
        }
      ],
      resourceUrls: [
        {
          format: 'image/png',
          resourceType: 'tile',
          template: 'https://tiles.example.com/gwc/rest/wmts/roads/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format=image/png&time={Time}'
        },
        {
          format: 'application/json',
          resourceType: 'FeatureInfo',
          template: 'https://tiles.example.com/gwc/rest/wmts/roads/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}?format=application/json'
        }
      ]
    })
    expect(sites.extent).toBeUndefined()
  })
  it('decodes tile matrix sets and how their levels map to zooms', async () => {
    const [mercator, geographic, google, lambert] = (await discover()).tileMatrixSets
    expect(mercator).toMatchObject({
      id: 'EPSG:900913',
      crs: 'EPSG:3857',
      zoom: { template: 'EPSG:900913:{z}', minZoom: 0, maxZoom: 2 }
    })
    expect(mercator.matrices).toHaveLength(3)
    expect(mercator.matrices[0]).toEqual({
      id: 'EPSG:900913:0',
      scaleDenominator: 559082264.0287178,
      topLeftCorner: [-20037508.34, 20037508.34],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 1,
      matrixHeight: 1
    })
    expect(geographic).toMatchObject({ id: 'EPSG:4326', crs: 'EPSG:4326' })
    expect(geographic.matrices[0].topLeftCorner).toEqual([90, -180])
    expect(google).toMatchObject({
      wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible',
      zoom: { template: '{z}', minZoom: 0, maxZoom: 1 }
    })
    expect(lambert).toMatchObject({ id: 'Lambert93', crs: 'EPSG:2154' })
    expect(lambert.zoom).toBeUndefined()
    expect(lambert.matrices.map((matrix) => matrix.id)).toEqual(['coarse', 'fine'])
  })
  it('raises OWS exception reports with the server message', async () => {
    const capabilities = await xml.parse(`
      <ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1" version="1.1.0">
        <ows:Exception exceptionCode="InvalidParameterValue">
          <ows:ExceptionText>Unknown layer</ows:ExceptionText>
        </ows:Exception>
      </ows:ExceptionReport>`, { output: 'dom' })
    await expect(wmts.discover(BASE, { capabilities }))
      .rejects.toMatchObject({
        code: 'OWS_EXCEPTION',
        exceptionCode: 'InvalidParameterValue',
        message: 'Unknown layer'
      })
  })
  it('rejects capabilities of another OWS service', async () => {
    const capabilities = await xml.parse(
      '<Capabilities xmlns="http://www.opengis.net/wcs/1.1.1" version="1.1.1"/>',
      { output: 'dom' }
    )
    await expect(wmts.discover(BASE, { capabilities }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
  it('decodes a pre-fetched document without any request', async () => {
    const capabilities = await parse('wmts-1.0.0.xml')
    const service = await wmts.discover(BASE, { capabilities })
    expect(xml.read).not.toHaveBeenCalled()
    expect(service.layers.map((entry) => entry.id)).toEqual(['roads', 'sites'])
  })
})

describe('wmts.discover URLs', () => {
  it('resolves relative GetTile and legend URLs against the capabilities URL', async () => {
    const service = await discoverWith({
      operations: getTile('../rest/wmts?'),
      contents: layer('<Style isDefault="true"><ows:Identifier>default</ows:Identifier><LegendURL format="image/png" xlink:href="/legends/roads.png"/></Style>') + matrixSet
    })
    expect(service.tileUrl).toBe('https://example.com/geoserver/gwc/rest/wmts?')
    expect(service.layers[0].styles[0].legendUrl).toBe('https://example.com/legends/roads.png')
  })
  it('keeps absolute URLs as written', async () => {
    const service = await discoverWith({
      operations: getTile('https://tiles.example.com/wmts?'),
      contents: matrixSet
    })
    expect(service.tileUrl).toBe('https://tiles.example.com/wmts?')
  })
  it('resolves relative ResourceURL templates without encoding their placeholders', async () => {
    const service = await discoverWith({
      contents: layer(`
        <ResourceURL format="image/png" resourceType="tile" template="tiles/roads/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        <ResourceURL format="image/png" resourceType="tile" template="{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png?time={Time}"/>
        <ResourceURL format="image/jpeg" resourceType="tile" template="https://CDN.example.com/{Style}/{TileMatrix}/{TileRow}/{TileCol}.jpg"/>`) + matrixSet
    })
    expect(service.layers[0].resourceUrls.map((resource) => resource.template)).toEqual([
      'https://example.com/geoserver/gwc/service/tiles/roads/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
      'https://example.com/geoserver/gwc/service/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png?time={Time}',
      'https://CDN.example.com/{Style}/{TileMatrix}/{TileRow}/{TileCol}.jpg'
    ])
    expect(service.layers[0].resourceUrls.filter((resource) => resource.format === 'image/png')).toHaveLength(2)
  })
  it('rejects URLs that cannot be resolved', async () => {
    await expect(discoverWith({
      operations: getTile('wmts?'),
      contents: matrixSet
    }, 'capabilities.xml')).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('wmts.discover malformed documents', () => {
  it('rejects a document without Contents', async () => {
    await expect(discoverWith({ withContents: false }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'missing WMTS Contents element'
      })
  })
  it('rejects a layer without Identifier', async () => {
    await expect(discoverWith({
      contents: '<Layer><ows:Title>No id</ows:Title></Layer>' + matrixSet
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: 'WMTS layer without Identifier'
    })
  })
  it('rejects a TileMatrixSet without Identifier', async () => {
    await expect(discoverWith({
      contents: '<TileMatrixSet><ows:SupportedCRS>EPSG:3857</ows:SupportedCRS></TileMatrixSet>'
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: 'WMTS TileMatrixSet without Identifier'
    })
  })
  it('falls back to the identifier when the title is empty', async () => {
    const service = await discoverWith({
      contents: layer('<ows:Title></ows:Title>') + matrixSet
    })
    expect(service.layers[0].title).toBe('roads')
  })
})

describe('wmts.discover extents', () => {
  const extentOf = async (lower, upper) => (await discoverWith({
    contents: layer(`<ows:WGS84BoundingBox><ows:LowerCorner>${lower}</ows:LowerCorner><ows:UpperCorner>${upper}</ows:UpperCorner></ows:WGS84BoundingBox>`) + matrixSet
  })).layers[0].extent
  it('reduces a 3D WGS84BoundingBox to its horizontal extent', async () => {
    expect(await extentOf('-5 42 0', '8 51 3000')).toEqual([-5, 42, 8, 51])
  })
  it('keeps a box crossing the antimeridian', async () => {
    expect(await extentOf('170 -20', '-170 10')).toEqual([170, -20, -170, 10])
  })
  it('gives no extent for an invalid box', async () => {
    expect(await extentOf('-5 51', '8 42')).toBeUndefined()
    expect(await extentOf('-5 Infinity', '8 51')).toBeUndefined()
  })
})

describe('wmts.discover GetTile endpoints', () => {
  const get = (href, ...values) => values.length === 0
    ? `<ows:Get xlink:href="${href}"/>`
    : `<ows:Get xlink:href="${href}"><ows:Constraint name="GetEncoding"><ows:AllowedValues>${
      values.map((value) => `<ows:Value>${value}</ows:Value>`).join('')
    }</ows:AllowedValues></ows:Constraint></ows:Get>`
  const operation = (...dcps) => `<ows:Operation name="GetTile">${
    dcps.map((gets) => `<ows:DCP><ows:HTTP>${gets}</ows:HTTP></ows:DCP>`).join('')
  }</ows:Operation>`
  it('normalizes encodings and reads every DCP', async () => {
    const service = await discoverWith({
      operations: operation(
        get('https://example.com/rest/', 'RESTful'),
        get('https://example.com/kvp?', 'kvp') + get('https://example.com/soap', 'SOAP')
      ),
      contents: matrixSet
    })
    expect(service.tileEndpoints).toEqual([
      { href: 'https://example.com/rest/', encodings: ['REST'] },
      { href: 'https://example.com/kvp?', encodings: ['KVP'] }
    ])
    expect(service.tileUrl).toBe('https://example.com/kvp?')
    expect(service.encodings).toEqual(['KVP', 'REST'])
  })
  it('assumes KVP for an endpoint without constraint', async () => {
    const service = await discoverWith({
      operations: operation(get('https://example.com/wmts?')),
      contents: matrixSet
    })
    expect(service.tileEndpoints).toEqual([
      { href: 'https://example.com/wmts?', encodings: ['KVP'] }
    ])
  })
  it('gives no tileUrl, rather than the capabilities URL, without a KVP endpoint', async () => {
    const restOnly = await discoverWith({
      operations: operation(get('https://example.com/rest/', 'RESTful')),
      contents: matrixSet
    })
    expect(restOnly.tileUrl).toBeUndefined()
    expect(restOnly.encodings).toEqual(['REST'])
    const none = await discoverWith({ contents: matrixSet })
    expect(none).toMatchObject({ tileEndpoints: [], encodings: [] })
    expect(none.tileUrl).toBeUndefined()
  })
  it('keeps KVP and RESTful endpoints of a single Get, and drops SOAP-only ones', async () => {
    const service = await discoverWith({
      operations: `<ows:Operation name="GetTile"><ows:DCP><ows:HTTP>
        <ows:Get xlink:href="https://example.com/both?"><ows:Constraint name="GetEncoding"><ows:AllowedValues>
          <ows:Value>KVP</ows:Value><ows:Value>RESTful</ows:Value><ows:Value>SOAP</ows:Value>
        </ows:AllowedValues></ows:Constraint></ows:Get>
        <ows:Get xlink:href="https://example.com/soap"><ows:Constraint name="GetEncoding"><ows:AllowedValues>
          <ows:Value>SOAP</ows:Value>
        </ows:AllowedValues></ows:Constraint></ows:Get>
      </ows:HTTP></ows:DCP></ows:Operation>`,
      contents: matrixSet
    })
    expect(service.tileEndpoints).toEqual([
      { href: 'https://example.com/both?', encodings: ['KVP', 'REST'] }
    ])
    expect(service.tileUrl).toBe('https://example.com/both?')
  })
})

describe('wmts.discover dimensions and limits', () => {
  it('keeps everything a Dimension declares', async () => {
    const service = await discoverWith({
      contents: layer(`
        <Dimension>
          <ows:Identifier>elevation</ows:Identifier>
          <ows:Title>Elevation</ows:Title>
          <ows:Abstract>Height above sea level</ows:Abstract>
          <ows:UOM>m</ows:UOM>
          <UnitSymbol>m</UnitSymbol>
          <Default>0</Default>
          <Current>false</Current>
          <Value>0</Value>
          <Value>100/1000/100</Value>
        </Dimension>
        <Dimension>
          <ows:Identifier>time</ows:Identifier>
          <Current>true</Current>
          <Value>2020-01-01</Value>
        </Dimension>`) + matrixSet
    })
    expect(service.layers[0].dimensions).toEqual([
      {
        name: 'elevation',
        title: 'Elevation',
        description: 'Height above sea level',
        units: 'm',
        unitSymbol: 'm',
        default: '0',
        current: false,
        values: ['0', '100/1000/100']
      },
      {
        name: 'time',
        current: true,
        values: ['2020-01-01']
      }
    ])
  })
  it('keeps valid limits', async () => {
    const service = await discoverWith({
      contents: layer(`
        <TileMatrixSetLink>
          <TileMatrixSet>WebMercatorQuad</TileMatrixSet>
          <TileMatrixSetLimits>
            <TileMatrixLimits>
              <TileMatrix>0</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>0</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>0</MaxTileCol>
            </TileMatrixLimits>
          </TileMatrixSetLimits>
        </TileMatrixSetLink>`) + matrixSet
    })
    expect(service.layers[0].tileMatrixSets).toEqual([
      {
        id: 'WebMercatorQuad',
        limits: [
          { tileMatrix: '0', minTileRow: 0, maxTileRow: 0, minTileCol: 0, maxTileCol: 0 }
        ]
      }
    ])
  })
  it.each([
    ['a negative index', '<TileMatrix>0</TileMatrix><MinTileRow>-1</MinTileRow><MaxTileRow>0</MaxTileRow><MinTileCol>0</MinTileCol><MaxTileCol>0</MaxTileCol>', 'invalid MinTileRow'],
    ['a fractional index', '<TileMatrix>0</TileMatrix><MinTileRow>0</MinTileRow><MaxTileRow>0</MaxTileRow><MinTileCol>1.5</MinTileCol><MaxTileCol>3</MaxTileCol>', 'invalid MinTileCol'],
    ['a missing index', '<TileMatrix>0</TileMatrix><MinTileRow>0</MinTileRow><MaxTileRow>0</MaxTileRow><MinTileCol>0</MinTileCol>', 'invalid MaxTileCol'],
    ['rows in reverse order', '<TileMatrix>0</TileMatrix><MinTileRow>3</MinTileRow><MaxTileRow>1</MaxTileRow><MinTileCol>0</MinTileCol><MaxTileCol>0</MaxTileCol>', 'minimum above maximum'],
    ['columns in reverse order', '<TileMatrix>0</TileMatrix><MinTileRow>0</MinTileRow><MaxTileRow>0</MaxTileRow><MinTileCol>2</MinTileCol><MaxTileCol>1</MaxTileCol>', 'minimum above maximum'],
    ['no TileMatrix', '<MinTileRow>0</MinTileRow>', 'without TileMatrix']
  ])('rejects limits with %s', async (_, limits, message) => {
    const contents = layer(`<TileMatrixSetLink><TileMatrixSet>WebMercatorQuad</TileMatrixSet><TileMatrixSetLimits>
      <TileMatrixLimits>${limits}</TileMatrixLimits></TileMatrixSetLimits></TileMatrixSetLink>`) + matrixSet
    await expect(discoverWith({ contents }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: expect.stringContaining(message)
      })
  })
  it('rejects a TileMatrixSetLink without TileMatrixSet', async () => {
    const contents = layer('<TileMatrixSetLink><TileMatrixSet> </TileMatrixSet></TileMatrixSetLink>') + matrixSet
    await expect(discoverWith({ contents }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'WMTS TileMatrixSetLink without TileMatrixSet'
      })
    const empty = layer('<TileMatrixSetLink/>') + matrixSet
    await expect(discoverWith({ contents: empty }))
      .rejects.toMatchObject({ message: 'WMTS TileMatrixSetLink without TileMatrixSet' })
  })
  it('rejects a TileMatrixSet without SupportedCRS', async () => {
    const set = `<TileMatrixSet><ows:Identifier>NoCrs</ows:Identifier>${tileMatrix()}</TileMatrixSet>`
    await expect(discoverWith({ contents: set }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'WMTS TileMatrixSet NoCrs without SupportedCRS'
      })
  })
  it('rejects a TileMatrixSet without TileMatrix', async () => {
    await expect(discoverWith({ contents: matrixSetOf() }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'WMTS TileMatrixSet WebMercatorQuad without TileMatrix'
      })
  })
  it('rejects a TileMatrix without Identifier', async () => {
    const set = '<TileMatrixSet><ows:Identifier>Broken</ows:Identifier><ows:SupportedCRS>EPSG:3857</ows:SupportedCRS><TileMatrix><ScaleDenominator>1</ScaleDenominator></TileMatrix></TileMatrixSet>'
    await expect(discoverWith({ contents: set }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'WMTS TileMatrix without Identifier in Broken'
      })
  })
  it.each([
    ['a zero tile width', { tileWidth: '0' }, 'TileWidth'],
    ['a negative matrix height', { matrixHeight: '-1' }, 'MatrixHeight'],
    ['a fractional tile height', { tileHeight: '256.5' }, 'TileHeight'],
    ['a missing matrix width', { matrixWidth: '' }, 'MatrixWidth'],
    ['a zero scale denominator', { scale: '0' }, 'ScaleDenominator'],
    ['a non numeric scale denominator', { scale: 'Infinity' }, 'ScaleDenominator'],
    ['a single coordinate corner', { corner: '-20037508.34' }, 'TopLeftCorner'],
    ['a non numeric corner', { corner: '-20037508.34 north' }, 'TopLeftCorner'],
    ['an empty corner', { corner: '' }, 'TopLeftCorner']
  ])('rejects a TileMatrix with %s', async (_, values, field) => {
    await expect(discoverWith({
      contents: matrixSetOf(tileMatrix(values))
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: `WMTS TileMatrix 0 of WebMercatorQuad: invalid ${field}`
    })
  })
})

describe('wmts.discover templates and zooms', () => {
  it('resolves a relative REST template starting with {Style}', async () => {
    const service = await discoverWith({
      contents: layer(
        '<ResourceURL format="image/png" resourceType="tile" template="{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/>'
      ) + matrixSet
    })
    expect(service.layers[0].resourceUrls[0].template)
      .toBe('https://example.com/geoserver/gwc/service/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png')
  })
  it('keeps every ResourceURL announcing the same format', async () => {
    const service = await discoverWith({
      contents: layer(`
        <ResourceURL format="image/png" resourceType="tile" template="https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        <ResourceURL format="image/png" resourceType="tile" template="https://b.example.com/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        <ResourceURL format="image/png" resourceType="FeatureInfo" template="https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.png"/>`) + matrixSet
    })
    expect(service.layers[0].resourceUrls).toEqual([
      {
        format: 'image/png',
        resourceType: 'tile',
        template: 'https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}.png'
      },
      {
        format: 'image/png',
        resourceType: 'tile',
        template: 'https://b.example.com/{TileMatrix}/{TileRow}/{TileCol}.png'
      },
      {
        format: 'image/png',
        resourceType: 'FeatureInfo',
        template: 'https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.png'
      }
    ])
  })
  it('gives a syntactic zoom template without implying an XYZ grid', async () => {
    const service = await discoverWith({
      contents: matrixSetOf(
        tileMatrix({ id: 'EPSG:4326:0' }),
        tileMatrix({
          id: 'EPSG:4326:1',
          scale: '279541132.0143589',
          matrixWidth: '2',
          matrixHeight: '2'
        })
      )
    })
    const [set] = service.tileMatrixSets
    expect(set.matrices.map((matrix) => matrix.id)).toEqual(['EPSG:4326:0', 'EPSG:4326:1'])
    expect(set.zoom).toEqual({
      template: 'EPSG:4326:{z}',
      minZoom: 0,
      maxZoom: 1
    })
  })
})
