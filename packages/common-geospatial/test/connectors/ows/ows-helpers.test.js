import { xml } from '@kalisio/common-core/io/xml'
import { READ_OPTIONS_SCHEMA, owsRequestUrl, readOwsBBox } from '../../../src/connectors/ows/ows-helpers.js'
import * as connectors from '../../../src/connectors/index.js'

const element = async (text) => (await xml.parse(text, { output: 'dom' })).documentElement
const box = (lower, upper) => element(`
  <ows:BoundingBox xmlns:ows="http://www.opengis.net/ows/1.1">
    <ows:LowerCorner>${lower}</ows:LowerCorner><ows:UpperCorner>${upper}</ows:UpperCorner>
  </ows:BoundingBox>`)

describe('readOwsBBox', () => {
  it('reads 2D corners, whatever the prefix and spacing', async () => {
    expect(readOwsBBox(await box('-5 42', ' 8  51 '))).toEqual([-5, 42, 8, 51])
  })
  it('reads 3D corners in the foundation bbox layout', async () => {
    expect(readOwsBBox(await box('2 48 100', '3 49 500'))).toEqual([2, 48, 100, 3, 49, 500])
  })
  it('keeps boxes crossing the antimeridian', async () => {
    expect(readOwsBBox(await box('170 -20', '-170 10'))).toEqual([170, -20, -170, 10])
  })
  it('rejects inverted latitudes or heights', async () => {
    expect(readOwsBBox(await box('-5 51', '8 42'))).toBeUndefined()
    expect(readOwsBBox(await box('2 48 500', '3 49 100'))).toBeUndefined()
  })
  it('rejects corners of different or unsupported dimensions', async () => {
    expect(readOwsBBox(await box('-5 42 0', '8 51'))).toBeUndefined()
    expect(readOwsBBox(await box('-5', '8'))).toBeUndefined()
    expect(readOwsBBox(await box('1 2 3 4', '5 6 7 8'))).toBeUndefined()
  })
  it('rejects missing or non finite coordinates', async () => {
    expect(readOwsBBox(null)).toBeUndefined()
    expect(readOwsBBox(await element('<B><LowerCorner>-5 42</LowerCorner></B>'))).toBeUndefined()
    expect(readOwsBBox(await box('', '8 51'))).toBeUndefined()
    expect(readOwsBBox(await box('-5 x', '8 51'))).toBeUndefined()
    expect(readOwsBBox(await box('-Infinity 42', '8 51'))).toBeUndefined()
  })
})

