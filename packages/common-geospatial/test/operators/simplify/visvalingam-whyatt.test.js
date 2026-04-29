import { describe, it, expect } from 'vitest'
import { simplify } from '../../../src/operators/simplify/visvalingam-whyatt.js'

describe('simplify', () => {
  // --- Edge cases ---

  it('returns coords as-is if <= 2 points', () => {
    expect(simplify([])).toEqual([])
    expect(simplify([[0, 0]])).toEqual([[0, 0]])
    expect(simplify([[0, 0], [1, 1]])).toEqual([[0, 0], [1, 1]])
  })

  it('always preserves the first and last point', () => {
    const coords = [
      [2.3522, 48.8566], [2.3530, 48.8570], [2.3545, 48.8580],
      [2.3550, 48.8581], [2.3552, 48.8582], [2.3560, 48.8590],
      [2.3575, 48.8600], [2.3578, 48.8601], [2.3680, 48.8680]
    ]
    const result = simplify(coords, { tolerance: 100 })
    expect(result[0]).toEqual([2.3522, 48.8566])
    expect(result[result.length - 1]).toEqual([2.3680, 48.8680])
  })

  it('returns all points if tolerance = 0', () => {
    const coords = [
      [2.3522, 48.8566], [2.3530, 48.8570], [2.3545, 48.8580],
      [2.3550, 48.8581], [2.3552, 48.8582], [2.3560, 48.8590],
      [2.3575, 48.8600], [2.3578, 48.8601], [2.3680, 48.8680]
    ]
    expect(simplify(coords, { tolerance: 0 })).toEqual(coords)
  })

  // --- Simplification behavior ---

  it('removes collinear points with a sufficient tolerance', () => {
    // 3 perfectly aligned points → the middle point has a triangle area of 0
    const coords = [[2.3522, 48.8566], [2.3601, 48.8566], [2.3680, 48.8566]]
    const result = simplify(coords, { tolerance: 1 })
    expect(result).toEqual([[2.3522, 48.8566], [2.3680, 48.8566]])
  })

  it('keeps significant points with a low tolerance', () => {
    // Sharp peak in the middle → large area → must be kept
    const coords = [[2.3522, 48.8566], [2.3601, 48.9000], [2.3680, 48.8566]]
    const result = simplify(coords, { tolerance: 1e-4 })
    expect(result).toEqual([[2.3522, 48.8566], [2.3601, 48.9000], [2.3680, 48.8566]])
  })

  it('simplifies more aggressively as tolerance increases', () => {
    const coords = [
      [2.3522, 48.8566], [2.3530, 48.8570], [2.3545, 48.8580],
      [2.3550, 48.8581], [2.3552, 48.8582], [2.3560, 48.8590],
      [2.3575, 48.8600], [2.3578, 48.8601], [2.3680, 48.8680]
    ]
    const resultStrict = simplify(coords, { tolerance: 1e-8 })
    const resultLarge = simplify(coords, { tolerance: 1e-4 })
    expect(resultLarge.length).toBeLessThanOrEqual(resultStrict.length)
  })

  it('removes GPS noise — nearly redundant consecutive points', () => {
    // Simulates GPS noise: [2.3550, 48.8581] and [2.3552, 48.8582] are nearly identical
    const coords = [
      [2.3522, 48.8566], [2.3545, 48.8580],
      [2.3550, 48.8581], [2.3552, 48.8582], // noise
      [2.3560, 48.8590], [2.3575, 48.8600],
      [2.3578, 48.8601], [2.3580, 48.8602], // noise
      [2.3680, 48.8680]
    ]
    const result = simplify(coords, { tolerance: 1e-7 })
    expect(result.length).toBeLessThan(coords.length)
    expect(result[0]).toEqual([2.3522, 48.8566])
    expect(result[result.length - 1]).toEqual([2.3680, 48.8680])
  })

  // --- getWeight ---

  it('getWeight = 0 removes all intermediate points', () => {
    // Zero weight → all areas equal 0 → all removed
    const coords = [
      [2.3522, 48.8566], [2.3530, 48.8570], [2.3545, 48.8580],
      [2.3560, 48.8590], [2.3680, 48.8680]
    ]
    const result = simplify(coords, { tolerance: 1, getWeight: () => 0 })
    expect(result).toEqual([[2.3522, 48.8566], [2.3680, 48.8680]])
  })

  it('high getWeight preserves targeted points', () => {
    // All intermediate points have a small but non-zero area.
    // Without getWeight, they would all be removed at tolerance = 1.
    // [2.3545, 48.8568] gets a huge weight so its effective area exceeds tolerance and must be kept.
    const coords = [
      [2.3522, 48.8566], [2.3530, 48.8567], [2.3545, 48.8568],
      [2.3560, 48.8567], [2.3680, 48.8566]
    ]
    const resultWithout = simplify(coords, { tolerance: 1 })
    expect(resultWithout).not.toContainEqual([2.3545, 48.8568]) // confirm it would be removed

    const resultWith = simplify(coords, {
      tolerance: 1,
      getWeight: (coord) => (coord[0] === 2.3545 ? 1e10 : 1)
    })
    expect(resultWith).toContainEqual([2.3545, 48.8568])
  })
})
