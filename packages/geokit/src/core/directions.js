import { asserts, is } from '@kalisio/check'
import { locale } from './locale.js'

function isDirectionOf (type, dir) {
  const directions = locale.get().content.DIRECTIONS
  const label = directions[type].label.toUpperCase()
  const symbol = directions[type].symbol.toUpperCase()
  const direction = dir.toUpperCase()
  return label === direction || symbol === direction
}

export const directions = Object.freeze({
  get () {
    return locale.get().content.DIRECTIONS
  },

  getNorth () {
    return this.get().NORTH
  },

  getSouth () {
    return this.get().SOUTH
  },

  getEast () {
    return this.get().EAST
  },

  getWest () {
    return this.get().WEST
  },

  isDirection (dir) {
    return (
      this.isNorth(dir) || this.isSouth(dir) || this.isEast(dir) || this.isWest(dir)
    )
  },

  isNorth (dir) {
    asserts.that(dir, is.string, 'dir must be a string')
    return isDirectionOf('NORTH', dir)
  },

  isSouth (dir) {
    asserts.that(dir, is.string, 'dir must be a string')
    return isDirectionOf('SOUTH', dir)
  },

  isEast (dir) {
    asserts.that(dir, is.string, 'dir must be a string')
    return isDirectionOf('EAST', dir)
  },

  isWest (dir) {
    asserts.that(dir, is.string, 'dir must be a string')
    return isDirectionOf('WEST', dir)
  }
})
