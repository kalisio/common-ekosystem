import nock from 'nock'
import { createRequester } from '../../src/runtime/index.js'

const URL = 'https://example.test/resource'

afterEach(() => nock.cleanAll())

describe('requester HTTP integration', () => {
  it('retries a GET after a 503 response', async () => {
    const scope = nock('https://example.test')
      .get('/resource')
      .reply(503)
      .get('/resource')
      .reply(200, { success: true })

    const client = createRequester({ retries: 1, retryDelay: 0 })
    const response = await client.fetch(URL)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    scope.done()
  })
  it('does not retry a POST without an idempotency key', async () => {
    const scope = nock('https://example.test')
      .post('/resource', 'payload')
      .reply(503)

    const client = createRequester({ retries: 2, retryDelay: 0 })
    const response = await client.fetch(URL, {
      method: 'POST',
      body: 'payload'
    })

    expect(response.status).toBe(503)
    scope.done()
  })
  it('retries a POST with an idempotency key', async () => {
    const scope = nock('https://example.test')
      .post('/resource', 'payload')
      .matchHeader('idempotency-key', 'test-key')
      .reply(503)
      .post('/resource', 'payload')
      .matchHeader('idempotency-key', 'test-key')
      .reply(200)

    const client = createRequester({ retries: 1, retryDelay: 0 })
    const response = await client.fetch(URL, {
      method: 'POST',
      body: 'payload',
      headers: { 'Idempotency-Key': 'test-key' }
    })

    expect(response.status).toBe(200)
    scope.done()
  })
})
