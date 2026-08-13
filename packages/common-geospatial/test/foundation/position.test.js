import { describe, it, expect } from 'vitest'
import {
  EARTH_RADIUS,
  parsePosition,
  isValidPosition,
  is3DPosition,
  isSamePosition,
  truncatePosition,
  reprojectPosition,
  distanceBetweenPositions,
  destinationFromPosition,
  DEFAULT_COORDINATE_PRECISION,
  MAX_COORDINATE_PRECISION
} from '../../src/foundation'

const ONE_DEGREE_M = (Math.PI / 180) * EARTH_RADIUS // ≈ 111194.93 m

describe('parsePosition — invalid input', () => {
  it('throws on null', () => {
    expect(() => parsePosition(null)).toThrow()
  })
  it('throws on undefined', () => {
    expect(() => parsePosition(undefined)).toThrow()
  })
  it('throws on empty string', () => {
    expect(() => parsePosition('')).toThrow()
  })
  it('throws on a number', () => {
    expect(() => parsePosition(42)).toThrow()
  })
})

describe('parsePosition — returns null on unparseable input', () => {
  it('returns null for a single value', () => {
    expect(parsePosition('48.8566')).toBeNull()
  })
  it('returns null for three values', () => {
    expect(parsePosition('48.8566,2.3522,100')).toBeNull()
  })
  it('returns null for non-numeric values', () => {
    expect(parsePosition('abc,def')).toBeNull()
  })
})

describe('parsePosition — separators', () => {
  it('parses with comma separator', () => {
    expect(parsePosition('2.3522E,48.8566N')).toEqual([2.3522, 48.8566])
  })
  it('parses with semicolon separator', () => {
    expect(parsePosition('2.3522E;48.8566N')).toEqual([2.3522, 48.8566])
  })
  it('parses with pipe separator', () => {
    expect(parsePosition('2.3522E|48.8566N')).toEqual([2.3522, 48.8566])
  })
})

describe('parsePosition — direction handling', () => {
  it('parses [lon, lat] with explicit directions', () => {
    expect(parsePosition('2.3522E,48.8566N')).toEqual([2.3522, 48.8566])
  })
  it('parses [lat, lon] and reorders to [lon, lat]', () => {
    expect(parsePosition('48.8566N,2.3522E')).toEqual([2.3522, 48.8566])
  })
  it('parses negative longitude (W)', () => {
    expect(parsePosition('73.9857W,40.7484N')).toEqual([-73.9857, 40.7484])
  })
  it('parses negative latitude (S)', () => {
    expect(parsePosition('18.4241E,33.9249S')).toEqual([18.4241, -33.9249])
  })
  it('parses both negative (W, S)', () => {
    expect(parsePosition('73.9857W,33.9249S')).toEqual([-73.9857, -33.9249])
  })
})

describe('parsePosition — ambiguous input', () => {
  it('returns two candidates when both values are ambiguous', () => {
    const result = parsePosition('48.8566,2.3522')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual([48.8566, 2.3522])
    expect(result).toContainEqual([2.3522, 48.8566])
  })
  it('returns a single result when one value is unambiguous (> 90)', () => {
    const result = parsePosition('2.3522,120.5')
    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(Array.isArray(result[0])).toBe(false)
  })
})

describe('isValidPosition', () => {
  it('returns true for a valid 2D position', () => {
    expect(isValidPosition([2.3522, 48.8566])).toBe(true)
  })

  it('returns true for a valid 3D position', () => {
    expect(isValidPosition([2.3522, 48.8566, 100])).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isValidPosition([])).toBe(false)
    expect(isValidPosition([2.3522])).toBe(false)
    expect(isValidPosition([2.3522, 48.8566, 100, 0])).toBe(false)
  })

  it('returns false for non-numbers', () => {
    expect(isValidPosition(['2.3522', 48.8566])).toBe(false)
    expect(isValidPosition([null, 48.8566])).toBe(false)
    expect(isValidPosition([2.3522, undefined])).toBe(false)
  })

  it('returns false for invalid altitude', () => {
    expect(isValidPosition([2.3522, 48.8566, NaN])).toBe(false)
    expect(isValidPosition([2.3522, 48.8566, '100'])).toBe(false)
  })

  it('returns false for non-array', () => {
    expect(isValidPosition(null)).toBe(false)
    expect(isValidPosition({})).toBe(false)
    expect(isValidPosition('2.3522,48.8566')).toBe(false)
  })
})

