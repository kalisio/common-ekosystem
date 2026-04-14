import { describe, it, expect } from 'vitest'
import { parsePosition } from '../../src/foundation'

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
