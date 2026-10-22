import http from 'node:http'
import { AssertionError } from '../../src/predicates/index.js'
import { createRequester, shouldRetryByDefault } from '../../src/runtime/index.js'

const URL_ = 'https://example.test/resource'
const status = (code, init = {}) => () => new Response(null, { status: code, ...init })
const ok = (body = 'ok') => () => new Response(body, { status: 200 })
const networkError = () => () => { throw new TypeError('fetch failed') }
const hang = () => (_, init) => new Promise((_resolve, reject) => {
  init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
})
function mockFetch (...handlers) {
  const calls = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
    calls.push({ input, init })
    if (init.signal?.aborted) throw init.signal.reason
    const handler = handlers[Math.min(calls.length - 1, handlers.length - 1)]
    return handler(input, init)
  })
  return calls
}
const sent = (call) => new Request(call.input, call.init)
const streamBody = () => new ReadableStream({ start (c) { c.enqueue(new Uint8Array([1])); c.close() } })
afterEach(() => vi.restoreAllMocks())

describe('options validation', () => {
  it('rejects invalid requester options', () => {
    expect(() => createRequester({ retries: -1 })).toThrow(AssertionError)
    expect(() => createRequester({ retries: 1.5 })).toThrow(AssertionError)
    expect(() => createRequester({ retryDelay: 'soon' })).toThrow(AssertionError)
    expect(() => createRequester({ maxRetryAfter: -1 })).toThrow(AssertionError)
    expect(() => createRequester({ shouldRetry: true })).toThrow(AssertionError)
    expect(() => createRequester({ signal: {} })).toThrow(AssertionError)
  })
  it('rejects a timeout of 0', () => {
    expect(() => createRequester({ timeout: 0 })).toThrow(AssertionError)
  })
  it('accepts fetch init keys alongside its own options', () => {
    expect(() => createRequester({ method: 'POST', cache: 'no-store', retries: 1 })).not.toThrow()
  })
  it('validates per-call options', async () => {
    const calls = mockFetch(ok())
    await expect(createRequester().fetch(URL_, { timeout: 0 })).rejects.toThrow(AssertionError)
    expect(calls.length).toBe(0)
  })
  it('allows per-call options to override requester defaults', async () => {
    const calls = mockFetch(status(503), ok())
    const client = createRequester({ retries: 2, retryDelay: 0, headers: { 'x-default': '1' } })
    const response = await client.fetch(URL_, { retries: 0, headers: { 'x-call': '2' } })
    expect(response.status).toBe(503)
    expect(calls.length).toBe(1)
    expect(sent(calls[0]).headers.get('x-default')).toBe('1')
    expect(sent(calls[0]).headers.get('x-call')).toBe('2')
  })
})

