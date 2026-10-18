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
  it('converts tag values unless parseTagValue is disabled', async () => {
    const text = '<a><id>01</id><title>1.0</title></a>'
    expect((await xml.parse(text)).a).toEqual({ id: 1, title: 1 })
    expect((await xml.parse(text, {
      parser: { parseTagValue: false }
    })).a).toEqual({ id: '01', title: '1.0' })
  })
  it('tolerates whitespace and a BOM before the XML declaration', async () => {
    for (const prefix of ['\n', '  \r\n', '\uFEFF']) {
      const json = await xml.parse(`${prefix}<?xml version="1.0"?><note><to>World</to></note>`)
      expect(json.note.to).toBe('World')
    }
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
  it.skipIf(!hasDomParser)('tolerates whitespace before the XML declaration in DOM output', async () => {
    const doc = await xml.parse('\n<?xml version="1.0"?><note/>', {
      output: 'dom'
    })
    expect(doc.documentElement.nodeName).toBe('note')
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
  it('reports where malformed XML is invalid', async () => {
    const error = await xml.parse('<root>\n  <child>\n</root>').catch((error) => error)
    expect(error.code).toBe(xml.ERROR_CODES.PARSE_FAILED)
    expect(error.message).toMatch(/^Invalid XML: .* \(line \d+, column \d+\)$/)
    expect(error.cause).toMatchObject({ code: expect.any(String), line: expect.any(Number) })
  })
  it('validates malformed XML before building a DOM', async () => {
    // DOM parsers do not reliably fail on malformed XML: it must never reach them.
    const domParser = {
      parseFromString: vi.fn()
    }
    await expect(xml.parse('<root><child></root>', {
      output: 'dom',
      domParser
    })).rejects.toMatchObject({
      code: xml.ERROR_CODES.PARSE_FAILED
    })
    expect(domParser.parseFromString).not.toHaveBeenCalled()
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
