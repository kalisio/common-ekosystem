import { assert, is, has, conform } from '@kalisio/common-core/predicates'
import fr from './i18n/fr.json'
import en from './i18n/en.json'

const MESSAGES_SCHEMA = {
  DIRECTIONS: {
    NORTH: { label: is.string, symbol: is.char },
    SOUTH: { label: is.string, symbol: is.char },
    EAST: { label: is.string, symbol: is.char },
    WEST: { label: is.string, symbol: is.char }
  }
}

const MESSAGES = {
  en,
  fr
}

let CURRENT_LOCALE = 'en'
const FALLBACK_LOCALE = 'en'

export function listLocales () {
  return Object.keys(MESSAGES)
}

export function setLocale (code) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => has.key(MESSAGES, v), message: 'code is unknown' }
  ])
  CURRENT_LOCALE = code
}

export function getLocale () {
  return CURRENT_LOCALE
}

export function getActiveLocales () {
  return CURRENT_LOCALE === FALLBACK_LOCALE
    ? [CURRENT_LOCALE]
    : [CURRENT_LOCALE, FALLBACK_LOCALE]
}

export function registerMessages (code, messages) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => !has.key(MESSAGES, v), message: 'messages already registered' },
    { value: messages, validator: is.plainObject, message: 'messages must be an object' },
    { value: messages, validator: (v) => conform.schema(v, MESSAGES_SCHEMA), message: 'messages do not conform to schema' }
  ])
  MESSAGES[code] = messages
}

export function getMessages (code) {
  assert.all([
    { value: code, validator: is.string, message: 'code must be a string' },
    { value: code, validator: (v) => has.key(MESSAGES, v), message: 'code is unknown' }
  ])
  return MESSAGES[code]
}
