import { is } from '@kalisio/common-core/predicates'
import { duration } from '../utilities/duration.js'

export class Duration {
  #iso

  constructor (value, unit) {
    if (is.instanceOf(value, Duration)) {
      if (unit !== undefined) {
        throw new TypeError('Cannot specify a unit when copying a Duration')
      }
      this.#iso = value.#iso
    } else {
      this.#iso = duration.parse(value, unit)
    }
    Object.freeze(this)
  }

  static from (value, unit) {
    if (is.instanceOf(value, Duration) && unit === undefined) return value
    return new Duration(value, unit)
  }

  add (value, unit) {
    const other = Duration.from(value, unit)
    return new Duration(duration.add(this.#iso, other.#iso))
  }

  subtract (value, unit) {
    const other = Duration.from(value, unit)
    return new Duration(duration.subtract(this.#iso, other.#iso))
  }

  negate () {
    return new Duration(duration.subtract('P0D', this.#iso))
  }

  /** Compares normalized representations: PT60M equals PT1H, but P1D does not equal PT24H. */
  equals (value, unit) {
    return this.#iso === Duration.from(value, unit).#iso
  }

  asMilliseconds () {
    return duration.asMilliseconds(this.#iso)
  }

  toISOString () {
    return this.#iso
  }

  toString () {
    return this.#iso
  }

  toJSON () {
    return this.#iso
  }
}
