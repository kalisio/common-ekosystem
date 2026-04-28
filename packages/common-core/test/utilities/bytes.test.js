// test/utilities/bytes.test.js
import { describe, it, expect } from 'vitest'
import { bytes } from '../../src/utilities/bytes'

describe('bytes.toBase64', () => {
  it('encodes a simple ASCII string', () => {
    expect(bytes.toBase64('hello')).toBe('aGVsbG8=')
  })
  it('encodes a UTF-8 string with accents', () => {
    expect(bytes.toBase64('café')).toBe(bytes.toBase64('café'))
    expect(() => bytes.toBase64('café')).not.toThrow()
  })
  it('encodes a Uint8Array', () => {
    expect(bytes.toBase64(new Uint8Array([104, 101, 108, 108, 111]))).toBe('aGVsbG8=')
  })
  it('encodes an ArrayBuffer', () => {
    const buf = new Uint8Array([104, 101, 108, 108, 111]).buffer
    expect(bytes.toBase64(buf)).toBe('aGVsbG8=')
  })
  it('encodes a large Uint8Array without stack overflow', () => {
    const large = new Uint8Array(100000).fill(65)
    expect(() => bytes.toBase64(large)).not.toThrow()
  })
  it('throws if value is a number', () => {
    expect(() => bytes.toBase64(123)).toThrow(TypeError)
  })
  it('throws if value is null', () => {
    expect(() => bytes.toBase64(null)).toThrow(TypeError)
  })
  it('throws if value is undefined', () => {
    expect(() => bytes.toBase64(undefined)).toThrow(TypeError)
  })
})

describe('bytes.fromBase64', () => {
  it('decodes a simple ASCII string', () => {
    expect(bytes.fromBase64('aGVsbG8=')).toBe('hello')
  })
  it('decodes a UTF-8 string with accents', () => {
    const encoded = bytes.toBase64('café')
    expect(bytes.fromBase64(encoded)).toBe('café')
  })
  it('is the inverse of toBase64 for strings', () => {
    const original = 'hello world'
    expect(bytes.fromBase64(bytes.toBase64(original))).toBe(original)
  })
  it('throws if value is not a string', () => {
    expect(() => bytes.fromBase64(123)).toThrow(TypeError)
    expect(() => bytes.fromBase64(null)).toThrow(TypeError)
    expect(() => bytes.fromBase64(undefined)).toThrow(TypeError)
  })
})

describe('bytes.fromBase64Bytes', () => {
  it('decodes to a Uint8Array', () => {
    expect(bytes.fromBase64Bytes('aGVsbG8=')).toEqual(new Uint8Array([104, 101, 108, 108, 111]))
  })
  it('is the inverse of toBase64 for Uint8Array', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5])
    expect(bytes.fromBase64Bytes(bytes.toBase64(original))).toEqual(original)
  })
  it('returns a Uint8Array instance', () => {
    expect(bytes.fromBase64Bytes('aGVsbG8=') instanceof Uint8Array).toBe(true)
  })
  it('throws if value is not a string', () => {
    expect(() => bytes.fromBase64Bytes(123)).toThrow(TypeError)
    expect(() => bytes.fromBase64Bytes(null)).toThrow(TypeError)
    expect(() => bytes.fromBase64Bytes(undefined)).toThrow(TypeError)
  })
})

describe('bytes.toHex', () => {
  it('encodes a Uint8Array to hex', () => {
    expect(bytes.toHex(new Uint8Array([0, 1, 255]))).toBe('0001ff')
  })
  it('encodes an ArrayBuffer to hex', () => {
    const buf = new Uint8Array([0, 1, 255]).buffer
    expect(bytes.toHex(buf)).toBe('0001ff')
  })
  it('pads single digit hex values', () => {
    expect(bytes.toHex(new Uint8Array([0, 1, 15]))).toBe('00010f')
  })
  it('throws if valus is an empty string', () => {
    expect(() => bytes.fromHex('')).toThrow()
  })
  it('throws if value is a string', () => {
    expect(() => bytes.toHex('hello')).toThrow(TypeError)
  })
  it('throws if value is null', () => {
    expect(() => bytes.toHex(null)).toThrow(TypeError)
  })
  it('throws if value is undefined', () => {
    expect(() => bytes.toHex(undefined)).toThrow(TypeError)
  })
})

describe('bytes.fromHex', () => {
  it('decodes a hex string to a Uint8Array', () => {
    expect(bytes.fromHex('0001ff')).toEqual(new Uint8Array([0, 1, 255]))
  })
  it('handles uppercase hex', () => {
    expect(bytes.fromHex('0001FF')).toEqual(new Uint8Array([0, 1, 255]))
  })
  it('is the inverse of toHex', () => {
    const original = new Uint8Array([0, 1, 127, 255])
    expect(bytes.fromHex(bytes.toHex(original))).toEqual(original)
  })
  it('throws if value is an empty string', () => {
    expect(() => bytes.fromHex('')).toThrow(TypeError)
  })
  it('throws if value has odd length', () => {
    expect(() => bytes.fromHex('abc')).toThrow(TypeError)
  })
  it('throws if value contains non-hex characters', () => {
    expect(() => bytes.fromHex('zz')).toThrow(TypeError)
  })
  it('throws if value is not a string', () => {
    expect(() => bytes.fromHex(123)).toThrow(TypeError)
    expect(() => bytes.fromHex(null)).toThrow(TypeError)
    expect(() => bytes.fromHex(undefined)).toThrow(TypeError)
  })
})

describe('bytes.dataUriToBlob', () => {
  it('returns a Blob instance', () => {
    const result = bytes.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result instanceof Blob).toBe(true)
  })
  it('sets the correct mime type', () => {
    const result = bytes.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result.type).toBe('text/plain')
  })
  it('sets the correct mime type for an image', () => {
    const result = bytes.dataUriToBlob('data:image/png;base64,iVBORw0KGgo=')
    expect(result.type).toBe('image/png')
  })
  it('sets the correct size', () => {
    const result = bytes.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    expect(result.size).toBe(5) // 'hello' = 5 bytes
  })
  it('produces the correct content', async () => {
    const result = bytes.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
    const text = await result.text()
    expect(text).toBe('hello')
  })
  it('throws if value is not a valid data URI', () => {
    expect(() => bytes.dataUriToBlob('hello')).toThrow(TypeError)
    expect(() => bytes.dataUriToBlob('data:text/plain,hello')).toThrow(TypeError)
  })
  it('throws if value is not a string', () => {
    expect(() => bytes.dataUriToBlob(null)).toThrow(TypeError)
    expect(() => bytes.dataUriToBlob(undefined)).toThrow(TypeError)
    expect(() => bytes.dataUriToBlob(123)).toThrow(TypeError)
  })
})
