import { request } from '../../src/operators/request.js'

const URL_ = 'https://example.test/resource'

function mockFetch (implementation = async () => new Response('ok')) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(implementation)
}

afterEach(() => vi.restoreAllMocks())

describe('request validation', () => {
  it('accepts an HTTP URL string', () => {
    expect(() => request('http://example.test/resource')).not.toThrow()
  })
  it('accepts a URL instance', () => {
    expect(() => request(new URL(URL_))).not.toThrow()
  })
  it('rejects invalid URLs', () => {
    expect(() => request('not-a-url')).toThrow('url must be a valid url')
    expect(() => request('file:///tmp/data.json')).toThrow('url must be a valid url')
    expect(() => request(new URL('file:///tmp/data.json'))).toThrow('url must be a valid url')
    expect(() => request(null)).toThrow('url must be a valid url')
  })
  it('validates requester options', () => {
    expect(() => request(URL_, { retries: -1 })).toThrow('options must be a valid options object')
    expect(() => request(URL_, { timeout: 0 })).toThrow('options must be a valid options object')
  })
  it('validates per-call options before fetching', async () => {
    const fetchMock = mockFetch()
    await expect(request(URL_).fetch({ retries: -1 })).rejects.toThrow('options must be a valid options object')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('request fetch', () => {
  it('fetches the bound URL and returns the response', async () => {
    const fetchMock = mockFetch(async () => new Response('hello'))
    const response = await request(URL_).fetch()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe(URL_)
    expect(await response.text()).toBe('hello')
  })
  it('preserves a bound URL instance', async () => {
    const url = new URL(URL_)
    const fetchMock = mockFetch()
    await request(url).fetch()
    expect(fetchMock.mock.calls[0][0]).toBe(url)
  })
  it('uses the same bound URL for successive calls', async () => {
    const fetchMock = mockFetch()
    const operation = request(URL_)
    await operation.fetch()
    await operation.fetch({ method: 'HEAD' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.map(([input]) => input)).toEqual([URL_, URL_])
    expect(fetchMock.mock.calls[1][1].method).toBe('HEAD')
  })
  it('merges default and per-call fetch options', async () => {
    const fetchMock = mockFetch()
    const operation = request(URL_, { headers: { 'x-default': '1', 'x-shared': 'default' } })
    await operation.fetch({ method: 'POST', body: 'hello', headers: { 'x-shared': 'call', 'x-call': '2' } })
    const [input, init] = fetchMock.mock.calls[0]
    const sent = new Request(input, init)
    expect(sent.method).toBe('POST')
    expect(await sent.text()).toBe('hello')
    expect(sent.headers.get('x-default')).toBe('1')
    expect(sent.headers.get('x-shared')).toBe('call')
    expect(sent.headers.get('x-call')).toBe('2')
  })
  it('delegates retries to requester', async () => {
    const fetchMock = mockFetch()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('ok'))
    const response = await request(URL_, { retries: 1, retryDelay: 0 }).fetch()
    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.every(([input]) => input === URL_)).toBe(true)
  })
  it('allows per-call options to override requester defaults', async () => {
    const fetchMock = mockFetch(async () => new Response(null, { status: 503 }))
    const response = await request(URL_, { retries: 2, retryDelay: 0 }).fetch({ retries: 0 })
    expect(response.status).toBe(503)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('propagates fetch errors', async () => {
    const error = new TypeError('fetch failed')
    mockFetch(async () => { throw error })
    await expect(request(URL_).fetch()).rejects.toBe(error)
  })
})

describe('request cancellation', () => {
  it('exposes the requester signal and initial state', () => {
    const operation = request(URL_)
    expect(operation.signal).toBeInstanceOf(AbortSignal)
    expect(operation.aborted).toBe(false)
    expect(operation.signal.aborted).toBe(false)
  })
  it('abort is permanent and forwards its reason', async () => {
    const fetchMock = mockFetch()
    const operation = request(URL_)
    const signal = operation.signal
    const reason = new Error('stop')
    operation.abort(reason)
    expect(operation.signal).toBe(signal)
    expect(operation.aborted).toBe(true)
    expect(signal.reason).toBe(reason)
    await expect(operation.fetch()).rejects.toBe(reason)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('aborts an ongoing fetch', async () => {
    const fetchMock = mockFetch((_, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    const operation = request(URL_)
    const promise = operation.fetch()
    const reason = new Error('cancelled')
    operation.abort(reason)
    await expect(promise).rejects.toBe(reason)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('reflects the default external signal', async () => {
    const controller = new AbortController()
    const operation = request(URL_, { signal: controller.signal })
    const reason = new Error('external')
    controller.abort(reason)
    expect(operation.aborted).toBe(true)
    expect(operation.signal.reason).toBe(reason)
    await expect(operation.fetch()).rejects.toBe(reason)
  })
  it('does not permanently abort the operation when a per-call signal aborts', async () => {
    const fetchMock = mockFetch()
    const controller = new AbortController()
    const operation = request(URL_)
    const reason = new Error('call cancelled')
    controller.abort(reason)
    await expect(operation.fetch({ signal: controller.signal })).rejects.toBe(reason)
    expect(operation.aborted).toBe(false)
    await expect(operation.fetch()).resolves.toBeInstanceOf(Response)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
