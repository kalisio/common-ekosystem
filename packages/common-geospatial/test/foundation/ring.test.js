import { describe, it, expect } from 'vitest'
import {
  deduplicatePositions,
  isClosedRing,
  closeRing,
  isValidRing,
  sphericalRingArea,
  isClockwiseRing,
  ringsIntersect,
  ringSelfIntersections
} from '../../src/foundation'

describe('deduplicatePositions', () => {
  it('removes consecutive duplicate positions', () => {
    const ring = [[0, 0], [0, 0], [2, 0], [2, 1], [0, 0]]
    expect(deduplicatePositions(ring)).toEqual([[0, 0], [2, 0], [2, 1], [0, 0]])
  })

  it('keeps non-consecutive equal positions', () => {
    const ring = [[0, 0], [2, 0], [0, 0], [2, 1]]
    expect(deduplicatePositions(ring)).toEqual([[0, 0], [2, 0], [0, 0], [2, 1]])
  })

  it('deduplicates positions equal within precision', () => {
    // [2, 0.00000001] and [2, 0.00000002] both round to 0.0000000 at the default precision (7)
    const ring = [[0, 0], [2, 0.00000001], [2, 0.00000002], [2, 1]]
    expect(deduplicatePositions(ring)).toEqual([[0, 0], [2, 0.00000001], [2, 1]])
  })

  it('respects a custom precision', () => {
    const ring = [[0, 0], [2, 0.001], [2, 0.002], [2, 1]]
    expect(deduplicatePositions(ring, { precision: 2 })).toEqual([[0, 0], [2, 0.001], [2, 1]])
  })

  it('ignores altitude by default', () => {
    const ring = [[0, 0, 10], [2, 1, 20], [2, 1, 50], [0, 1, 30]]
    expect(deduplicatePositions(ring)).toEqual([[0, 0, 10], [2, 1, 20], [0, 1, 30]])
  })

  it('keeps altitude-differing positions with consider3D', () => {
    const ring = [[0, 0, 10], [2, 1, 20], [2, 1, 50], [0, 1, 30]]
    expect(deduplicatePositions(ring, { consider3D: true })).toEqual([[0, 0, 10], [2, 1, 20], [2, 1, 50], [0, 1, 30]])
  })

  it('leaves a clean ring untouched', () => {
    const ring = [[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]
    expect(deduplicatePositions(ring)).toEqual(ring)
  })

  it('returns an empty array for an empty ring', () => {
    expect(deduplicatePositions([])).toEqual([])
  })

  it('throws for invalid options', () => {
    expect(() => deduplicatePositions([[0, 0], [1, 0]], { precision: 'bad' })).toThrow()
    expect(() => deduplicatePositions([[0, 0], [1, 0]], { consider3D: 'bad' })).toThrow()
  })
})

describe('isClosedRing', () => {
  it('returns true when first equals last', () => {
    expect(isClosedRing([[0, 0], [2, 0], [2, 1], [0, 0]])).toBe(true)
  })

  it('returns false when first differs from last', () => {
    expect(isClosedRing([[0, 0], [2, 0], [2, 1], [0, 1]])).toBe(false)
  })

  it('returns false for an empty ring', () => {
    expect(isClosedRing([])).toBe(false)
  })

  it('ignores altitude by default when comparing endpoints', () => {
    expect(isClosedRing([[0, 0, 10], [2, 0], [2, 1], [0, 0, 99]])).toBe(true)
  })

  it('throws for invalid options', () => {
    expect(() => isClosedRing([[0, 0], [2, 0], [2, 1], [0, 0]], { precision: 'bad' })).toThrow()
    expect(() => isClosedRing([[0, 0], [2, 0], [2, 1], [0, 0]], { consider3D: 'bad' })).toThrow()
  })
})

describe('closeRing', () => {
  it('appends the first position when the ring is open', () => {
    const ring = [[0, 0], [2, 0], [2, 1], [0, 1]]
    expect(closeRing(ring)).toEqual([[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]])
  })

  it('returns the ring unchanged when already closed', () => {
    const ring = [[0, 0], [2, 0], [2, 1], [0, 0]]
    expect(closeRing(ring)).toBe(ring)
  })

  it('returns an empty ring unchanged', () => {
    const ring = []
    expect(closeRing(ring)).toBe(ring)
  })

  it('clones the first position to avoid aliasing', () => {
    const ring = [[0, 0], [2, 0], [2, 1], [0, 1]]
    const closed = closeRing(ring)
    expect(closed[closed.length - 1]).not.toBe(closed[0])
    expect(closed[closed.length - 1]).toEqual(closed[0])
  })
})

describe('isValidRing', () => {
  it('returns true for a valid closed ring of 4 positions', () => {
    expect(isValidRing([[0, 0], [2, 0], [2, 1], [0, 0]])).toBe(true)
  })

  it('returns false for fewer than 4 positions', () => {
    expect(isValidRing([[0, 0], [2, 0], [0, 0]])).toBe(false)
  })

  it('returns false when not closed', () => {
    expect(isValidRing([[0, 0], [2, 0], [2, 1], [0, 1]])).toBe(false)
  })

  it('returns false for a non-array', () => {
    expect(isValidRing(null)).toBe(false)
    expect(isValidRing('ring')).toBe(false)
  })
})

describe('sphericalRingArea', () => {
  it('is positive for a counter-clockwise ring', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
    expect(sphericalRingArea(ring)).toBeGreaterThan(0)
  })

  it('is negative for a clockwise ring', () => {
    const ring = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
    expect(sphericalRingArea(ring)).toBeLessThan(0)
  })

  it('flips sign when the ring is reversed', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
    const reversed = [...ring].reverse()
    expect(sphericalRingArea(ring)).toBeCloseTo(-sphericalRingArea(reversed), 10)
  })

  it('throws for an invalid ring', () => {
    expect(() => sphericalRingArea([[0, 0], [1, 0], [0, 0]])).toThrow()
    expect(() => sphericalRingArea(null)).toThrow()
  })
})

