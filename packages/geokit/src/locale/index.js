import { asserts, is, has, conforms } from '@kalisio/check'
import fr from './fr.json'
import en from './en.json'

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
  en,
  fr
}

let CURRENT_LOCALE = 'en'

export function registerLocale (code, locale) {
  asserts.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: locale, validator: is.plainObject, message: 'locale must be an object' },
    { value: locale, validator: (v) => conforms.schema(locale, LOCALE_SCHEMA), message: 'locale is not conforms with the required schema' }
  ])
  LOCALES[code] = locale
}

export function setLocale (code) {
  asserts.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => has.key(LOCALES, v), message: 'code must be a well-known locale' }
  ])
  CURRENT_LOCALE = code
}

export function getLocale () {
  return LOCALES[CURRENT_LOCALE]
}
