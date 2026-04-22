import { is, conform } from '@kalisio/kore'
import { isDirection } from '../directions.js'
import { DD } from './dd.js'

const SCHEMA = {
  degrees: is.nonNegativeInteger,
  minutes: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: isDirection
}

const REGEX_LAT = /^(\d{2})(\d{3})([NS])$/
const REGEX_LON = /^(\d{3})(\d{3})([EW])$/

export function DDMAero (ddm) {
  let _degrees = null
  let _minutes = null
  let _direction = null

  if (is.plainObject(ddm) && conform.schema(ddm, SCHEMA)) {
    _degrees = ddm.degrees
    _minutes = ddm.minutes
    _direction = ddm.direction
  } else if (is.string(ddm)) {
    const pattern = ddm.trim()
    const match = pattern.match(REGEX_LAT) ?? pattern.match(REGEX_LON)
    if (match) {
      _degrees = parseFloat(match[1])
      _minutes = parseFloat(match[2]) / 10
      _direction = match[3]
    }
  }

  return {
    get degrees () { return _degrees },
    get minutes () { return _minutes },
    get direction () { return _direction },
    get format () { return 'DDM_AERO' },

    isValid () {
      return is.nonNegativeInteger(_degrees) &&
        is.inRangeExclusiveMax(_minutes, 0, 60) &&
        isDirection(_direction)
    },

    toString () {
      if (!this.isValid()) return ''
      const isLon = _direction === 'E' || _direction === 'W'
      const deg = String(_degrees).padStart(isLon ? 3 : 2, '0')
      const min = Math.floor(_minutes * 10).toString().padStart(3, '0')
      return `${deg}${min}${_direction}`
    },

    toDecimal () {
      if (!this.isValid()) return null
      return DD({ degrees: _degrees + _minutes / 60, direction: _direction })
    }
  }
}
