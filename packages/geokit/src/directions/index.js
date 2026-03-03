import { asserts, is } from '@kalisio/check'
import { getLocale } from '../locale'

function getDirections () {
  return getLocale().DIRECTIONS
}

function normalizeDirection (dir) {
  asserts.that(dir, is.string, 'dir must be a string')
  return dir.toUpperCase()
}

function isDirectionOf (type, dir) {
  const directions = getDirections()
  const label = directions[type].label.toUpperCase()
  const symbol = directions[type].symbol.toUpperCase()
  const direction = normalizeDirection(dir)
  return label === direction || symbol === direction
}

export function isNorthDirection (dir) {
  return isDirectionOf('NORTH', dir)
}

export function isSouthDirection (dir) {
  return isDirectionOf('SOUTH', dir)
}

export function isEastDirection (dir) {
  return isDirectionOf('EAST', dir)
}

export function isWestDirection (dir) {
  return isDirectionOf('WEST', dir)
}

export function isDirection (dir) {
  return (
    isNorthDirection(dir) ||
    isSouthDirection(dir) ||
    isEastDirection(dir) ||
    isWestDirection(dir)
  )
}
