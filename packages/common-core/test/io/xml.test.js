import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { xml } from '../../src/io/index.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const fixture = (name) => join(dataDir, name)

const hasDomParser = await (async () => {
  if (typeof globalThis.DOMParser !== 'undefined') return true
  try {
    await import('@xmldom/xmldom')
    return true
  } catch {
    return false
  }
})()

describe('xml.parse', () => {
  it.skipIf(!hasDomParser)('parses a real XML fixture into a DOM Document', async () => {
    const doc = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'))
    expect(doc.documentElement.nodeName).toBe('note')
    expect(doc.documentElement.getAttribute('category')).toBe('reminder')
    expect(doc.getElementsByTagName('to')[0].textContent).toBe('World')
  })
  it.skipIf(!hasDomParser)('decodes XML entities', async () => {
    const doc = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'))
    expect(doc.getElementsByTagName('body')[0].textContent).toBe('Hello & welcome')
  })
  it('uses an injected domParser', async () => {
    const domParser = {
      parseFromString: (text, type) => ({ injected: true, text, type, getElementsByTagName: () => [] })
    }
    expect(await xml.parse('<a/>', { domParser })).toMatchObject({ injected: true, text: '<a/>', type: 'text/xml' })
  })
  it('throws PARSE_FAILED with INVALID_XML cause when parsererror is returned', async () => {
    const domParser = {
      parseFromString: () => ({ getElementsByTagName: (name) => name === 'parsererror' ? [{}] : [] })
    }
    await expect(xml.parse('<a>', { domParser })).rejects.toMatchObject({
      code: xml.ERROR_CODES.PARSE_FAILED,
      cause: { code: xml.ERROR_CODES.INVALID_XML }
    })
  })
  it('wraps an error thrown by the DOM parser as PARSE_FAILED', async () => {
    const cause = new Error('parser failure')
    const domParser = {
      parseFromString: () => {
        throw cause
      }
    }
    await expect(xml.parse('<a>', { domParser })).rejects.toMatchObject({ code: xml.ERROR_CODES.PARSE_FAILED, cause })
  })
  it.skipIf(!hasDomParser)('rejects malformed XML with PARSE_FAILED', async () => {
    await expect(xml.parse('<root><child></root>')).rejects.toMatchObject({ code: xml.ERROR_CODES.PARSE_FAILED })
  })
  it('rejects a non-string input', async () => {
    await expect(xml.parse(42)).rejects.toThrowError()
  })
  it('rejects an invalid domParser option', async () => {
    await expect(xml.parse('<a/>', { domParser: {} })).rejects.toThrowError()
  })
})

describe('xml.read', () => {
  it.skipIf(!hasDomParser)('reads and parses an XML fixture from a path', async () => {
    const doc = await xml.read(fixture('note.xml'))
    expect(doc.getElementsByTagName('from')[0].textContent).toBe('Kalisio')
  })
  it('propagates source errors', async () => {
    await expect(xml.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: xml.ERROR_CODES.READ_FAILED })
  })
})
