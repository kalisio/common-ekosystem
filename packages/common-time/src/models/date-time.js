import { date } from '../utilities/date.js'
import { timezone } from '../utilities/timezone.js'
import { Duration } from './duration.js'

function isSnapshot (value) {
  return value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !(value instanceof DateTime) &&
    Object.hasOwn(value, 'instant') &&
    Object.hasOwn(value, 'timezone')
}

/**
 * Immutable instant associated with an IANA timezone.
 * Arithmetic is calendar-aware and never mutates the original instance.
 */
export class DateTime {
  #timestamp
  #timezone

  constructor (value = Date.now(), options = {}) {
    const snapshot = isSnapshot(value)

    const inheritedTimezone = value instanceof DateTime
      ? value.#timezone
      : snapshot ? value.timezone : 'UTC'

    const zone = options.timezone === undefined
      ? inheritedTimezone
      : options.timezone

    this.#timezone = timezone.normalize(zone)

    const input = value instanceof DateTime
      ? value.#timestamp
      : snapshot ? value.instant : value

    this.#timestamp = date.parse(input, {
      timezone: this.#timezone,
      format: options.format
    }).getTime()

    Object.freeze(this)
  }

  static from (value, options) {
    if (value instanceof DateTime && options === undefined) return value
    return new DateTime(value, options)
  }

  static now (options) {
    return new DateTime(Date.now(), options)
  }

  get timestamp () {
    return this.#timestamp
  }

  get timezone () {
    return this.#timezone
  }

  withTimezone (name) {
    return new DateTime(this, { timezone: name })
  }

  add (value, unit) {
    const iso = Duration.from(value, unit).toISOString()
    return new DateTime(date.addDuration(this.#timestamp, iso, {
      timezone: this.#timezone
    }), { timezone: this.#timezone })
  }

  subtract (value, unit) {
    const iso = Duration.from(value, unit).toISOString()
    return new DateTime(date.subtractDuration(this.#timestamp, iso, {
      timezone: this.#timezone
    }), { timezone: this.#timezone })
  }

  /** Weeks follow the locale: Sunday in English, the default, Monday in French. */
  startOf (unit, { locale = 'en' } = {}) {
    return new DateTime(date.startOf(this.#timestamp, unit, {
      timezone: this.#timezone,
      locale
    }), { timezone: this.#timezone })
  }

  endOf (unit, { locale = 'en' } = {}) {
    return new DateTime(date.endOf(this.#timestamp, unit, {
      timezone: this.#timezone,
      locale
    }), { timezone: this.#timezone })
  }

  diff (value, unit = 'milliseconds', { floating = false } = {}) {
    const other = DateTime.from(value, { timezone: this.#timezone })
    return date.diff(this.#timestamp, other.#timestamp, unit, {
      timezone: this.#timezone,
      floating
    })
  }

  isBefore (value) {
    const other = DateTime.from(value, { timezone: this.#timezone })
    return this.#timestamp < other.#timestamp
  }

  isAfter (value) {
    const other = DateTime.from(value, { timezone: this.#timezone })
    return this.#timestamp > other.#timestamp
  }

  isSame (value) {
    const other = DateTime.from(value, { timezone: this.#timezone })
    return this.#timestamp === other.#timestamp
  }

  format (pattern, { locale = 'en' } = {}) {
    return date.format(this.#timestamp, pattern, {
      timezone: this.#timezone,
      locale
    })
  }

  toDate () {
    return new Date(this.#timestamp)
  }

  toISOString () {
    return new Date(this.#timestamp).toISOString()
  }

  valueOf () {
    return this.#timestamp
  }

  // Like Date: numeric contexts (<, -, +dateTime) get the timestamp, all others the string,
  // so that 'Time: ' + dateTime does not print a timestamp
  [Symbol.toPrimitive] (hint) {
    return hint === 'number' ? this.#timestamp : this.toString()
  }

  toString () {
    return this.format()
  }

  toJSON () {
    return {
      instant: this.toISOString(),
      timezone: this.#timezone
    }
  }
}
