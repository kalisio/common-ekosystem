import { is, conforms } from '@kalisio/check'

const SCHEMA = {
  degrees: is.number,
  minutes: is.number
}

const REGEX_LAT = /^(\d{2})(\d{3})([NS])$/
const REGEX_LON = /^(\d{3})(\d{3})([EW])$/

export function DDMAero (coord) {
  let degrees = null
  let minutes = null
  let direction = null

  if (conforms.schema(coord, SCHEMA)) {
    degrees = coord.degrees
    minutes = coord.minutes
    direction = coord.direction ?? null
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_LAT) ?? pattern.match(REGEX_LON)
    if (match) {
      degrees = parseFloat(match[1])
      minutes = parseFloat(match[2]) / 10
      direction = match[3]
    }
  }

  return {
    degrees () { return degrees },
    minutes () { return minutes },
    direction () { return direction },

    isValid () {
      return is.number(degrees) && is.number(minutes)
    },

    format () {
      if (!this.isValid()) return ''
      const isLon = direction === 'E' || direction === 'W'
      const deg = String(degrees).padStart(isLon ? 3 : 2, '0')
      const mmm = Math.floor(minutes * 10).toString().padStart(3, '0')
      return `${deg}${mmm}${direction ?? ''}`
    }
  }
}
