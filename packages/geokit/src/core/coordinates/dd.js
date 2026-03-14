import { asserts, is, conforms, optional } from '@kalisio/check'
import { directions } from '../directions.js'

const SCHEMA = {
  value: is.number,
  direction: optional(directions.is)
}

const REGEX_SIGNED = /^(-\d{1,3}(?:\.\d+)?)°?$/
const REGEX_DIR = /^(\d{1,3}(?:\.\d+)?)°?([NSEW])$/

export function DD (coord) {
  let _value = null
  let _direction = null

  if (conforms.schema(coord, SCHEMA)) {
    if (is.defined(coord.direction)) {
      if (coord.value >= 0) {
        _value = coord.value
        _direction = coord.direction
      }
    } else {
      _value = coord.value
    }
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      _value = parseFloat(match[1])
      _direction = match[2]
    }
  }

  return {
    value () { return _value },
    direction () { return _direction },

    isValid () {
      return is.number(_value)
    },

    format (decimalPlaces) {
      asserts.that(decimalPlaces, is.positiveInteger, 'decimalPlace must be a positive integer')
      if (!this.isValid()) return ''
      let str = `${_value.toFixed(decimalPlaces)}°`
      if (_direction) str += ` ${_direction}`
      return str
    }
  }
}
