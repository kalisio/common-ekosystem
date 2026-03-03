import { describe, it, expect } from 'vitest'
import {
  COORDINATE_TYPES,
  isLatitudeType,
  isLongitudeType,
  isCoordinateType
} from '../../src/coordinates/types.js'

describe('COORDINATE_TYPES', () => {
  it('should contain all LATITUDE aliases', () => {
    expect(COORDINATE_TYPES.LATITUDE).toContain('LATITUDE')
    expect(COORDINATE_TYPES.LATITUDE).toContain('latitude')
    expect(COORDINATE_TYPES.LATITUDE).toContain('LAT')
    expect(COORDINATE_TYPES.LATITUDE).toContain('lat')
  })

  it('should contain all LONGITUDE aliases', () => {
    expect(COORDINATE_TYPES.LONGITUDE).toContain('LONGITUDE')
    expect(COORDINATE_TYPES.LONGITUDE).toContain('longitude')
    expect(COORDINATE_TYPES.LONGITUDE).toContain('LON')
    expect(COORDINATE_TYPES.LONGITUDE).toContain('lon')
  })
})

describe('isLatitudeType', () => {
  it.each(['LATITUDE', 'latitude', 'LAT', 'lat'])(
    'returns true for "%s"',
    (type) => expect(isLatitudeType(type)).toBe(true)
  )

  it.each(['LONGITUDE', 'longitude', 'LON', 'lon'])(
    'returns false for "%s"',
    (type) => expect(isLatitudeType(type)).toBe(false)
  )

  it('throws when type is not a string', () => {
    expect(() => isLatitudeType(1)).toThrow()
    expect(() => isLatitudeType(null)).toThrow()
    expect(() => isLatitudeType(undefined)).toThrow()
  })
})

describe('isLongitudeType', () => {
  it.each(['LONGITUDE', 'longitude', 'LON', 'lon'])(
    'returns true for "%s"',
    (type) => expect(isLongitudeType(type)).toBe(true)
  )

  it.each(['LATITUDE', 'latitude', 'LAT', 'lat'])(
    'returns false for "%s"',
    (type) => expect(isLongitudeType(type)).toBe(false)
  )

  it('throws when type is not a string', () => {
    expect(() => isLongitudeType(1)).toThrow()
    expect(() => isLongitudeType(null)).toThrow()
    expect(() => isLongitudeType(undefined)).toThrow()
  })
})

describe('isCoordinateType', () => {
  it.each(['LATITUDE', 'latitude', 'LAT', 'lat', 'LONGITUDE', 'longitude', 'LON', 'lon'])(
    'returns true for "%s"',
    (type) => expect(isCoordinateType(type)).toBe(true)
  )

  it.each(['X', 'Lat', 'Lon', ' ', ''])(
    'returns false for "%s"',
    (type) => expect(isCoordinateType(type)).toBe(false)
  )

  it('throws when type is not a string', () => {
    expect(() => isCoordinateType(1)).toThrow()
    expect(() => isCoordinateType(null)).toThrow()
    expect(() => isCoordinateType(undefined)).toThrow()
  })
})
