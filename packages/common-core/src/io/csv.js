import Ajv from 'ajv'
import Papa from 'papaparse'
import { is, assert, conform, optional } from '../predicates/index.js'
import { source } from './source.js'

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
  rowSchema: optional(is.plainObject)
}

const AJV_OPTIONS = {
  allErrors: true,
  coerceTypes: true
}

const validators = new WeakMap()

function getValidator (rowSchema) {
  let validate = validators.get(rowSchema)
  if (!validate) {
    validate = new Ajv(AJV_OPTIONS).compile(rowSchema)
    validators.set(rowSchema, validate)
  }
  return validate
}

function mapRows (rows, header, parseErrors) {
  return rows.map((row, index) => {
    const mapped = {}
    header.forEach((name, column) => {
      mapped[name] = row[column]
    })
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

function validateRows (data, rowSchema) {
  const validate = getValidator(rowSchema)
  const validationErrors = []
  data.forEach((row, index) => {
    if (!validate(row)) {
      validationErrors.push({
        row: index,
        errors: validate.errors.map(error => ({
          ...error,
          params: { ...error.params }
        }))
      })
    }
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
        validator: (v) => conform.schema(v, PARSE_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const { header, parser = {}, rowSchema } = options
    if (
      rowSchema !== undefined &&
      parser.dynamicTyping !== undefined &&
      parser.dynamicTyping !== false
    ) {
      throw new TypeError('dynamicTyping cannot be used with rowSchema')
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
      validationErrors: validateRows(rows, rowSchema)
    }
  },

  async read (input, options = {}) {
    const text = await source.readAsText(input, options)
    return csv.parse(text, options)
  }
}
