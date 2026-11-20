import moment from 'moment-timezone'

function isValid (value) {
  return typeof value === 'string' && moment.tz.zone(value) !== null
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

function list () {
  return moment.tz.names()
}

function atMoment (name, at) {
  assertValid(name)
  let parsed
  if (at instanceof Date || (typeof at === 'number' && Number.isFinite(at))) {
    parsed = moment.tz(at, name)
  } else if (typeof at === 'string' && at.trim()) {
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

export const timezone = {
  isValid,
  normalize,
  guess,
  list,
  offset,
  abbreviation
}
