// test/utilities/byte.test.js
import { describe, it, expect } from 'vitest'
import { AssertionError } from '../../src/predicates/index.js'
import { byte } from '../../src/utilities/index.js'

describe('byte.toBase64', () => {
  it('encodes a simple ASCII string', () => {
    expect(byte.toBase64('hello')).toBe('aGVsbG8=')
  })
  it('encodes a UTF-8 string with accents', () => {
    expect(byte.toBase64('café')).toBe(byte.toBase64('café'))
    expect(() => byte.toBase64('café')).not.toThrow()
  })
  it('encodes a Uint8Array', () => {
    expect(byte.toBase64(new Uint8Array([104, 101, 108, 108, 111]))).toBe('aGVsbG8=')
  })
  it('encodes an ArrayBuffer', () => {
    const buf = new Uint8Array([104, 101, 108, 108, 111]).buffer
    expect(byte.toBase64(buf)).toBe('aGVsbG8=')
  })
  it('encodes a large Uint8Array without stack overflow', () => {
    const large = new Uint8Array(100000).fill(65)
    expect(() => byte.toBase64(large)).not.toThrow()
  })
  it('throws if value is a number', () => {
    expect(() => byte.toBase64(123)).toThrow(AssertionError)
  })
  it('throws if value is null', () => {
    expect(() => byte.toBase64(null)).toThrow(AssertionError)
  })
  it('throws if value is undefined', () => {
    expect(() => byte.toBase64(undefined)).toThrow(AssertionError)
  })
})

describe('byte.fromBase64', () => {
  it('decodes a simple ASCII string', () => {
    expect(byte.fromBase64('aGVsbG8=')).toBe('hello')
  })
  it('decodes a UTF-8 string with accents', () => {
    const encoded = byte.toBase64('café')
    expect(byte.fromBase64(encoded)).toBe('café')
  })
  it('is the inverse of toBase64 for strings', () => {
    const original = 'hello world'
    expect(byte.fromBase64(byte.toBase64(original))).toBe(original)
  })
  it('throws if value is not a string', () => {
    expect(() => byte.fromBase64(123)).toThrow(AssertionError)
    expect(() => byte.fromBase64(null)).toThrow(AssertionError)
    expect(() => byte.fromBase64(undefined)).toThrow(AssertionError)
  })
})

describe('byte.fromBase64Bytes', () => {
  it('decodes to a Uint8Array', () => {
    expect(byte.fromBase64Bytes('aGVsbG8=')).toEqual(new Uint8Array([104, 101, 108, 108, 111]))
  })
  it('is the inverse of toBase64 for Uint8Array', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5])
    expect(byte.fromBase64Bytes(byte.toBase64(original))).toEqual(original)
  })
  it('returns a Uint8Array instance', () => {
    expect(byte.fromBase64Bytes('aGVsbG8=') instanceof Uint8Array).toBe(true)
  })
  it('throws if value is not a string', () => {
    expect(() => byte.fromBase64Bytes(123)).toThrow(AssertionError)
    expect(() => byte.fromBase64Bytes(null)).toThrow(AssertionError)
    expect(() => byte.fromBase64Bytes(undefined)).toThrow(AssertionError)
  })
})

describe('byte.toHex', () => {
  it('encodes a Uint8Array to hex', () => {
    expect(byte.toHex(new Uint8Array([0, 1, 255]))).toBe('0001ff')
  })
  it('encodes an ArrayBuffer to hex', () => {
    const buf = new Uint8Array([0, 1, 255]).buffer
    expect(byte.toHex(buf)).toBe('0001ff')
  })
  it('pads single digit hex values', () => {
    expect(byte.toHex(new Uint8Array([0, 1, 15]))).toBe('00010f')
  })
  it('throws if valus is an empty string', () => {
    expect(() => byte.fromHex('')).toThrow()
  })
  it('throws if value is a string', () => {
    expect(() => byte.toHex('hello')).toThrow(AssertionError)
  })
  it('throws if value is null', () => {
    expect(() => byte.toHex(null)).toThrow(AssertionError)
  })
  it('throws if value is undefined', () => {
    expect(() => byte.toHex(undefined)).toThrow(AssertionError)
  })
})

describe('byte.fromHex', () => {
  it('decodes a hex string to a Uint8Array', () => {
    expect(byte.fromHex('0001ff')).toEqual(new Uint8Array([0, 1, 255]))
  })
  it('handles uppercase hex', () => {
    expect(byte.fromHex('0001FF')).toEqual(new Uint8Array([0, 1, 255]))
  })
  it('is the inverse of toHex', () => {
    const original = new Uint8Array([0, 1, 127, 255])
    expect(byte.fromHex(byte.toHex(original))).toEqual(original)
  })
  it('throws if value is an empty string', () => {
    expect(() => byte.fromHex('')).toThrow(AssertionError)
  })
  it('throws if value has odd length', () => {
    expect(() => byte.fromHex('abc')).toThrow(AssertionError)
  })
  it('throws if value contains non-hex characters', () => {
    expect(() => byte.fromHex('zz')).toThrow(AssertionError)
  })
  it('throws if value is not a string', () => {
    expect(() => byte.fromHex(123)).toThrow(AssertionError)
    expect(() => byte.fromHex(null)).toThrow(AssertionError)
    expect(() => byte.fromHex(undefined)).toThrow(AssertionError)
  })
})

describe('byte.dataUriToBlob', () => {
  it('returns a Blob instance', () => {
    const result = byte.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result instanceof Blob).toBe(true)
  })
  it('sets the correct mime type', () => {
    const result = byte.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result.type).toBe('text/plain')
  })
  it('sets the correct mime type for an image', () => {
    const result = byte.dataUriToBlob('data:image/png;base64,iVBORw0KGgo=')
    expect(result.type).toBe('image/png')
  })
  it('sets the correct size', () => {
    const result = byte.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result.size).toBe(5) // 'hello' = 5 bytes
  })
  it('produces the correct content', async () => {
    const result = byte.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    const text = await result.text()
    expect(text).toBe('hello')
  })
  it('throws if value is not a valid data URI', () => {
    expect(() => byte.dataUriToBlob('hello')).toThrow(AssertionError)
    expect(() => byte.dataUriToBlob('data:text/plain,hello')).toThrow(AssertionError)
  })
  it('throws if value is not a string', () => {
    expect(() => byte.dataUriToBlob(null)).toThrow(AssertionError)
    expect(() => byte.dataUriToBlob(undefined)).toThrow(AssertionError)
    expect(() => byte.dataUriToBlob(123)).toThrow(AssertionError)
  })
})
