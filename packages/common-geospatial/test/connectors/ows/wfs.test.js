import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '@kalisio/common-core/io/xml'
import { wfs } from '../../../src/connectors/index.js'

vi.mock('@kalisio/common-core/io/xml', async (importOriginal) => {
  const { xml } = await importOriginal()
  return { xml: { ...xml, read: vi.fn() } }
})

const here = dirname(fileURLToPath(import.meta.url))
const parse = (name) => xml.parse(readFileSync(join(here, '../fixtures', name), 'utf-8'), { output: 'dom' })
const query = (requestUrl) => Object.fromEntries(new URL(requestUrl).searchParams)
const GEOSERVER = 'https://example.com/geoserver/wfs'
const MAPSERVER = 'https://example.com/cgi-bin/mapserv?map=demo'

// Inline capabilities: `operations` goes inside <ows:OperationsMetadata>,
// `types` inside <FeatureTypeList>.
const capabilitiesOf = ({ version = '2.0.2', operations = '', types = '', withTypes = true } = {}) => xml.parse(`
  <wfs:WFS_Capabilities version="${version}" xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
    <ows:OperationsMetadata>${operations}</ows:OperationsMetadata>
    ${withTypes ? `<wfs:FeatureTypeList>${types}</wfs:FeatureTypeList>` : ''}
  </wfs:WFS_Capabilities>`, { output: 'dom' })

const discoverWith = async (parts, base = 'https://example.com/geoserver/ows?service=WFS') =>
  wfs.discover(base, { capabilities: await capabilitiesOf(parts) })

const featureType = (inner, name = 'topp:roads') => `<wfs:FeatureType><wfs:Name>${name}</wfs:Name>${inner}</wfs:FeatureType>`

const formats = (values, operation = true) => {
  const parameter = `<ows:Parameter name="outputFormat"><ows:AllowedValues>${values.map((value) => `<ows:Value>${value}</ows:Value>`).join('')}</ows:AllowedValues></ows:Parameter>`
  return operation ? `<ows:Operation name="GetFeature">${parameter}</ows:Operation>` : parameter
}

beforeEach(() => {
  xml.read.mockReset()
})

describe('wfs.getCapabilities and wfs.discover over HTTP', () => {
  it('sends a KVP GetCapabilities request and forwards transport options', async () => {
    xml.read.mockResolvedValue(await parse('wfs-2.0.2.xml'))
    const service = await wfs.discover(GEOSERVER, { version: '2.0.2', searchParams: { apikey: 'secret' }, request: { headers: { Authorization: 'Bearer x' } } })
    expect(xml.read).toHaveBeenCalledOnce()
    const [requestUrl, options] = xml.read.mock.calls[0]
    expect(query(requestUrl)).toEqual({ apikey: 'secret', SERVICE: 'WFS', REQUEST: 'GetCapabilities', VERSION: '2.0.2' })
    expect(options).toEqual({ request: { headers: { Authorization: 'Bearer x' } }, output: 'dom' })
    expect(service.version).toBe('2.0.2')
  })
  it('refuses to request a version it does not implement', async () => {
    await expect(wfs.getCapabilities(GEOSERVER, { version: '1.0.0' })).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
    await expect(wfs.getCapabilities(GEOSERVER, { version: '2.0.1' })).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
    expect(xml.read).not.toHaveBeenCalled()
  })
})

describe('wfs.discover WFS 2.0.2 (pre-fetched document)', () => {
  it('decodes the service without any request', async () => {
    const service = await wfs.discover(GEOSERVER, { capabilities: await parse('wfs-2.0.2.xml') })
    expect(xml.read).not.toHaveBeenCalled()
    expect(service).toMatchObject({
      version: '2.0.2',
      title: 'Demo WFS 2.0',
      featureUrl: 'https://example.com/geoserver/wfs',
      featureEndpoints: [
        { href: 'https://example.com/geoserver/wfs', method: 'GET' },
        { href: 'https://example.com/geoserver/wfs', method: 'POST' }
      ],
      outputFormats: ['application/gml+xml; version=3.2', 'application/json; subtype=topojson', 'application/json', 'csv'],
      // TopoJSON is skipped: generic application/json is the GeoJSON format.
      outputFormat: 'application/json'
    })
  })
  it('decodes feature types', async () => {
    const { layers } = await wfs.discover(GEOSERVER, { capabilities: await parse('wfs-2.0.2.xml') })
    expect(layers).toEqual([
      {
        id: 'topp:roads',
        title: 'Roads',
        description: 'Road network',
        defaultCrs: 'EPSG:4326',
        crs: ['EPSG:4326', 'EPSG:3857'],
        srsNames: ['urn:ogc:def:crs:EPSG::4326', 'urn:ogc:def:crs:EPSG::3857'],
        outputFormats: ['application/json', 'shape-zip'],
        extent: [-5, 42, 8, 51]
      },
      { id: 'topp:islands', title: 'topp:islands', defaultCrs: 'EPSG:4326', crs: ['EPSG:4326'], srsNames: ['urn:ogc:def:crs:EPSG::4326'], extent: [170, -20, -170, 10] },
      { id: 'topp:catalogue', title: 'Catalogue' }
    ])
  })
})

