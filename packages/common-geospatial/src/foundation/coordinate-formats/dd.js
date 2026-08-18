import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { isValidDirection, getDirectionSymbols } from '../directions.js'

const SCHEMA = {
  degrees: is.number,
  direction: optional(isValidDirection)
}

const REGEX_SIGNED = /^(-?\d{1,3}(?:\.\d+)?)°?$/

function dirRegex () {
  return new RegExp(`^(\\d{1,3}(?:\\.\\d+)?)°?([${getDirectionSymbols()}])$`, 'i')
}

export function DD (dd) {
  let _degrees = null
  let _direction = null

  if (is.plainObject(dd) && conform.schema(dd, SCHEMA)) {
    if (is.defined(dd.direction)) {
      if (dd.degrees >= 0) {
        _degrees = dd.degrees
        _direction = dd.direction
      }
    } else {
      _degrees = dd.degrees
    }
  } else if (is.string(dd)) {
    const pattern = dd.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(dirRegex())
    if (match) {
      _degrees = parseFloat(match[1])
      _direction = match[2] ?? null
    }
  }

  return {
    get degrees () { return _degrees },
    get direction () { return _direction },
    get format () { return 'DD' },

    isValid () {
      return is.number(_degrees)
    },

    toString (decimalPlaces) {
      assert.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      let str = `${_degrees.toFixed(decimalPlaces)}°`
      if (_direction) str += ` ${_direction}`
      return str
    },

    toDecimal () {
      if (!this.isValid()) return null
      return DD({ degrees: _degrees, direction: _direction })
    }
  }
}
