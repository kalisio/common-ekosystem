import { describe, it, expect } from 'vitest'
import {
  positionToNVector,
  nVectorToPosition,
  dotNVectors,
  crossNVectors,
  addNVectors,
  scaleNVector,
  getNVectorNorm,
  normalizeNVector,
  angleBetweenNVectors,
  northNVector,
  eastNVector,
  southNVector,
  westNVector,
  bearingNVector,
  destinationNVector,
  crossNVectorArcs
} from '../../src/foundation/nvector.js'

function expectVectorCloseTo (actual, expected, precision = 10) {
  expect(actual).toHaveLength(3)
  for (let i = 0; i < 3; i++) expect(actual[i]).toBeCloseTo(expected[i], precision)
}

// Build a spherical edge (pair of unit vectors) from two lon/lat positions.
function edge (p1, p2) {
  return [positionToNVector(p1), positionToNVector(p2)]
}

describe('positionToNVector', () => {
  it('maps cardinal positions to the canonical basis', () => {
    expectVectorCloseTo(positionToNVector([0, 0]), [1, 0, 0])
    expectVectorCloseTo(positionToNVector([90, 0]), [0, 1, 0])
    expectVectorCloseTo(positionToNVector([0, 90]), [0, 0, 1])
    expectVectorCloseTo(positionToNVector([180, 0]), [-1, 0, 0])
    expectVectorCloseTo(positionToNVector([-90, 0]), [0, -1, 0])
    expectVectorCloseTo(positionToNVector([0, -90]), [0, 0, -1])
  })
  it('always produces a unit vector', () => {
    for (const p of [[0, 0], [12, 45], [-73, -40], [179, 89], [-180, -89.9]]) {
      expect(getNVectorNorm(positionToNVector(p))).toBeCloseTo(1, 12)
    }
  })
  it('ignores altitude (2D contract)', () => {
    expect(positionToNVector([12, 45, 999])).toEqual(positionToNVector([12, 45]))
    expect(getNVectorNorm(positionToNVector([12, 45, 8848]))).toBeCloseTo(1, 12)
  })
})

describe('nVectorToPosition', () => {
  it('maps the canonical basis back to cardinal positions', () => {
    expect(nVectorToPosition([1, 0, 0])).toEqual([0, 0])
    expectVectorCloseTo([...nVectorToPosition([0, 1, 0]), 0], [90, 0, 0])
    expect(nVectorToPosition([0, 0, 1])[1]).toBeCloseTo(90, 10)
    expect(nVectorToPosition([0, 0, -1])[1]).toBeCloseTo(-90, 10)
  })
  it('is the inverse of positionToNVector', () => {
    for (const p of [[0, 0], [12, 45], [-73, -40], [179, 89], [-45.5, 12.25]]) {
      const round = nVectorToPosition(positionToNVector(p))
      expect(round[0]).toBeCloseTo(p[0], 9)
      expect(round[1]).toBeCloseTo(p[1], 9)
    }
  })
  it('always returns a 2D position, dropping altitude across the round trip', () => {
    expect(nVectorToPosition(positionToNVector([12, 45, 999]))).toHaveLength(2)
  })
})

describe('dotNVectors', () => {
  it('is zero for orthogonal vectors and one for equal unit vectors', () => {
    expect(dotNVectors([1, 0, 0], [0, 1, 0])).toBe(0)
    expect(dotNVectors([1, 0, 0], [1, 0, 0])).toBe(1)
  })
  it('is commutative', () => {
    expect(dotNVectors([1, 2, 3], [-4, 5, 6])).toBe(dotNVectors([-4, 5, 6], [1, 2, 3]))
  })
})

