import { describe, it, expect } from 'vitest'
import { distanceBetweenPositions } from '../../src/foundation/position.js'
import { isValidLine, lineLength } from '../../src/foundation/line.js'

describe('isValidLine', () => {
  it('accepts a line of two or more valid positions', () => {
    expect(isValidLine([[2.35, 48.85], [2.40, 48.90]])).toBe(true)
    expect(isValidLine([[0, 0], [1, 1], [2, 2]])).toBe(true)
  })

  it('does not require closure (unlike a ring)', () => {
    expect(isValidLine([[0, 0], [1, 1]])).toBe(true)
  })

  it('rejects fewer than the minimum positions', () => {
    // Cardinality guard lives here, at the geometry level.
    expect(isValidLine([])).toBe(false)
    expect(isValidLine([[2.35, 48.85]])).toBe(false)
  })

  it('rejects when any position is invalid', () => {
    expect(isValidLine([[2.35, 48.85], [NaN, 5]])).toBe(false)
    expect(isValidLine([[2.35, 48.85], [1]])).toBe(false)
    expect(isValidLine([[2.35, 48.85], ['a', 'b']])).toBe(false)
  })

  it('rejects a non-array', () => {
    expect(isValidLine('nope')).toBe(false)
    expect(isValidLine(undefined)).toBe(false)
    expect(isValidLine(null)).toBe(false)
  })
})

describe('lineLength', () => {
  it('equals the distance between the two endpoints for a single segment', () => {
    const a = [2.35, 48.85]
    const b = [2.40, 48.90]
    expect(lineLength([a, b])).toBeCloseTo(distanceBetweenPositions(a, b), 9)
  })

  it('is additive across segments', () => {
    const a = [0, 0]
    const b = [1, 0]
    const c = [1, 1]
    const expected = distanceBetweenPositions(a, b) + distanceBetweenPositions(b, c)
    expect(lineLength([a, b, c])).toBeCloseTo(expected, 9)
  })

  it('grows monotonically as segments are appended', () => {
    const two = lineLength([[0, 0], [1, 0]])
    const three = lineLength([[0, 0], [1, 0], [1, 1]])
    expect(three).toBeGreaterThan(two)
  })

  it('is zero for degenerate inputs (total fold, no line-hood required)', () => {
    // lineLength guards on isValidPositions, not isValidLine: empty and single
    // position are accepted and measure zero.
    expect(lineLength([])).toBe(0)
    expect(lineLength([[2.35, 48.85]])).toBe(0)
  })

  it('is zero for a segment whose endpoints coincide', () => {
    expect(lineLength([[2.35, 48.85], [2.35, 48.85]])).toBeCloseTo(0, 9)
  })

  it('does not mutate the input', () => {
    const line = [[0, 0], [1, 1]]
    const snapshot = structuredClone(line)
    lineLength(line)
    expect(line).toEqual(snapshot)
  })

  it('rejects a non-array', () => {
    expect(() => lineLength('nope')).toThrow(/valid array of positions/)
  })

  it('rejects an array containing an invalid position', () => {
    expect(() => lineLength([[2.35, 48.85], [NaN, 5]])).toThrow(/valid array of positions/)
  })
})
