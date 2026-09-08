import { load } from 'js-yaml'
import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

const PARSE_OPTIONS_SCHEMA = {
  parser: optional(is.plainObject)
}

export const yaml = {

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
      return load(text, options.parser)
    } catch (cause) {
      const error = new Error('Failed to parse YAML', { cause })
      error.code = yaml.ERROR_CODES.PARSE_FAILED
      throw error
    }
  },

  async read (input, options = {}) {
    return yaml.parse(await source.readAsText(input, options), options)
  }

}
