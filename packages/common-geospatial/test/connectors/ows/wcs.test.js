import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '@kalisio/common-core/io/xml'
import { wcs } from '../../../src/connectors/index.js'

vi.mock('@kalisio/common-core/io/xml', async (importOriginal) => {
  const { xml } = await importOriginal()
  return { xml: { ...xml, read: vi.fn() } }
})

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, '../fixtures', name), 'utf-8')
const parse = (name) => xml.parse(fixture(name), { output: 'dom' })
const BASE = 'https://example.com/wcs'
const query = (requestUrl) => Object.fromEntries(new URL(requestUrl).searchParams)

// Inline capabilities: `request` goes inside <Capability><Request>, `offerings`
// inside <ContentMetadata>.
const capabilitiesOf = ({ version = '1.0.0', request = '', offerings = '', withCapability = true, contents } = {}) => xml.parse(`
  <WCS_Capabilities version="${version}" xmlns="http://www.opengis.net/wcs"
    xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink">
    <Service><name>WCS</name><label>Inline</label></Service>
    ${withCapability ? `<Capability><Request>${request}</Request></Capability>` : ''}
    ${contents ?? `<ContentMetadata>${offerings}</ContentMetadata>`}
  </WCS_Capabilities>`, { output: 'dom' })

const discoverWith = async (parts, base = 'https://example.com/geoserver/ows?service=WCS') =>
  wcs.discover(base, { capabilities: await capabilitiesOf(parts) })

const offering = (inner, name = 'dem') => `<CoverageOfferingBrief><name>${name}</name>${inner}</CoverageOfferingBrief>`
const envelope = (...positions) => `<lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">${positions.map((position) => `<gml:pos>${position}</gml:pos>`).join('')}</lonLatEnvelope>`
const extentOf = async (...positions) => (await discoverWith({ offerings: offering(envelope(...positions)) })).layers[0].extent

beforeEach(() => {
  xml.read.mockReset()
})

describe('wcs.getCapabilities and wcs.discover over HTTP', () => {
  it('pins VERSION=1.0.0 and forwards transport options', async () => {
    xml.read.mockResolvedValue(await parse('wcs-1.0.0.xml'))
    await wcs.discover(BASE, { searchParams: { apikey: 'secret' }, request: { timeout: 5000 } })
    expect(xml.read).toHaveBeenCalledOnce()
    const [requestUrl, options] = xml.read.mock.calls[0]
    expect(query(requestUrl)).toEqual({ apikey: 'secret', SERVICE: 'WCS', REQUEST: 'GetCapabilities', VERSION: '1.0.0' })
    expect(options).toEqual({ request: { timeout: 5000 }, output: 'dom' })
  })
  it('refuses to request another version', async () => {
    await expect(wcs.getCapabilities(BASE, { version: '2.0.1' })).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
    expect(xml.read).not.toHaveBeenCalled()
  })
})

describe('wcs.discover (pre-fetched document)', () => {
  it('decodes coverage offerings without any request', async () => {
    const service = await wcs.discover(BASE, { capabilities: await parse('wcs-1.0.0.xml') })
    expect(xml.read).not.toHaveBeenCalled()
    expect(service).toEqual({
      version: '1.0.0',
      title: 'Demo WCS',
      coverageUrl: 'https://data.example.com/wcs?',
      coverageEndpoints: [
        { href: 'https://data.example.com/wcs?', method: 'GET' },
        { href: 'https://data.example.com/wcs', method: 'POST' }
      ],
      layers: [
        { id: 'dem', title: 'Elevation', description: 'Digital elevation model', extent: [-5, 42, 8, 51] },
        { id: 'temperature', title: 'temperature', extent: [-180, -90, 180, 90], timePositions: ['2020-01-01T00:00:00Z', '2020-12-31T00:00:00Z'] }
      ]
    })
  })
})

