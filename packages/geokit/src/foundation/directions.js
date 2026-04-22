import { assert, is } from '@kalisio/kore'
import { getLocale } from './locale.js'
import { AXES, isLatitude, isLongitude, isAxis } from './axes.js'

function getAll () {
  return getLocale().content.DIRECTIONS
}

function isDirectionOf (type, dir) {
  const all = getAll()
  const label = all[type].label.toUpperCase()
  const symbol = all[type].symbol.toUpperCase()
  return dir.toUpperCase() === label || dir.toUpperCase() === symbol
}

export function getDirections (axis = null) {
  const directions = getAll()
  if (is.defined(axis)) {
    assert.that(axis, isAxis, 'axis must be a valid axis')
    if (isLatitude(axis)) return [directions.SOUTH, directions.NORTH]
    if (isLongitude(axis)) return [directions.EAST, directions.WEST]
    return []
  }
  return [directions.SOUTH, directions.NORTH, directions.EAST, directions.WEST]
}

export function getNorth () { return getAll().NORTH }
export function getSouth () { return getAll().SOUTH }
export function getEast () { return getAll().EAST }
export function getWest () { return getAll().WEST }

export function isDirection (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isNorth(dir) || isSouth(dir) || isEast(dir) || isWest(dir)
}

export function isNorth (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isDirectionOf('NORTH', dir)
}

export function isSouth (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isDirectionOf('SOUTH', dir)
}

export function isEast (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isDirectionOf('EAST', dir)
}

export function isWest (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isDirectionOf('WEST', dir)
}

export function getDirectionAxis (dir) {
  assert.that(dir, isDirection, 'dir must be a direction')
  if (isWest(dir) || isEast(dir)) return AXES.LONGITUDE
  return AXES.LATITUDE
}
