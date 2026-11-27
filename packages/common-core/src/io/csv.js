import Papa from 'papaparse'
import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'
import { validate } from '../operators/validate.js'

const isHeader = (value) =>
  value === true ||
  (
    is.nonEmptyArray(value) &&
    value.every(is.nonEmptyString) &&
    new Set(value).size === value.length
  )

const PARSE_OPTIONS_SCHEMA = {
  header: optional(isHeader),
  parser: optional(is.plainObject),
  rowSchema: optional(v => is.plainObject(v) || is.boolean(v)),
  locale: optional(is.nonEmptyString)
}

const AJV_OPTIONS = {
  coerceTypes: true
}

function mapRows (rows, header, parseErrors) {
  return rows.map((row, index) => {
    // Own properties are defined, so a "__proto__" column is kept as data
    const mapped = Object.fromEntries(
      header.map((name, column) => [name, row[column]])
    )
    if (row.length < header.length) {
      parseErrors.push({
        type: 'FieldMismatch',
        code: 'TooFewFields',
        message: `Too few fields: expected ${header.length} fields but parsed ${row.length}`,
        row: index
      })
    }
    if (row.length > header.length) {
      // Match PapaParse behavior when header: true
      mapped.__parsed_extra = row.slice(header.length)
      parseErrors.push({
        type: 'FieldMismatch',
        code: 'TooManyFields',
        message: `Too many fields: expected ${header.length} fields but parsed ${row.length}`,
        row: index
      })
    }
    return mapped
  })
}

function validateRows (rows, rowSchema, locale) {
  const validator = validate(rowSchema, { ajvOptions: AJV_OPTIONS })
  const validationErrors = []
  rows.forEach((row, index) => {
    // Type coercion mutates the row in place
    const { valid, errors } = validator(row, { locale })
    if (!valid) validationErrors.push({ row: index, errors })
  })
  return validationErrors
}

export const csv = {

  ERROR_CODES: {
    ...source.ERROR_CODES
  },

  parse (text, options = {}) {
    assert.all([
      {
        value: text,
        validator: is.string,
        message: 'text must be a string'
      },
      {
        value: options,
        validator: v => conform.schema(v, PARSE_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const { header, parser = {}, rowSchema, locale } = options
    // Parsing must return all results synchronously
    if (parser.worker || parser.download || parser.step || parser.chunk) {
      throw new TypeError('Only synchronous non-streaming parsing is supported')
    }
    // Type coercion is handled by Ajv when a row schema is provided
    if (
      rowSchema !== undefined &&
      parser.dynamicTyping !== undefined &&
      parser.dynamicTyping !== false
    ) {
      throw new TypeError('dynamicTyping cannot be used with rowSchema')
    }
    // Parsing is sync, so an async validator could not be awaited
    if (rowSchema?.$async) {
      throw new TypeError('rowSchema cannot be async')
    }
    const customHeader = is.array(header)
    const {
      data,
      errors: parseErrors,
      meta: parseMeta
    } = Papa.parse(text, {
      skipEmptyLines: true,
      ...parser,
      header: customHeader ? false : header === true
    })
    const rows = customHeader ? mapRows(data, header, parseErrors) : data
    if (customHeader) {
      parseMeta.fields = [...header]
    }
    const result = {
      data: rows,
      parseErrors,
      parseMeta
    }
    if (rowSchema === undefined) return result
    return {
      ...result,
      validationErrors: validateRows(rows, rowSchema, locale)
    }
  },

  async read (input, options = {}) {
    const text = await source.readAsText(input, options)
    return csv.parse(text, options)
  }
}
