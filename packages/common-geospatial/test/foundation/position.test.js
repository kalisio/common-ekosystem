import { MAX_COORDINATE_PRECISION } from '../../src/foundation/coordinate.js'
import {
  EARTH_RADIUS,
  parsePosition,
  isValidPosition,
  is3DPosition,
  isSamePosition,
  truncatePosition,
  reprojectPosition,
  destinationFromPosition,
  distanceBetweenPositions
} from '../../src/foundation/position.js'

// Hemisphere-suffixed decimal-degree literals.
// Adjust these four if parseCoordinate expects a different textual form
// (e.g. '2.35 E', 'E2.35', or a DMS notation).
const N = (d) => `${d}N`
const S = (d) => `${d}S`
const E = (d) => `${d}E`
const W = (d) => `${d}W`

describe('parsePosition', () => {
  describe('input guard', () => {
    it('throws on a non-string pattern', () => {
      expect(() => parsePosition(42)).toThrow(/pattern/)
      expect(() => parsePosition(null)).toThrow(/pattern/)
      expect(() => parsePosition(undefined)).toThrow(/pattern/)
      expect(() => parsePosition({})).toThrow(/pattern/)
      expect(() => parsePosition([])).toThrow(/pattern/)
    })
    it('throws on an empty string', () => {
      expect(() => parsePosition('')).toThrow(/pattern/)
    })
  })

  describe('separators and arity', () => {
    it('returns null when the pattern has a single field', () => {
      expect(parsePosition(N(48.85))).toBeNull()
    })
    it('returns null when the pattern has more than two fields', () => {
      expect(parsePosition('1,2,3')).toBeNull()
      expect(parsePosition(`${E(2.35)},${N(48.85)},${N(1)}`)).toBeNull()
    })
    it('splits on comma, semicolon and pipe', () => {
      const expected = [2.35, 48.85]
      expect(parsePosition(`${E(2.35)},${N(48.85)}`)).toEqual(expected)
      expect(parsePosition(`${E(2.35)};${N(48.85)}`)).toEqual(expected)
      expect(parsePosition(`${E(2.35)}|${N(48.85)}`)).toEqual(expected)
    })
    it('tolerates whitespace around fields', () => {
      // parsePosition itself does not trim; this asserts parseCoordinate does.
      expect(parsePosition(` ${E(2.35)} , ${N(48.85)} `)).toEqual([2.35, 48.85])
    })
  })

  describe('unparseable fields', () => {
    it('returns null when neither field parses', () => {
      expect(parsePosition('foo,bar')).toBeNull()
    })
    it('returns null when only one field parses', () => {
      expect(parsePosition(`nope,${N(48.85)}`)).toBeNull()
      expect(parsePosition(`${E(2.35)},nope`)).toBeNull()
    })
  })

  describe('both axes explicit', () => {
    it('keeps [lon, lat] when given in [lon, lat] order', () => {
      expect(parsePosition(`${E(2.35)},${N(48.85)}`)).toEqual([2.35, 48.85])
    })
    it('reorders to [lon, lat] when given in [lat, lon] order', () => {
      expect(parsePosition(`${N(48.85)},${E(2.35)}`)).toEqual([2.35, 48.85])
    })
  })

  describe('hemisphere signing', () => {
    it('negates a western longitude', () => {
      expect(parsePosition(`${W(2.35)},${N(48.85)}`)).toEqual([-2.35, 48.85])
    })
    it('negates a southern latitude', () => {
      expect(parsePosition(`${E(2.35)},${S(48.85)}`)).toEqual([2.35, -48.85])
    })
    it('negates both when west and south', () => {
      expect(parsePosition(`${W(2.35)},${S(48.85)}`)).toEqual([-2.35, -48.85])
    })
    it('applies signing regardless of field order', () => {
      expect(parsePosition(`${S(48.85)},${W(2.35)}`)).toEqual([-2.35, -48.85])
    })
  })

  describe('one axis explicit, one inferred', () => {
    it('keeps order when the first field is an explicit longitude', () => {
      expect(parsePosition(`${E(2.35)},48.85`)).toEqual([2.35, 48.85])
    })
    it('swaps when the first field is an explicit latitude', () => {
      expect(parsePosition(`${N(48.85)},2.35`)).toEqual([2.35, 48.85])
    })
    it('keeps [lon, lat] when the second field is an explicit longitude', () => {
      expect(parsePosition(`48.85,${E(2.35)}`)).toEqual([2.35, 48.85])
    })
    it('keeps order when the second field is an explicit latitude', () => {
      expect(parsePosition(`2.35,${N(48.85)}`)).toEqual([2.35, 48.85])
    })
    it('carries the sign of the explicit field through inference', () => {
      expect(parsePosition(`${W(2.35)},48.85`)).toEqual([-2.35, 48.85])
    })
  })

  describe('magnitude-based longitude inference', () => {
    // Depends on guessCoordinateAxis treating |value| > 90 as longitude and
    // leaving a sub-90 magnitude ambiguous. If that heuristic differs, these
    // inputs fall through to the ambiguous-pair branch instead.
    it('treats an out-of-latitude-range first field as longitude', () => {
      expect(parsePosition('120.5,45.2')).toEqual([120.5, 45.2])
    })
    it('treats an out-of-latitude-range second field as longitude', () => {
      expect(parsePosition('45.2,120.5')).toEqual([120.5, 45.2])
    })
  })

  describe('fully ambiguous input', () => {
    it('returns both candidate orderings when neither axis can be determined', () => {
      expect(parsePosition('2.35,48.85')).toEqual([
        [2.35, 48.85],
        [48.85, 2.35]
      ])
    })
  })

  describe('contradictory axes', () => {
    // Two fields resolving to the SAME axis cannot form a position and are
    // rejected like any other invalid input: null, not a partial result.
    it('returns null for two explicit longitudes', () => {
      expect(parsePosition(`${E(2.35)},${E(3.40)}`)).toBeNull()
    })
    it('returns null for two explicit latitudes', () => {
      expect(parsePosition(`${N(45)},${N(46)}`)).toBeNull()
    })
    it('returns null for two magnitude-inferred longitudes', () => {
      expect(parsePosition('120,130')).toBeNull()
    })
  })
})