describe('is3DPosition', () => {
  it('returns true for a 3D position', () => {
    expect(is3DPosition([2.3522, 48.8566, 100])).toBe(true)
  })

  it('returns false for a 2D position', () => {
    expect(is3DPosition([2.3522, 48.8566])).toBe(false)
  })

  it('throws for wrong length', () => {
    expect(() => is3DPosition([])).toThrow()
    expect(() => is3DPosition([2.3522])).toThrow()
    expect(() => is3DPosition([2.3522, 48.8566, 100, 0])).toThrow()
  })

  it('throws for non-array', () => {
    expect(() => is3DPosition(null)).toThrow()
    expect(() => is3DPosition({})).toThrow()
  })
})

describe('isSamePosition', () => {
  it('throws for invalid positions', () => {
    expect(() => isSamePosition(null, [2.3522, 48.8566])).toThrow()
    expect(() => isSamePosition([2.3522, 48.8566], null)).toThrow()
  })

  it('throws for invalid options', () => {
    expect(() => isSamePosition([2.3522, 48.8566], [2.3522, 48.8566], { precision: 'bad' })).toThrow()
    expect(() => isSamePosition([2.3522, 48.8566], [2.3522, 48.8566], { consider3D: 'bad' })).toThrow()
  })

  it('returns true for two identical 2D positions', () => {
    expect(isSamePosition([2.3522, 48.8566], [2.3522, 48.8566])).toBe(true)
  })

  it('returns true for two identical 3D positions', () => {
    expect(isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 100], { consider3D: true })).toBe(true)
  })

  it('returns true for positions equal within default precision', () => {
    // differ at the 8th decimal, below the default precision of 7
    expect(isSamePosition([2.35220001, 48.8566], [2.3522, 48.8566])).toBe(true)
  })

  it('returns false for positions differing beyond default precision', () => {
    // differ at the 6th decimal, above the default precision of 7
    expect(isSamePosition([2.352201, 48.8566], [2.3522, 48.8566])).toBe(false)
  })

  it('ignores altitude by default (consider3D: false)', () => {
    expect(isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200])).toBe(true)
  })

  it('returns false when altitudes differ with consider3D: true', () => {
    expect(isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200], { consider3D: true })).toBe(false)
  })

  it('returns true when altitudes are equal with consider3D: true', () => {
    expect(isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 100], { consider3D: true })).toBe(true)
  })

  it('uses ?? 0 when one position has no altitude and consider3D: true', () => {
    expect(isSamePosition([2.3522, 48.8566], [2.3522, 48.8566, 0], { consider3D: true })).toBe(true)
    expect(isSamePosition([2.3522, 48.8566], [2.3522, 48.8566, 100], { consider3D: true })).toBe(false)
  })

  it('respects custom precision', () => {
    expect(isSamePosition([2.352, 48.856], [2.353, 48.857], { precision: 2 })).toBe(true)
    expect(isSamePosition([2.352, 48.856], [2.353, 48.857], { precision: 3 })).toBe(false)
  })
})

