import { describe, it, expect } from 'vitest'
import { EARTH_RADIUS, distanceBetweenPositions, lineLength } from '../../src/foundation/index.js'

const ONE_DEGREE_M = (Math.PI / 180) * EARTH_RADIUS

describe('lineLength', () => {
  it('returns 0 for a single-position line', () => {
    expect(lineLength([[2.3522, 48.8566]])).toBe(0)
  })
  it('measures a single one-degree segment', () => {
    expect(lineLength([[0, 0], [0, 1]])).toBeCloseTo(ONE_DEGREE_M, 3)
  })
  it('sums consecutive segments', () => {
    // three colinear one-degree steps along a meridian
    expect(lineLength([[0, 0], [0, 1], [0, 2], [0, 3]])).toBeCloseTo(3 * ONE_DEGREE_M, 3)
  })
  it('equals the pairwise distance for a two-point line', () => {
    const a = [2.3522, 48.8566]
    const b = [-73.9857, 40.7484]
    expect(lineLength([a, b])).toBeCloseTo(distanceBetweenPositions(a, b), 6)
  })
  it('measures a closed ring as its perimeter', () => {
    // unit square around the equator/prime-meridian corner
    const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
    const expected =
      distanceBetweenPositions([0, 0], [1, 0]) +
      distanceBetweenPositions([1, 0], [1, 1]) +
      distanceBetweenPositions([1, 1], [0, 1]) +
      distanceBetweenPositions([0, 1], [0, 0])
    expect(lineLength(ring)).toBeCloseTo(expected, 6)
  })
  it('is independent of direction (same length reversed)', () => {
    const line = [[0, 0], [2, 1], [4, 0], [6, 3]]
    const reversed = [...line].reverse()
    expect(lineLength(line)).toBeCloseTo(lineLength(reversed), 6)
  })
  it('ignores altitude', () => {
    expect(lineLength([[0, 0, 100], [0, 1, 900]])).toBeCloseTo(ONE_DEGREE_M, 3)
  })
  it('throws for an invalid line', () => {
    expect(() => lineLength([])).toThrow()
    expect(() => lineLength(null)).toThrow()
    expect(() => lineLength([[0, 0], [999, 0]])).toThrow()
  })
})
