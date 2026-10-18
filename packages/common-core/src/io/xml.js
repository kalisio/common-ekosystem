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

function parseFailure (message, cause) {
  const error = new Error(message, { cause })
  error.code = xml.ERROR_CODES.PARSE_FAILED
  return error
}

export const xml = {

  ERROR_CODES: {
    ...source.ERROR_CODES,
    PARSE_FAILED: 'PARSE_FAILED'
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
    const { output = 'json', domParser, parser = {} } = options
    // Leading whitespace (and BOM) before the XML declaration makes a document
    // invalid; some servers emit it anyway, and it carries no content.
    const content = text.trimStart()
    // The DOM parsers do not reliably fail on malformed XML (the browser one
    // returns a <parsererror> document, xmldom a partial one), so documents are
    // validated first, whatever the output.
    const validation = XMLValidator.validate(content)
    if (validation !== true) {
      const { msg, line, col } = validation.err
      throw parseFailure(`Invalid XML: ${msg} (line ${line}, column ${col})`, validation.err)
    }
    if (output === 'dom') {
      // Outside the try block: a missing @xmldom/xmldom is a setup issue, not a
      // parse failure, and must surface as such.
      const domInstance = domParser ?? await getDomParser()
      try {
        return domInstance.parseFromString(content, 'text/xml')
      } catch (cause) {
        throw parseFailure('Failed to parse XML', cause)
      }
    }
    try {
      return new XMLParser({ ignoreAttributes: false, ...parser }).parse(content)
    } catch (cause) {
      throw parseFailure('Failed to parse XML', cause)
    }
  },

  async read (input, options = {}) {
    return xml.parse(await source.readAsText(input, options), options)
  }
}
