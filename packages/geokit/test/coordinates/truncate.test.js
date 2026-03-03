import { describe, it, expect } from 'vitest'
import { truncateCoordinates } from '../../src/coordinates/truncate.js'

describe('truncateCoordinates', () => {
  describe('default precision (7)', () => {
    it('truncates positive longitude and latitude', () => {
      expect(truncateCoordinates(2.35222229876, 48.85666669432)).toEqual({
        longitude: 2.3522223,
        latitude: 48.8566667
      })
    })

    it('truncates negative coordinates', () => {
      expect(truncateCoordinates(-73.98765432, -33.86543219)).toEqual({
        longitude: -73.9876543,
        latitude: -33.8654322
      })
    })

    it('preserves coordinates that need no truncation', () => {
      expect(truncateCoordinates(2.0, 48.0)).toEqual({ longitude: 2.0, latitude: 48.0 })
    })

    it('handles zero coordinates', () => {
      expect(truncateCoordinates(0, 0)).toEqual({ longitude: 0, latitude: 0 })
    })
  })

  describe('explicit precision', () => {
    it('precision 0 → rounds to integer', () => {
      expect(truncateCoordinates(2.8, 48.4, 0)).toEqual({ longitude: 3, latitude: 48 })
    })

    it('precision 1', () => {
      expect(truncateCoordinates(2.35222229876, 48.85666669432, 1)).toMatchObject({
        longitude: 2.4,
        latitude: 48.9
      })
    })

    it('precision 2', () => {
      expect(truncateCoordinates(2.35222229876, 48.85666669432, 2)).toEqual({
        longitude: 2.35,
        latitude: 48.86
      })
    })

    it('precision 4', () => {
      expect(truncateCoordinates(2.35222229876, 48.85666669432, 4)).toEqual({
        longitude: 2.3522,
        latitude: 48.8567
      })
    })

    it('precision 6', () => {
      expect(truncateCoordinates(-74.0060, 40.7128, 6)).toEqual({
        longitude: -74.006,
        latitude: 40.7128
      })
    })

    it('precision 8', () => {
      expect(truncateCoordinates(2.352222298, 48.856666694, 8)).toEqual({
        longitude: 2.3522223,
        latitude: 48.85666669
      })
    })
  })

  describe('edge cases', () => {
    it('handles max longitude (180)', () => {
      expect(truncateCoordinates(180, 0, 2)).toEqual({ longitude: 180, latitude: 0 })
    })

    it('handles min longitude (-180)', () => {
      expect(truncateCoordinates(-180, 0, 2)).toEqual({ longitude: -180, latitude: 0 })
    })

    it('handles max latitude (90)', () => {
      expect(truncateCoordinates(0, 90, 2)).toEqual({ longitude: 0, latitude: 90 })
    })

    it('handles min latitude (-90)', () => {
      expect(truncateCoordinates(0, -90, 2)).toEqual({ longitude: 0, latitude: -90 })
    })
  })

  describe('invalid inputs', () => {
    it.each([
      ['longitude is not a number', 'invalid', 48.8566, undefined],
      ['latitude is not a number', 2.3522, 'invalid', undefined],
      ['longitude is NaN', NaN, 48.8566, undefined],
      ['latitude is NaN', 2.3522, NaN, undefined],
      ['precision is below 0', 2.3522, 48.8566, -1],
      ['precision is above 8', 2.3522, 48.8566, 9],
      ['precision is not a number', 2.3522, 48.8566, '7']
    ])('throws when %s', (_, lon, lat, precision) => {
      expect(() => truncateCoordinates(lon, lat, precision)).toThrow()
    })
  })
})
