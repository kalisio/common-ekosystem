import { describe, it, expect } from 'vitest'
import {
  guessCoordinateType,
  parseCoordinate,
  parseCoordinates
} from '../../src/coordinates/parse.js'

describe('guessCoordinateType', () => {
  it('detects latitude from N/S (case insensitive)', () => {
    expect(guessCoordinateType(10, 'N')).toBe('lat')
    expect(guessCoordinateType(10, 'n')).toBe('lat')
    expect(guessCoordinateType(-10, 'S')).toBe('lat')
  })

  it('detects longitude from E/W (case insensitive)', () => {
    expect(guessCoordinateType(10, 'E')).toBe('lon')
    expect(guessCoordinateType(10, 'w')).toBe('lon')
  })

  it('value > 90 forces longitude', () => {
    expect(guessCoordinateType(90.0001)).toBe('lon')
    expect(guessCoordinateType(-91)).toBe('lon')
  })

  it('exact boundary ±90 remains ambiguous', () => {
    expect(guessCoordinateType(90)).toEqual(['lat', 'lon'])
    expect(guessCoordinateType(-90)).toEqual(['lat', 'lon'])
  })

  it('no direction in valid range → ambiguous', () => {
    expect(guessCoordinateType(0)).toEqual(['lat', 'lon'])
  })
})

describe('parseCoordinate', () => {
  /* ---------- DMS ---------- */
  it('parses DMS with symbols', () => {
    const r = parseCoordinate('48°30\'36"N')
    expect(r.format).toBe('DMS')
    expect(r.type).toBe('lat')
  })

  it('parses DMS with spaces only', () => {
    const r = parseCoordinate('48 30 36 N')
    expect(r.format).toBe('DMS')
  })

  it('parses DMS with decimal seconds', () => {
    const r = parseCoordinate('48°30\'36.5"N')
    expect(r.value).toBeCloseTo(48.510138, 5)
  })

  it('parses DMS lowercase direction', () => {
    const r = parseCoordinate('48 30 36 n')
    expect(r.type).toBe('lat')
  })

  it('parses DMS negative without direction (ambiguous)', () => {
    const r = parseCoordinate('-48 30 36')
    expect(r.type).toEqual(['lat', 'lon'])
  })

  /* ---------- DM ---------- */
  it('parses DM classic', () => {
    const r = parseCoordinate('48°30\'N')
    expect(r.format).toBe('DM')
    expect(r.type).toBe('lat')
  })

  it('parses DM decimal minutes', () => {
    const r = parseCoordinate('48°30.5\'')
    expect(r.format).toBe('DM')
  })

  it('parses DM with spaces', () => {
    const r = parseCoordinate('48 30 N')
    expect(r.format).toBe('DM')
  })

  /* ---------- DD ---------- */
  it('parses DD plain', () => {
    const r = parseCoordinate('48.8566')
    expect(r.format).toBe('DD')
    expect(r.type).toEqual(['lat', 'lon'])
  })

  it('parses DD with direction', () => {
    const r = parseCoordinate('48.8566S')
    expect(r.type).toBe('lat')
    expect(r.value).toBeLessThan(0)
  })

  it('parses DD with trimming', () => {
    const r = parseCoordinate('   48.8566   ')
    expect(r.format).toBe('DD')
  })

  it('negative + direction throws (invalid sign rule)', () => {
    expect(() => parseCoordinate('-48N')).toThrow()
  })

  /* ---------- INVALID ---------- */
  it('returns null for invalid string', () => {
    expect(parseCoordinate('foo')).toBeNull()
    expect(parseCoordinate('48°')).toBeNull()
  })

  it('throws if not a string', () => {
    expect(() => parseCoordinate(123)).toThrow()
  })
})

describe('parseCoordinates', () => {
  /* ---------- explicit / explicit ---------- */
  it('lon,lat explicit', () => {
    const r = parseCoordinates('2E,48N')
    expect(r.longitude).toBe(2)
    expect(r.latitude).toBe(48)
  })

  it('lat,lon explicit', () => {
    const r = parseCoordinates('48N,2E')
    expect(r.longitude).toBe(2)
    expect(r.latitude).toBe(48)
  })

  /* ---------- explicit + ambiguous ---------- */
  it('lon explicit + ambiguous', () => {
    const r = parseCoordinates('2E,48')
    expect(r.longitude).toBe(2)
  })

  it('lat explicit + ambiguous', () => {
    const r = parseCoordinates('48N,2')
    expect(r.longitude).toBe(2)
  })

  it('ambiguous + lon explicit', () => {
    const r = parseCoordinates('48,2E')
    expect(r.longitude).toBe(2)
  })

  it('ambiguous + lat explicit', () => {
    const r = parseCoordinates('2,48N')
    expect(r.longitude).toBe(2)
  })

  /* ---------- both ambiguous ---------- */
  it('returns both permutations if ambiguous', () => {
    const r = parseCoordinates('10,20')
    expect(Array.isArray(r)).toBe(true)
    expect(r).toHaveLength(2)
  })

  /* ---------- format mismatch ---------- */
  it('returns null if formats mismatch', () => {
    expect(parseCoordinates("48°30'N,2.5")).toBeNull()
  })

  /* ---------- wrong number of parts ---------- */
  it('returns null if not exactly two parts', () => {
    expect(parseCoordinates('10')).toBeNull()
    expect(parseCoordinates('1,2,3')).toBeNull()
  })

  /* ---------- invalid inner parse ---------- */
  it('throws if inner coordinate invalid (format access)', () => {
    expect(() => parseCoordinates('foo,bar')).toThrow()
  })

  it('throws if pattern not string', () => {
    expect(() => parseCoordinates(123)).toThrow()
  })
})
