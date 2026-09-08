import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

const PARSE_OPTIONS_SCHEMA = {
  output: optional((v) => is.oneOf(v, ['json', 'dom'])),
  domParser: optional((v) => is.function(v?.parseFromString)),
  parser: optional(is.plainObject)
}

async function getDomParser () {
  if (typeof globalThis.DOMParser !== 'undefined') return new globalThis.DOMParser()
  const { DOMParser: NodeDomParser } = await import('@xmldom/xmldom')
  return new NodeDomParser()
}

export const xml = {

  ERROR_CODES: {
    ...source.ERROR_CODES,
    PARSE_FAILED: 'PARSE_FAILED',
    INVALID_XML: 'INVALID_XML'
  },

  async parse (text, options = {}) {
    assert.all([
      { value: text, validator: is.string, message: 'text must be a string' },
      {
        value: options,
        validator: (v) => conform.schema(v, PARSE_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const validation = XMLValidator.validate(text)
    if (validation !== true) {
      const error = new Error('Invalid XML')
      error.code = xml.ERROR_CODES.INVALID_XML
      throw error
    }
    try {
      const {
        output = 'json',
        domParser,
        parser = {}
      } = options
      if (output === 'dom') {
        const domInstance = domParser ?? await getDomParser()
        return domInstance.parseFromString(text, 'text/xml')
      }
      const xmlParser = new XMLParser({
        ignoreAttributes: false,
        ...parser
      })
      return xmlParser.parse(text)
    } catch (cause) {
      const error = new Error('Failed to parse XML', { cause })
      error.code = xml.ERROR_CODES.PARSE_FAILED
      throw error
    }
  },

  async read (input, options = {}) {
    return xml.parse(await source.readAsText(input, options), options)
  }
}
