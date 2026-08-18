import { is, conform } from '@kalisio/common-core/predicates'
import { AXES } from '../axes.js'
import { isValidDirection, isEast, isWest, getDirectionSymbols } from '../directions.js'
import { DD } from './dd.js'

const SCHEMA = {
  degrees: is.nonNegativeInteger,
  minutes: (v) => is.inRangeExclusiveMax(v, 0, 60),
  direction: isValidDirection
}

function latRegex () {
  return new RegExp(`^(\\d{2})(\\d{3})([${getDirectionSymbols(AXES.LATITUDE).join('')}])$`, 'i')
}

function lonRegex () {
  return new RegExp(`^(\\d{3})(\\d{3})([${getDirectionSymbols(AXES.LONGITUDE).join('')}])$`, 'i')
}

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
    const match = pattern.match(latRegex()) ?? pattern.match(lonRegex())
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
        isValidDirection(_direction)
    },

    toString () {
      if (!this.isValid()) return ''
      const isLon = isEast(_direction) || isWest(_direction)
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
