import { is } from '../predicates/index.js'

// Decimal notation only: rejects hex/binary/octal, "Infinity", "1_000", "42px".
// Fractional digits are grouped behind the dot so that no two quantifiers compete
// for the same digits, which keeps matching linear.
const DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

// ISO 8601 only, the one format every engine parses the same way. A date alone is
// read as UTC; a date-time needs an explicit offset, otherwise it would be local time.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/

const TRUE_VALUES = new Set(['true', '1'])
const FALSE_VALUES = new Set(['false', '0'])

export const cast = {

  number (value, fallback) {
    if (is.number(value)) return value
    if (!is.string(value)) return fallback
    const text = value.trim()
    if (!DECIMAL.test(text)) return fallback
    const number = Number(text)
    return is.number(number) ? number : fallback
  },

  integer (value, fallback) {
    const number = cast.number(value)
    return is.integer(number) ? number : fallback
  },

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

  string (value, fallback) {
    if (is.string(value)) return value
    if (is.number(value) || is.boolean(value)) return String(value)
    return fallback
  },

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

  array (value, fallback) {
    if (is.array(value)) return value
    if (is.set(value)) return Array.from(value)
    if (is.map(value)) return Array.from(value.entries())
    return fallback
  },

  object (value, fallback) {
    if (is.plainObject(value)) return value
    if (!is.map(value)) return fallback
    if (!Array.from(value.keys()).every(key => is.string(key))) return fallback
    return Object.fromEntries(value)
  },

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

  set (value, fallback) {
    if (is.set(value)) return value
    if (is.array(value)) return new Set(value)
    return fallback
  }

}
