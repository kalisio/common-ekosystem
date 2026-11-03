import { assert, is } from '@kalisio/common-core/predicates'
import { getLocale, getActiveLocales, getMessages } from './localization.js'
import { AXES, isLatitude, isLongitude, isValidAxis } from './axes.js'

function getLocalizedDirections () {
  return getMessages(getLocale()).DIRECTIONS
}

function collectLocalizedSymbols (keys) {
  const symbols = new Set()
  for (const code of getActiveLocales()) {
    const { DIRECTIONS } = getMessages(code)
    for (const key of keys) symbols.add(DIRECTIONS[key].symbol)
  }
  return [...symbols]
}

function isValidDirectionOf (type, dir) {
  if (!is.string(dir)) return false
  const value = dir.toUpperCase()
  return getActiveLocales().some((code) => {
    const { label, symbol } = getMessages(code).DIRECTIONS[type]
    return value === label.toUpperCase() || value === symbol.toUpperCase()
  })
}

export function getDirections (axis = null) {
  const directions = getLocalizedDirections()
  if (is.defined(axis)) {
    assert.that(axis, isValidAxis, 'axis must be a valid axis')
    if (isLatitude(axis)) return [directions.SOUTH, directions.NORTH]
    if (isLongitude(axis)) return [directions.EAST, directions.WEST]
    return []
  }
  return [directions.SOUTH, directions.NORTH, directions.EAST, directions.WEST]
}

export function getDirectionSymbols (axis = null) {
  if (is.defined(axis)) {
    assert.that(axis, isValidAxis, 'axis must be a valid axis')
    if (isLatitude(axis)) return collectLocalizedSymbols(['NORTH', 'SOUTH'])
    if (isLongitude(axis)) return collectLocalizedSymbols(['EAST', 'WEST'])
    return []
  }
  return collectLocalizedSymbols(['NORTH', 'SOUTH', 'EAST', 'WEST'])
}

// Escaped regex alternation of the direction symbols of an axis (or of all axes)
export function getDirectionPattern (axis = null) {
  return getDirectionSymbols(axis)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'))
    .join('|')
}

export function getNorth () { return getLocalizedDirections().NORTH }
export function getSouth () { return getLocalizedDirections().SOUTH }
export function getEast () { return getLocalizedDirections().EAST }
export function getWest () { return getLocalizedDirections().WEST }

export function isValidDirection (dir) {
  return isNorth(dir) || isSouth(dir) || isEast(dir) || isWest(dir)
}

export function isNorth (dir) {
  return isValidDirectionOf('NORTH', dir)
}

export function isSouth (dir) {
  return isValidDirectionOf('SOUTH', dir)
}

export function isEast (dir) {
  return isValidDirectionOf('EAST', dir)
}

export function isWest (dir) {
  return isValidDirectionOf('WEST', dir)
}

export function getDirectionAxis (dir) {
  assert.that(dir, isValidDirection, 'dir must be a direction')
  if (isWest(dir) || isEast(dir)) return AXES.LONGITUDE
  return AXES.LATITUDE
}
