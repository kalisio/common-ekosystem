import { describe, it, expect } from 'vitest'
import { url } from '../../src/utilities'

describe('url.build', () => {
  it('builds a url with valid params', () => {
    expect(url.build('https://example.com', { foo: 'bar', page: 1 }))
      .toBe('https://example.com/?foo=bar&page=1')
  })

  it('ignores undefined values', () => {
    expect(url.build('https://example.com', { foo: 'bar', baz: undefined }))
      .toBe('https://example.com/?foo=bar')
  })

  it('throws if baseUrl is invalid', () => {
    expect(() => url.build('not-a-url', { foo: 'bar' })).toThrow('baseUrl must be an url')
  })

  it('throws if params is empty', () => {
    expect(() => url.build('https://example.com', {})).toThrow('params must be a non empty object')
  })
})

describe('url.parse', () => {
  it('parses host, port and path from a url with explicit port', () => {
    expect(url.parse('https://example.com:3000/api/users'))
      .toEqual({ hosts: [{ host: 'example.com', port: 3000 }], path: '/api/users', query: {} })
  })

  it('uses defaultPort when no port is specified', () => {
    expect(url.parse('https://example.com/api/users'))
      .toEqual({ hosts: [{ host: 'example.com', port: 80 }], path: '/api/users', query: {} })
  })

  it('accepts a custom defaultPort', () => {
    expect(url.parse('https://example.com/api/users', 443))
      .toEqual({ hosts: [{ host: 'example.com', port: 443 }], path: '/api/users', query: {} })
  })

  it('returns / as path when there is no path', () => {
    expect(url.parse('https://example.com')).toMatchObject({ path: '/' })
  })

  it('parses the query string into a decoded object', () => {
    expect(url.parse('https://example.com/api?foo=bar&page=2').query)
      .toEqual({ foo: 'bar', page: '2' })
  })

  it('decodes percent-encoded query values', () => {
    expect(url.parse('https://example.com/?auth=a%20b%40c').query)
      .toEqual({ auth: 'a b@c' })
  })

  it('parses a multi-host connection string into several hosts', () => {
    expect(url.parse('mongodb://h1:27017,h2:27017,h3:27017/db'))
      .toEqual({
        hosts: [
          { host: 'h1', port: 27017 },
          { host: 'h2', port: 27017 },
          { host: 'h3', port: 27017 }
        ],
        path: '/db',
        query: {}
      })
  })

  it('keeps userinfo out of the first host', () => {
    expect(url.parse('mongodb://user:pass@h1:27017,h2:27017/db').hosts)
      .toEqual([{ host: 'h1', port: 27017 }, { host: 'h2', port: 27017 }])
  })

  it('parses the replica set query of a connection string', () => {
    expect(url.parse('mongodb://h1:27017,h2:27017/db?replicaSet=rs0').query)
      .toEqual({ replicaSet: 'rs0' })
  })

  it('throws if url is invalid', () => {
    expect(() => url.parse('not-a-url')).toThrow('url must be an url')
  })

  it('throws if defaultPort is not a number', () => {
    expect(() => url.parse('https://example.com', '80')).toThrow('defaultPort must be a number')
  })
})

describe('url.addQueryParam', () => {
  it('appends query params to an existing url', () => {
    expect(url.addQueryParam('https://example.com/?foo=bar', { baz: 'qux' }))
      .toBe('https://example.com/?foo=bar&baz=qux')
  })

  it('overwrites an existing param with the same key', () => {
    expect(url.addQueryParam('https://example.com/?foo=old', { foo: 'new' }))
      .toBe('https://example.com/?foo=new')
  })

  it('ignores undefined values', () => {
    expect(url.addQueryParam('https://example.com/', { foo: 'bar', baz: undefined }))
      .toBe('https://example.com/?foo=bar')
  })

  it('percent-encodes param values', () => {
    expect(url.addQueryParam('https://example.com/', { auth: 'a b@c' }))
      .toBe('https://example.com/?auth=a%20b%40c')
  })

  it('inserts the param before the fragment', () => {
    expect(url.addQueryParam('https://example.com/?a=1#frag', { auth: 'toto' }))
      .toBe('https://example.com/?a=1&auth=toto#frag')
  })

  it('adds a query param to a multi-host connection string', () => {
    expect(url.addQueryParam('mongodb://h1:27017,h2:27017/db?replicaSet=rs0', { auth: 'toto' }))
      .toBe('mongodb://h1:27017,h2:27017/db?replicaSet=rs0&auth=toto')
  })

  it('throws if url is invalid', () => {
    expect(() => url.addQueryParam('not-a-url', { foo: 'bar' })).toThrow('url must be an url')
  })
})

describe('url.encode', () => {
  it('encodes an url', () => {
    expect(url.encode('https://example.com/path with spaces'))
      .toBe('https://example.com/path%20with%20spaces')
  })

  it('throws if url is invalid', () => {
    expect(() => url.encode('not-a-url')).toThrow('url must be an url')
  })
})

describe('url.obfuscate', () => {
  it('masks username and password with default mask', () => {
    expect(url.obfuscate('https://user:pass@example.com'))
      .toBe('https://*****:*****@example.com/')
  })

  it('masks username and password with a custom mask', () => {
    expect(url.obfuscate('https://user:pass@example.com', 'HIDDEN'))
      .toBe('https://HIDDEN:HIDDEN@example.com/')
  })

  it('masks a username with no password', () => {
    expect(url.obfuscate('https://user@example.com'))
      .toBe('https://*****@example.com/')
  })

  it('masks the credentials of a multi-host connection string', () => {
    expect(url.obfuscate('mongodb://user:pass@h1:27017,h2:27017/db'))
      .toBe('mongodb://*****:*****@h1:27017,h2:27017/db')
  })

  it('does not alter a url with no credentials', () => {
    expect(url.obfuscate('https://example.com')).toBe('https://example.com/')
  })

  it('throws if url is invalid', () => {
    expect(() => url.obfuscate('not-a-url')).toThrow('url must be an url')
  })

  it('throws if mask is not a string', () => {
    expect(() => url.obfuscate('https://user:pass@example.com', 123)).toThrow('mask must be a string')
  })
})