describe('wfs.discover WFS 1.1.0', () => {
  it('reads unwrapped parameter values, SRS elements and relative endpoints', async () => {
    const service = await wfs.discover(MAPSERVER, { capabilities: await parse('wfs-1.1.0.xml') })
    expect(service).toMatchObject({
      version: '1.1.0',
      title: 'Demo WFS 1.1',
      featureUrl: 'https://example.com/cgi-bin/mapserv?map=demo&',
      featureEndpoints: [
        { href: 'https://example.com/cgi-bin/mapserv?map=demo&', method: 'GET' },
        { href: 'https://example.com/cgi-bin/mapserv?map=demo', method: 'POST' }
      ],
      outputFormats: ['text/xml; subtype=gml/3.1.1', 'application/json; subtype=geojson'],
      outputFormat: 'application/json; subtype=geojson'
    })
    expect(service.layers).toEqual([
      { id: 'rivers', title: 'Rivers', defaultCrs: 'EPSG:4326', crs: ['EPSG:4326', 'EPSG:3857', 'EPSG:2154'], srsNames: ['EPSG:4326', 'EPSG:3857', 'EPSG:2154'], extent: [-1, 43, 3, 47] },
      { id: 'stations', title: 'Stations' }
    ])
  })
})

describe('wfs.discover GetFeature endpoints', () => {
  const getFeature = (...dcps) => `<ows:Operation name="GetFeature">${dcps.map((http) => `<ows:DCP><ows:HTTP>${http}</ows:HTTP></ows:DCP>`).join('')}</ows:Operation>`
  it('keeps GET and POST endpoints across DCP elements, in document order', async () => {
    const service = await discoverWith({
      operations: getFeature(
        '<ows:Post xlink:href="https://example.com/post"/><ows:Get xlink:href="wfs?"/>',
        '<ows:Get xlink:href="https://alt.example.com/wfs?"/>'
      )
    })
    expect(service.featureEndpoints).toEqual([
      { href: 'https://example.com/post', method: 'POST' },
      { href: 'https://example.com/geoserver/wfs?', method: 'GET' },
      { href: 'https://alt.example.com/wfs?', method: 'GET' }
    ])
    expect(service.featureUrl).toBe('https://example.com/geoserver/wfs?')
  })
  it('gives no featureUrl when only POST is advertised', async () => {
    const service = await discoverWith({ operations: getFeature('<ows:Post xlink:href="https://example.com/post"/>') })
    expect(service.featureEndpoints).toEqual([{ href: 'https://example.com/post', method: 'POST' }])
    expect(service.featureUrl).toBeUndefined()
  })
  it('gives no featureUrl, rather than the capabilities URL, without any endpoint', async () => {
    const service = await discoverWith({})
    expect(service.featureEndpoints).toEqual([])
    expect(service.featureUrl).toBeUndefined()
  })
  it('rejects an endpoint that cannot be resolved', async () => {
    await expect(discoverWith({ operations: getFeature('<ows:Get xlink:href="wfs?"/>') }, 'capabilities.xml'))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('wfs.discover output formats', () => {
  const geojsonOf = async (values) => (await discoverWith({ operations: formats(values) })).outputFormat
  it('prefers explicit GeoJSON formats, keeping the server spelling', async () => {
    expect(await geojsonOf(['application/json', 'application/geo+json'])).toBe('application/geo+json')
    expect(await geojsonOf(['application/json', 'application/json; subtype=geojson'])).toBe('application/json; subtype=geojson')
    expect(await geojsonOf(['json', 'GEOJSON'])).toBe('GEOJSON')
    expect(await geojsonOf(['application/vnd.geo+json'])).toBe('application/vnd.geo+json')
    expect(await geojsonOf(['Application/JSON; Subtype=GeoJSON'])).toBe('Application/JSON; Subtype=GeoJSON')
  })
  it('reads quoted parameter values', async () => {
    expect(await geojsonOf(['application/json; subtype="topojson"', 'application/json; subtype="geojson"'])).toBe('application/json; subtype="geojson"')
    expect(await geojsonOf(["application/json; subtype='geojson'"])).toBe("application/json; subtype='geojson'")
    expect(await geojsonOf(['application/json; subtype="topojson"'])).toBeUndefined()
  })
  it('ignores parameters unrelated to the subtype', async () => {
    expect(await geojsonOf(['application/json; charset=utf-8'])).toBe('application/json; charset=utf-8')
    expect(await geojsonOf(['application/json; strict'])).toBe('application/json; strict')
  })
  it('falls back to generic JSON, but never to another JSON subtype', async () => {
    expect(await geojsonOf(['application/json; subtype=topojson', 'application/json'])).toBe('application/json')
    expect(await geojsonOf(['text/xml', 'json'])).toBe('json')
    expect(await geojsonOf(['application/json; subtype=topojson'])).toBeUndefined()
    expect(await geojsonOf(['text/xml; subtype=gml/3.1.1'])).toBeUndefined()
  })
  it('skips an empty operation parameter for the global one', async () => {
    const service = await discoverWith({
      operations: '<ows:Operation name="GetFeature"><ows:Parameter name="outputFormat"><ows:AllowedValues/></ows:Parameter></ows:Operation>' +
        formats(['application/json'], false)
    })
    expect(service.outputFormats).toEqual(['application/json'])
    expect(service.outputFormat).toBe('application/json')
  })
  it('prefers the operation parameter over the global one', async () => {
    const service = await discoverWith({ operations: formats(['text/xml']) + formats(['application/json'], false) })
    expect(service.outputFormats).toEqual(['text/xml'])
    expect(service.outputFormat).toBeUndefined()
  })
})

describe('wfs.discover feature types', () => {
  it('lists the default CRS first, without duplicates', async () => {
    const { layers } = await discoverWith({
      types: featureType(`
        <wfs:DefaultCRS>urn:ogc:def:crs:EPSG::2154</wfs:DefaultCRS>
        <wfs:OtherCRS>urn:ogc:def:crs:EPSG::4326</wfs:OtherCRS>
        <wfs:OtherCRS>EPSG:2154</wfs:OtherCRS>`)
    })
    expect(layers[0]).toMatchObject({ defaultCrs: 'EPSG:2154', crs: ['EPSG:2154', 'EPSG:4326'] })
    expect(layers[0].srsNames).toEqual(['urn:ogc:def:crs:EPSG::2154', 'urn:ogc:def:crs:EPSG::4326', 'EPSG:2154'])
  })
  it('keeps each advertised identifier once', async () => {
    const { layers } = await discoverWith({
      types: featureType('<wfs:DefaultCRS>urn:ogc:def:crs:EPSG::4326</wfs:DefaultCRS><wfs:OtherCRS>urn:ogc:def:crs:EPSG::4326</wfs:OtherCRS>')
    })
    expect(layers[0]).toMatchObject({ crs: ['EPSG:4326'], srsNames: ['urn:ogc:def:crs:EPSG::4326'] })
  })
  it('reduces a 3D WGS84BoundingBox to its horizontal extent', async () => {
    const { layers } = await discoverWith({
      types: featureType('<ows:WGS84BoundingBox><ows:LowerCorner>-5 42 0</ows:LowerCorner><ows:UpperCorner>8 51 3000</ows:UpperCorner></ows:WGS84BoundingBox>')
    })
    expect(layers[0].extent).toEqual([-5, 42, 8, 51])
  })
  it('gives no extent for an invalid box', async () => {
    const { layers } = await discoverWith({
      types: featureType('<ows:WGS84BoundingBox><ows:LowerCorner>-5 51</ows:LowerCorner><ows:UpperCorner>8 42</ows:UpperCorner></ows:WGS84BoundingBox>')
    })
    expect(layers[0].extent).toBeUndefined()
  })
})

describe('wfs.discover malformed documents', () => {
  it('rejects a document that is not a WFS capabilities document', async () => {
    const capabilities = await xml.parse('<WMS_Capabilities version="1.3.0"/>', { output: 'dom' })
    await expect(wfs.discover(GEOSERVER, { capabilities })).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
  it('rejects an unsupported version', async () => {
    await expect(discoverWith({ version: '1.0.0' })).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })
  it('accepts WFS 2.0.0', async () => {
    const service = await discoverWith({ version: '2.0.0' })
    expect(service.version).toBe('2.0.0')
  })
  it('rejects a feature type without Name', async () => {
    await expect(discoverWith({ types: '<wfs:FeatureType><wfs:Title>No name</wfs:Title></wfs:FeatureType>' }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES', message: 'WFS FeatureType without Name' })
  })
  it('accepts a service without FeatureTypeList, as WFS 2.0 allows', async () => {
    const service = await discoverWith({ withTypes: false })
    expect(service.layers).toEqual([])
  })
})
