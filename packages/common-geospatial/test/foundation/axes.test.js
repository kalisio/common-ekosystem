import { describe, it, expect } from 'vitest'
import { AXES, isValidAxis, isLatitude, isLongitude, isAltitude } from '../../src/foundation/axes.js'

describe('AXES', () => {
  it('should contain LATITUDE', () => {
    expect(AXES.LATITUDE).toBe('LAT')
  })

  it('should contain LONGITUDE', () => {
    expect(AXES.LONGITUDE).toBe('LON')
  })

  it('should contain ALTITUDE', () => {
    expect(AXES.ALTITUDE).toBe('ALT')
  })
})

describe('isValidAxis', () => {
  it('should return true for LATITUDE', () => {
    expect(isValidAxis(AXES.LATITUDE)).toBe(true)
  })

  it('should return true for LONGITUDE', () => {
    expect(isValidAxis(AXES.LONGITUDE)).toBe(true)
  })

  it('should return true for ALTITUDE', () => {
    expect(isValidAxis(AXES.ALTITUDE)).toBe(true)
  })

  it('should return false for an unknown axis', () => {
    expect(isValidAxis('UNKNOWN')).toBe(false)
  })

  it('should throw if axis is not a string', () => {
    expect(() => isValidAxis(null)).toThrow()
    expect(() => isValidAxis(42)).toThrow()
    expect(() => isValidAxis(undefined)).toThrow()
  })
})

describe('isLatitude', () => {
  it('should return true for LATITUDE', () => {
    expect(isLatitude(AXES.LATITUDE)).toBe(true)
  })

  it('should return false for LONGITUDE', () => {
    expect(isLatitude(AXES.LONGITUDE)).toBe(false)
  })

  it('should return false for ALTITUDE', () => {
    expect(isLatitude(AXES.ALTITUDE)).toBe(false)
  })

  it('should throw if axis is not a string', () => {
    expect(() => isLatitude(null)).toThrow()
    expect(() => isLatitude(42)).toThrow()
  })
})

describe('isLongitude', () => {
  it('should return true for LONGITUDE', () => {
    expect(isLongitude(AXES.LONGITUDE)).toBe(true)
  })

  it('should return false for LATITUDE', () => {
    expect(isLongitude(AXES.LATITUDE)).toBe(false)
  })

  it('should return false for ALTITUDE', () => {
    expect(isLongitude(AXES.ALTITUDE)).toBe(false)
  })

  it('should throw if axis is not a string', () => {
    expect(() => isLongitude(null)).toThrow()
    expect(() => isLongitude(42)).toThrow()
  })
})

describe('isAltitude', () => {
  it('should return true for ALTITUDE', () => {
    expect(isAltitude(AXES.ALTITUDE)).toBe(true)
  })

  it('should return false for LATITUDE', () => {
    expect(isAltitude(AXES.LATITUDE)).toBe(false)
  })

  it('should return false for LONGITUDE', () => {
    expect(isAltitude(AXES.LONGITUDE)).toBe(false)
  })

  it('should throw if axis is not a string', () => {
    expect(() => isAltitude(null)).toThrow()
    expect(() => isAltitude(42)).toThrow()
  })
})
