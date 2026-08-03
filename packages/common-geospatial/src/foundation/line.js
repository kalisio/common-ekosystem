import { assert, is } from '@kalisio/common-core/predicates'
import { distanceBetweenPositions } from './position.js'
import { isValidPositions } from './positions.js'

export function isValidLine (line) {
  return is.arrayOfLengthAtLeast(line, 2) && isValidPositions(line)
}

export function lineLength (line) {
  assert.that(line, isValidPositions, 'line must be a valid array of positions')
  let total = 0
  for (let i = 0; i < line.length - 1; i++) {
    total += distanceBetweenPositions(line[i], line[i + 1])
  }
  return total
}
