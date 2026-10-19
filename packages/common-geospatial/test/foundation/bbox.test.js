import {
  reprojectPosition,
  isValidBBox,
  is3DBBox,
  mergeBBox,
  computeBBox,
  truncateBBox,
  reprojectBBox,
  WGS84
} from '../../src/foundation/index.js'

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

describe('reprojectBBox', () => {
  const lambert = [100000, 6100000, 1300000, 7100000]
  it('should preserve a 2D bbox for identical projections', () => {
    const bbox = [2, 48, 3, 49]
    expect(reprojectBBox(bbox, 'EPSG:4326', 'EPSG:4326'))
      .toEqual(bbox)
  })
  it('should preserve a 3D bbox for identical projections', () => {
    const bbox = [2, 48, 100, 3, 49, 500]
    expect(reprojectBBox(bbox, 'EPSG:4326', 'EPSG:4326'))
      .toEqual(bbox)
  })
  it('should default to WGS84 when target is omitted', () => {
    const result = reprojectBBox(
      [222638.98159, 6106854.83489, 333958.47238, 6274861.39401],
      'EPSG:3857'
    )
    expect(result).toHaveLength(4)
    expect(result[0]).toBeCloseTo(2, 6)
    expect(result[1]).toBeCloseTo(48, 6)
    expect(result[2]).toBeCloseTo(3, 6)
    expect(result[3]).toBeCloseTo(49, 6)
  })
  it('should default to WGS84 for a 3D bbox', () => {
    const result = reprojectBBox(
      [222638.98159, 6106854.83489, 100, 333958.47238, 6274861.39401, 500],
      'EPSG:3857'
    )
    expect(result).toHaveLength(6)
    expect(result[0]).toBeCloseTo(2, 6)
    expect(result[1]).toBeCloseTo(48, 6)
    expect(result[2]).toBe(100)
    expect(result[3]).toBeCloseTo(3, 6)
    expect(result[4]).toBeCloseTo(49, 6)
    expect(result[5]).toBe(500)
  })
  it('should preserve a bbox when source matches the default target', () => {
    const bbox = [2, 48, 100, 3, 49, 500]
    const result = reprojectBBox(bbox, WGS84)
    expect(result).toEqual(bbox)
    expect(result).not.toBe(bbox)
  })
  it('should reproject a 2D bbox', () => {
    const result = reprojectBBox(
      [2, 48, 3, 49],
      'EPSG:4326',
      'EPSG:3857'
    )
    expect(result[0]).toBeCloseTo(222638.98, 2)
    expect(result[1]).toBeCloseTo(6106854.83, 2)
    expect(result[2]).toBeCloseTo(333958.47, 2)
    expect(result[3]).toBeCloseTo(6274861.39, 2)
  })
  it('should reproject a 3D bbox', () => {
    const result = reprojectBBox(
      [2, 48, 100, 3, 49, 500],
      'EPSG:4326',
      'EPSG:3857'
    )
    expect(result).toHaveLength(6)
    expect(result[0]).toBeCloseTo(222638.98, 2)
    expect(result[1]).toBeCloseTo(6106854.83, 2)
    expect(result[2]).toBe(100)
    expect(result[3]).toBeCloseTo(333958.47, 2)
    expect(result[4]).toBeCloseTo(6274861.39, 2)
    expect(result[5]).toBe(500)
  })
  it('should reject an invalid bbox', () => {
    expect(() => reprojectBBox(
      [0, 0, 0],
      'EPSG:4326',
      'EPSG:3857'
    )).toThrow()
  })
  it('should reject an unknown projection', () => {
    expect(() => reprojectBBox(
      [2, 48, 3, 49],
      'EPSG:999999',
      'EPSG:3857'
    )).toThrow()
  })
  it('should not mutate the input bbox', () => {
    const bbox = Object.freeze([2, 48, 100, 3, 49, 500])
    reprojectBBox(bbox, 'EPSG:4326', 'EPSG:3857')
    expect(bbox).toEqual([2, 48, 100, 3, 49, 500])
  })
  // A wide Lambert-93 box: its parallels are arcs, so the northernmost point
  // lies in the middle of the top edge, north of both top corners.
  it('returns a copy when source and target are the same', () => {
    const bbox = [-5, 42, 8, 51]
    const result = reprojectBBox(bbox, 'EPSG:4326', 'EPSG:4326')
    expect(result).toEqual(bbox)
    expect(result).not.toBe(bbox)
  })
  it('finds extrema along the edges, not only at the corners', () => {
    const [, cornerNorth] = reprojectPosition([lambert[2], lambert[3]], 'EPSG:2154', 'EPSG:4326')
    const [, edgeNorth] = reprojectPosition([(lambert[0] + lambert[2]) / 2, lambert[3]], 'EPSG:2154', 'EPSG:4326')
    expect(edgeNorth).toBeGreaterThan(cornerNorth + 0.1)
    const [west, south, east, north] = reprojectBBox(lambert, 'EPSG:2154')
    expect(north).toBeCloseTo(edgeNorth, 6)
    expect(west).toBeLessThan(east)
    expect(south).toBeLessThan(north)
  })
  it('still contains every corner', () => {
    const [west, south, east, north] = reprojectBBox(lambert, 'EPSG:2154')
    for (const corner of [[lambert[0], lambert[1]], [lambert[0], lambert[3]], [lambert[2], lambert[1]], [lambert[2], lambert[3]]]) {
      const [x, y] = reprojectPosition(corner, 'EPSG:2154', 'EPSG:4326')
      expect(x).toBeGreaterThanOrEqual(west)
      expect(x).toBeLessThanOrEqual(east)
      expect(y).toBeGreaterThanOrEqual(south)
      expect(y).toBeLessThanOrEqual(north)
    }
  })
  it('keeps the vertical bounds of a 3D box', () => {
    const result = reprojectBBox([lambert[0], lambert[1], -10, lambert[2], lambert[3], 100], 'EPSG:2154')
    expect(result).toHaveLength(6)
    expect(result[2]).toBe(-10)
    expect(result[5]).toBe(100)
    expect(result[4]).toBeCloseTo(reprojectBBox(lambert, 'EPSG:2154')[3], 9)
  })
  it('rejects invalid boxes and boxes crossing the antimeridian', () => {
    expect(() => reprojectBBox([0, 10, 1, 5], 'EPSG:2154')).toThrow()
    expect(() => reprojectBBox([170, -20, -170, 10], 'EPSG:4326', 'EPSG:3857')).toThrow('antimeridian')
  })
})