describe('isValidPosition', () => {
  it('should accept valid 2D and 3D positions', () => {
    expect(isValidPosition([2, 48])).toBe(true)
    expect(isValidPosition([2, 48, 100])).toBe(true)
    expect(isValidPosition([0, 0, 0])).toBe(true)
    expect(isValidPosition([-2, -48, -100])).toBe(true)
  })
  it('should accept projected coordinates', () => {
    expect(isValidPosition([700000, 6600000])).toBe(true)
  })
  it.each([
    null,
    undefined,
    '2,48',
    [],
    [2],
    [2, 48, 100, 200],
    [2, '48'],
    [2, null],
    [2, 48, '100']
  ])('should reject an invalid position: %j', (position) => {
    expect(isValidPosition(position)).toBe(false)
  })
})

describe('is3DPosition', () => {
  it('should distinguish 2D and 3D positions', () => {
    expect(is3DPosition([2, 48])).toBe(false)
    expect(is3DPosition([2, 48, 100])).toBe(true)
    expect(is3DPosition([2, 48, 0])).toBe(true)
  })
  it('should reject invalid positions', () => {
    expect(() => is3DPosition([2])).toThrow()
    expect(() => is3DPosition(null)).toThrow()
  })
})

describe('isSamePosition', () => {
  it('should recognize identical positions', () => {
    expect(isSamePosition([2, 48], [2, 48])).toBe(true)
    expect(isSamePosition([2, 48, 100], [2, 48, 100])).toBe(true)
  })
  it('should ignore Z by default', () => {
    expect(isSamePosition([2, 48, 100], [2, 48, 500])).toBe(true)
  })
  it('should compare Z when requested', () => {
    expect(isSamePosition([2, 48, 100], [2, 48, 500], { consider3D: true })).toBe(false)
    expect(isSamePosition([2, 48, 100], [2, 48, 100], { consider3D: true })).toBe(true)
  })
  it('should treat missing Z as zero', () => {
    expect(isSamePosition([2, 48], [2, 48, 0], { consider3D: true })).toBe(true)
    expect(isSamePosition([2, 48], [2, 48, 100], { consider3D: true })).toBe(false)
  })
  it('should compare positions using the requested precision', () => {
    const p1 = [2.12341, 48]
    const p2 = [2.12349, 48]
    expect(isSamePosition(p1, p2, { precision: 3 })).toBe(true)
    expect(isSamePosition(p1, p2, { precision: 4 })).toBe(false)
  })
  it('should reject invalid positions', () => {
    expect(() => isSamePosition(null, [2, 48])).toThrow()
    expect(() => isSamePosition([2, 48], null)).toThrow()
  })
  it('should reject an invalid consider3D option', () => {
    expect(() => isSamePosition([2, 48], [2, 48], { consider3D: 'yes' })).toThrow()
  })
  it('should reject a negative precision', () => {
    expect(() => isSamePosition([2, 48], [2, 48], { precision: -1 })).toThrow()
  })
  it('should reject a non-integer precision', () => {
    expect(() => isSamePosition([2, 48], [2, 48], { precision: 1.5 })).toThrow()
  })
  it('should reject a precision exceeding the maximum', () => {
    expect(() => isSamePosition([2, 48], [2, 48], { precision: MAX_COORDINATE_PRECISION + 1 })).toThrow()
  })
  it('should accept boundary precision values', () => {
    expect(isSamePosition([2, 48], [2, 48], { precision: 0 })).toBe(true)
    expect(isSamePosition([2, 48], [2, 48], { precision: MAX_COORDINATE_PRECISION })).toBe(true)
  })
})