describe('wcs.discover GetCoverage endpoints', () => {
  const getCoverage = (...dcps) => `<GetCoverage>${dcps.map((http) => `<DCPType><HTTP>${http}</HTTP></DCPType>`).join('')}</GetCoverage>`
  const online = (method, href) => `<${method}><OnlineResource xlink:href="${href}"/></${method}>`
  it('keeps GET and POST endpoints across DCPType elements, resolved against the capabilities URL', async () => {
    const service = await discoverWith({
      request: getCoverage(
        online('Post', '/wcs'),
        online('Get', 'wcs?') + online('Get', 'https://alt.example.com/wcs?')
      )
    })
    expect(service.coverageEndpoints).toEqual([
      { href: 'https://example.com/wcs', method: 'POST' },
      { href: 'https://example.com/geoserver/wcs?', method: 'GET' },
      { href: 'https://alt.example.com/wcs?', method: 'GET' }
    ])
    expect(service.coverageUrl).toBe('https://example.com/geoserver/wcs?')
  })
  it('gives no coverageUrl without a GET endpoint', async () => {
    const postOnly = await discoverWith({ request: getCoverage(online('Post', '/wcs')) })
    expect(postOnly.coverageUrl).toBeUndefined()
    const none = await discoverWith({})
    expect(none.coverageEndpoints).toEqual([])
    expect(none.coverageUrl).toBeUndefined()
  })
  it('rejects an endpoint that cannot be resolved', async () => {
    await expect(discoverWith({
      request: getCoverage(online('Get', 'wcs?'))
    }, 'capabilities.xml')).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('wcs.discover envelopes', () => {
  it('reads the lower and upper corners', async () => {
    expect(await extentOf('-5 42', '8 51')).toEqual([-5, 42, 8, 51])
  })
  it('keeps an envelope crossing the antimeridian', async () => {
    // Taking the min and max of the corners would wrongly give the whole world.
    expect(await extentOf('170 -20', '-170 10')).toEqual([170, -20, -170, 10])
  })
  it('ignores a third coordinate, when both corners have one', async () => {
    expect(await extentOf('-5 42 0', '8 51 3000')).toEqual([-5, 42, 8, 51])
    expect(await extentOf('-5 42', '8 51 3000')).toBeUndefined()
    expect(await extentOf('-5 42 0', '8 51')).toBeUndefined()
  })
  it('rejects non-finite coordinates in a 3D envelope', async () => {
    expect(await extentOf('-5 42 Infinity', '8 51 3000')).toBeUndefined()
    expect(await extentOf('-5 42 0', '8 51 NaN')).toBeUndefined()
  })
  it('gives no extent for an invalid envelope', async () => {
    expect(await extentOf('-5 51', '8 42')).toBeUndefined()
    expect(await extentOf('-5 42')).toBeUndefined()
    expect(await extentOf('-5 42', '8 51', '9 52')).toBeUndefined()
    expect(await extentOf('-5', '8')).toBeUndefined()
    expect(await extentOf('-5 Infinity', '8 51')).toBeUndefined()
    expect(await extentOf('-5 42', '')).toBeUndefined()
  })
})

describe('wcs.discover malformed documents', () => {
  it('rejects other versions, naming the one it got', async () => {
    const capabilities = await xml.parse(
      '<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0" version="2.0.1"/>',
      { output: 'dom' }
    )
    await expect(wcs.discover(BASE, { capabilities }))
      .rejects.toMatchObject({
        code: 'UNSUPPORTED_VERSION',
        message: expect.stringContaining('2.0.1')
      })
    await expect(discoverWith({ version: '1.1.0' }))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' })
  })
  it('rejects a document that is not a WCS capabilities document', async () => {
    const capabilities = await xml.parse('<WMS_Capabilities version="1.3.0"/>', { output: 'dom' })
    await expect(wcs.discover(BASE, { capabilities }))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
  it('rejects a document without ContentMetadata', async () => {
    await expect(discoverWith({ contents: '' }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'missing WCS ContentMetadata element'
      })
  })
  it('rejects a document without Capability', async () => {
    await expect(discoverWith({ withCapability: false }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'missing WCS Capability element'
      })
  })
  it('rejects a coverage offering without name', async () => {
    await expect(discoverWith({
      offerings: '<CoverageOfferingBrief><label>No name</label></CoverageOfferingBrief>'
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: 'WCS CoverageOfferingBrief without name'
    })
  })
})

describe('wcs.discover external content metadata', () => {
  it('keeps the reference of offerings described in another document', async () => {
    const service = await discoverWith({
      contents: '<ContentMetadata xlink:href="metadata/coverages.xml"/>'
    })
    expect(service.contentMetadataUrl).toBe('https://example.com/geoserver/metadata/coverages.xml')
    expect(service.layers).toEqual([])
    expect(xml.read).not.toHaveBeenCalled()
  })
  it('has no contentMetadataUrl for inline offerings', async () => {
    const service = await discoverWith({ offerings: offering('') })
    expect(service.contentMetadataUrl).toBeUndefined()
    expect(service.layers.map((layer) => layer.id)).toEqual(['dem'])
  })
  it('rejects a reference that cannot be resolved', async () => {
    await expect(discoverWith({
      contents: '<ContentMetadata xlink:href="metadata/coverages.xml"/>'
    }, 'capabilities.xml')).rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})
