import { asserts, is, conforms } from '@kalisio/check'

const SCHEMA = {
  degrees: is.number,
  minutes: is.number,
  seconds: is.number
}

const REGEX_SIGNED = /^(-?\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?$/
const REGEX_DIR = /^(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?([NSEW])$/

export function DMS (coord) {
  let degrees = null
  let minutes = null
  let seconds = null
  let direction = null

  if (conforms.schema(coord, SCHEMA)) {
    degrees = coord.degrees
    minutes = coord.minutes
    seconds = coord.seconds
    direction = coord.direction ?? null
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_SIGNED) ?? pattern.match(REGEX_DIR)
    if (match) {
      degrees = parseFloat(match[1])
      minutes = parseFloat(match[2])
      seconds = parseFloat(match[3])
      direction = match[4] ?? null
    }
  }

  return {
    degrees () { return degrees },
    minutes () { return minutes },
    seconds () { return seconds },
    direction () { return direction },

    isValid () {
      return is.number(degrees) && is.number(minutes) && is.number(seconds)
    },

    format (decimalPlaces) {
      asserts.that(decimalPlaces, is.positiveInteger, 'decimalPlaces must be a positive integer')
      if (!this.isValid()) return ''
      return `${degrees}° ${minutes}' ${seconds.toFixed(decimalPlaces)}" ${direction ?? ''}`
    }
  }
}
