import { assert, is, conform, optional } from '@kalisio/common-core'
import { isDirection } from '../directions.js'
import { DD } from './dd.js'

const SCHEMA = {
  degrees: is.integer,
  minutes: (v) => is.integer(v) && is.inRange(v, 0, 59),
  seconds: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: optional(isDirection)
}

const REGEX_SIGNED = /^(-?\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?$/
const REGEX_DIR = /^(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?([NSEW])$/

export function DMS (dms) {
  let _degrees = null
  let _minutes = null
  let _seconds = null
  let _direction = null

  if (is.plainObject(dms) && conform.schema(dms, SCHEMA)) {
    if (is.defined(dms.direction)) {
      if (dms.degrees >= 0) {
        _degrees = dms.degrees
        _minutes = dms.minutes
        _seconds = dms.seconds
        _direction = dms.direction
      }
    } else {
      _degrees = dms.degrees
      _minutes = dms.minutes
      _seconds = dms.seconds
    }
  } else if (is.string(dms)) {
    const pattern = dms.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      _degrees = parseFloat(match[1])
      _minutes = parseFloat(match[2])
      _seconds = parseFloat(match[3])
      _direction = match[4] ?? null
    }
  }

  return {
    get degrees () { return _degrees },
    get minutes () { return _minutes },
    get seconds () { return _seconds },
    get direction () { return _direction },
    get format () { return 'DMS' },

    isValid () {
      return is.integer(_degrees) &&
        is.integer(_minutes) && is.inRange(_minutes, 0, 59) &&
        is.inRangeExclusiveMax(_seconds, 0, 60)
    },

    toString (decimalPlaces) {
      assert.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      let str = `${_degrees}° ${_minutes}' ${_seconds.toFixed(decimalPlaces)}"`
      if (_direction) str += ` ${_direction}`
      return str
    },

    toDecimal () {
      if (!this.isValid()) return null
      return DD({ degrees: _degrees + _minutes / 60 + _seconds / 3600, direction: _direction })
    }
  }
}
