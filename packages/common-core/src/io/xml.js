import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

const PARSE_OPTIONS_SCHEMA = {
  domParser: optional((v) => is.function(v?.parseFromString))
}

async function getDomParser () {
  if (typeof DOMParser !== 'undefined') return new DOMParser()
  const { DOMParser: NodeDomParser } = await import(/* webpackIgnore: true */ '@xmldom/xmldom')
  return new NodeDomParser()
}

function hasParserError (document) {
  return document.getElementsByTagName('parsererror').length > 0
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
    try {
      const parser = options.domParser ?? await getDomParser()
      const document = parser.parseFromString(text, 'text/xml')
      if (hasParserError(document)) {
        const error = new Error('Invalid XML')
        error.code = xml.ERROR_CODES.INVALID_XML
        throw error
      }
      return document
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
