import { describe, it, expect } from 'vitest'
import {
  isValidBBox,
  is3DBBox,
  mergeBBox,
  computeBBox,
  truncateBBox
} from '../../src/foundation'

describe('isValidBBox', () => {
  it('returns true for a valid 2D bbox', () => {
    expect(isValidBBox([-10, -20, 10, 20])).toBe(true)
  })

  it('returns true for a valid 3D bbox', () => {
    expect(isValidBBox([-10, -20, -100, 10, 20, 100])).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isValidBBox([])).toBe(false)
    expect(isValidBBox([-10, -20, 10])).toBe(false)
    expect(isValidBBox([-10, -20, 10, 20, 0])).toBe(false)
  })

  it('returns false when south > north', () => {
    expect(isValidBBox([-10, 20, 10, -20])).toBe(false)
  })

  it('returns false when minAlt > maxAlt in 3D', () => {
    expect(isValidBBox([-10, -20, 100, 10, 20, -100])).toBe(false)
  })

  it('returns true when bbox crosses antimeridian (west > east)', () => {
    expect(isValidBBox([10, -20, -10, 20])).toBe(true)
  })

  it('returns false for non-array', () => {
    expect(isValidBBox(null)).toBe(false)
    expect(isValidBBox({})).toBe(false)
  })
})

describe('is3DBBox', () => {
  it('returns true for a valid 3D bbox', () => {
    expect(is3DBBox([-10, -20, -100, 10, 20, 100])).toBe(true)
  })

  it('returns false for a valid 2D bbox', () => {
    expect(is3DBBox([-10, -20, 10, 20])).toBe(false)
  })

  it('throws for invalid bbox', () => {
    expect(() => is3DBBox(null)).toThrow()
    expect(() => is3DBBox([])).toThrow()
  })
})

describe('mergeBBox', () => {
  it('throws for invalid bbox', () => {
    expect(() => mergeBBox(null, [-10, -20, 10, 20])).toThrow()
    expect(() => mergeBBox([-10, -20, 10, 20], null)).toThrow()
  })

  it('merges two 2D bboxes', () => {
    expect(mergeBBox([-10, -20, 10, 20], [-5, -15, 15, 25])).toEqual([-10, -20, 15, 25])
  })

  it('merges two 3D bboxes', () => {
    expect(mergeBBox([-10, -20, -100, 10, 20, 100], [-5, -15, -50, 15, 25, 200])).toEqual([-10, -20, -100, 15, 25, 200])
  })

  it('merges when one bbox is contained in the other', () => {
    expect(mergeBBox([-10, -20, 10, 20], [-5, -5, 5, 5])).toEqual([-10, -20, 10, 20])
  })

  it('merges two identical bboxes', () => {
    expect(mergeBBox([-10, -20, 10, 20], [-10, -20, 10, 20])).toEqual([-10, -20, 10, 20])
  })

  it('merges two adjacent bboxes', () => {
    expect(mergeBBox([-10, -20, 0, 20], [0, -20, 10, 20])).toEqual([-10, -20, 10, 20])
  })

  it('merges two non-overlapping bboxes', () => {
    expect(mergeBBox([-20, -20, -10, 20], [10, -20, 20, 20])).toEqual([-20, -20, 20, 20])
  })

  it('merges two point bboxes', () => {
    expect(mergeBBox([2.3522, 48.8566, 2.3522, 48.8566], [2.3600, 48.8600, 2.3600, 48.8600])).toEqual([2.3522, 48.8566, 2.3600, 48.8600])
  })

  it('merges two identical point bboxes', () => {
    expect(mergeBBox([2.3522, 48.8566, 2.3522, 48.8566], [2.3522, 48.8566, 2.3522, 48.8566])).toEqual([2.3522, 48.8566, 2.3522, 48.8566])
  })

  it('merges bboxes at extreme coordinates', () => {
    expect(mergeBBox([-180, -90, 0, 0], [0, 0, 180, 90])).toEqual([-180, -90, 180, 90])
  })

  it('merges 3D bboxes with negative altitudes', () => {
    expect(mergeBBox([-10, -20, -200, 10, 20, -100], [-5, -15, -150, 15, 25, -50])).toEqual([-10, -20, -200, 15, 25, -50])
  })

  it('merges 3D bboxes where one has zero altitude range', () => {
    expect(mergeBBox([-10, -20, 0, 10, 20, 0], [-5, -15, -100, 15, 25, 100])).toEqual([-10, -20, -100, 15, 25, 100])
  })
})

