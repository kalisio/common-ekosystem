import { describe, it, expect } from 'vitest'
import { url } from '../../src/utilities'

describe('url.buildUrl', () => {
  it('builds a url with valid params', () => {
    expect(url.buildUrl('https://example.com', { foo: 'bar', page: 1 }))
      .toBe('https://example.com/?foo=bar&page=1')
  })

  it('ignores undefined values', () => {
    expect(url.buildUrl('https://example.com', { foo: 'bar', baz: undefined }))
      .toBe('https://example.com/?foo=bar')
  })

  it('throws if baseUrl is invalid', () => {
    expect(() => url.buildUrl('not-a-url', { foo: 'bar' })).toThrow('baseUrl must be an url')
  })

  it('throws if params is empty', () => {
    expect(() => url.buildUrl('https://example.com', {})).toThrow('params must be a non empty object')
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

  it('percent-encodes special characters in the mask', () => {
    expect(url.obfuscate('https://user:pass@example.com', '[hidden]'))
      .toBe('https://%5Bhidden%5D:%5Bhidden%5D@example.com/')
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
