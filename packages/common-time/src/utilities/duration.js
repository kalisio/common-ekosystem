import { is } from '@kalisio/common-core/predicates'
import moment from 'moment-timezone'

const UNITS = [
  'year', 'quarter', 'month', 'week', 'day',
  'hour', 'minute', 'second', 'millisecond'
]
const CALENDAR_UNITS = ['year', 'quarter', 'month', 'week', 'day']

const COMPONENT = '[+-]?\\d+(?:[.,]\\d+)?'
const ISO_DURATION = new RegExp(
  `^[+-]?P(?:${COMPONENT}Y)?(?:${COMPONENT}M)?(?:${COMPONENT}W)?(?:${COMPONENT}D)?` +
  `(?:T(?:${COMPONENT}H)?(?:${COMPONENT}M)?(?:${COMPONENT}S)?)?$`
)

// The overall sign applies to every component, so only the signs of the nonzero components can differ
function hasMixedSigns (iso) {
  const signs = new Set()
  const body = iso.replace(/^[+-]?P/, '')
  // Sticky flag: each token must start right where the previous one ended,
  // so the engine never retries from every position → linear cost
  for (const [, amount] of body.matchAll(/T?([+-]?\d+(?:[.,]\d+)?)[YMWDHS]/gy)) {
    const value = Number(amount.replace(',', '.'))
    if (value !== 0) signs.add(Math.sign(value))
  }
  return signs.size > 1
}

function normalizeUnit (unit) {
  const normalized = is.string(unit) ? moment.normalizeUnits(unit) : undefined
  if (!UNITS.includes(normalized)) {
    throw new RangeError(`Invalid duration unit: ${unit}`)
  }
  return normalized
}

// Converts supported inputs into a private Moment duration.
function toMoment (value, unit) {
  let parsed

  if (is.string(value) && unit === undefined) {
    // Designators are accepted in any case, but Moment only parses uppercase ones
    // and silently returns a zero duration otherwise
    const iso = value.toUpperCase()
    if (!ISO_DURATION.test(iso) || !/[YMWDHS]$/.test(iso)) {
      throw new RangeError(`Invalid ISO 8601 duration: ${value}`)
    }
    // As in Temporal: a calendar day is not always 24 hours long, so P1DT-24H is not zero
    if (hasMixedSigns(iso)) {
      throw new RangeError(`Duration components must share the same sign: ${value}`)
    }
    parsed = moment.duration(iso)
  } else if (is.number(value)) {
    if (unit === undefined) {
      throw new TypeError('A numeric duration requires a unit')
    }
    parsed = moment.duration(value, normalizeUnit(unit))
  } else {
    throw new TypeError('Expected an ISO 8601 duration or a finite number with a unit')
  }

  if (!parsed.isValid() || !is.number(parsed.asMilliseconds())) {
    throw new RangeError('Invalid duration')
  }

  return parsed
}

/**
 * Returns a normalized ISO 8601 duration string, following Moment's rules: weeks become days,
 * 12 months become a year, seconds and minutes carry over up to hours but hours never become days,
 * a zero duration is P0D. As in Temporal, components of opposite signs (P1M-1D, P1DT-24H) are rejected.
 */
function parse (value, unit) {
  return toMoment(value, unit).toISOString()
}

// Opposite sign of a normalized duration, whose components share the overall sign
function negate (iso) {
  if (iso === 'P0D') return iso
  return iso.startsWith('-') ? iso.slice(1) : `-${iso}`
}

// Operands of opposite signs can leave Moment's groups (months, days, time) with opposite signs:
// Moment then writes P1M-1D, or P0D when their nominal totals cancel, as for P1D - PT24H.
// Normalized durations are canonical, so the groups only cancel exactly when the operands match.
function combine (left, right, operation) {
  const first = parse(left)
  const second = parse(right)
  const result = toMoment(first)[operation](toMoment(second)).toISOString()
  const cancelling = operation === 'add' ? negate(second) : second
  if (hasMixedSigns(result) || (result === 'P0D' && first !== cancelling)) {
    throw new RangeError(`Duration ${operation} would mix components of opposite signs: ${left}, ${right}`)
  }
  return result
}

/** Adds two ISO 8601 durations, preserving calendar units. */
function add (left, right) {
  return combine(left, right, 'add')
}

/** Subtracts two ISO 8601 durations, preserving calendar units. */
function subtract (left, right) {
  return combine(left, right, 'subtract')
}

// Calendar components are read from the input, before normalization
function hasCalendarComponent (value, unit) {
  if (is.number(value)) return value !== 0 && CALENDAR_UNITS.includes(normalizeUnit(unit))
  const datePart = value.toUpperCase().replace(/^[+-]?P/, '').split('T')[0]
  return (datePart.match(/\d+(?:[.,]\d+)?/g) ?? []).some((amount) => Number(amount.replace(',', '.')) !== 0)
}

/**
 * Converts a time-based duration into milliseconds.
 * Calendar units (years, months, weeks and days) require a reference date.
 */
function asMilliseconds (value, unit) {
  const iso = parse(value, unit)

  if (hasCalendarComponent(value, unit)) {
    throw new RangeError('Cannot convert calendar duration to milliseconds without a reference date')
  }

  return toMoment(iso).asMilliseconds()
}

function isValid (value, unit) {
  try {
    toMoment(value, unit)
    return true
  } catch {
    return false
  }
}

export const duration = {
  parse,
  add,
  subtract,
  asMilliseconds,
  isValid
}
