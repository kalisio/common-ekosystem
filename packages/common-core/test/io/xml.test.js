import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { xml } from '../../src/io/xml.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

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
  it('parses XML as JSON', async () => {
    const result = await xml.parse('<note><to>World</to></note>', {
      output: 'json'
    })
    expect(result).toEqual({
      note: {
        to: 'World'
      }
    })
  })
  it('rejects object as output', async () => {
    await expect(xml.parse('<a/>', {
      output: 'object'
    })).rejects.toThrowError()
  })
  it('uses JSON output by default', async () => {
    const text = '<note><to>World</to></note>'

    expect(await xml.parse(text)).toEqual(
      await xml.parse(text, { output: 'json' })
    )
  })
  it('parses a real XML fixture into JSON', async () => {
    const json = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'))
    expect(json.note['@_category']).toBe('reminder')
    expect(json.note.to).toBe('World')
  })
  it('decodes XML entities into JSON', async () => {
    const json = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'))
    expect(json.note.body).toBe('Hello & welcome')
  })
  it('supports parser options', async () => {
    const json = await xml.parse('<note category="reminder"/>', {
      parser: {
        attributeNamePrefix: ''
      }
    })
    expect(json.note.category).toBe('reminder')
  })
  it.skipIf(!hasDomParser)('parses a real XML fixture into a DOM Document', async () => {
    const doc = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'), {
      output: 'dom'
    })
    expect(doc.documentElement.nodeName).toBe('note')
    expect(doc.documentElement.getAttribute('category')).toBe('reminder')
    expect(doc.getElementsByTagName('to')[0].textContent).toBe('World')
  })
  it.skipIf(!hasDomParser)('decodes XML entities into DOM', async () => {
    const doc = await xml.parse(await readFile(fixture('note.xml'), 'utf-8'), {
      output: 'dom'
    })
    expect(doc.getElementsByTagName('body')[0].textContent).toBe('Hello & welcome')
  })
  it('uses an injected domParser', async () => {
    const domParser = {
      parseFromString: (text, type) => ({ injected: true, text, type })
    }
    expect(await xml.parse('<a/>', {
      output: 'dom',
      domParser
    })).toMatchObject({
      injected: true,
      text: '<a/>',
      type: 'text/xml'
    })
  })

  it('wraps an error thrown by the DOM parser as PARSE_FAILED', async () => {
    const cause = new Error('parser failure')
    const domParser = {
      parseFromString: () => {
        throw cause
      }
    }
    await expect(xml.parse('<a/>', {
      output: 'dom',
      domParser
    })).rejects.toMatchObject({
      code: xml.ERROR_CODES.PARSE_FAILED,
      cause
    })
  })
  it('rejects malformed XML with PARSE_FAILED', async () => {
    await expect(xml.parse('<root><child></root>')).rejects.toMatchObject({
      code: xml.ERROR_CODES.PARSE_FAILED
    })
  })
  it('rejects a non-string input', async () => {
    await expect(xml.parse(42)).rejects.toThrowError()
  })
  it('rejects an invalid output option', async () => {
    await expect(xml.parse('<a/>', {
      output: 'invalid'
    })).rejects.toThrowError()
  })
  it('rejects an invalid domParser option', async () => {
    await expect(xml.parse('<a/>', {
      output: 'dom',
      domParser: {}
    })).rejects.toThrowError()
  })
})

describe('xml.read', () => {
  it('reads and parses an XML fixture into JSON', async () => {
    const json = await xml.read(fixture('note.xml'))
    expect(json.note.from).toBe('Kalisio')
  })
  it.skipIf(!hasDomParser)('reads and parses an XML fixture into DOM', async () => {
    const doc = await xml.read(fixture('note.xml'), {
      output: 'dom'
    })
    expect(doc.getElementsByTagName('from')[0].textContent).toBe('Kalisio')
  })
  it('propagates source errors', async () => {
    await expect(xml.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({
      code: xml.ERROR_CODES.READ_FAILED
    })
  })
})
