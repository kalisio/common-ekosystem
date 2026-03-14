import { asserts, is, conforms, optional } from '@kalisio/check'
import { directions } from '../directions.js'

const SCHEMA = {
  degrees: is.nonNegativeInteger,
  minutes: (v) => is.integer(v) && is.inRange(v, 0, 59),
  seconds: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: optional(directions.is)
}

const REGEX_SIGNED = /^(-?\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?$/
const REGEX_DIR = /^(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?([NSEW])$/

export function DMS (coord) {
  let _degrees = null
  let _minutes = null
  let _seconds = null
  let _direction = null

  if (conforms.schema(coord, SCHEMA)) {
    _degrees = coord.degrees
    _minutes = coord.minutes
    _seconds = coord.seconds
    _direction = coord.direction ?? null
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      _degrees = parseFloat(match[1])
      _minutes = parseFloat(match[2])
      _seconds = parseFloat(match[3])
      _direction = match[4] ?? null
    }
  }

  return {
    degrees () { return _degrees },
    minutes () { return _minutes },
    seconds () { return _seconds },
    direction () { return _direction },

    isValid () {
      return is.nonNegativeInteger(_degrees) &&
        is.integer(_minutes) && is.inRange(_minutes, 0, 59) &&
        is.inRangeExclusiveMax(_seconds, 0, 60)
    },

    format (decimalPlaces) {
      asserts.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      let str = `${_degrees}° ${_minutes}' ${_seconds.toFixed(decimalPlaces)}"`
      if (_direction) str += ` ${_direction}`
      return str
    }
  }
}