describe('default retry policy', () => {
  it('returns a successful response without retrying', async () => {
    const calls = mockFetch(ok('hello'))
    const response = await createRequester({ retries: 3, retryDelay: 0 }).fetch(URL_)
    expect(await response.text()).toBe('hello')
    expect(calls.length).toBe(1)
  })
  for (const code of [408, 429, 500, 502, 503, 504]) {
    it(`retries a GET on ${code}`, async () => {
      const calls = mockFetch(status(code), ok())
      const response = await createRequester({ retries: 1, retryDelay: 0 }).fetch(URL_)
      expect(response.status).toBe(200)
      expect(calls.length).toBe(2)
    })
  }
  for (const code of [400, 404, 501, 505]) {
    it(`does not retry a GET on ${code}`, async () => {
      const calls = mockFetch(status(code), ok())
      const response = await createRequester({ retries: 3, retryDelay: 0 }).fetch(URL_)
      expect(response.status).toBe(code)
      expect(calls.length).toBe(1)
    })
  }
  it('returns the last response once retries are exhausted', async () => {
    const calls = mockFetch(status(503))
    const response = await createRequester({ retries: 2, retryDelay: 0 }).fetch(URL_)
    expect(response.status).toBe(503)
    expect(calls.length).toBe(3)
  })
  it('retries a GET on a network error', async () => {
    const calls = mockFetch(networkError(), ok())
    const response = await createRequester({ retries: 1, retryDelay: 0 }).fetch(URL_)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('throws the last error once retries are exhausted', async () => {
    const calls = mockFetch(networkError())
    await expect(createRequester({ retries: 2, retryDelay: 0 }).fetch(URL_)).rejects.toMatchObject({ name: 'TypeError', message: 'fetch failed' })
    expect(calls.length).toBe(3)
  })
  for (const code of [408, 429, 503]) {
    it(`does not retry a POST on ${code}`, async () => {
      const calls = mockFetch(status(code), ok())
      const response = await createRequester({ retries: 3, retryDelay: 0 })
        .fetch(URL_, { method: 'POST', body: 'x' })
      expect(response.status).toBe(code)
      expect(calls.length).toBe(1)
    })
  }
  it('does not retry a POST on a network error', async () => {
    const calls = mockFetch(networkError(), ok())
    await expect(createRequester({ retries: 3, retryDelay: 0 }).fetch(URL_, { method: 'POST', body: 'x' })).rejects.toThrow(TypeError)
    expect(calls.length).toBe(1)
  })
  it('retries a POST carrying an Idempotency-Key', async () => {
    const calls = mockFetch(status(503), ok())
    const response = await createRequester({ retries: 1, retryDelay: 0 }).fetch(URL_, {
      method: 'POST',
      body: 'x',
      headers: { 'Idempotency-Key': 'abc-123' }
    })
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('honors an Idempotency-Key inherited from a Request', async () => {
    const calls = mockFetch(status(503), ok())
    const input = new Request(URL_, { method: 'POST', headers: { 'Idempotency-Key': 'abc-123' } })
    const response = await createRequester({ retries: 1, retryDelay: 0 }).fetch(input)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('does not retry a POST with an empty Idempotency-Key', async () => {
    const calls = mockFetch(status(503), ok())
    const response = await createRequester({ retries: 1, retryDelay: 0 }).fetch(URL_, {
      method: 'POST',
      body: 'x',
      headers: { 'Idempotency-Key': '   ' }
    })
    expect(response.status).toBe(503)
    expect(calls.length).toBe(1)
  })
  it('shouldRetryByDefault works without headers in the context', () => {
    expect(shouldRetryByDefault({ response: new Response(null, { status: 503 }), method: 'GET' })).toBe(true)
    expect(shouldRetryByDefault({ response: new Response(null, { status: 503 }), method: 'POST' })).toBe(false)
    expect(shouldRetryByDefault({ error: new TypeError(), method: 'PUT' })).toBe(true)
    expect(shouldRetryByDefault({ method: 'GET' })).toBe(false)
  })
})

describe('custom retry policy', () => {
  it('replaces the default policy', async () => {
    const calls = mockFetch(status(503), ok())
    const response = await createRequester({ retries: 3, retryDelay: 0, shouldRetry: () => false }).fetch(URL_)
    expect(response.status).toBe(503)
    expect(calls.length).toBe(1)
  })
  it('is never consulted for a successful response', async () => {
    const calls = mockFetch(ok(), ok())
    let evaluations = 0
    const response = await createRequester({
      retries: 3,
      retryDelay: 0,
      shouldRetry: () => { evaluations++; return true }
    }).fetch(URL_)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(1)
    expect(evaluations).toBe(0)
  })
  it('can be composed with the default policy', async () => {
    const calls = mockFetch(status(429), status(503), ok())
    const client = createRequester({
      retries: 3,
      retryDelay: 0,
      shouldRetry: (context) =>
        shouldRetryByDefault(context) ||
        (context.method === 'POST' && context.response?.status === 429)
    })
    const response = await client.fetch(URL_, { method: 'POST', body: 'x' })
    expect(response.status).toBe(503)
    expect(calls.length).toBe(2)
  })
  it('can reject a retry after a network error', async () => {
    const calls = mockFetch(networkError(), ok())
    await expect(createRequester({ retries: 2, shouldRetry: () => false }).fetch(URL_)).rejects.toThrow(TypeError)
    expect(calls.length).toBe(1)
  })
  it('receives the response, method, headers and a 1-based attempt', async () => {
    mockFetch(status(503), status(503), ok())
    const contexts = []
    await createRequester({
      retries: 3,
      retryDelay: 0,
      shouldRetry: (context) => { contexts.push(context); return true }
    }).fetch(URL_, { headers: { 'x-trace': '42' } })
    expect(contexts.map((c) => c.attempt)).toEqual([1, 2])
    expect(contexts.map((c) => c.response.status)).toEqual([503, 503])
    expect(contexts.every((c) => c.method === 'GET')).toBeTruthy()
    expect(contexts.every((c) => c.headers.get('x-trace') === '42')).toBeTruthy()
  })
  it('receives the error on a network failure', async () => {
    mockFetch(networkError(), ok())
    const contexts = []
    await createRequester({
      retries: 1,
      retryDelay: 0,
      shouldRetry: (context) => { contexts.push(context); return true }
    }).fetch(URL_)
    expect(contexts.length).toBe(1)
    expect(contexts[0].error instanceof TypeError).toBeTruthy()
    expect(contexts[0].response).toBe(undefined)
  })
  it('cannot alter the headers of later evaluations or attempts', async () => {
    const calls = mockFetch(status(503), status(503), ok())
    const seen = []
    await createRequester({
      retries: 3,
      retryDelay: 0,
      shouldRetry: ({ headers }) => {
        seen.push(headers.has('x-mutated'))
        headers.set('x-mutated', '1')
        return true
      }
    }).fetch(URL_, { headers: { 'x-a': '1' } })
    expect(seen).toEqual([false, false])
    expect(calls.every((call) => !sent(call).headers.has('x-mutated'))).toBeTruthy()
  })
})

describe('method resolution', () => {
  const capture = (methods) => ({ method }) => { methods.push(method); return false }
  it('uses the method fetch actually uses when method is explicitly undefined', async () => {
    const calls = mockFetch(status(503))
    const methods = []
    await createRequester({ method: 'POST', retries: 1, shouldRetry: capture(methods) })
      .fetch(new Request(URL_), { method: undefined })
    expect(sent(calls[0]).method).toBe('GET')
    expect(methods).toEqual(['GET'])
  })
  it('uses defaults.method when the call does not override it', async () => {
    mockFetch(status(503))
    const methods = []
    await createRequester({ method: 'POST', retries: 1, shouldRetry: capture(methods) })
      .fetch(URL_, { body: 'x' })
    expect(methods).toEqual(['POST'])
  })
  it('uses the method of a Request input', async () => {
    mockFetch(status(503))
    const methods = []
    await createRequester({ retries: 1, shouldRetry: capture(methods) })
      .fetch(new Request(URL_, { method: 'DELETE' }))
    expect(methods).toEqual(['DELETE'])
  })
  it('normalizes the method to upper case', async () => {
    mockFetch(status(503))
    const methods = []
    await createRequester({ retries: 1, shouldRetry: capture(methods) })
      .fetch(URL_, { method: 'put', body: 'x' })
    expect(methods).toEqual(['PUT'])
  })
})

describe('headers', () => {
  it('merges default and per-call headers, per-call winning', async () => {
    const calls = mockFetch(ok())
    await createRequester({ headers: { 'x-a': 'default', 'x-b': 'default' } })
      .fetch(URL_, { headers: { 'x-b': 'call' } })
    const { headers } = sent(calls[0])
    expect(headers.get('x-a')).toBe('default')
    expect(headers.get('x-b')).toBe('call')
  })
  it('accepts Headers instances and arrays of pairs', async () => {
    const calls = mockFetch(ok())
    await createRequester({ headers: new Headers({ 'x-a': '1' }) })
      .fetch(URL_, { headers: [['x-b', '2']] })
    const { headers } = sent(calls[0])
    expect(headers.get('x-a')).toBe('1')
    expect(headers.get('x-b')).toBe('2')
  })
  it('keeps the headers of a Request input and merges the others into them', async () => {
    const calls = mockFetch(ok())
    await createRequester({ headers: { 'x-a': 'default' } })
      .fetch(new Request(URL_, { headers: { 'x-request': '1', 'x-a': 'request' } }))
    const { headers } = sent(calls[0])
    expect(headers.get('x-request')).toBe('1')
    expect(headers.get('x-a')).toBe('default')
  })
  it('leaves the headers of a Request input untouched when none are given', async () => {
    const calls = mockFetch(ok())
    await createRequester().fetch(new Request(URL_, { headers: { 'x-request': '1' } }))
    expect(sent(calls[0]).headers.get('x-request')).toBe('1')
  })
})

describe('bodies', () => {
  const replayable = {
    string: () => 'text',
    ArrayBuffer: () => new ArrayBuffer(4),
    Uint8Array: () => new Uint8Array(4),
    Blob: () => new Blob(['x']),
    URLSearchParams: () => new URLSearchParams({ a: '1' }),
    FormData: () => { const f = new FormData(); f.set('a', '1'); return f }
  }
  for (const [name, make] of Object.entries(replayable)) {
    it(`accepts a ${name} body with retries`, async () => {
      const calls = mockFetch(status(503), ok())
      const response = await createRequester({ retries: 1, retryDelay: 0 })
        .fetch(URL_, { method: 'PUT', body: make() })
      expect(response.status).toBe(200)
      expect(calls.length).toBe(2)
    })
  }
  it('rejects a stream body with retries, before any call', async () => {
    const calls = mockFetch(ok())
    await expect(createRequester({ retries: 1 }).fetch(URL_, { method: 'PUT', body: streamBody(), duplex: 'half' })).rejects.toThrow(AssertionError)
    expect(calls.length).toBe(0)
  })
  it('accepts a stream body without retries', async () => {
    const calls = mockFetch(ok())
    await createRequester().fetch(URL_, {
      method: 'PUT',
      body: streamBody(),
      duplex: 'half',
      retries: 0
    })
    expect(calls).toHaveLength(1)
  })
  it('checks the default body unless the call overrides it, even with null', async () => {
    const calls = mockFetch(ok())
    const client = createRequester({ method: 'PUT', body: streamBody(), duplex: 'half', retries: 1 })
    await expect(client.fetch(URL_)).rejects.toThrow(AssertionError)
    await client.fetch(URL_, { body: null })
    expect(calls.length).toBe(1)
  })
  it('rejects a Request with a body when retries > 0', async () => {
    const calls = mockFetch(ok())
    const request = new Request(URL_, { method: 'POST', body: 'x' })
    await expect(createRequester({ retries: 1 }).fetch(request)).rejects.toThrow(AssertionError)
    expect(calls.length).toBe(0)
  })
  it('rejects a Request with a body even when the options replace it', async () => {
    const calls = mockFetch(ok())
    const form = new FormData()
    form.set('a', '1')
    await expect(createRequester({ retries: 1 }).fetch(new Request(URL_, { method: 'POST', body: form }), { body: new FormData() })).rejects.toThrow(AssertionError)
    expect(calls.length).toBe(0)
  })
  it('accepts a Request with a body without retries', async () => {
    const calls = mockFetch(ok())
    await createRequester().fetch(
      new Request(URL_, { method: 'POST', body: 'x' }),
      { retries: 0 }
    )
    expect(calls).toHaveLength(1)
  })
  it('cancels the body of a response before retrying', async () => {
    let cancelled = false
    const body = new ReadableStream({ cancel () { cancelled = true } })
    mockFetch(() => new Response(body, { status: 503 }), ok())
    await createRequester({ retries: 1, retryDelay: 0 }).fetch(URL_)
    expect(cancelled).toBe(true)
  })
})

describe('delays', () => {
  const noDelayExpected = () => { throw new Error('retryDelay should not be called') }
  it('passes a 1-based attempt to the retryDelay function', async () => {
    mockFetch(status(503), status(503), ok())
    const attempts = []
    await createRequester({ retries: 3, retryDelay: (n) => { attempts.push(n); return 0 } }).fetch(URL_)
    expect(attempts).toEqual([1, 2])
  })
  it('rejects an invalid retryDelay return value', async () => {
    mockFetch(status(503), ok())
    await expect(createRequester({ retries: 1, retryDelay: () => -1 }).fetch(URL_)).rejects.toThrow(AssertionError)
  })
  it('honors Retry-After in seconds instead of retryDelay', async () => {
    const calls = mockFetch(status(503, { headers: { 'Retry-After': '0' } }), ok())
    const response = await createRequester({ retries: 1, retryDelay: noDelayExpected }).fetch(URL_)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('honors Retry-After as an HTTP date', async () => {
    const past = new Date(Date.now() - 10_000).toUTCString()
    const calls = mockFetch(status(429, { headers: { 'Retry-After': past } }), ok())
    const response = await createRequester({ retries: 1, retryDelay: noDelayExpected }).fetch(URL_)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('falls back to retryDelay when Retry-After is invalid', async () => {
    mockFetch(status(503, { headers: { 'Retry-After': 'soon' } }), ok())
    const attempts = []
    await createRequester({ retries: 1, retryDelay: (n) => { attempts.push(n); return 0 } }).fetch(URL_)
    expect(attempts).toEqual([1])
  })
  it('returns the response when Retry-After exceeds maxRetryAfter', async () => {
    const calls = mockFetch(status(503, { headers: { 'Retry-After': '120' } }), ok())
    const response = await createRequester({ retries: 3, maxRetryAfter: 60_000 }).fetch(URL_)
    expect(response.status).toBe(503)
    expect(calls.length).toBe(1)
  })
  it('keeps the final response body readable when Retry-After exceeds the limit', async () => {
    const calls = mockFetch(() => new Response('payload', {
      status: 503, headers: { 'Retry-After': '120' }
    }))
    const response = await createRequester({ retries: 1, maxRetryAfter: 60_000 }).fetch(URL_)
    expect(await response.text()).toBe('payload')
    expect(calls.length).toBe(1)
  })
})

describe('cancellation', () => {
  it('abort() is permanent and reflected by aborted and signal', async () => {
    const calls = mockFetch(ok())
    const client = createRequester()
    expect(client.aborted).toBe(false)
    client.abort(new Error('stop'))
    expect(client.aborted).toBe(true)
    expect(client.signal.aborted).toBe(true)
    await expect(client.fetch(URL_)).rejects.toMatchObject({ message: 'stop' })
    await expect(client.fetch(URL_)).rejects.toMatchObject({ message: 'stop' })
    expect(calls.length).toBe(0)
  })
  it('abort() cancels concurrent requests', async () => {
    const calls = mockFetch(hang())
    const client = createRequester()
    const first = client.fetch(URL_)
    const second = client.fetch(URL_)
    client.abort(new Error('stop'))
    await expect(first).rejects.toMatchObject({ message: 'stop' })
    await expect(second).rejects.toMatchObject({ message: 'stop' })
    expect(calls.length).toBe(2)
  })
  it('reflects an aborted signal option in aborted and signal', async () => {
    mockFetch(ok())
    const controller = new AbortController()
    const client = createRequester({ signal: controller.signal })
    controller.abort(new Error('external'))
    expect(client.aborted).toBe(true)
    expect(client.signal.aborted).toBe(true)
    expect(client.signal.reason.message).toBe('external')
    await expect(client.fetch(URL_)).rejects.toMatchObject({ message: 'external' })
  })
  it('does not retry when the per-call signal aborts', async () => {
    const calls = mockFetch(hang())
    const controller = new AbortController()
    const promise = createRequester({ retries: 3, retryDelay: 0 }).fetch(URL_, { signal: controller.signal })
    setTimeout(() => controller.abort(new Error('cancelled')), 10)
    await expect(promise).rejects.toMatchObject({ message: 'cancelled' })
    expect(calls.length).toBe(1)
  })
  it('honors the signal of a Request input', async () => {
    mockFetch(ok())
    const controller = new AbortController()
    controller.abort(new Error('request signal'))
    await expect(createRequester().fetch(new Request(URL_, { signal: controller.signal }))).rejects.toMatchObject({ message: 'request signal' })
  })
  it('interrupts the delay between attempts', async () => {
    const calls = mockFetch(status(503), ok())
    const client = createRequester({ retries: 1, retryDelay: 10_000 })
    const start = Date.now()
    const promise = client.fetch(URL_)
    setTimeout(() => client.abort(new Error('stop')), 20)
    await expect(promise).rejects.toMatchObject({ message: 'stop' })
    expect(Date.now() - start < 1000).toBeTruthy()
    expect(calls.length).toBe(1)
  })
})

describe('timeout', () => {
  it('rejects with a TimeoutError', async () => {
    mockFetch(hang())
    await expect(createRequester({ timeout: 20 }).fetch(URL_)).rejects.toMatchObject({ name: 'TimeoutError' })
  })
  it('applies to each attempt and retries a GET', async () => {
    const calls = mockFetch(hang(), ok())
    const response = await createRequester({ timeout: 20, retries: 1, retryDelay: 0 }).fetch(URL_)
    expect(response.status).toBe(200)
    expect(calls.length).toBe(2)
  })
  it('does not retry a POST that timed out', async () => {
    const calls = mockFetch(hang(), ok())
    await expect(createRequester({ timeout: 20, retries: 3, retryDelay: 0 }).fetch(URL_, { method: 'POST', body: 'x' })).rejects.toMatchObject({ name: 'TimeoutError' })
    expect(calls.length).toBe(1)
  })
  it('passes a 1-based attempt to the timeout function', async () => {
    mockFetch(hang(), ok())
    const attempts = []
    await createRequester({
      retries: 1,
      retryDelay: 0,
      timeout: (n) => { attempts.push(n); return 20 }
    }).fetch(URL_)
    expect(attempts).toEqual([1, 2])
  })
  it('rejects an invalid timeout function return value', async () => {
    mockFetch(ok())
    await expect(createRequester({ timeout: () => 0 }).fetch(URL_)).rejects.toThrow(AssertionError)
  })
  it('accepts a timeout function returning undefined', async () => {
    mockFetch(ok())
    const response = await createRequester({ timeout: () => undefined }).fetch(URL_)
    expect(response.status).toBe(200)
  })
})

describe('timeout with a real server', () => {
  let server
  let base
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/slow-headers') {
        setTimeout(() => res.end('{"ok":true}'), 200)
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.flushHeaders()
      setTimeout(() => res.end('{"ok":true}'), 150)
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${server.address().port}`
  })
  afterAll(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })
  it('times out when the headers are too slow', async () => {
    await expect(createRequester({ timeout: 50 }).fetch(`${base}/slow-headers`)).rejects.toMatchObject({ name: 'TimeoutError' })
  })
  it('does not abort the body once the response has arrived', async () => {
    const response = await createRequester({ timeout: 50 }).fetch(`${base}/slow-body`)
    expect(await response.json()).toEqual({ ok: true })
  })
  it('bounds the body reading with a signal option', async () => {
    const response = await createRequester().fetch(`${base}/slow-body`, { signal: AbortSignal.timeout(50) })
    await expect(response.json()).rejects.toMatchObject({ name: 'TimeoutError' })
  })
  it('lets abort() interrupt the body reading', async () => {
    const client = createRequester()
    const response = await client.fetch(`${base}/slow-body`)
    setTimeout(() => client.abort(new Error('stop')), 20)
    await expect(response.json()).rejects.toMatchObject({ message: 'stop' })
  })
})
