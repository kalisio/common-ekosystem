import { is, conforms } from '@kalisio/check'
import { directions } from '../directions.js'

const SCHEMA = {
  degrees: is.nonNegativeInteger,
  minutes: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: directions.is
}

const REGEX_LAT = /^(\d{2})(\d{3})([NS])$/
const REGEX_LON = /^(\d{3})(\d{3})([EW])$/

export function DDMAero (coord) {
  let _degrees = null
  let _minutes = null
  let _direction = null

  if (conforms.schema(coord, SCHEMA)) {
    _degrees = coord.degrees
    _minutes = coord.minutes
    _direction = coord.direction
  } else if (is.string(coord)) {
    const pattern = coord.replace(/\s+/g, '')
    const match = pattern.match(REGEX_LAT) ?? pattern.match(REGEX_LON)
    if (match) {
      _degrees = parseFloat(match[1])
      _minutes = parseFloat(match[2]) / 10
      _direction = match[3]
    }
  }

  return {
    degrees () { return _degrees },
    minutes () { return _minutes },
    direction () { return _direction },

    isValid () {
      return is.nonNegativeInteger(_degrees) &&
        is.inRangeExclusiveMax(_minutes, 0, 60) &&
        directions.is(_direction)
    },

    format () {
      if (!this.isValid()) return ''
      const isLon = _direction === 'E' || _direction === 'W'
      const deg = String(_degrees).padStart(isLon ? 3 : 2, '0')
      const min = Math.floor(_minutes * 10).toString().padStart(3, '0')
      return `${deg}${min}${_direction}`
    }
  }
}
