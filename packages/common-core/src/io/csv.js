import Papa from 'papaparse'
import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

export const csv = {

  ERROR_CODES: {
    ...source.ERROR_CODES
  },

  PARSE_OPTIONS_SCHEMA: {
    header: optional(is.boolean),
    delimiter: optional(is.string),
    skipEmptyLines: optional((v) => is.boolean(v) || v === 'greedy')
  },

  parse (text, options = {}) {
    assert.all([
      { value: text, validator: is.string, message: 'text must be a string' },
      {
        value: options,
        validator: (v) => conform.schema(v, csv.PARSE_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    return Papa.parse(text, options)
  },

  async read (input, options = {}) {
    return csv.parse(await source.readAsText(input, options), options)
  }

}