describe('crossNVectors', () => {
  it('follows the right-hand rule on the canonical basis', () => {
    expect(crossNVectors([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    expect(crossNVectors([0, 1, 0], [0, 0, 1])).toEqual([1, 0, 0])
    expect(crossNVectors([0, 0, 1], [1, 0, 0])).toEqual([0, 1, 0])
  })
  it('is antisymmetric', () => {
    const ab = crossNVectors([1, 2, 3], [-4, 5, 6])
    const ba = crossNVectors([-4, 5, 6], [1, 2, 3])
    expect(ab).toEqual(ba.map((c) => -c))
  })
  it('returns the zero vector for parallel inputs', () => {
    expect(crossNVectors([1, 2, 3], [2, 4, 6])).toEqual([0, 0, 0])
  })
})

describe('addNVectors', () => {
  it('adds component-wise', () => {
    expect(addNVectors([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
  })
})

describe('scaleNVector', () => {
  it('scales component-wise', () => {
    expect(scaleNVector([1, 2, 3], 2)).toEqual([2, 4, 6])
    expect(scaleNVector([1, 2, 3], -1)).toEqual([-1, -2, -3])
  })
})

describe('getNVectorNorm', () => {
  it('measures Euclidean length', () => {
    expect(getNVectorNorm([3, 4, 0])).toBe(5)
    expect(getNVectorNorm([0, 0, 0])).toBe(0)
  })
})

describe('normalizeNVector', () => {
  it('returns a unit vector in the same direction', () => {
    const n = normalizeNVector([3, 4, 0])
    expect(getNVectorNorm(n)).toBeCloseTo(1, 12)
    expectVectorCloseTo(n, [0.6, 0.8, 0])
  })
})

describe('angleBetweenNVectors', () => {
  it('returns pi/2 between orthogonal directions', () => {
    const a = positionToNVector([0, 0])
    const b = positionToNVector([90, 0])
    const pole = positionToNVector([0, 90])
    expect(angleBetweenNVectors(a, b)).toBeCloseTo(Math.PI / 2, 12)
    expect(angleBetweenNVectors(a, pole)).toBeCloseTo(Math.PI / 2, 12)
  })
  it('returns 0 between a direction and itself', () => {
    const v = positionToNVector([12, 45])
    expect(angleBetweenNVectors(v, v)).toBeCloseTo(0, 12)
  })
  it('returns pi between antipodal directions', () => {
    const a = positionToNVector([0, 0])
    const b = positionToNVector([180, 0])
    expect(angleBetweenNVectors(a, b)).toBeCloseTo(Math.PI, 12)
  })
  it('is symmetric', () => {
    const a = positionToNVector([10, 20])
    const b = positionToNVector([-30, 40])
    expect(angleBetweenNVectors(a, b)).toBeCloseTo(angleBetweenNVectors(b, a), 12)
  })
})

describe('local frame (north/east/south/west)', () => {
  it('at the equator, north points to the pole and east along +y', () => {
    const origin = positionToNVector([0, 0]) // [1, 0, 0]
    expectVectorCloseTo(northNVector(origin), [0, 0, 1])
    expectVectorCloseTo(eastNVector(origin), [0, 1, 0])
  })
  it('south and west are the negatives of north and east', () => {
    const origin = positionToNVector([25, 40])
    expectVectorCloseTo(southNVector(origin), scaleNVector(northNVector(origin), -1))
    expectVectorCloseTo(westNVector(origin), scaleNVector(eastNVector(origin), -1))
  })
  it('north and east are unit vectors orthogonal to the origin', () => {
    const origin = positionToNVector([25, 40])
    expect(getNVectorNorm(northNVector(origin))).toBeCloseTo(1, 10)
    expect(getNVectorNorm(eastNVector(origin))).toBeCloseTo(1, 10)
    expect(dotNVectors(northNVector(origin), origin)).toBeCloseTo(0, 10)
    expect(dotNVectors(eastNVector(origin), origin)).toBeCloseTo(0, 10)
  })
  it('north and east are orthogonal to each other', () => {
    const origin = positionToNVector([25, 40])
    expect(dotNVectors(northNVector(origin), eastNVector(origin))).toBeCloseTo(0, 10)
  })
})

describe('bearingNVector', () => {
  it('bearing 0 points north, bearing pi/2 points east', () => {
    const origin = positionToNVector([0, 0])
    expectVectorCloseTo(bearingNVector(origin, 0), northNVector(origin))
    expectVectorCloseTo(bearingNVector(origin, Math.PI / 2), eastNVector(origin))
  })
  it('bearing pi points south, bearing 3pi/2 points west', () => {
    const origin = positionToNVector([0, 0])
    expectVectorCloseTo(bearingNVector(origin, Math.PI), southNVector(origin))
    expectVectorCloseTo(bearingNVector(origin, 3 * Math.PI / 2), westNVector(origin))
  })
  it('returns a unit vector orthogonal to the origin', () => {
    const origin = positionToNVector([25, 40])
    const dir = bearingNVector(origin, Math.PI / 3)
    expect(getNVectorNorm(dir)).toBeCloseTo(1, 10)
    expect(dotNVectors(dir, origin)).toBeCloseTo(0, 10)
  })
})

describe('destinationNVector', () => {
  it('returns the origin for a zero angular distance', () => {
    const origin = positionToNVector([12, 45])
    expectVectorCloseTo(destinationNVector(origin, Math.PI / 4, 0), origin)
  })
  it('moving north increases latitude', () => {
    const start = positionToNVector([0, 0])
    const dest = destinationNVector(start, 0, 0.1) // 0.1 rad north
    const [lon, lat] = nVectorToPosition(dest)
    expect(lat).toBeGreaterThan(0)
    expect(lon).toBeCloseTo(0, 9)
  })
  it('moving east along the equator increases longitude, stays on the equator', () => {
    const start = positionToNVector([0, 0])
    const dest = destinationNVector(start, Math.PI / 2, 0.1)
    const [lon, lat] = nVectorToPosition(dest)
    expect(lon).toBeGreaterThan(0)
    expect(lat).toBeCloseTo(0, 9)
  })
  it('the angular distance travelled matches the requested one', () => {
    const start = positionToNVector([10, 20])
    const dest = destinationNVector(start, Math.PI / 5, 0.3)
    expect(angleBetweenNVectors(start, dest)).toBeCloseTo(0.3, 10)
  })
  it('produces a unit vector', () => {
    const start = positionToNVector([10, 20])
    const dest = destinationNVector(start, 1.2, 0.5)
    expect(getNVectorNorm(dest)).toBeCloseTo(1, 10)
  })
})

describe('crossNVectorArcs', () => {
  it('detects two arcs that properly cross', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(true)
  })
  it('returns false for disjoint arcs on the same great circle', () => {
    const [a1, a2] = edge([0, 0], [10, 0])
    const [b1, b2] = edge([20, 0], [30, 0])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('returns false for arcs that stay clearly apart', () => {
    const [a1, a2] = edge([-10, 5], [10, 5])
    const [b1, b2] = edge([-10, -5], [10, -5])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('is order-independent in the pair of edges', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(crossNVectorArcs(b1, b2, a1, a2))
  })
  it('returns false when arcs only touch at a shared vertex', () => {
    const shared = [5, 5]
    const [a1, a2] = edge([0, 0], shared)
    const [b1, b2] = edge(shared, [10, 0])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('returns false for a degenerate arc (coincident endpoints)', () => {
    const [a1, a2] = edge([5, 5], [5, 5])
    const [b1, b2] = edge([0, 0], [10, 10])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('detects a crossing on short edges, where the tolerance must scale', () => {
    const [a1, a2] = edge([0, 0], [0.0001, 0])
    const [b1, b2] = edge([0.00005, -0.0001], [0.00005, 0.0001])
    expect(crossNVectorArcs(a1, a2, b1, b2)).toBe(true)
  })
  it('accepts an explicit tolerance wide enough to reject everything', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(crossNVectorArcs(a1, a2, b1, b2, 1)).toBe(false)
  })
})
