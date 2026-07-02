import { assert, is, conform, optional } from '../predicates/index.js'

const NORMALIZE_OPTIONS_SCHEMA = {
  ignoreSpaces: optional(is.boolean),
  ignoreDiacritics: optional(is.boolean),
  ignoreCase: optional(is.boolean),
  locale: optional(is.string)
}

const COMPARE_OPTIONS_SCHEMA = {
  ...NORMALIZE_OPTIONS_SCHEMA
}

export const string = {

  DIACRITICS: {
    a: 'aáàäâã',
    e: 'eéëèê',
    i: 'iíïìî',
    o: 'oóöòõô',
    u: 'uüúùû',
    c: 'cç'
  },

  normalize (str, options = {}) {
    assert.all([
      { value: str, validator: is.string, message: 'str must be a string' },
      { value: options, validator: (v) => conform.schema(v, NORMALIZE_OPTIONS_SCHEMA) }
    ])
    const {
      ignoreSpaces = false,
      ignoreDiacritics = false,
      ignoreCase = false,
      locale = undefined // 'fr-FR'
    } = options
    let result = str
    if (ignoreSpaces) {
      result = result.replace(/\s+/g, ' ').trim()
    }
    if (ignoreDiacritics) {
      result = result
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
    }
    if (ignoreCase) {
      result = result.toLocaleLowerCase(locale)
    }
    return result
  },

  compare (str1, str2, options = {}) {
    assert.all([
      { value: str1, validator: is.string, message: 'str1 must be a string' },
      { value: str2, validator: is.string, message: 'str2 must be a string' },
      { value: options, validator: (v) => conform.schema(v, COMPARE_OPTIONS_SCHEMA) }
    ])
    const normalizeOptions = { ignoreDiacritics: true, ignoreCase: true, ...options }
    const nStr1 = string.normalize(str1, normalizeOptions)
    const nStr2 = string.normalize(str2, normalizeOptions)
    return nStr1.localeCompare(nStr2, options.locale)
  },

  makeDiacriticPattern (pattern, options = {}) {
    assert.that(pattern, is.string, 'pattern must be a string')
    const { reverse = false } = options ?? {}
    let result = ''
    for (const char of pattern) {
      const lower = char.toLowerCase()
      let family = null
      for (const chars of Object.values(this.DIACRITICS)) {
        if (
          (reverse && chars.includes(lower)) ||
          (!reverse && chars.startsWith(lower))
        ) {
          family = chars
          break
        }
      }
      if (!family) {
        result += char
      } else {
        result += `[${family}]`
      }
    }
    return result
  },

  slugify (str, separator = '-') {
    assert.all([
      { value: str, validator: is.string, message: 'str must be a string' },
      { value: separator, validator: is.char, message: 'separator must be a char' }
    ])
    const result = string.normalize(str.trim(), { ignoreDiacritics: true }).toLowerCase()
    return result
      .replace(/[^a-z0-9]+/gi, separator)
      .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '')
  },

  initials (str, options = {}) {
    assert.that(str, is.string, 'str must be a string')
    const { max = undefined } = options
    const result = str
      .trim()
      .split(/\s+/)
      .map(word => word[0].toUpperCase())
    return (max ? result.slice(0, max) : result).join('')
  }

}