describe('truncatePosition', () => {
  it('should truncate a 2D position', () => {
    const position = [2.123456, 48.987654]
    expect(truncatePosition(position, 2)).toEqual([2.12, 48.99])
  })
  it('should truncate a 3D position', () => {
    const position = [2.123456, 48.987654, 100.56789]
    expect(truncatePosition(position, 2)).toEqual([2.12, 48.99, 100.57])
  })
  it('should mutate and return the original position', () => {
    const position = [2.123456, 48.987654]
    const result = truncatePosition(position, 2)
    expect(result).toBe(position)
    expect(position).toEqual([2.12, 48.99])
  })
  it('should reject invalid arguments', () => {
    expect(() => truncatePosition(null)).toThrow()
    expect(() => truncatePosition([2, 48], -1)).toThrow()
    expect(() => truncatePosition([2, 48], MAX_COORDINATE_PRECISION + 1)).toThrow()
  })
})

describe('reprojectPosition', () => {
  it('should preserve a 2D position for identical projections', () => {
    const position = [2, 48]
    const result = reprojectPosition(position, 'EPSG:4326', 'EPSG:4326')
    expect(result).toEqual(position)
    expect(result).not.toBe(position)
  })
  it('should preserve a 3D position for identical projections', () => {
    const position = [2, 48, 100]
    const result = reprojectPosition(position, 'EPSG:4326', 'EPSG:4326')
    expect(result).toEqual(position)
    expect(result).not.toBe(position)
  })
  it('should reproject from WGS84 to Web Mercator', () => {
    const result = reprojectPosition([2, 48], 'EPSG:4326', 'EPSG:3857')
    expect(result).toHaveLength(2)
    expect(result[0]).toBeCloseTo(222638.98159, 2)
    expect(result[1]).toBeCloseTo(6106854.83489, 2)
  })
  it('should reproject from Web Mercator to WGS84', () => {
    const result = reprojectPosition([222638.98159, 6106854.83489], 'EPSG:3857', 'EPSG:4326')
    expect(result[0]).toBeCloseTo(2, 6)
    expect(result[1]).toBeCloseTo(48, 6)
  })
  it('should reproject a 3D position', () => {
    const result = reprojectPosition([2, 48, 150], 'EPSG:4326', 'EPSG:3857')
    expect(result).toHaveLength(3)
    expect(result[0]).toBeCloseTo(222638.98159, 2)
    expect(result[1]).toBeCloseTo(6106854.83489, 2)
    expect(result[2]).toBe(150)
  })
  it('should preserve a negative altitude for a horizontal projection', () => {
    const result = reprojectPosition([2, 48, -100], 'EPSG:4326', 'EPSG:3857')
    expect(result[2]).toBe(-100)
  })
  it('should not mutate the input position', () => {
    const position = [2, 48, 100]
    const original = [...position]
    const result = reprojectPosition(position, 'EPSG:4326', 'EPSG:3857')
    expect(position).toEqual(original)
    expect(result).not.toBe(position)
  })
  it('should reject an invalid position', () => {
    expect(() => reprojectPosition([2], 'EPSG:4326', 'EPSG:3857')).toThrow()
  })
  it('should reject an unknown source projection', () => {
    expect(() => reprojectPosition([2, 48], 'EPSG:999999', 'EPSG:4326')).toThrow(/unknown source projection/)
  })
  it('should reject an unknown target projection', () => {
    expect(() => reprojectPosition([2, 48], 'EPSG:4326', 'EPSG:999999')).toThrow(/unknown target projection/)
  })
  it('should validate projections even when identical', () => {
    expect(() => reprojectPosition([2, 48], 'EPSG:999999', 'EPSG:999999')).toThrow()
  })
})

