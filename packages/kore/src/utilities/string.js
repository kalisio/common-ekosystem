import { assert, is } from '../predicates'

export const string = {

  DIACRITICS: {
    a: 'aáàäâã',
    e: 'eéëèê',
    i: 'iíïìî',
    o: 'oóöòõô',
    u: 'uüúùû',
    c: 'cç'
  },

  removeDiacritics (str) {
    assert.that(str, is.string, 'str must be a string')
    return Object.entries(this.DIACRITICS).reduce((acc, [base, chars]) => {
      return acc.replace(new RegExp(`[${chars}]`, 'gi'), char =>
        char === char.toUpperCase() ? base.toUpperCase() : base
      )
    }, str)
  },

  makeDiacriticPattern (pattern, options = {}) {
    assert.that(pattern, is.string, 'str must be a string')
    const { reverse = false } = options ?? {}
    let result = ''
    for (const char of pattern) {
      const lower = char.toLowerCase()
      let family = null
      for (const chars of Object.values(this.DIACRITICS)) {
        if (
          (reverse && chars.includes(lower)) ||
          (!reverse && chars[0] === lower)
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
    const result = this.removeDiacritics(str.trim()).toLowerCase()
    return result
      .replace(/[^a-z0-9]+/gi, separator)
      .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '')
  }
}
