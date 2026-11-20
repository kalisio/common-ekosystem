import moment from 'moment-timezone'
import { duration as durations } from './duration.js'
import { timezone as tz } from './timezone.js'

const DEFAULT_TIMEZONE = 'UTC'
const DEFAULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ'
const DEFAULT_LOCALE = 'en'

// Units actually supported by each moment operation; others are silently ignored by moment
const UNITS = {
  add: ['year', 'quarter', 'month', 'week', 'isoWeek', 'day', 'hour', 'minute', 'second', 'millisecond'],
  startOf: ['year', 'quarter', 'month', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second', 'millisecond'],
  diff: ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond']
}

function assertTimezone (value) {
  if (!tz.isValid(value)) {
    throw new RangeError(`Invalid timezone: ${value}`)
  }
}

function assertLocale (locale) {
  if (typeof locale !== 'string' || !moment.locales().includes(locale)) {
    throw new RangeError(`Unknown or unloaded locale: ${locale}`)
  }
}

function normalizeUnit (unit, operation) {
  const normalized = typeof unit === 'string' ? moment.normalizeUnits(unit) : undefined
  if (!UNITS[operation].includes(normalized)) {
    throw new RangeError(`Invalid date unit for ${operation}: ${unit}`)
  }
  return normalized
}

/**
 * Parses a Date, a timestamp in milliseconds, or a strict ISO 8601 string.
 * Strings without an offset are interpreted in the supplied timezone (UTC by default).
 * Around daylight saving transitions, Moment's behavior is kept:
 * - a local time that does not exist (spring gap) is shifted forward by the gap,
 *   for instance 02:30 on 2026-03-29 in Europe/Paris gives 03:30 (01:30Z);
 * - an ambiguous local time (autumn overlap) resolves to its first occurrence,
 *   for instance 02:30 on 2026-10-25 in Europe/Paris gives 00:30Z.
 * Always returns a fresh native Date; Moment instances are never exposed.
 */
function parse (value, { format, timezone = DEFAULT_TIMEZONE } = {}) {
  assertTimezone(timezone)
  if (format !== undefined && (typeof format !== 'string' || !format)) {
    throw new TypeError('Date format must be a non-empty string')
  }

  let parsed
  if (value instanceof Date) {
    parsed = moment(value)
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    parsed = moment(value)
  } else if (typeof value === 'string' && value.trim()) {
    parsed = moment.tz(value, format ?? moment.ISO_8601, true, timezone)
  } else {
    throw new TypeError('Expected a Date, a millisecond timestamp, or a date string')
  }

  if (!parsed.isValid()) throw new RangeError('Invalid date')
  return parsed.toDate()
}

// The locale is always set explicitly so that results never depend on Moment's global locale,
// which merely importing a locale file changes
function inTimezone (value, timezone, locale = DEFAULT_LOCALE) {
  assertTimezone(timezone)
  assertLocale(locale)
  return moment.tz(parse(value, { timezone }), timezone).locale(locale)
}

/** Formats an instant in the chosen IANA timezone and locale (UTC and English by default). */
function format (value, pattern = DEFAULT_FORMAT, { timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = {}) {
  if (typeof pattern !== 'string' || !pattern) {
    throw new TypeError('Date format must be a non-empty string')
  }
  return inTimezone(value, timezone, locale).format(pattern)
}

/**
 * Calendar-aware addition in the given timezone; never mutates the input.
 * Fractional amounts follow Moment: days and months are rounded to the nearest integer,
 * half away from zero (1.5 days adds 2 days), weeks being converted to days and quarters
 * or years to months before rounding; hours and smaller units keep their fraction.
 */
function add (value, amount, unit, { timezone = DEFAULT_TIMEZONE } = {}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('Date amount must be a finite number')
  }
  return inTimezone(value, timezone).add(amount, normalizeUnit(unit, 'add')).toDate()
}

function addDuration (value, iso, { timezone = DEFAULT_TIMEZONE } = {}) {
  return inTimezone(value, timezone).add(moment.duration(durations.parse(iso))).toDate()
}

function subtractDuration (value, iso, { timezone = DEFAULT_TIMEZONE } = {}) {
  return inTimezone(value, timezone).subtract(moment.duration(durations.parse(iso))).toDate()
}

function startOf (value, unit, { timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = {}) {
  return inTimezone(value, timezone, locale).startOf(normalizeUnit(unit, 'startOf')).toDate()
}

/** End of the period containing the instant, with the same rules as startOf. */
function endOf (value, unit, { timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = {}) {
  return inTimezone(value, timezone, locale).endOf(normalizeUnit(unit, 'startOf')).toDate()
}

/** Signed difference: left minus right (truncated unless floating is true). */
function diff (left, right, unit = 'milliseconds', { timezone = DEFAULT_TIMEZONE, floating = false } = {}) {
  const normalized = normalizeUnit(unit, 'diff')
  return inTimezone(left, timezone).diff(inTimezone(right, timezone), normalized, floating)
}

function isBefore (left, right, options) {
  return parse(left, options).getTime() < parse(right, options).getTime()
}

function isAfter (left, right, options) {
  return parse(left, options).getTime() > parse(right, options).getTime()
}

function isSame (left, right, options) {
  return parse(left, options).getTime() === parse(right, options).getTime()
}

function isValid (value, options) {
  try {
    parse(value, options)
    return true
  } catch {
    return false
  }
}

export const date = {
  parse,
  format,
  add,
  addDuration,
  subtractDuration,
  startOf,
  endOf,
  diff,
  isBefore,
  isAfter,
  isSame,
  isValid
}
