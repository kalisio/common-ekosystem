import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { json } from '@kalisio/common-core/io/json'
import {
  getLandingPage,
  getConformance,
  findLink,
  asDirectory,
  linkTarget,
  readJson
} from '../../../src/connectors/ogc-api/ogc-api-helpers.js'

vi.mock('@kalisio/common-core/io/json', () => ({ json: { read: vi.fn() } }))

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(readFileSync(join(here, '../fixtures', name), 'utf-8'))
const landingPage = fixture('landing.json')
const conformance = fixture('conformance.json')
const ROOT = 'https://example.com/api'

// Serve fixtures by URL and record what was requested.
function serve (routes) {
  json.read.mockImplementation(async (source) => {
    if (!Object.hasOwn(routes, source)) throw new Error(`unexpected request ${source}`)
    return routes[source]
  })
}

beforeEach(() => {
  json.read.mockReset()
})

describe('findLink', () => {
  const links = landingPage.links
  it('matches short and OGC URI relations', () => {
    expect(findLink(links, 'data', 'application/json').href).toBe('collections?f=json')
    expect(findLink(links, 'conformance', 'application/json').href)
      .toBe('https://example.com/api/conformance?f=json')
  })
  it('prefers JSON links over HTML alternatives', () => {
    expect(findLink(links, 'data', 'application/json').href).toBe('collections?f=json')
    expect(findLink(links, 'conformance', 'application/json').href)
      .toBe('https://example.com/api/conformance?f=json')
    expect(findLink(links, 'data', 'text/html').href).toBe('collections?f=html')
  })
  it('ignores media type parameters and never returns another type', () => {
    expect(findLink(links, 'service-desc', 'application/vnd.oai.openapi+json').href)
      .toBe('https://example.com/api/openapi?f=json')
    expect(findLink(links, 'service-doc', 'application/json')).toBeNull()
    expect(findLink(links, 'self', 'application/json')).toBeNull()
  })
  it('honours the order of preferred media types', () => {
    const typed = [
      { rel: 'next', href: 'a', type: 'application/json' },
      { rel: 'next', href: 'b', type: 'application/geo+json' }
    ]
    expect(findLink(typed, 'next', ['application/geo+json', 'application/json']).href).toBe('b')
    expect(findLink(typed, 'next', ['application/json', 'application/geo+json']).href).toBe('a')
  })
  it('falls back to an untyped link, but never to an incompatible type', () => {
    expect(findLink([{ rel: 'next', href: 'c' }], 'next', 'application/json').href).toBe('c')
    expect(findLink([{ rel: 'next', href: 'a', type: 'text/html' }], 'next', 'application/json')).toBeNull()
    expect(findLink(undefined, 'next')).toBeNull()
    expect(findLink([], 'next')).toBeNull()
  })
  it('returns the first matching link when no media type is requested', () => {
    expect(findLink(links, 'self').href).toBe('https://example.com/api?f=html')
  })
})

describe('getLandingPage', () => {
  it('reads and validates the landing page', async () => {
    serve({ [ROOT]: landingPage })
    const result = await getLandingPage(ROOT)
    expect(result).toEqual(landingPage)
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][0]).toBe(ROOT)
    expect(json.read.mock.calls[0][1].request.headers.get('accept')).toBe('application/json')
  })
  it('forwards search and transport options', async () => {
    serve({ 'https://example.com/api?key=secret': landingPage })
    const signal = new AbortController().signal
    await getLandingPage(ROOT, {
      searchParams: { key: 'secret' },
      request: { timeout: 5000, signal }
    })
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api?key=secret')
    expect(json.read.mock.calls[0][1].request).toMatchObject({ timeout: 5000, signal })
  })
  it('rejects a document without links', async () => {
    for (const document of [{ title: 'No links' }, [], 'html', null]) {
      serve({ [ROOT]: document })
      await expect(getLandingPage(ROOT)).rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'not an OGC API landing page'
      })
    }
  })
  it('rejects invalid input before making a request', async () => {
    serve({})
    await expect(getLandingPage('')).rejects.toThrow('input must be a non empty string')
    expect(json.read).not.toHaveBeenCalled()
  })
})

