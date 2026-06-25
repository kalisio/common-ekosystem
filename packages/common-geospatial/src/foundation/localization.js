import { assert, is, has, conform } from '@kalisio/common-core'
import fr from './i18n/fr.json'
import en from './i18n/en.json'

const LOCALE_SCHEMA = {
  DIRECTIONS: {
    NORTH: { label: is.string, symbol: is.char },
    SOUTH: { label: is.string, symbol: is.char },
    EAST: { label: is.string, symbol: is.char },
    WEST: { label: is.string, symbol: is.char }
  }
}

const LOCALES = {
  en,
  fr
}

let CURRENT_LOCALE = 'en'
const FALLBACK_LOCALE = 'en'

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
  return CURRENT_LOCALE
}

export function getLocaleByCode (code) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => has.key(LOCALES, v), message: 'code is unknown' }
  ])
  return LOCALES[code]
}

export function getActiveLocales () {
  return CURRENT_LOCALE === FALLBACK_LOCALE
    ? [CURRENT_LOCALE]
    : [CURRENT_LOCALE, FALLBACK_LOCALE]
}

function collectSymbols (keys) {
  const symbols = new Set()
  for (const code of getActiveLocales()) {
    const { DIRECTIONS } = getLocaleByCode(code)
    for (const key of keys) symbols.add(DIRECTIONS[key].symbol)
  }
  return [...symbols]
}

// Latitude symbols (NORTH/SOUTH), current locale + fallback.
export function getLatitudeSymbols () {
  return collectSymbols(['NORTH', 'SOUTH'])
}

// Longitude symbols (EAST/WEST), current locale + fallback.
export function getLongitudeSymbols () {
  return collectSymbols(['EAST', 'WEST'])
}

// All direction symbols (both axes), current locale + fallback.
export function getAllDirectionSymbols () {
  return collectSymbols(['NORTH', 'SOUTH', 'EAST', 'WEST'])
}
