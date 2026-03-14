import { asserts, is, conforms } from '@kalisio/check'

const SCHEMA = {
  value: is.number
}

const REGEX_SIGNED = /^(-\d{1,3}(?:\.\d+)?)°?$/
const REGEX_DIR = /^(\d{1,3}(?:\.\d+)?)°?([NSEW])$/

export function DD (coord) {
  let value = null
  let direction = null

  if (conforms.schema(coord, SCHEMA)) {
    value = coord.value
    direction = coord.direction
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      value = parseFloat(match[1])
      direction = match[2]
    }
  }

  return {
    value () {
      return value
    },

    direction () {
      return direction
    },

    isValid () {
      return is.number(value)
    },

    format (decimalPlaces) {
      asserts.that(decimalPlaces, is.positiveInteger, 'decimalPlace must be a positive integer')
      if (!this.isValid()) return ''
      return `${value.toFixed(decimalPlaces)} °${direction ?? ''}`
    }
  }
}