describe('getConformance', () => {
  it('follows the JSON link advertised by the landing page', async () => {
    serve({ 'https://example.com/api/conformance?f=json': conformance })
    const result = await getConformance(ROOT, { landingPage })
    expect(result).toEqual(conformance)
    expect(result.conformsTo).toHaveLength(3)
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api/conformance?f=json')
  })
  it('resolves a relative link advertised by the landing page', async () => {
    const page = {
      links: [{ rel: 'conformance', type: 'application/json', href: 'conformance?f=json' }]
    }
    serve({ 'https://example.com/api/conformance?f=json': conformance })
    await getConformance(ROOT, { landingPage: page })
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api/conformance?f=json')
  })
  it('uses the normative path when no landing page is provided', async () => {
    serve({ 'https://example.com/api/conformance': conformance })
    const result = await getConformance(ROOT)
    expect(result).toEqual(conformance)
    expect(json.read).toHaveBeenCalledOnce()
    expect(json.read.mock.calls[0][0]).toBe('https://example.com/api/conformance')
  })
  it('asks for JSON and forwards transport options', async () => {
    serve({ 'https://example.com/api/conformance': conformance })
    const signal = new AbortController().signal
    await getConformance(ROOT, {
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
  it('preserves a caller-provided Accept header regardless of its representation', async () => {
    serve({ 'https://example.com/api/conformance': conformance })
    const forms = [
      { accept: 'application/json;profile=x' },
      new Headers({ ACCEPT: 'application/json;profile=x' }),
      [['Accept', 'application/json;profile=x']]
    ]
    for (const headers of forms) {
      await getConformance(ROOT, { request: { headers } })
      expect(json.read.mock.lastCall[1].request.headers.get('accept')).toBe('application/json;profile=x')
    }
    expect(json.read).toHaveBeenCalledTimes(forms.length)
  })
  it('does not guess an endpoint missing from a landing page', async () => {
    serve({})
    const htmlOnly = {
      links: [{ href: 'conformance?f=html', rel: 'conformance', type: 'text/html' }]
    }
    await expect(getConformance(ROOT, { landingPage: htmlOnly }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'OGC API landing page without conformance link'
      })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('rejects a pre-fetched landing page without links', async () => {
    serve({})
    await expect(getConformance(ROOT, { landingPage: { title: 'No links' } }))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'not an OGC API landing page'
      })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('adds searchParams to the requested URL', async () => {
    serve({ 'https://example.com/api/conformance?key=secret': conformance })
    await getConformance(ROOT, { searchParams: { key: 'secret' } })
    expect(json.read).toHaveBeenCalledOnce()
  })
  it('rejects a root that relative links cannot be resolved against', async () => {
    serve({})
    await expect(getConformance('fixtures/api'))
      .rejects.toMatchObject({ code: 'INVALID_CAPABILITIES' })
    expect(json.read).not.toHaveBeenCalled()
  })
  it('rejects a document that is not a conformance declaration', async () => {
    serve({ 'https://example.com/api/conformance': { title: 'oops' } })
    await expect(getConformance(ROOT))
      .rejects.toMatchObject({
        code: 'INVALID_CAPABILITIES',
        message: 'not an OGC API conformance document'
      })
  })
})

describe('linkTarget', () => {
  it('follows an advertised link rather than guessing the fallback', () => {
    expect(linkTarget(ROOT, landingPage, 'data', 'application/json', 'collections'))
      .toBe('https://example.com/api/collections?f=json')
  })
  it('uses the fallback only when no landing page is provided', () => {
    expect(linkTarget(ROOT, undefined, 'data', 'application/json', 'collections'))
      .toBe('https://example.com/api/collections')
  })
  it('rejects a landing page without a matching JSON link', () => {
    expect(() => linkTarget(ROOT, landingPage, 'service-doc', 'application/json', 'docs'))
      .toThrow(expect.objectContaining({ code: 'INVALID_CAPABILITIES' }))
  })
})

describe('readJson', () => {
  it('sets the requested Accept media type', async () => {
    serve({ 'https://example.com/api/collections': { collections: [] } })
    await readJson('https://example.com/api/collections', {}, 'application/geo+json')
    expect(json.read.mock.calls[0][1].request.headers.get('accept')).toBe('application/geo+json')
  })
  it('does not override an existing Accept header', async () => {
    serve({ 'https://example.com/api/collections': { collections: [] } })
    await readJson('https://example.com/api/collections', {
      request: { headers: new Headers({ Accept: 'application/json;profile=test' }) }
    }, 'application/geo+json')
    expect(json.read.mock.calls[0][1].request.headers.get('accept')).toBe('application/json;profile=test')
  })
})

describe('asDirectory', () => {
  it('treats the API root as a directory with or without a trailing slash', () => {
    expect(asDirectory('https://example.com/api')).toBe('https://example.com/api/')
    expect(asDirectory('https://example.com/api/')).toBe('https://example.com/api/')
    expect(asDirectory('https://example.com')).toBe('https://example.com/')
  })
  it('keeps the query string of the root', () => {
    expect(asDirectory('https://example.com/api?f=json')).toBe('https://example.com/api/?f=json')
  })
  it('resolves normative paths under the root in every case', async () => {
    for (const root of ['https://example.com/api', 'https://example.com/api/', 'https://example.com/api?f=json']) {
      // The root query is not carried over: use searchParams for that.
      serve({ 'https://example.com/api/conformance': conformance })
      await getConformance(root)
      expect(json.read.mock.lastCall[0]).toBe('https://example.com/api/conformance')
    }
    expect(json.read).toHaveBeenCalledTimes(3)
  })
})
