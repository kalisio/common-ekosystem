import { is } from '../predicates/index.js'

// ISO 8601 only, the one format every engine parses the same way. A date alone is
// read as UTC; a date-time needs an explicit offset, otherwise it would be local time.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/

const TRUE_VALUES = new Set(['true', '1'])
const FALSE_VALUES = new Set(['false', '0'])

// Each method returns the fallback (undefined by default) when the value cannot
// be converted unambiguously. The fallback is returned as-is, and so is a value
// that already has the target type: the result can be the input itself, not a copy.
export const cast = {

  // Follows Number() for strings: decimal notation and the 0x, 0o and 0b prefixes.
  // A sign before a prefix is rejected ('-0x10') and '010' is decimal, not octal.
  // Unlike Number(), rejects '', null and booleans instead of returning 0 or 1.
  // Overflow returns the fallback, underflow rounds to 0.
  number (value, fallback) {
    if (is.number(value)) return value
    if (!is.string(value) || is.emptyString(value.trim())) return fallback
    const number = Number(value)
    return is.number(number) ? number : fallback
  },

  // Rejects fractions ('1.5' returns the fallback, '1e3' returns 1000) within float
  // precision: '1.0000000000000001' already parses as 1. Only accepts safe integers.
  integer (value, fallback) {
    const number = cast.number(value)
    return is.integer(number) ? number : fallback
  },

  // Strings are trimmed: true/false in any casing (Python writes True, SQL TRUE) and 1/0.
  // Words such as yes/no or on/off are rejected: they are language, not a serialization.
  boolean (value, fallback) {
    if (is.boolean(value)) return value
    if (value === 1) return true
    if (value === 0) return false
    if (!is.string(value)) return fallback
    const text = value.trim().toLowerCase()
    if (TRUE_VALUES.has(text)) return true
    if (FALSE_VALUES.has(text)) return false
    return fallback
  },

  // Unlike String(), rejects null, undefined, NaN, objects and symbols.
  string (value, fallback) {
    if (is.string(value)) return value
    if (is.number(value) || is.boolean(value)) return String(value)
    return fallback
  },

  // Converts valid Date instances, ISO 8601 strings and integer timestamps in milliseconds.
  // Stricter than the Date constructor: '2026-11-01T14:30:00', without offset, is rejected.
  date (value, fallback) {
    if (is.date(value)) return value
    if (is.integer(value)) {
      const date = new Date(value)
      return is.date(date) ? date : fallback
    }
    if (!is.string(value)) return fallback
    const text = value.trim()
    if (!ISO_DATE.test(text) && !ISO_DATE_TIME.test(text)) return fallback
    // The day must survive a round trip: V8 rolls 2026-02-30 over to March 2.
    const day = text.slice(0, 10)
    const calendarDate = new Date(day)
    if (!is.date(calendarDate) || !calendarDate.toISOString().startsWith(day)) return fallback
    const date = new Date(text)
    return is.date(date) ? date : fallback
  },

  // Converts arrays, sets and maps to arrays.
  // Map entries become [key, value] pairs.
  array (value, fallback) {
    if (is.array(value)) return value
    if (is.set(value)) return Array.from(value)
    if (is.map(value)) return Array.from(value.entries())
    return fallback
  },

  // Converts plain objects and maps with string keys to plain objects.
  // A '__proto__' key stays an own property: guarding against pollution is up to merge.
  object (value, fallback) {
    if (is.plainObject(value)) return value
    if (!is.map(value)) return fallback
    if (!Array.from(value.keys()).every(key => is.string(key))) return fallback
    return Object.fromEntries(value)
  },

  // Converts plain objects and arrays of key-value pairs to maps.
  // Objects: own enumerable properties, as Object.entries(); symbol keys are rejected.
  // Arrays: duplicate keys are rejected instead of silently keeping the last value.
  map (value, fallback) {
    if (is.map(value)) return value
    if (is.plainObject(value)) {
      if (Object.getOwnPropertySymbols(value).length > 0) return fallback
      return new Map(Object.entries(value))
    }
    if (!is.array(value)) return fallback
    if (!value.every(entry => is.array(entry) && entry.length === 2)) return fallback
    const map = new Map(value)
    return map.size === value.length ? map : fallback
  },

  // Converts arrays to sets, removing duplicate values.
  set (value, fallback) {
    if (is.set(value)) return value
    if (is.array(value)) return new Set(value)
    return fallback
  }

}
