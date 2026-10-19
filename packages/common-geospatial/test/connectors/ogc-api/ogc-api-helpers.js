import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { json } from '@kalisio/common-core/io/json'
import { commonApi } from '../../../src/connectors/index.js'
import { asDirectory } from '../../../src/connectors/ogc-api/ogc-api-helpers.js'

vi.mock('@kalisio/common-core/io/json', () => ({ json: { read: vi.fn() } }))

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(readFileSync(join(here, '../fixtures', name), 'utf-8'))
const landingPage = fixture('landing.json')

// Serve fixtures by URL and record what was requested.
function serve (routes) {
  json.read.mockImplementation(async (source) => {
    if (!(source in routes)) throw new Error(`unexpected request ${source}`)
    return routes[source]
  })
}

beforeEach(() => {
  json.read.mockReset()
})

describe('commonApi.findLink', () => {
  const links = landingPage.links
  it('matches short and OGC URI relations', () => {
    expect(commonApi.findLink(links, 'data', 'application/json').href).toBe('collections?f=json')
    expect(commonApi.findLink(links, 'conformance', 'application/json').href)
      .toBe('https://example.com/api/conformance?f=json')
  })
  it('ignores media type parameters and never returns another type', () => {
    expect(commonApi.findLink(links, 'service-desc', 'application/vnd.oai.openapi+json').href)
      .toBe('https://example.com/api/openapi?f=json')
    expect(commonApi.findLink(links, 'service-doc', 'application/json')).toBeNull()
  })
  it('honours the order of preference and falls back to untyped links', () => {
    const typed = [{ rel: 'next', href: 'a', type: 'application/json' }, { rel: 'next', href: 'b', type: 'application/geo+json' }]
    expect(commonApi.findLink(typed, 'next', ['application/geo+json', 'application/json']).href).toBe('b')
    expect(commonApi.findLink([{ rel: 'next', href: 'c' }], 'next', 'application/json').href).toBe('c')
    expect(commonApi.findLink(undefined, 'next')).toBeNull()
  })
})

describe('commonApi.getLandingPage', () => {
  it('reads and validates a landing page', async () => {
    serve({ 'https://example.com/api': landingPage })
    const result = await commonApi.getLandingPage('https://example.com/api')
    expect(result).toEqual(landingPage)
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][1].request.headers.get('accept')).toBe('application/json')
  })
  it('forwards search and transport options', async () => {
    serve({ 'https://example.com/api?key=secret': landingPage })
    await commonApi.getLandingPage('https://example.com/api', {
      searchParams: { key: 'secret' },
      request: { timeout: 5000 }
    })
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api?key=secret')
    expect(json.read.mock.calls[0][1].request.timeout).toBe(5000)
  })
  it('rejects a document without links', async () => {
    serve({ 'https://example.com/api': { title: 'Not a landing page' } })
    await expect(commonApi.getLandingPage('https://example.com/api'))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'not an OGC API landing page'
      })
  })
})

describe('commonApi.getConformance', () => {
  it('follows the landing page link when one is provided', async () => {
    serve({ 'https://example.com/api/conformance?f=json': fixture('conformance.json') })
    const conformance = await commonApi.getConformance('https://example.com/api', { landingPage })
    expect(conformance.conformsTo).toHaveLength(3)
    expect(json.read).toHaveBeenCalledOnce()
  })
  it('resolves a relative link advertised by the landing page', async () => {
    const page = {
      links: [
        { rel: 'conformance', type: 'application/json', href: 'conformance?f=json' }
      ]
    }
    serve({ 'https://example.com/api/conformance?f=json': fixture('conformance.json') })
    await commonApi.getConformance('https://example.com/api', { landingPage: page })
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api/conformance?f=json')
  })
  it('uses the normative path, under the root, without a landing page', async () => {
    serve({ 'https://example.com/api/conformance': fixture('conformance.json') })
    await commonApi.getConformance('https://example.com/api')
    expect(json.read).toHaveBeenCalledOnce()
  })
  it('asks for JSON unless the caller sets Accept, and forwards transport options', async () => {
    serve({ 'https://example.com/api/conformance': fixture('conformance.json') })
    const signal = new AbortController().signal
    await commonApi.getConformance('https://example.com/api', {
      request: {
        signal,
        timeout: 5000,
        headers: { Authorization: 'Bearer x' }
      }
    })
    const { request } = json.read.mock.calls[0][1]
    expect(request).toMatchObject({ signal, timeout: 5000 })
    expect(request.headers).toBeInstanceOf(Headers)
    expect(Object.fromEntries(request.headers)).toEqual({
      accept: 'application/json',
      authorization: 'Bearer x'
    })
  })
  it('keeps an Accept header set by the caller, whatever its case and form', async () => {
    serve({ 'https://example.com/api/conformance': fixture('conformance.json') })
    const forms = [
      { accept: 'application/json;profile=x' },
      new Headers({ ACCEPT: 'application/json;profile=x' }),
      [['Accept', 'application/json;profile=x']]
    ]
    for (const headers of forms) {
      await commonApi.getConformance('https://example.com/api', { request: { headers } })
      expect(json.read.mock.lastCall[1].request.headers.get('accept')).toBe('application/json;profile=x')
    }
  })
  it('does not guess an endpoint missing from a landing page', async () => {
    serve({})
    const htmlOnly = {
      links: [
        { href: 'conformance?f=html', rel: 'conformance', type: 'text/html' }
      ]
    }
    await expect(commonApi.getConformance('https://example.com/api', { landingPage: htmlOnly }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'OGC API landing page without conformance link'
      })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('rejects a pre-fetched landing page without links', async () => {
    serve({})
    await expect(commonApi.getConformance('https://example.com/api', {
      landingPage: { title: 'No links' }
    })).rejects.toMatchObject({
      code: 'INVALID_CAPABILITIES',
      message: 'not an OGC API landing page'
    })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('adds searchParams to the requested URL', async () => {
    serve({ 'https://example.com/api/conformance?key=secret': fixture('conformance.json') })
    await commonApi.getConformance('https://example.com/api', {
      searchParams: { key: 'secret' }
    })
    expect(json.read).toHaveBeenCalledOnce()
  })
  it('rejects a root that relative links cannot be resolved against', async () => {
    serve({})
    await expect(commonApi.getConformance('fixtures/api'))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('rejects a document that is not a conformance declaration', async () => {
    serve({ 'https://example.com/api/conformance': { title: 'oops' } })
    await expect(commonApi.getConformance('https://example.com/api'))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
  })
})

describe('asDirectory', () => {
  it('treats the API root as a directory, with or without a trailing slash', () => {
    expect(asDirectory('https://example.com/api')).toBe('https://example.com/api/')
    expect(asDirectory('https://example.com/api/')).toBe('https://example.com/api/')
    expect(asDirectory('https://example.com')).toBe('https://example.com/')
  })
  it('keeps the query string of the root', () => {
    expect(asDirectory('https://example.com/api?f=json')).toBe('https://example.com/api/?f=json')
  })
  it('resolves normative paths under the root in every case', async () => {
    for (const root of ['https://example.com/api', 'https://example.com/api/', 'https://example.com/api?f=json']) {
      // The query of the root is not carried over: use searchParams for that.
      serve({ 'https://example.com/api/conformance': fixture('conformance.json') })
      await commonApi.getConformance(root)
      expect(json.read.mock.lastCall[0]).toBe('https://example.com/api/conformance')
    }
  })
})
