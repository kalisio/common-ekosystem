import { assert, is, has, conform } from '@kalisio/common-core'
import fr from './locales/fr.json'
import en from './locales/en.json'

const LOCALE_SCHEMA = {
  DIRECTIONS: {
    NORTH: { label: is.string, symbol: is.string },
    SOUTH: { label: is.string, symbol: is.string },
    EAST: { label: is.string, symbol: is.string },
    WEST: { label: is.string, symbol: is.string }
  }
}

const LOCALES = {
  en,
  fr
}

let CURRENT_LOCALE = 'en'

export function listLocales () {
  return Object.keys(LOCALES)
}

export function registerLocale (code, content) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => !has.key(LOCALES, v), message: 'locale already registered' },
    { value: content, validator: is.plainObject, message: 'content must be an object' },
    { value: content, validator: (v) => conform.schema(v, LOCALE_SCHEMA), message: 'content does not conform to schema' }
  ])
  LOCALES[code] = content
}

export function setLocale (code) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => has.key(LOCALES, v), message: 'code is unknown' }
  ])
  CURRENT_LOCALE = code
}

export function getLocale () {
  return {
    code: CURRENT_LOCALE,
    content: LOCALES[CURRENT_LOCALE]
  }
}