describe('isClockwiseRing', () => {
  it('returns false for a counter-clockwise ring', () => {
    expect(isClockwiseRing([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])).toBe(false)
  })

  it('returns true for a clockwise ring', () => {
    expect(isClockwiseRing([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])).toBe(true)
  })

  it('throws for an invalid ring', () => {
    expect(() => isClockwiseRing([[0, 0], [1, 0], [0, 0]])).toThrow()
  })
})

describe('ringsIntersect', () => {
  const exterior = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]

  it('returns false for a hole well inside the exterior', () => {
    const hole = [[3, 3], [3, 6], [6, 6], [6, 3], [3, 3]]
    expect(ringsIntersect(exterior, hole)).toBe(false)
  })

  it('returns true for a hole straddling the exterior boundary', () => {
    const hole = [[8, 3], [12, 3], [12, 6], [8, 6], [8, 3]]
    expect(ringsIntersect(exterior, hole)).toBe(true)
  })

  it('returns true for two overlapping rings', () => {
    const a = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]
    const b = [[2, 2], [6, 2], [6, 6], [2, 6], [2, 2]]
    expect(ringsIntersect(a, b)).toBe(true)
  })

  it('returns false for two separate rings', () => {
    const a = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    const b = [[5, 5], [7, 5], [7, 7], [5, 7], [5, 5]]
    expect(ringsIntersect(a, b)).toBe(false)
  })

  it('returns false for edge-adjacent rings (shared boundary, no crossing)', () => {
    // Detects franc crossings only: rings sharing an edge do not count as intersecting.
    const a = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    const b = [[2, 0], [4, 0], [4, 2], [2, 2], [2, 0]]
    expect(ringsIntersect(a, b)).toBe(false)
  })

  it('is symmetric', () => {
    const a = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]
    const b = [[2, 2], [6, 2], [6, 6], [2, 6], [2, 2]]
    expect(ringsIntersect(a, b)).toBe(ringsIntersect(b, a))
  })

  it('throws for an invalid ring', () => {
    const valid = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    expect(() => ringsIntersect([[0, 0], [1, 0], [0, 0]], valid)).toThrow()
    expect(() => ringsIntersect(valid, null)).toThrow()
  })
})

describe('ringSelfIntersections', () => {
  it('returns an empty array for a simple convex ring', () => {
    const ring = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    expect(ringSelfIntersections(ring)).toEqual([])
  })

  it('returns an empty array for a concave but non self-intersecting ring', () => {
    // Inward-pointing arrow: concave, yet no edge crosses another.
    const ring = [[0, 0], [4, 0], [2, 1], [4, 2], [0, 2], [0, 0]]
    expect(ringSelfIntersections(ring)).toEqual([])
  })

  it('detects a bowtie and reports the crossing edge pair', () => {
    // Edges e0 (0,0)->(2,2) and e2 (2,0)->(0,2) cross at (1,1).
    const ring = [[0, 0], [2, 2], [2, 0], [0, 2], [0, 0]]
    expect(ringSelfIntersections(ring)).toEqual([[0, 2]])
  })

  it('does not flag the wrap-around edge pair (first edge meets last edge at the closing vertex)', () => {
    // On this triangle the only non-adjacent candidate is (first edge, last
    // edge); they merely share the closing vertex and must not count.
    const ring = [[0, 0], [2, 0], [1, 2], [0, 0]]
    expect(ringSelfIntersections(ring)).toEqual([])
  })

  it('detects a self-intersection that straddles the antimeridian', () => {
    // Same bowtie shape, shifted onto the +/-180 seam. On the sphere the
    // great-circle arcs take the short way across the antimeridian and still
    // cross; a planar checker fed raw coordinates would route them the long
    // way around and miss it. This is the case that justifies dropping kinks.
    const ring = [[170, 0], [-170, 2], [-170, 0], [170, 2], [170, 0]]
    const pairs = ringSelfIntersections(ring)
    expect(pairs.length).toBeGreaterThan(0)
    expect(pairs).toContainEqual([0, 2])
  })

  it('reports every crossing pair for a ring with two distinct self-intersections', () => {
    // Star-like ring crossing itself twice; assert we collect both pairs.
    const ring = [[0, 0], [4, 4], [0, 3], [4, 1], [2, 5], [0, 0]]
    const pairs = ringSelfIntersections(ring)
    expect(pairs.length).toBeGreaterThanOrEqual(2)
  })

  it('does not report a false crossing when a duplicate vertex makes two edges share a position', () => {
    // A convex ring with one consecutive duplicate vertex: no edges actually
    // cross. The duplicate is a separate defect (DUPLICATE_POSITION); the shared
    // vertex it creates must not be misread as a self-intersection.
    const ring = [[10, 0], [7, 7], [7, 7], [0, 10], [-10, 0], [0, -10], [10, 0]]
    expect(ringSelfIntersections(ring)).toEqual([])
  })

  it('throws for an invalid ring', () => {
    expect(() => ringSelfIntersections([[0, 0], [1, 0], [0, 0]])).toThrow()
    expect(() => ringSelfIntersections([[0, 0], [2, 0], [2, 2], [0, 2]])).toThrow()
    expect(() => ringSelfIntersections(null)).toThrow()
  })
})
