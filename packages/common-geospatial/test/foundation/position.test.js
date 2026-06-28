import { describe, it, expect } from 'vitest'
import { parsePosition, isValidPosition, is3DPosition, isSamePosition } from '../../src/foundation'

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

  it('returns false for out of range longitude', () => {
    expect(isValidPosition([-181, 48.8566])).toBe(false)
    expect(isValidPosition([181, 48.8566])).toBe(false)
  })

  it('returns false for out of range latitude', () => {
    expect(isValidPosition([2.3522, -91])).toBe(false)
    expect(isValidPosition([2.3522, 91])).toBe(false)
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
  it('throws for invalid position1', () => {
    expect(() => isSamePosition(null, [2.3522, 48.8566])).toThrow()
    expect(() => isSamePosition([999, 999], [2.3522, 48.8566])).toThrow()
  })

  it('throws for invalid position2', () => {
    expect(() => isSamePosition([2.3522, 48.8566], null)).toThrow()
    expect(() => isSamePosition([2.3522, 48.8566], [999, 999])).toThrow()
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
    expect(isSamePosition([2.35220000001, 48.8566], [2.3522, 48.8566])).toBe(true)
  })

  it('returns false for positions differing beyond default precision', () => {
    expect(isSamePosition([2.3522000001, 48.8566], [2.3522, 48.8566])).toBe(false)
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
