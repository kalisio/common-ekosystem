import { is } from '@kalisio/common-core/predicates'
import moment from 'moment-timezone'

function isValid (value) {
  return is.string(value) && moment.tz.zone(value) !== null
}

function assertValid (value) {
  if (!isValid(value)) {
    throw new RangeError(`Invalid timezone: ${value}`)
  }
}

/** Returns the normalized casing of a valid timezone name; links such as US/Eastern are not resolved. */
function normalize (name) {
  assertValid(name)
  return moment.tz.zone(name).name
}

function guess () {
  const name = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isValid(name) ? normalize(name) : moment.tz.guess()
}

/** Returns all timezones, or those associated with an ISO 3166-1 alpha-2 country code. */
function list (country) {
  if (country === undefined) return moment.tz.names()
  if (!is.string(country)) {
    throw new TypeError('Country code must be a string')
  }
  if (!/^[a-z]{2}$/i.test(country)) {
    throw new RangeError(`Invalid country code: ${country}`)
  }
  const zones = moment.tz.zonesForCountry(country.toUpperCase())
  if (!zones) {
    throw new RangeError(`Unknown country code: ${country}`)
  }
  return [...zones]
}

function atMoment (name, at) {
  assertValid(name)
  let parsed
  if (is.instanceOf(at, Date) || is.number(at)) {
    parsed = moment.tz(at, name)
  } else if (is.nonEmptyString(at)) {
    parsed = moment.tz(at, moment.ISO_8601, true, name)
  } else {
    throw new TypeError('Expected a Date, a millisecond timestamp, or an ISO 8601 string')
  }
  if (!parsed.isValid()) throw new RangeError('Invalid date')
  return parsed
}

function offset (name, at = Date.now()) {
  return atMoment(name, at).utcOffset()
}

/** Abbreviation in effect at the given instant (now by default), such as CET, CEST or -03. */
function abbreviation (name, at = Date.now()) {
  return atMoment(name, at).zoneAbbr()
}

function format (name, at = Date.now(), pattern = 'Z', { locale = 'en' } = {}) {
  if (!is.nonEmptyString(pattern)) {
    throw new TypeError('Date format must be a non-empty string')
  }
  if (!is.string(locale) || !moment.locales().includes(locale)) {
    throw new RangeError(`Unknown or unloaded locale: ${locale}`)
  }
  return atMoment(name, at).locale(locale).format(pattern)
}

export const timezone = {
  isValid,
  normalize,
  guess,
  list,
  offset,
  abbreviation,
  format
}
