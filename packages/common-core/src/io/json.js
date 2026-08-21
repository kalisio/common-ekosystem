import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

const PARSE_OPTIONS_SCHEMA = {
  reviver: optional(is.function)
}

export const json = {

  ERROR_CODES: {
    ...source.ERROR_CODES,
    PARSE_FAILED: 'PARSE_FAILED'
  },

  parse (text, options = {}) {
    assert.all([
      { value: text, validator: is.string, message: 'text must be a string' },
      {
        value: options,
        validator: (v) => conform.schema(v, PARSE_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    try {
      return JSON.parse(text, options.reviver)
    } catch (cause) {
      const error = new Error('Failed to parse JSON', { cause })
      error.code = json.ERROR_CODES.PARSE_FAILED
      throw error
    }
  },

  async read (input, options = {}) {
    return json.parse(await source.readAsText(input, options), options)
  }

}
