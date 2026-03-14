import { asserts, is, conforms } from '@kalisio/check'

const SCHEMA = {
  degrees: is.number,
  minutes: is.number
}

const REGEX_SIGNED = /^(-?\d{1,3})°(\d{1,2}(?:\.\d+)?)'?$/
const REGEX_DIR = /^(\d{1,3})°(\d{1,2}(?:\.\d+)?)'?([NSEW])$/

export function DDM (coord) {
  let degrees = null
  let minutes = null
  let direction = null

  if (conforms.schema(coord, SCHEMA)) {
    degrees = coord.degrees
    minutes = coord.minutes
    direction = coord.direction ?? null
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      degrees = parseFloat(match[1])
      minutes = parseFloat(match[2])
      direction = match[3] ?? null
    }
  }

  return {
    degrees () {
      return degrees
    },

    minutes () {
      return minutes
    },

    direction () {
      return direction
    },

    isValid () {
      return is.number(degrees) && is.number(minutes)
    },

    format (decimalPlaces) {
      asserts.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      return `${degrees}° ${minutes.toFixed(decimalPlaces)}' ${direction ?? ''}`
    }
  }
}
