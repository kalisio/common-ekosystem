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

// A direction matches a type if it equals its label or its symbol, in any of
// the active locales (current + fallback), case-insensitively.
function isValidDirectionOf (type, dir) {
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

export function getNorth () { return getLocalizedDirections().NORTH }
export function getSouth () { return getLocalizedDirections().SOUTH }
export function getEast () { return getLocalizedDirections().EAST }
export function getWest () { return getLocalizedDirections().WEST }

export function isValidDirection (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isNorth(dir) || isSouth(dir) || isEast(dir) || isWest(dir)
}

export function isNorth (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isValidDirectionOf('NORTH', dir)
}

export function isSouth (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isValidDirectionOf('SOUTH', dir)
}

export function isEast (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isValidDirectionOf('EAST', dir)
}

export function isWest (dir) {
  assert.that(dir, is.string, 'dir must be a string')
  return isValidDirectionOf('WEST', dir)
}

export function getDirectionAxis (dir) {
  assert.that(dir, isValidDirection, 'dir must be a direction')
  if (isWest(dir) || isEast(dir)) return AXES.LONGITUDE
  return AXES.LATITUDE
}
