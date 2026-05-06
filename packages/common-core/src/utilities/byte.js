// src/utilities/bytes.js
import { assert, is } from '../predicates'

export const bytes = {

  toBase64 (value) {
    assert.that(
      value,
      (v) => typeof v === 'string' || v instanceof ArrayBuffer || ArrayBuffer.isView(v),
      'value must be a string, ArrayBuffer or ArrayBufferView'
    )
    if (typeof value === 'string') {
      value = new TextEncoder().encode(value)
    }
    const raw = new Uint8Array(value)
    const CHUNK_SIZE = 0x8000
    const chunks = []
    for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
      chunks.push(String.fromCharCode.apply(null, raw.subarray(i, i + CHUNK_SIZE)))
    }
    return btoa(chunks.join(''))
  },

  fromBase64Bytes (value) {
    assert.that(value, is.string, 'value must be a string')
    return Uint8Array.from(atob(value), c => c.charCodeAt(0))
  },

  fromBase64 (value) {
    assert.that(value, is.string, 'value must be a string')
    return new TextDecoder().decode(bytes.fromBase64Bytes(value))
  },

  toHex (value) {
    assert.that(
      value,
      (v) => v instanceof ArrayBuffer || ArrayBuffer.isView(v),
      'value must be an ArrayBuffer or ArrayBufferView'
    )
    return Array.from(new Uint8Array(value))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  },

  fromHex (value) {
    assert.that(value, is.hex, 'value must be an hex string')
    const result = new Uint8Array(value.length / 2)
    for (let i = 0; i < value.length; i += 2) {
      result[i / 2] = parseInt(value.slice(i, i + 2), 16)
    }
    return result
  },

  dataUriToBlob (value) {
    assert.that(value, is.dataUri, 'value must be a valid data URI')
    const [header, data] = value.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    const byteString = atob(data)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeType })
  }

}