describe('owsRequestUrl', () => {
  it('builds a KVP request with extra search parameters', () => {
    const requestUrl = owsRequestUrl('https://example.com/wms?map=demo', {
      service: 'WMS', request: 'GetCapabilities', version: '1.3.0', searchParams: { apikey: 'secret' }
    })
    expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
      map: 'demo', SERVICE: 'WMS', REQUEST: 'GetCapabilities', VERSION: '1.3.0', apikey: 'secret'
    })
  })
  it('does not let searchParams override the standard parameters', () => {
    const requestUrl = owsRequestUrl('https://example.com/wms', {
      service: 'WMS',
      request: 'GetCapabilities',
      version: '1.3.0',
      searchParams: { SERVICE: 'WFS', REQUEST: 'GetFeature', VERSION: '2.0.0', apikey: 'secret' }
    })
    expect(Object.fromEntries(new URL(requestUrl).searchParams)).toEqual({
      SERVICE: 'WMS', REQUEST: 'GetCapabilities', VERSION: '1.3.0', apikey: 'secret'
    })
  })
  it('drops a VERSION given in searchParams when no version is requested', () => {
    const requestUrl = owsRequestUrl('https://example.com/wms', {
      service: 'WMS', request: 'GetCapabilities', searchParams: { VERSION: '1.1.1' }
    })
    expect(new URL(requestUrl).searchParams.has('VERSION')).toBe(false)
  })
  it('normalizes reserved parameters whatever their case, in the base URL and in searchParams', () => {
    const requestUrl = owsRequestUrl('https://example.com/wms?service=WFS&map=demo&Request=GetFeature#top', {
      service: 'WMS', request: 'GetCapabilities', version: '1.3.0', searchParams: { service: 'WCS', ReQuEsT: 'GetMap', version: '1.1.1', key: 'secret' }
    })
    expect(requestUrl).toBe('https://example.com/wms?map=demo&key=secret&SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0#top')
  })
  it('keeps the version of the base URL when no version is requested', () => {
    const query = (base, options) => Object.fromEntries(new URL(owsRequestUrl(base, { service: 'WMS', request: 'GetCapabilities', ...options })).searchParams)
    expect(query('https://example.com/wms?version=1.1.1')).toEqual({ SERVICE: 'WMS', REQUEST: 'GetCapabilities', VERSION: '1.1.1' })
    // A requested version wins over the base URL.
    expect(query('https://example.com/wms?version=1.1.1', { version: '1.3.0' })).toMatchObject({ VERSION: '1.3.0' })
    // A version in searchParams is ignored: the server picks its own.
    expect(query('https://example.com/wms', { searchParams: { VERSION: '1.1.1' } })).toEqual({ SERVICE: 'WMS', REQUEST: 'GetCapabilities' })
    // An empty version in the base URL is dropped.
    expect(query('https://example.com/wms?VERSION=')).toEqual({ SERVICE: 'WMS', REQUEST: 'GetCapabilities' })
  })
  it('leaves other parameters of the base URL untouched', () => {
    expect(owsRequestUrl('https://example.com/wms?a=%2F&bad=%E0%A4%A&service=WMS', { service: 'WMS', request: 'GetCapabilities' }))
      .toBe('https://example.com/wms?a=%2F&bad=%E0%A4%A&SERVICE=WMS&REQUEST=GetCapabilities')
  })
})

describe('decoding pre-fetched exception reports', () => {
  const reports = [
    '<ServiceExceptionReport version="1.3.0"><ServiceException code="InvalidFormat">Bad request</ServiceException></ServiceExceptionReport>',
    `<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1" version="2.0.0">
      <ows:Exception exceptionCode="InvalidParameterValue"><ows:ExceptionText>Bad request</ows:ExceptionText></ows:Exception>
    </ows:ExceptionReport>`
  ]
  it.each(['wms', 'wmts', 'wfs', 'wcs'])('raises OWS_EXCEPTION from %s.discover', async (name) => {
    for (const report of reports) {
      const capabilities = await xml.parse(report, { output: 'dom' })
      await expect(connectors[name].discover('https://example.com/ows', { capabilities }))
        .rejects.toMatchObject({ code: 'OWS_EXCEPTION', message: 'Bad request' })
    }
  })
})

describe('READ_OPTIONS_SCHEMA', () => {
  it('accepts a DOM Document as capabilities', async () => {
    const capabilities = await xml.parse('<WMS_Capabilities version="1.3.0"><Capability/></WMS_Capabilities>', { output: 'dom' })
    expect(READ_OPTIONS_SCHEMA.capabilities(capabilities)).toBe(true)
    await expect(connectors.wms.discover('https://example.com/wms', { capabilities })).resolves.toMatchObject({ version: '1.3.0' })
  })
  it('rejects capabilities that are not a DOM Document', async () => {
    const document = await xml.parse('<WMS_Capabilities version="1.3.0"><Capability/></WMS_Capabilities>', { output: 'dom' })
    for (const capabilities of [{}, [], { nodeType: 1 }, document.documentElement, 'xml', 42]) {
      expect(READ_OPTIONS_SCHEMA.capabilities(capabilities)).toBe(false)
      await expect(connectors.wms.discover('https://example.com/wms', { capabilities })).rejects.toThrow('options must be a valid options object')
    }
  })
})
