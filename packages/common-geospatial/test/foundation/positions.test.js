import { describe, it, expect } from 'vitest'
import { isValidPositions } from '../../src/foundation'

describe('isValidPositions', () => {
  it('returns true for an array of valid positions', () => {
    expect(isValidPositions([[0, 0], [2, 1], [3, 4]])).toBe(true)
  })
  it('returns true for a single valid position', () => {
    expect(isValidPositions([[0, 0]])).toBe(true)
  })
  it('returns true for valid 3D positions', () => {
    expect(isValidPositions([[0, 0, 10], [2, 1, 20]])).toBe(true)
  })
  it('returns false for an empty array', () => {
    expect(isValidPositions([])).toBe(false)
  })
  it('returns false when one position is invalid', () => {
    expect(isValidPositions([[0, 0], [999, 0]])).toBe(false)
    expect(isValidPositions([[0, 0], [0, 91]])).toBe(false)
  })
  it('returns false when an element is not a position', () => {
    expect(isValidPositions([[0, 0], null])).toBe(false)
    expect(isValidPositions([[0, 0], 'nope'])).toBe(false)
  })
  it('returns false for a non-array', () => {
    expect(isValidPositions(null)).toBe(false)
    expect(isValidPositions({})).toBe(false)
    expect(isValidPositions('positions')).toBe(false)
  })
})
