import { nvector } from '../../src/utilities/index.js'

function expectVectorCloseTo (actual, expected, precision = 10) {
  expect(actual).toHaveLength(3)
  for (let i = 0; i < 3; i++) expect(actual[i]).toBeCloseTo(expected[i], precision)
}

// Build a spherical edge (pair of unit vectors) from two lon/lat positions.
function edge (p1, p2) {
  return [nvector.fromPosition(p1), nvector.fromPosition(p2)]
}

describe('fromPosition', () => {
  it('maps cardinal positions to the canonical basis', () => {
    expectVectorCloseTo(nvector.fromPosition([0, 0]), [1, 0, 0])
    expectVectorCloseTo(nvector.fromPosition([90, 0]), [0, 1, 0])
    expectVectorCloseTo(nvector.fromPosition([0, 90]), [0, 0, 1])
    expectVectorCloseTo(nvector.fromPosition([180, 0]), [-1, 0, 0])
    expectVectorCloseTo(nvector.fromPosition([-90, 0]), [0, -1, 0])
    expectVectorCloseTo(nvector.fromPosition([0, -90]), [0, 0, -1])
  })
  it('always produces a unit vector', () => {
    for (const p of [[0, 0], [12, 45], [-73, -40], [179, 89], [-180, -89.9]]) {
      expect(nvector.norm(nvector.fromPosition(p))).toBeCloseTo(1, 12)
    }
  })
  it('ignores altitude (2D contract)', () => {
    expect(nvector.fromPosition([12, 45, 999])).toEqual(nvector.fromPosition([12, 45]))
    expect(nvector.norm(nvector.fromPosition([12, 45, 8848]))).toBeCloseTo(1, 12)
  })
})

describe('toPosition', () => {
  it('maps the canonical basis back to cardinal positions', () => {
    expect(nvector.toPosition([1, 0, 0])).toEqual([0, 0])
    expectVectorCloseTo([...nvector.toPosition([0, 1, 0]), 0], [90, 0, 0])
    expect(nvector.toPosition([0, 0, 1])[1]).toBeCloseTo(90, 10)
    expect(nvector.toPosition([0, 0, -1])[1]).toBeCloseTo(-90, 10)
  })
  it('is the inverse of fromPosition', () => {
    for (const p of [[0, 0], [12, 45], [-73, -40], [179, 89], [-45.5, 12.25]]) {
      const round = nvector.toPosition(nvector.fromPosition(p))
      expect(round[0]).toBeCloseTo(p[0], 9)
      expect(round[1]).toBeCloseTo(p[1], 9)
    }
  })
  it('always returns a 2D position, dropping altitude across the round trip', () => {
    expect(nvector.toPosition(nvector.fromPosition([12, 45, 999]))).toHaveLength(2)
  })
})

describe('dot', () => {
  it('is zero for orthogonal vectors and one for equal unit vectors', () => {
    expect(nvector.dot([1, 0, 0], [0, 1, 0])).toBe(0)
    expect(nvector.dot([1, 0, 0], [1, 0, 0])).toBe(1)
  })
  it('is commutative', () => {
    expect(nvector.dot([1, 2, 3], [-4, 5, 6])).toBe(nvector.dot([-4, 5, 6], [1, 2, 3]))
  })
})

