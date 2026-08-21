import { is, assert, conform, optional } from '../predicates/index.js'
import { env } from '../utilities/index.js'

async function fetchText (input) {
  const response = await fetch(input)
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${response.statusText}`)
    error.code = source.ERROR_CODES.HTTP_ERROR
    error.status = response.status
    error.statusText = response.statusText
    throw error
  }
  return response.text()
}

function getReadFn (input, options = {}) {
  const { encoding = 'utf-8' } = options
  if (typeof Blob !== 'undefined' && input instanceof Blob) return () => input.text()
  if (input instanceof URL) return () => fetchText(input)
  if (is.string(input)) {
    if (env.node && !is.url(input)) {
      return async () => {
        const { readFile } = await import('node:fs/promises')
        return readFile(input, encoding)
      }
    }
    return () => fetchText(input)
  }
  const error = new Error('source must be a URL, a string locator or a File/Blob')
  error.code = source.ERROR_CODES.UNSUPPORTED_SOURCE
  throw error
}

export const source = {

  ERROR_CODES: {
    UNSUPPORTED_SOURCE: 'UNSUPPORTED_SOURCE',
    READ_FAILED: 'READ_FAILED',
    HTTP_ERROR: 'HTTP_ERROR'
  },

  READ_OPTIONS_SCHEMA: {
    encoding: optional(is.nonEmptyString)
  },

  async readAsText (input, options = {}) {
    assert.all([
      { value: input, validator: is.defined, message: 'source must be defined' },
      {
        value: options,
        validator: (v) => conform.schema(v, source.READ_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const read = getReadFn(input, options)
    try {
      return await read()
    } catch (cause) {
      const error = new Error(`Failed to read source ${input}`, { cause })
      error.code = source.ERROR_CODES.READ_FAILED
      throw error
    }
  }
}
