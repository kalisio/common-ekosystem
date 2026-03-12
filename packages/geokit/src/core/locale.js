import { asserts, is, has, conforms } from '@kalisio/check'
import { deepFreeze } from './utils.js'
import fr from './locales/fr.json'
import en from './locales/en.json'

const LOCALE_SCHEMA = {
  DIRECTIONS: {
    NORTH: {
      label: is.string,
      symbol: is.string
    },
    SOUTH: {
      label: is.string,
      symbol: is.string
    },
    EAST: {
      label: is.string,
      symbol: is.string
    },
    WEST: {
      label: is.string,
      symbol: is.string
    }
  }
}

const LOCALES = {
  en: deepFreeze(en),
  fr: deepFreeze(fr)
}

let CURRENT_LOCALE = 'en'

export const locale = Object.freeze({
  list () {
    return Object.keys(LOCALES)
  },

  register (code, content) {
    asserts.all([
      { value: code, validator: is.string, message: 'code must be a string' },
      { value: code, validator: (v) => !has.key(LOCALES, v), message: 'locale already registered' },
      { value: content, validator: is.plainObject, message: 'content must be an object' },
      { value: content, validator: (v) => conforms.schema(v, LOCALE_SCHEMA), message: 'content does not conform to schema' }
    ])
    LOCALES[code] = deepFreeze(content)
  },

  set (code) {
    asserts.all([
      { value: code, validator: is.string, message: 'code must be a string' },
      { value: code, validator: (v) => has.key(LOCALES, v), message: 'code is unknown' }
    ])
    CURRENT_LOCALE = code
  },

  get () {
    return {
      code: CURRENT_LOCALE,
      content: LOCALES[CURRENT_LOCALE]
    }
  }
})