describe('distanceBetweenPositions', () => {
  it('should return zero for identical positions', () => {
    expect(distanceBetweenPositions([2, 48], [2, 48])).toBeCloseTo(0, 6)
  })
  it('should compute the distance between two positions', () => {
    const result = distanceBetweenPositions([0, 0], [1, 0])
    expect(result).toBeCloseTo(EARTH_RADIUS * Math.PI / 180, 3)
  })
  it('should be symmetric', () => {
    const p1 = [2, 48]
    const p2 = [3, 49]
    expect(distanceBetweenPositions(p1, p2)).toBeCloseTo(distanceBetweenPositions(p2, p1), 6)
  })
  it('should reject invalid positions', () => {
    expect(() => distanceBetweenPositions(null, [2, 48])).toThrow()
    expect(() => distanceBetweenPositions([2, 48], null)).toThrow()
  })
})

describe('destinationFromPosition', () => {
  it('should return the starting position for a zero distance', () => {
    const result = destinationFromPosition([2, 48], 90, 0)
    expect(result[0]).toBeCloseTo(2, 6)
    expect(result[1]).toBeCloseTo(48, 6)
  })
  it('should compute a destination towards the east', () => {
    const distance = EARTH_RADIUS * Math.PI / 180
    const result = destinationFromPosition([0, 0], 90, distance)
    expect(result[0]).toBeCloseTo(1, 6)
    expect(result[1]).toBeCloseTo(0, 6)
  })
  it('should compute a destination towards the north', () => {
    const distance = EARTH_RADIUS * Math.PI / 180
    const result = destinationFromPosition([0, 0], 0, distance)
    expect(result[0]).toBeCloseTo(0, 6)
    expect(result[1]).toBeCloseTo(1, 6)
  })
  it('should produce a destination at the requested distance', () => {
    const start = [2, 48]
    const distance = 10000
    const destination = destinationFromPosition(start, 45, distance)
    expect(distanceBetweenPositions(start, destination)).toBeCloseTo(distance, 3)
  })
  it('should reject invalid arguments', () => {
    expect(() => destinationFromPosition(null, 90, 1000)).toThrow()
    expect(() => destinationFromPosition([2, 48], 'east', 1000)).toThrow()
    expect(() => destinationFromPosition([2, 48], 90, '1000')).toThrow()
  })
})
