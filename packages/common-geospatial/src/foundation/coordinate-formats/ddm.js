import { assert, is, conform, optional } from '@kalisio/common-core'
import { isDirection } from '../directions.js'
import { DD } from './dd.js'

const SCHEMA = {
  degrees: is.integer,
  minutes: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: optional(isDirection)
}

const REGEX_SIGNED = /^(-?\d{1,3})°(\d{1,2}(?:\.\d+)?)'?$/
const REGEX_DIR = /^(\d{1,3})°(\d{1,2}(?:\.\d+)?)'?([NSEW])$/

export function DDM (ddm) {
  let _degrees = null
  let _minutes = null
  let _direction = null

  if (is.plainObject(ddm) && conform.schema(ddm, SCHEMA)) {
    if (is.defined(ddm.direction)) {
      if (ddm.degrees >= 0) {
        _degrees = ddm.degrees
        _minutes = ddm.minutes
        _direction = ddm.direction
      }
    } else {
      _degrees = ddm.degrees
      _minutes = ddm.minutes
    }
  } else if (is.string(ddm)) {
    const pattern = ddm.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      _degrees = parseFloat(match[1])
      _minutes = parseFloat(match[2])
      _direction = match[3] ?? null
    }
  }

  return {
    get degrees () { return _degrees },
    get minutes () { return _minutes },
    get direction () { return _direction },
    get format () { return 'DDM' },

    isValid () {
      return is.integer(_degrees) && is.inRangeExclusiveMax(_minutes, 0, 60)
    },

    toString (decimalPlaces) {
      assert.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      let str = `${_degrees}° ${_minutes.toFixed(decimalPlaces)}'`
      if (_direction) str += ` ${_direction}`
      return str
    },

    toDecimal () {
      if (!this.isValid()) return null
      return DD({ degrees: _degrees + _minutes / 60, direction: _direction })
    }
  }
}
