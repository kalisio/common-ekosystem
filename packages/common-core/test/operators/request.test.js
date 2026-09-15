import { schedule } from '../../src/utilities/index.js'
import { request } from '../../src/operators/request.js'

vi.mock('../../src/utilities/index.js', () => ({
  schedule: { delay: vi.fn() }
}))

function response (status) {
  return {
    status,
    body: {
      cancel: vi.fn().mockResolvedValue(undefined)
    }
  }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  schedule.delay.mockReset()
  schedule.delay.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('handle', () => {
  it('exposes and aborts the underlying signal', () => {
    const req = request()
    expect(req.aborted).toBe(false)
    req.abort(new Error('stop'))
    expect(req.aborted).toBe(true)
    expect(req.signal.aborted).toBe(true)
  })
})

describe('validation', () => {
  it('rejects invalid creation options', () => {
    expect(() => request({ retries: -1 })).toThrow('options must be a valid options object')
    expect(() => request({ retryDelay: -1 })).toThrow('options must be a valid options object')
    expect(() => request({ timeout: -1 })).toThrow('options must be a valid options object')
    expect(() => request({ signal: {} })).toThrow('options must be a valid options object')
  })
  it('rejects invalid per-call options', async () => {
    const req = request()
    await expect(req.fetch('/url', { retries: -1 })).rejects.toThrow('options must be a valid options object')
    await expect(req.fetch('/url', { retryDelay: -1 })).rejects.toThrow('options must be a valid options object')
    await expect(req.fetch('/url', { timeout: -1 })).rejects.toThrow('options must be a valid options object')
    await expect(req.fetch('/url', { signal: {} })).rejects.toThrow('options must be a valid options object')
  })
  it('rejects an invalid retryDelay function result', async () => {
    fetchMock.mockResolvedValue(response(503))
    const req = request()
    await expect(req.fetch('/url', { retries: 1, retryDelay: () => -1 }))
      .rejects.toThrow('retryDelay function must return a non negative integer')
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('rejects an invalid timeout function result', async () => {
    const req = request()
    await expect(req.fetch('/url', { timeout: () => -1 }))
      .rejects.toThrow('timeout function must return a non negative integer')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('accepts undefined from a timeout function', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { timeout: () => undefined })
    expect(timeoutSpy).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('success and non-retryable responses', () => {
  it('returns the response and never delays on success', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    const result = await req.fetch('/url')
    expect(result.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(schedule.delay).not.toHaveBeenCalled()
  })
  it('does not retry a non-retryable status', async () => {
    fetchMock.mockResolvedValue(response(404))
    const req = request()
    const result = await req.fetch('/url', { retries: 3 })
    expect(result.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(schedule.delay).not.toHaveBeenCalled()
  })
})

describe('retry on status', () => {
  it('retries a retryable status then returns the successful response', async () => {
    const first = response(503)
    fetchMock.mockResolvedValueOnce(first).mockResolvedValueOnce(response(200))
    const req = request()
    const result = await req.fetch('/url', { retries: 1 })
    expect(result.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(schedule.delay).toHaveBeenCalledOnce()
    expect(first.body.cancel).toHaveBeenCalledOnce()
  })
  it('drains only the responses it discards, not the one it returns', async () => {
    const r1 = response(500)
    const r2 = response(500)
    const r3 = response(500)
    fetchMock.mockResolvedValueOnce(r1).mockResolvedValueOnce(r2).mockResolvedValueOnce(r3)
    const req = request()
    const result = await req.fetch('/url', { retries: 2 })
    expect(result).toBe(r3)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(r1.body.cancel).toHaveBeenCalledOnce()
    expect(r2.body.cancel).toHaveBeenCalledOnce()
    expect(r3.body.cancel).not.toHaveBeenCalled()
  })
  it('handles a retryable response with a null body', async () => {
    fetchMock.mockResolvedValueOnce({ status: 503, body: null }).mockResolvedValueOnce(response(200))
    const req = request()
    const result = await req.fetch('/url', { retries: 1 })
    expect(result.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('retry on thrown error', () => {
  it('retries a thrown error when the user signal is not aborted', async () => {
    fetchMock.mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce(response(200))
    const req = request()
    const result = await req.fetch('/url', { retries: 1 })
    expect(result.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('throws once retries are exhausted', async () => {
    fetchMock.mockRejectedValue(new Error('net'))
    const req = request()
    await expect(req.fetch('/url', { retries: 1 })).rejects.toThrow('net')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('abort', () => {
  it('throws without retrying when the user signal is aborted', async () => {
    fetchMock.mockRejectedValue(new Error('aborted'))
    const req = request()
    req.abort()
    await expect(req.fetch('/url', { retries: 3 })).rejects.toThrow('aborted')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(schedule.delay).not.toHaveBeenCalled()
  })
  it('rejects when the delay between retries is aborted', async () => {
    fetchMock.mockResolvedValue(response(503))
    schedule.delay.mockRejectedValueOnce(new Error('aborted'))
    const req = request()
    await expect(req.fetch('/url', { retries: 2 })).rejects.toThrow('aborted')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(schedule.delay).toHaveBeenCalledOnce()
  })
})

describe('options', () => {
  it('lets per-call options override creation defaults', async () => {
    fetchMock.mockResolvedValue(response(500))
    const req = request({ retries: 0 })
    await req.fetch('/url', { retries: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
  it('merges defaults and per-call options into the fetch call', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request({ method: 'POST' })
    await req.fetch('/url', { headers: { a: '1' } })
    expect(fetchMock).toHaveBeenCalledWith('/url', expect.objectContaining({
      method: 'POST',
      headers: { a: '1' },
      signal: req.signal
    }))
  })
  it('calls a function retryDelay with the attempt number', async () => {
    fetchMock.mockResolvedValue(response(500))
    const retryDelay = vi.fn(attempt => attempt * 10)
    const req = request()
    await req.fetch('/url', { retries: 2, retryDelay })
    expect(retryDelay).toHaveBeenNthCalledWith(1, 1)
    expect(retryDelay).toHaveBeenNthCalledWith(2, 2)
    expect(schedule.delay).toHaveBeenNthCalledWith(1, 10, expect.anything())
    expect(schedule.delay).toHaveBeenNthCalledWith(2, 20, expect.anything())
  })
})

describe('body replay', () => {
  it('accepts a string body when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body: 'hello', retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts an ArrayBuffer body when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body: new ArrayBuffer(8), retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts an ArrayBuffer view when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body: new Uint8Array([1, 2, 3]), retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts a Blob body when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body: new Blob(['hello']), retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts a URLSearchParams body when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body: new URLSearchParams({ a: '1' }), retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts a FormData body when retries are enabled', async () => {
    fetchMock.mockResolvedValue(response(200))
    const body = new FormData()
    body.append('name', 'value')
    const req = request()
    await req.fetch('/url', { method: 'POST', body, retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('rejects a stream body when retries are enabled', async () => {
    const body = new ReadableStream()
    const req = request()
    await expect(req.fetch('/url', { method: 'POST', body, retries: 1 }))
      .rejects.toThrow('body must be replayable')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('accepts a stream body when retries are disabled', async () => {
    const body = new ReadableStream()
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { method: 'POST', body, retries: 0 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('checks the creation-level body', async () => {
    const body = new ReadableStream()
    const req = request({ method: 'POST', body, retries: 1 })
    await expect(req.fetch('/url')).rejects.toThrow('body must be replayable')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('lets an explicit per-call body override the default body', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request({ method: 'POST', body: new ReadableStream(), retries: 1 })
    await req.fetch('/url', { body: 'replayable' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('lets body null override the default body', async () => {
    fetchMock.mockResolvedValue(response(200))
    const req = request({ method: 'POST', body: new ReadableStream(), retries: 1 })
    await req.fetch('/url', { body: null })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/url', expect.objectContaining({ body: null }))
  })
  it('rejects a Request with a body when retries are enabled', async () => {
    const input = new Request('https://example.com', { method: 'POST', body: 'hello' })
    const req = request()
    await expect(req.fetch(input, { retries: 1 }))
      .rejects.toThrow('a Request with a body cannot be retried')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('accepts a Request with a body when retries are disabled', async () => {
    const input = new Request('https://example.com', { method: 'POST', body: 'hello' })
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch(input, { retries: 0 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('accepts a Request without a body when retries are enabled', async () => {
    const input = new Request('https://example.com')
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch(input, { retries: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('timeout', () => {
  it('creates a fresh timeout signal for every attempt', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockResolvedValue(response(500))
    const req = request()
    await req.fetch('/url', { retries: 2, timeout: 1000 })
    expect(timeoutSpy).toHaveBeenCalledTimes(3)
    expect(timeoutSpy).toHaveBeenCalledWith(1000)
  })
  it('calls a function timeout with attempt + 1 and passes the result', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockResolvedValue(response(500))
    const timeout = vi.fn(attempt => attempt * 1000)
    const req = request()
    await req.fetch('/url', { retries: 2, timeout })
    expect(timeout).toHaveBeenNthCalledWith(1, 1)
    expect(timeout).toHaveBeenNthCalledWith(2, 2)
    expect(timeout).toHaveBeenNthCalledWith(3, 3)
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, 1000)
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, 2000)
    expect(timeoutSpy).toHaveBeenNthCalledWith(3, 3000)
  })
  it('accepts a zero timeout', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200))
    const timeout = vi.fn(attempt => attempt === 1 ? 0 : 1000)
    const req = request()
    await req.fetch('/url', { retries: 1, timeout })
    expect(timeoutSpy).toHaveBeenCalledTimes(2)
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, 0)
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, 1000)
  })
  it('delays on the user signal, not the per-attempt timeout signal', async () => {
    fetchMock.mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200))
    const req = request()
    await req.fetch('/url', { retries: 1, timeout: 5000 })
    expect(schedule.delay).toHaveBeenCalledWith(1000, { signal: req.signal })
  })
})

describe('signal wiring', () => {
  it('combines a per-call timeout into the fetch signal', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    const anySpy = vi.spyOn(AbortSignal, 'any')
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { timeout: 5000 })
    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(anySpy).toHaveBeenCalledOnce()
  })
  it('wires a creation-level signal alongside the controller', async () => {
    const external = new AbortController()
    const anySpy = vi.spyOn(AbortSignal, 'any')
    fetchMock.mockResolvedValue(response(200))
    const req = request({ signal: external.signal })
    await req.fetch('/url')
    expect(anySpy).toHaveBeenCalledWith(expect.arrayContaining([req.signal, external.signal]))
  })
  it('wires a per-call signal alongside the controller', async () => {
    const external = new AbortController()
    const anySpy = vi.spyOn(AbortSignal, 'any')
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url', { signal: external.signal })
    expect(anySpy).toHaveBeenCalledWith(expect.arrayContaining([req.signal, external.signal]))
  })
  it('combines creation-level and per-call signals', async () => {
    const creation = new AbortController()
    const call = new AbortController()
    const anySpy = vi.spyOn(AbortSignal, 'any')
    fetchMock.mockResolvedValue(response(200))
    const req = request({ signal: creation.signal })
    await req.fetch('/url', { signal: call.signal })
    expect(anySpy).toHaveBeenCalledWith(expect.arrayContaining([req.signal, creation.signal, call.signal]))
  })
  it('uses the controller signal directly when nothing else is combined', async () => {
    const anySpy = vi.spyOn(AbortSignal, 'any')
    fetchMock.mockResolvedValue(response(200))
    const req = request()
    await req.fetch('/url')
    expect(anySpy).not.toHaveBeenCalled()
    expect(fetchMock.mock.calls[0][1].signal).toBe(req.signal)
  })
})
