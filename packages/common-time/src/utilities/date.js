import { is } from '@kalisio/common-core/predicates'
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
  if (!is.string(locale) || !moment.locales().includes(locale)) {
    throw new RangeError(`Unknown or unloaded locale: ${locale}`)
  }
}

function normalizeUnit (unit, operation) {
  const normalized = is.string(unit) ? moment.normalizeUnits(unit) : undefined
  if (!UNITS[operation].includes(normalized)) {
    throw new RangeError(`Invalid date unit for ${operation}: ${unit}`)
  }
  return normalized
}

function timestamp (value) {
  const input = is.object(value) && is.number(value.timestamp) && is.function(value.toDate)
    ? value.timestamp
    : value
  return parse(input).getTime()
}

function stepMilliseconds (value) {
  let milliseconds
  if (is.number(value)) {
    milliseconds = value
  } else if (is.string(value)) {
    milliseconds = durations.asMilliseconds(value)
  } else if (is.object(value) && is.function(value.asMilliseconds)) {
    milliseconds = value.asMilliseconds()
  } else {
    throw new TypeError('Expected an ISO duration, a Duration, or milliseconds')
  }
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
    throw new RangeError('Alignment step must be a positive whole number of milliseconds')
  }
  return milliseconds
}

function alignment (value, step, { origin = 0 } = {}) {
  const instant = timestamp(value)
  const anchor = timestamp(origin)
  const milliseconds = stepMilliseconds(step)
  const distance = instant - anchor
  if (!Number.isSafeInteger(distance)) {
    throw new RangeError('Distance from alignment origin exceeds safe integer precision')
  }
  // Adding the step only to a negative remainder keeps every intermediate value a safe integer
  const rest = distance % milliseconds
  const remainder = rest < 0 ? rest + milliseconds : rest
  return { instant, milliseconds, remainder }
}

function alignedDate (milliseconds) {
  const result = new Date(milliseconds)
  if (!Number.isFinite(result.getTime())) {
    throw new RangeError('Aligned date is out of range')
  }
  return result
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
function parse (value, { format, timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = {}) {
  assertTimezone(timezone)
  assertLocale(locale)
  if (format !== undefined && (!is.string(format) || !format)) {
    throw new TypeError('Date format must be a non-empty string')
  }
  let parsed
  if (is.instanceOf(value, Date)) {
    parsed = moment(value)
  } else if (is.number(value)) {
    parsed = moment(value)
  } else if (is.string(value) && value.trim()) {
    // The locale is passed explicitly: importing a Moment locale file changes the global one
    parsed = moment.tz(value, format ?? moment.ISO_8601, locale, true, timezone)
  } else {
    throw new TypeError('Expected a Date, a millisecond timestamp, or a date string')
  }
  if (!parsed.isValid()) throw new RangeError('Invalid date')
  return parsed.toDate()
}

function isValid (value, options) {
  try {
    parse(value, options)
    return true
  } catch {
    return false
  }
}

// The locale is always set explicitly so that results never depend on Moment's global locale,
// which merely importing a locale file changes
function inTimezone (value, timezone, locale = DEFAULT_LOCALE) {
  assertTimezone(timezone)
  assertLocale(locale)
  return moment.tz(parse(value, { timezone }), timezone).locale(locale)
}

function format (value, pattern = DEFAULT_FORMAT, { timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = {}) {
  return tz.format(timezone, value, pattern, { locale })
}

function add (value, amount, unit, { timezone = DEFAULT_TIMEZONE } = {}) {
  if (!is.number(amount)) {
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

function floor (value, step, options) {
  const { instant, remainder } = alignment(value, step, options)
  return alignedDate(instant - remainder)
}

// Each bound is computed in a single operation from the instant, so that no intermediate value
// leaves the safe integer range while the result stays within it
function ceil (value, step, options) {
  const { instant, milliseconds, remainder } = alignment(value, step, options)
  return alignedDate(remainder === 0 ? instant : instant + (milliseconds - remainder))
}

function round (value, step, options) {
  const { instant, milliseconds, remainder } = alignment(value, step, options)
  return alignedDate(remainder >= milliseconds / 2
    ? instant + (milliseconds - remainder)
    : instant - remainder)
}

export const date = {
  parse,
  isValid,
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
  floor,
  ceil,
  round
}