describe('truncatePosition', () => {
  it('truncates a 2D position with default precision', () => {
    expect(truncatePosition([2.352212345, 48.856612345])).toEqual([2.3522123, 48.8566123])
  })

  it('truncates a 3D position with default precision', () => {
    expect(truncatePosition([2.352212345, 48.856612345, 100.123456789])).toEqual([2.3522123, 48.8566123, 100.1234568])
  })

  it('truncates with custom precision', () => {
    expect(truncatePosition([2.352212345, 48.856612345], 3)).toEqual([2.352, 48.857])
  })

  it('truncates with precision 0', () => {
    expect(truncatePosition([2.352212345, 48.856612345], 0)).toEqual([2, 49])
  })

  it('truncates negative coordinates', () => {
    expect(truncatePosition([-73.98570123, 40.74840123])).toEqual([-73.9857012, 40.7484012])
  })

  it('truncates at the maximum precision without producing NaN', () => {
    const result = truncatePosition([2.12345678, 48.12345678], MAX_COORDINATE_PRECISION)
    expect(result.every((coordinate) => !Number.isNaN(coordinate))).toBe(true)
    expect(result).toEqual([2.12345678, 48.12345678])
  })

  it('defaults precision to DEFAULT_COORDINATE_PRECISION', () => {
    const value = [2.352212345, 48.856612345]
    expect(truncatePosition([...value])).toEqual(truncatePosition([...value], DEFAULT_COORDINATE_PRECISION))
  })

  it('mutates in place and returns the same object', () => {
    const position = [2.352212345, 48.856612345]
    expect(truncatePosition(position)).toBe(position)
  })

  it('throws if position is invalid', () => {
    expect(() => truncatePosition(null)).toThrow()
    expect(() => truncatePosition('not a position')).toThrow()
  })

  it('throws if precision is out of range', () => {
    expect(() => truncatePosition([2.3522, 48.8566], -1)).toThrow()
    expect(() => truncatePosition([2.3522, 48.8566], 9)).toThrow()
  })
})

describe('distanceBetweenPositions', () => {
  it('returns 0 between identical positions', () => {
    expect(distanceBetweenPositions([2.3522, 48.8566], [2.3522, 48.8566])).toBeCloseTo(0, 6)
  })
  it('measures one degree of latitude as one arc-degree', () => {
    expect(distanceBetweenPositions([0, 0], [0, 1])).toBeCloseTo(ONE_DEGREE_M, 3)
  })
  it('measures one degree of longitude at the equator as one arc-degree', () => {
    expect(distanceBetweenPositions([0, 0], [1, 0])).toBeCloseTo(ONE_DEGREE_M, 3)
  })
  it('is symmetric', () => {
    const a = [2.3522, 48.8566]
    const b = [-73.9857, 40.7484]
    expect(distanceBetweenPositions(a, b)).toBeCloseTo(distanceBetweenPositions(b, a), 6)
  })
  it('measures the half-circumference between antipodes', () => {
    expect(distanceBetweenPositions([0, 0], [180, 0])).toBeCloseTo(Math.PI * EARTH_RADIUS, 3)
  })
  it('ignores altitude', () => {
    expect(distanceBetweenPositions([0, 0, 100], [0, 1, 900])).toBeCloseTo(ONE_DEGREE_M, 3)
  })
  it('throws for an invalid position', () => {
    expect(() => distanceBetweenPositions(null, [0, 0])).toThrow()
  })
})

