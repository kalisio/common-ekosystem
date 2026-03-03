import { describe, it, expect } from 'vitest'
import { normalizeCoordinates } from '../../src/coordinates/normalize.js'

describe('normalizeCoordinates', () => {
  describe('already in range — no change', () => {
    it.each([
      ['valid coordinates', 2.3522, 48.8566, { longitude: 2.3522, latitude: 48.8566 }],
      ['zero', 0, 0, { longitude: 0, latitude: 0 }],
      ['max bounds (180, 90)', 180, 90, { longitude: 180, latitude: 90 }],
      ['min bounds (-180, -90)', -180, -90, { longitude: -180, latitude: -90 }],
      ['full decimal precision', 2.123456789, 48.987654321, { longitude: 2.123456789, latitude: 48.987654321 }]
    ])('returns %s unchanged', (_, lon, lat, expected) => {
      expect(normalizeCoordinates(lon, lat)).toEqual(expected)
    })
  })

  describe('longitude normalization', () => {
    it.each([
      ['> 180', 181, 0, { longitude: -179, latitude: 0 }],
      ['> 360', 360, 0, { longitude: 0, latitude: 0 }],
      ['< -180', -181, 0, { longitude: 179, latitude: 0 }]
    ])('wraps longitude %s', (_, lon, lat, expected) => {
      expect(normalizeCoordinates(lon, lat)).toEqual(expected)
    })

    it('keeps -180 as -180', () => {
      expect(normalizeCoordinates(-180, 0)).toEqual({ longitude: -180, latitude: 0 })
    })

    it('fixes -0 longitude → 0', () => {
      const result = normalizeCoordinates(-360, 0)
      expect(Object.is(result.longitude, -0)).toBe(false)
      expect(result.longitude).toBe(0)
    })
  })

  describe('latitude normalization', () => {
    it.each([
      ['North Pole (91°)', 0, 91, { longitude: 180, latitude: 89 }],
      ['North Pole (180°)', 0, 180, { longitude: 180, latitude: 0 }],
      ['South Pole (-91°)', 0, -91, { longitude: 180, latitude: -89 }]
    ])('bounces off %s', (_, lon, lat, expected) => {
      expect(normalizeCoordinates(lon, lat)).toEqual(expected)
    })

    it('normalizes flipped longitude after pole bounce', () => {
      expect(normalizeCoordinates(10, 91).longitude).toBe(-170)
    })
  })

  describe('combined latitude and longitude normalization', () => {
    it.each([
      ['both out of range', 181, 91, { longitude: 1, latitude: 89 }],
      ['both negative out of range', -181, -91, { longitude: -1, latitude: -89 }],
      ['extreme longitude and pole bounce', 190, 180, { longitude: 10, latitude: 0 }],
      ['longitude > 360 and latitude > 90', 370, 95, { longitude: -170, latitude: 85 }],
      ['both at extreme bounds', 360, 180, { longitude: 180, latitude: 0 }]
    ])('normalizes %s', (_, lon, lat, expected) => {
      expect(normalizeCoordinates(lon, lat)).toEqual(expected)
    })
  })

  describe('invalid inputs', () => {
    it.each([
      ['longitude is not a number', 'invalid', 48],
      ['latitude is not a number', 2, 'invalid'],
      ['longitude is NaN', NaN, 48],
      ['latitude is NaN', 2, NaN]
    ])('throws when %s', (_, lon, lat) => {
      expect(() => normalizeCoordinates(lon, lat)).toThrow()
    })
  })
})
