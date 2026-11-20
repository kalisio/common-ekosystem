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

function normalizeUnit (unit) {
  const normalized = typeof unit === 'string' ? moment.normalizeUnits(unit) : undefined
  if (!UNITS.includes(normalized)) {
    throw new RangeError(`Invalid duration unit: ${unit}`)
  }
  return normalized
}

// Converts supported inputs into a private Moment duration.
function toMoment (value, unit) {
  let parsed

  if (typeof value === 'string' && unit === undefined) {
    // Designators are accepted in any case, but Moment only parses uppercase ones
    // and silently returns a zero duration otherwise
    const iso = value.toUpperCase()
    if (!ISO_DURATION.test(iso) || !/[YMWDHS]$/.test(iso)) {
      throw new RangeError(`Invalid ISO 8601 duration: ${value}`)
    }
    parsed = moment.duration(iso)
  } else if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Duration amount must be a finite number')
    }
    if (unit === undefined) {
      throw new TypeError('A numeric duration requires a unit')
    }
    parsed = moment.duration(value, normalizeUnit(unit))
  } else {
    throw new TypeError('Expected an ISO 8601 duration or a number with a unit')
  }

  if (!parsed.isValid() || !Number.isFinite(parsed.asMilliseconds())) {
    throw new RangeError('Invalid duration')
  }

  return parsed
}

/**
 * Returns a normalized ISO 8601 duration string, following Moment's rules: weeks become days,
 * 12 months become a year, seconds and minutes carry over up to hours but hours never become days,
 * a zero duration is P0D. Components of opposite signs (P1M-1D) are a Moment extension
 * that strict ISO 8601 parsers reject. Beware that Moment writes P0D for any duration whose total,
 * counting 24 hours a day, is zero: P1DT-24H becomes P0D.
 */
function parse (value, unit) {
  return toMoment(value, unit).toISOString()
}

/** Adds two ISO 8601 durations, preserving calendar units. */
function add (left, right) {
  return toMoment(left).add(toMoment(right)).toISOString()
}

/** Subtracts two ISO 8601 durations, preserving calendar units. */
function subtract (left, right) {
  return toMoment(left).subtract(toMoment(right)).toISOString()
}

// Calendar components are read from the input, not from the normalized string,
// since Moment writes P1DT-24H as P0D although a calendar day is not always 24 hours long
function hasCalendarComponent (value, unit) {
  if (typeof value === 'number') return value !== 0 && CALENDAR_UNITS.includes(normalizeUnit(unit))
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
