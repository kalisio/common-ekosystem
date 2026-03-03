import { asserts, is } from '@kalisio/check'
import { isDirection, isSouthDirection, isWestDirection } from '../directions'
import { isCoordinateType, isLatitudeType } from './types.js'

export function convertCoordinateFromSexagesimal (deg, min = 0, sec = 0, dir = undefined) {
  asserts.all([
    { value: deg, validator: is.number, message: 'deg must be a number' },
    { value: min, validator: (v) => is.inRange(v, 0, 60), message: 'min must be in range [0, 60]' },
    { value: sec, validator: (v) => is.inRange(v, 0, 60), message: 'sec must be in range [0, 60]' }
  ])
  let sign = Math.sign(deg) || 1
  if (is.defined(dir)) {
    asserts.that(dir, isDirection, 'dir must be a direction')
    asserts.that(sign, is.positive, 'deg sign must be positive')
    if (isSouthDirection(dir) || isWestDirection(dir)) sign = -1
  }
  const dd = Math.abs(deg) + (min / 60) + (sec / 3600)
  return dd * sign
}

export function convertCoordinateToSexagesimal (coord, type = undefined) {
  asserts.that(coord, is.number, 'coord must be a number')
  const abs = Math.abs(coord)
  const deg = Math.floor(abs)
  const minFloat = (abs - deg) * 60
  const min = Math.floor(minFloat)
  const sec = (minFloat - min) * 60
  if (is.defined(type)) {
    asserts.that(type, isCoordinateType, 'type must be either "LAT" or "LON"')
    let dir
    if (isLatitudeType(type)) {
      dir = coord < 0 ? 'S' : 'N'
    } else {
      dir = coord < 0 ? 'W' : 'E'
    }
    return { deg, min, sec, dir }
  }
  return { deg: coord < 0 ? -deg : deg, min, sec }
}