describe('computeBBox', () => {
  it('throws for empty array', () => {
    expect(() => computeBBox([])).toThrow()
  })

  it('throws for invalid positions', () => {
    expect(() => computeBBox([null])).toThrow()
  })

  it('throws for invalid options', () => {
    expect(() => computeBBox([[2.3522, 48.8566]], { ignore3D: 'bad' })).toThrow()
  })

  it('computes bbox for a single 2D position', () => {
    expect(computeBBox([[2.3522, 48.8566]])).toEqual([2.3522, 48.8566, 2.3522, 48.8566])
  })

  it('computes bbox for multiple 2D positions', () => {
    expect(computeBBox([
      [-10, -20],
      [10, 20],
      [0, 0]
    ])).toEqual([-10, -20, 10, 20])
  })

  it('computes 3D bbox when at least one position has altitude', () => {
    expect(computeBBox([
      [-10, -20, -100],
      [10, 20, 100],
      [0, 0]
    ])).toEqual([-10, -20, -100, 10, 20, 100])
  })

  it('uses 0 for missing altitude in 3D mode', () => {
    expect(computeBBox([
      [-10, -20],
      [10, 20, 100]
    ])).toEqual([-10, -20, 0, 10, 20, 100])
  })

  it('ignores altitude with ignore3D: true', () => {
    expect(computeBBox([
      [-10, -20, -100],
      [10, 20, 100]
    ], { ignore3D: true })).toEqual([-10, -20, 10, 20])
  })

  it('computes bbox for a single 3D position', () => {
    expect(computeBBox([[2.3522, 48.8566, 100]])).toEqual([2.3522, 48.8566, 100, 2.3522, 48.8566, 100])
  })

  it('computes bbox at extreme coordinates', () => {
    expect(computeBBox([[-180, -90], [180, 90]])).toEqual([-180, -90, 180, 90])
  })
})

describe('truncateBBox', () => {
  it('truncates a 2D bbox with default precision', () => {
    expect(truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321]))
      .toEqual([-10.1234568, -20.9876543, 10.1234568, 20.9876543])
  })

  it('truncates a 3D bbox with default precision', () => {
    expect(truncateBBox([-10.123456789, -20.987654321, -100.123456789, 10.123456789, 20.987654321, 100.123456789]))
      .toEqual([-10.1234568, -20.9876543, -100.1234568, 10.1234568, 20.9876543, 100.1234568])
  })

  it('truncates a 3D bbox with custom precision', () => {
    expect(truncateBBox([-10.123456, -20.987654, -100.123456, 10.123456, 20.987654, 100.123456], 2))
      .toEqual([-10.12, -20.99, -100.12, 10.12, 20.99, 100.12])
  })

  it('truncates with custom precision', () => {
    expect(truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321], 3))
      .toEqual([-10.123, -20.988, 10.123, 20.988])
  })

  it('truncates with precision 0', () => {
    expect(truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321], 0))
      .toEqual([-10, -21, 10, 21])
  })

  it('mutates in place and returns the same object', () => {
    const bbox = [-10.123456789, -20.987654321, 10.123456789, 20.987654321]
    expect(truncateBBox(bbox)).toBe(bbox)
  })

  it('throws if bbox is invalid', () => {
    expect(() => truncateBBox(null)).toThrow()
    expect(() => truncateBBox([])).toThrow()
  })

  it('throws if precision is out of range', () => {
    expect(() => truncateBBox([-10, -20, 10, 20], -1)).toThrow()
    expect(() => truncateBBox([-10, -20, 10, 20], 9)).toThrow()
  })
})