describe('destinationFromPosition', () => {
  it('returns the origin for a zero distance', () => {
    const result = destinationFromPosition([2.3522, 48.8566], 45, 0)
    expect(result[0]).toBeCloseTo(2.3522, 9)
    expect(result[1]).toBeCloseTo(48.8566, 9)
  })
  it('moves north for bearing 0', () => {
    const [lon, lat] = destinationFromPosition([0, 0], 0, ONE_DEGREE_M)
    expect(lon).toBeCloseTo(0, 6)
    expect(lat).toBeCloseTo(1, 6)
  })
  it('moves east along the equator for bearing 90', () => {
    const [lon, lat] = destinationFromPosition([0, 0], 90, ONE_DEGREE_M)
    expect(lon).toBeCloseTo(1, 6)
    expect(lat).toBeCloseTo(0, 6)
  })
  it('moves south for bearing 180', () => {
    const [lon, lat] = destinationFromPosition([0, 0], 180, ONE_DEGREE_M)
    expect(lon).toBeCloseTo(0, 6)
    expect(lat).toBeCloseTo(-1, 6)
  })
  it('moves west for bearing 270', () => {
    const [lon, lat] = destinationFromPosition([0, 0], 270, ONE_DEGREE_M)
    expect(lon).toBeCloseTo(-1, 6)
    expect(lat).toBeCloseTo(0, 6)
  })
  it('lands at the requested distance from the origin', () => {
    // Inverse consistency: distance(origin, destination) === requested distance.
    const origin = [10, 20]
    const dest = destinationFromPosition(origin, 57, 250000)
    expect(distanceBetweenPositions(origin, dest)).toBeCloseTo(250000, 3)
  })
  it('returns a 2D position', () => {
    expect(destinationFromPosition([2.3522, 48.8566], 30, 1000)).toHaveLength(2)
  })
  it('throws for an invalid position', () => {
    expect(() => destinationFromPosition(null, 0, 1000)).toThrow()
  })
  it('throws for a non-numeric bearing or distance', () => {
    expect(() => destinationFromPosition([0, 0], 'north', 1000)).toThrow()
    expect(() => destinationFromPosition([0, 0], 0, 'far')).toThrow()
  })
})

describe('reprojectPosition', () => {
  it('is the identity when source and target are equal', () => {
    const result = reprojectPosition([2.3522, 48.8566], 'EPSG:4326', 'EPSG:4326')
    expect(result[0]).toBeCloseTo(2.3522, 9)
    expect(result[1]).toBeCloseTo(48.8566, 9)
  })

  it('maps the origin to the origin (4326 → 3857)', () => {
    const [x, y] = reprojectPosition([0, 0], 'EPSG:4326', 'EPSG:3857')
    expect(x).toBeCloseTo(0, 6)
    expect(y).toBeCloseTo(0, 6)
  })

  it('round-trips 4326 → 3857 → 4326', () => {
    const projected = reprojectPosition([2.3522, 48.8566], 'EPSG:4326', 'EPSG:3857')
    const back = reprojectPosition(projected, 'EPSG:3857', 'EPSG:4326')
    expect(back[0]).toBeCloseTo(2.3522, 6)
    expect(back[1]).toBeCloseTo(48.8566, 6)
  })

  it('preserves coordinate signs into Web Mercator', () => {
    const [x, y] = reprojectPosition([2.3522, 48.8566], 'EPSG:4326', 'EPSG:3857')
    // positive lon/lat → positive easting/northing, in metric ranges
    expect(x).toBeGreaterThan(0)
    expect(y).toBeGreaterThan(0)
    expect(Math.abs(x)).toBeGreaterThan(180) // no longer degrees
  })

  it('passes altitude through on a 3D position', () => {
    const result = reprojectPosition([2.3522, 48.8566, 100], 'EPSG:4326', 'EPSG:3857')
    expect(result).toHaveLength(3)
    expect(result[2]).toBeCloseTo(100, 6)
  })

  it('throws for an invalid position', () => {
    expect(() => reprojectPosition(null, 'EPSG:4326', 'EPSG:3857')).toThrow()
    expect(() => reprojectPosition([2.3522], 'EPSG:4326', 'EPSG:3857')).toThrow()
  })

  it('throws for an unknown source projection', () => {
    expect(() => reprojectPosition([2.3522, 48.8566], 'EPSG:0000', 'EPSG:3857')).toThrow()
  })

  it('throws for an unknown target projection', () => {
    expect(() => reprojectPosition([2.3522, 48.8566], 'EPSG:4326', 'EPSG:0000')).toThrow()
  })
})
