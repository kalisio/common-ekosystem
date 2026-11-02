import { assert, is, conform, optional } from '../predicates/index.js'
import { string } from './string.js'

const PASSWORD_CHARSETS = {
  letters: string.charset(/[a-zA-Z]/),
  digits: string.charset(/\d/),
  specials: string.charset(/[^a-zA-Z\d]/)
}

const PASSWORD_OPTIONS_SCHEMA = {
  length: optional(is.positiveInteger),
  digits: optional(is.nonNegativeInteger),
  specials: optional(is.nonNegativeInteger)
}

// Cryptographically secure random index in [0, size)
function secureIndex (size) {
  // Reject values above the largest multiple of size to avoid modulo bias
  const limit = 0x100000000 - (0x100000000 % size)
  const value = new Uint32Array(1)
  do {
    globalThis.crypto.getRandomValues(value)
  } while (value[0] >= limit)
  return value[0] % size
}

// Cryptographically secure draw of count characters among chars
function draw (chars, count) {
  return Array.from({ length: count }, () => chars[secureIndex(chars.length)])
}

export const random = {

  integer (min, max) {
    assert.all([
      { value: min, validator: is.integer, message: 'min must be an integer' },
      { value: max, validator: is.integer, message: 'max must be an integer' },
      { value: max, validator: (v) => v >= min, message: 'max must be greater than or equal to min' }
    ])
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  number (min, max) {
    assert.all([
      { value: min, validator: is.number, message: 'min must be a number' },
      { value: max, validator: is.number, message: 'max must be a number' },
      { value: max, validator: (v) => v >= min, message: 'max must be greater than or equal to min' }
    ])
    return Math.random() * (max - min) + min
  },

  choice (array) {
    assert.that(array, is.nonEmptyArray, 'array must be a non-empty array')
    return array[Math.floor(Math.random() * array.length)]
  },

  sample (generator, count) {
    assert.all([
      { value: generator, validator: is.function, message: 'generator must be a function' },
      { value: count, validator: is.nonNegativeInteger, message: 'count must be a non-negative integer' }
    ])
    return Array.from({ length: count }, () => generator())
  },

  shuffle (array) {
    assert.that(array, is.array, 'array must be an array')
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  password (options = {}) {
    assert.that(options, (v) => conform.schema(v, PASSWORD_OPTIONS_SCHEMA), 'invalid password options')
    const length = options.length ?? 12
    const digits = options.digits ?? 1
    const specials = options.specials ?? 1
    assert.that(length, (v) => v >= digits + specials, 'length must be greater than or equal to digits plus specials')
    const result = [
      ...draw(PASSWORD_CHARSETS.digits, digits),
      ...draw(PASSWORD_CHARSETS.specials, specials),
      ...draw(PASSWORD_CHARSETS.letters, length - digits - specials)
    ]
    // Secure Fisher-Yates shuffle so that digits and specials do not always come first
    for (let i = result.length - 1; i > 0; i--) {
      const j = secureIndex(i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result.join('')
  }

}
