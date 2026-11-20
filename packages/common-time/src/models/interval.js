import { is } from '@kalisio/common-core/predicates'
import { DateTime } from './date-time.js'
import { Duration } from './duration.js'

function isSnapshot (value) {
  return is.plainObject(value) &&
    Object.hasOwn(value, 'start') &&
    Object.hasOwn(value, 'end')
}

/**
 * Immutable half-open interval [start, end).
 * Both bounds are absolute instants represented in the same timezone.
 * Empty intervals (start === end) are allowed.
 * Accepts two bounds, another interval, a JSON snapshot, or an ISO 8601 interval
 * made of two instants (start/end), as written by toString().
 */
export class Interval {
  #start
  #end

  constructor (start, end, options = {}) {
    let inheritedTimezone = 'UTC'
    if (is.instanceOf(start, DateTime)) {
      inheritedTimezone = start.timezone
    }

    if (end === undefined && is.instanceOf(start, Interval)) {
      inheritedTimezone = start.timezone
      end = start.end
      start = start.start
    } else if (end === undefined && isSnapshot(start)) {
      const snapshot = start
      start = snapshot.start
      end = snapshot.end

      if (Object.hasOwn(snapshot, 'timezone')) {
        inheritedTimezone = snapshot.timezone
      } else if (is.instanceOf(start, DateTime)) {
        inheritedTimezone = start.timezone
      }
    } else if (end === undefined && is.string(start) && start.includes('/')) {
      const bounds = start.split('/')
      if (bounds.length !== 2 || bounds.some(bound => !is.nonEmptyString(bound))) {
        throw new RangeError(`Invalid ISO 8601 interval: ${start}`)
      }
      start = bounds[0]
      end = bounds[1]
    }

    if (start === undefined || end === undefined) {
      throw new TypeError('Interval requires start and end')
    }

    let zone = inheritedTimezone
    if (options.timezone !== undefined) {
      zone = options.timezone
    }

    this.#start = DateTime.from(start, { timezone: zone })
    this.#end = DateTime.from(end, { timezone: zone })

    if (this.#start.timestamp > this.#end.timestamp) {
      throw new RangeError('Interval start must not be after end')
    }

    Object.freeze(this)
  }

  static from (value, end, options) {
    if (is.instanceOf(value, Interval) && end === undefined && options === undefined) return value
    return new Interval(value, end, options)
  }

  get start () {
    return this.#start
  }

  get end () {
    return this.#end
  }

  get timezone () {
    return this.#start.timezone
  }

  /** Exact elapsed duration, never a calendar approximation. */
  get duration () {
    return new Duration(this.#end.timestamp - this.#start.timestamp, 'milliseconds')
  }

  isEmpty () {
    return this.#start.timestamp === this.#end.timestamp
  }

  contains (value) {
    const timestamp = DateTime.from(value, { timezone: this.timezone }).timestamp
    return timestamp >= this.#start.timestamp && timestamp < this.#end.timestamp
  }

  overlaps (value) {
    const other = Interval.from(value)

    if (this.isEmpty() || other.isEmpty()) return false

    return this.#start.timestamp < other.#end.timestamp &&
      other.#start.timestamp < this.#end.timestamp
  }

  /** Returns the common interval, or null when there is no overlap. */
  intersection (value) {
    const other = Interval.from(value)

    if (!this.overlaps(other)) return null

    return new Interval(
      Math.max(this.#start.timestamp, other.#start.timestamp),
      Math.min(this.#end.timestamp, other.#end.timestamp),
      { timezone: this.timezone }
    )
  }

  /**
   * Shifts both bounds using calendar-aware duration arithmetic. Aligned periods keep their meaning
   * ([Jan 1, Feb 1) shifted by P1M gives [Feb 1, Mar 1)), but bounds clamped to the end of a month
   * can shorten the interval or make it empty: [Jan 30, Jan 31) shifted by P1M gives [Feb 28, Feb 28).
   * Time units (PT…) always preserve the length.
   */
  shift (value, unit) {
    const offset = Duration.from(value, unit)

    return new Interval(
      this.#start.add(offset),
      this.#end.add(offset),
      { timezone: this.timezone }
    )
  }

  withTimezone (name) {
    return new Interval(this.#start, this.#end, { timezone: name })
  }

  /** Equality compares absolute bounds, independently of timezone. */
  equals (value) {
    const other = Interval.from(value)

    return this.#start.timestamp === other.#start.timestamp &&
      this.#end.timestamp === other.#end.timestamp
  }

  toJSON () {
    return {
      start: this.#start.toISOString(),
      end: this.#end.toISOString(),
      timezone: this.timezone
    }
  }

  toString () {
    return `${this.#start.toISOString()}/${this.#end.toISOString()}`
  }
}