describe('cross', () => {
  it('follows the right-hand rule on the canonical basis', () => {
    expect(nvector.cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    expect(nvector.cross([0, 1, 0], [0, 0, 1])).toEqual([1, 0, 0])
    expect(nvector.cross([0, 0, 1], [1, 0, 0])).toEqual([0, 1, 0])
  })
  it('is antisymmetric', () => {
    const ab = nvector.cross([1, 2, 3], [-4, 5, 6])
    const ba = nvector.cross([-4, 5, 6], [1, 2, 3])
    expect(ab).toEqual(ba.map(c => -c))
  })
  it('returns the zero vector for parallel inputs', () => {
    expect(nvector.cross([1, 2, 3], [2, 4, 6])).toEqual([0, 0, 0])
  })
})

describe('add', () => {
  it('adds component-wise', () => {
    expect(nvector.add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
  })
})

describe('scale', () => {
  it('scales component-wise', () => {
    expect(nvector.scale([1, 2, 3], 2)).toEqual([2, 4, 6])
    expect(nvector.scale([1, 2, 3], -1)).toEqual([-1, -2, -3])
  })
})

describe('norm', () => {
  it('measures Euclidean length', () => {
    expect(nvector.norm([3, 4, 0])).toBe(5)
    expect(nvector.norm([0, 0, 0])).toBe(0)
  })
})

describe('normalize', () => {
  it('returns a unit vector in the same direction', () => {
    const n = nvector.normalize([3, 4, 0])
    expect(nvector.norm(n)).toBeCloseTo(1, 12)
    expectVectorCloseTo(n, [0.6, 0.8, 0])
  })
})

describe('angleBetween', () => {
  it('returns pi/2 between orthogonal directions', () => {
    const a = nvector.fromPosition([0, 0])
    const b = nvector.fromPosition([90, 0])
    const pole = nvector.fromPosition([0, 90])
    expect(nvector.angleBetween(a, b)).toBeCloseTo(Math.PI / 2, 12)
    expect(nvector.angleBetween(a, pole)).toBeCloseTo(Math.PI / 2, 12)
  })
  it('returns 0 between a direction and itself', () => {
    const v = nvector.fromPosition([12, 45])
    expect(nvector.angleBetween(v, v)).toBeCloseTo(0, 12)
  })
  it('returns pi between antipodal directions', () => {
    const a = nvector.fromPosition([0, 0])
    const b = nvector.fromPosition([180, 0])
    expect(nvector.angleBetween(a, b)).toBeCloseTo(Math.PI, 12)
  })
  it('is symmetric', () => {
    const a = nvector.fromPosition([10, 20])
    const b = nvector.fromPosition([-30, 40])
    expect(nvector.angleBetween(a, b)).toBeCloseTo(nvector.angleBetween(b, a), 12)
  })
})

describe('local frame (north/east/south/west)', () => {
  it('at the equator, north points to the pole and east along +y', () => {
    const origin = nvector.fromPosition([0, 0]) // [1, 0, 0]
    expectVectorCloseTo(nvector.north(origin), [0, 0, 1])
    expectVectorCloseTo(nvector.east(origin), [0, 1, 0])
  })
  it('south and west are the negatives of north and east', () => {
    const origin = nvector.fromPosition([25, 40])
    expectVectorCloseTo(nvector.south(origin), nvector.scale(nvector.north(origin), -1))
    expectVectorCloseTo(nvector.west(origin), nvector.scale(nvector.east(origin), -1))
  })
  it('north and east are unit vectors orthogonal to the origin', () => {
    const origin = nvector.fromPosition([25, 40])
    expect(nvector.norm(nvector.north(origin))).toBeCloseTo(1, 10)
    expect(nvector.norm(nvector.east(origin))).toBeCloseTo(1, 10)
    expect(nvector.dot(nvector.north(origin), origin)).toBeCloseTo(0, 10)
    expect(nvector.dot(nvector.east(origin), origin)).toBeCloseTo(0, 10)
  })
  it('north and east are orthogonal to each other', () => {
    const origin = nvector.fromPosition([25, 40])
    expect(nvector.dot(nvector.north(origin), nvector.east(origin))).toBeCloseTo(0, 10)
  })
})

describe('bearing', () => {
  it('bearing 0 points north, bearing pi/2 points east', () => {
    const origin = nvector.fromPosition([0, 0])
    expectVectorCloseTo(nvector.bearing(origin, 0), nvector.north(origin))
    expectVectorCloseTo(nvector.bearing(origin, Math.PI / 2), nvector.east(origin))
  })
  it('bearing pi points south, bearing 3pi/2 points west', () => {
    const origin = nvector.fromPosition([0, 0])
    expectVectorCloseTo(nvector.bearing(origin, Math.PI), nvector.south(origin))
    expectVectorCloseTo(nvector.bearing(origin, 3 * Math.PI / 2), nvector.west(origin))
  })
  it('returns a unit vector orthogonal to the origin', () => {
    const origin = nvector.fromPosition([25, 40])
    const dir = nvector.bearing(origin, Math.PI / 3)
    expect(nvector.norm(dir)).toBeCloseTo(1, 10)
    expect(nvector.dot(dir, origin)).toBeCloseTo(0, 10)
  })
})

describe('destination', () => {
  it('returns the origin for a zero angular distance', () => {
    const origin = nvector.fromPosition([12, 45])
    expectVectorCloseTo(nvector.destination(origin, Math.PI / 4, 0), origin)
  })
  it('moving north increases latitude', () => {
    const start = nvector.fromPosition([0, 0])
    const dest = nvector.destination(start, 0, 0.1) // 0.1 rad north
    const [lon, lat] = nvector.toPosition(dest)
    expect(lat).toBeGreaterThan(0)
    expect(lon).toBeCloseTo(0, 9)
  })
  it('moving east along the equator increases longitude, stays on the equator', () => {
    const start = nvector.fromPosition([0, 0])
    const dest = nvector.destination(start, Math.PI / 2, 0.1)
    const [lon, lat] = nvector.toPosition(dest)
    expect(lon).toBeGreaterThan(0)
    expect(lat).toBeCloseTo(0, 9)
  })
  it('the angular distance travelled matches the requested one', () => {
    const start = nvector.fromPosition([10, 20])
    const dest = nvector.destination(start, Math.PI / 5, 0.3)
    expect(nvector.angleBetween(start, dest)).toBeCloseTo(0.3, 10)
  })
  it('produces a unit vector', () => {
    const start = nvector.fromPosition([10, 20])
    const dest = nvector.destination(start, 1.2, 0.5)
    expect(nvector.norm(dest)).toBeCloseTo(1, 10)
  })
})

describe('crossArcs', () => {
  it('detects two arcs that properly cross', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(true)
  })
  it('returns false for disjoint arcs on the same great circle', () => {
    const [a1, a2] = edge([0, 0], [10, 0])
    const [b1, b2] = edge([20, 0], [30, 0])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('returns false for arcs that stay clearly apart', () => {
    const [a1, a2] = edge([-10, 5], [10, 5])
    const [b1, b2] = edge([-10, -5], [10, -5])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('is order-independent in the pair of edges', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(nvector.crossArcs(b1, b2, a1, a2))
  })
  it('returns false when arcs only touch at a shared vertex', () => {
    const shared = [5, 5]
    const [a1, a2] = edge([0, 0], shared)
    const [b1, b2] = edge(shared, [10, 0])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('returns false for a degenerate arc (coincident endpoints)', () => {
    const [a1, a2] = edge([5, 5], [5, 5])
    const [b1, b2] = edge([0, 0], [10, 10])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(false)
  })
  it('detects a crossing on short edges, where the tolerance must scale', () => {
    const [a1, a2] = edge([0, 0], [0.0001, 0])
    const [b1, b2] = edge([0.00005, -0.0001], [0.00005, 0.0001])
    expect(nvector.crossArcs(a1, a2, b1, b2)).toBe(true)
  })
  it('accepts an explicit tolerance wide enough to reject everything', () => {
    const [a1, a2] = edge([-10, 0], [10, 0])
    const [b1, b2] = edge([0, -10], [0, 10])
    expect(nvector.crossArcs(a1, a2, b1, b2, 1)).toBe(false)
  })
})
