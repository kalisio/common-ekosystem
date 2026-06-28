import { describe, it, expect } from 'vitest'
import { isValidBBox, is3DBBox, mergeBBox } from '../../src/foundation'

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

  it('returns false for invalid south-west position', () => {
    expect(isValidBBox([-181, -20, 10, 20])).toBe(false)
    expect(isValidBBox([-10, -91, 10, 20])).toBe(false)
  })

  it('returns false for invalid north-east position', () => {
    expect(isValidBBox([-10, -20, 181, 20])).toBe(false)
    expect(isValidBBox([-10, -20, 10, 91])).toBe(false)
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
    expect(() => is3DBBox([-181, -20, 10, 20])).toThrow()
  })
})

describe('mergeBBox', () => {
  it('throws for invalid bbox1', () => {
    expect(() => mergeBBox(null, [-10, -20, 10, 20])).toThrow()
    expect(() => mergeBBox([-181, -20, 10, 20], [-10, -20, 10, 20])).toThrow()
  })

  it('throws for invalid bbox2', () => {
    expect(() => mergeBBox([-10, -20, 10, 20], null)).toThrow()
    expect(() => mergeBBox([-10, -20, 10, 20], [-181, -20, 10, 20])).toThrow()
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
