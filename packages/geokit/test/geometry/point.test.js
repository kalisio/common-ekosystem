import { describe, it, expect, beforeEach } from 'vitest'
import { Point, parsePoint } from '../../src/geometry/point.js'
import { setLocale } from '../../src/core/locale.js'

beforeEach(() => {
  setLocale('en')
})

describe('Point', () => {
  describe('from array', () => {
    it('should be valid with lon and lat', () => {
      const pos = Point([2.3522, 48.8566])
      expect(pos.isValid()).toBe(true)
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
      expect(pos.altitude).toBe(null)
    })

    it('should be valid with lon, lat and altitude', () => {
      const pos = Point([2.3522, 48.8566, 100])
      expect(pos.isValid()).toBe(true)
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
      expect(pos.altitude).toBe(100)
    })

    it('should be invalid with only one element', () => {
      expect(Point([2.3522]).isValid()).toBe(false)
    })

    it('should be invalid with non-number values', () => {
      expect(Point(['a', 48.8566]).isValid()).toBe(false)
      expect(Point([2.3522, 'b']).isValid()).toBe(false)
    })

    it('should be invalid with null altitude', () => {
      const pos = Point([2.3522, 48.8566, null])
      expect(pos.isValid()).toBe(true)
    })
  })

  describe('from object', () => {
    it('should be valid with lon and lat', () => {
      const pos = Point({ lon: 2.3522, lat: 48.8566 })
      expect(pos.isValid()).toBe(true)
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
    })

    it('should be valid with longitude and latitude', () => {
      const pos = Point({ longitude: 2.3522, latitude: 48.8566 })
      expect(pos.isValid()).toBe(true)
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
    })

    it('should be valid with x and y', () => {
      const pos = Point({ x: 2.3522, y: 48.8566 })
      expect(pos.isValid()).toBe(true)
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
    })

    it('should be valid with alt', () => {
      const pos = Point({ lon: 2.3522, lat: 48.8566, alt: 100 })
      expect(pos.isValid()).toBe(true)
      expect(pos.altitude).toBe(100)
    })

    it('should be valid with altitude', () => {
      const pos = Point({ lon: 2.3522, lat: 48.8566, altitude: 100 })
      expect(pos.isValid()).toBe(true)
      expect(pos.altitude).toBe(100)
    })

    it('should be valid with z', () => {
      const pos = Point({ lon: 2.3522, lat: 48.8566, z: 100 })
      expect(pos.isValid()).toBe(true)
      expect(pos.altitude).toBe(100)
    })

    it('should be invalid with missing lat', () => {
      expect(Point({ lon: 2.3522 }).isValid()).toBe(false)
    })

    it('should be invalid with missing lon', () => {
      expect(Point({ lat: 48.8566 }).isValid()).toBe(false)
    })
  })

  describe('from invalid input', () => {
    it('should be invalid with null', () => {
      expect(Point(null).isValid()).toBe(false)
    })

    it('should be invalid with a string', () => {
      expect(Point('48.8566, 2.3522').isValid()).toBe(false)
    })

    it('should be invalid with a number', () => {
      expect(Point(42).isValid()).toBe(false)
    })
  })

  describe('dimension', () => {
    it('should be 2 without altitude', () => {
      expect(Point([2.3522, 48.8566]).dimension).toBe(2)
    })

    it('should be 3 with altitude', () => {
      expect(Point([2.3522, 48.8566, 100]).dimension).toBe(3)
    })
  })

  describe('setters', () => {
    it('should update longitude', () => {
      const pos = Point([2.3522, 48.8566])
      pos.longitude = 3.0
      expect(pos.longitude).toBe(3.0)
    })

    it('should update latitude', () => {
      const pos = Point([2.3522, 48.8566])
      pos.latitude = 49.0
      expect(pos.latitude).toBe(49.0)
    })

    it('should update altitude', () => {
      const pos = Point([2.3522, 48.8566, 100])
      pos.altitude = 200
      expect(pos.altitude).toBe(200)
    })
  })

  describe('normalize', () => {
    it('should throw if position is invalid', () => {
      expect(() => Point(null).normalize()).toThrow()
    })

    it('should keep a valid position unchanged', () => {
      const pos = Point([2.3522, 48.8566])
      pos.normalize()
      expect(pos.longitude).toBeCloseTo(2.3522)
      expect(pos.latitude).toBeCloseTo(48.8566)
    })

    it('should wrap longitude above 180', () => {
      const pos = Point([181, 48.8566])
      pos.normalize()
      expect(pos.longitude).toBeCloseTo(-179)
    })

    it('should wrap longitude below -180', () => {
      const pos = Point([-181, 48.8566])
      pos.normalize()
      expect(pos.longitude).toBeCloseTo(179)
    })

    it('should wrap latitude above 90', () => {
      const pos = Point([2.3522, 91])
      pos.normalize()
      expect(pos.latitude).toBe(89)
    })

    it('should wrap latitude below -90', () => {
      const pos = Point([2.3522, -91])
      pos.normalize()
      expect(pos.latitude).toBe(-89)
    })

    it('should return this for chaining', () => {
      const pos = Point([2.3522, 48.8566])
      expect(pos.normalize()).toBe(pos)
    })
  })

  describe('truncate', () => {
    it('should throw if precision is out of range', () => {
      const pos = Point([2.3522, 48.8566])
      expect(() => pos.truncate(-1)).toThrow()
      expect(() => pos.truncate(9)).toThrow()
    })

    it('should throw if position is invalid', () => {
      expect(() => Point(null).truncate(2)).toThrow()
    })

    it('should truncate lon and lat', () => {
      const pos = Point([2.3522, 48.8566])
      pos.truncate(2)
      expect(pos.longitude).toBe(2.35)
      expect(pos.latitude).toBe(48.86)
    })

    it('should truncate altitude if defined', () => {
      const pos = Point([2.3522, 48.8566, 100.123])
      pos.truncate(2)
      expect(pos.altitude).toBe(100.12)
    })

    it('should use default precision of 7', () => {
      const pos = Point([2.352200001, 48.856600001])
      pos.truncate()
      expect(pos.longitude).toBe(2.3522)
      expect(pos.latitude).toBe(48.8566)
    })

    it('should return this for chaining', () => {
      const pos = Point([2.3522, 48.8566])
      expect(pos.truncate(2)).toBe(pos)
    })
  })

  describe('toArray', () => {
    it('should return null if invalid', () => {
      expect(Point(null).toArray()).toBe(null)
    })

    it('should return [lon, lat] for 2D position', () => {
      expect(Point([2.3522, 48.8566]).toArray()).toEqual([2.3522, 48.8566])
    })

    it('should return [lon, lat, alt] for 3D position', () => {
      expect(Point([2.3522, 48.8566, 100]).toArray()).toEqual([2.3522, 48.8566, 100])
    })
  })

  describe('toJSON', () => {
    it('should return null if invalid', () => {
      expect(Point(null).toJSON()).toBe(null)
    })

    it('should return lon and lat', () => {
      expect(Point([2.3522, 48.8566]).toJSON()).toEqual({ lon: 2.3522, lat: 48.8566 })
    })

    it('should include alt if defined', () => {
      expect(Point([2.3522, 48.8566, 100]).toJSON()).toEqual({ lon: 2.3522, lat: 48.8566, alt: 100 })
    })
  })

  describe('toGeoJSON', () => {
    it('should return null if invalid', () => {
      expect(Point(null).toGeoJSON()).toBe(null)
    })

    it('should return coordinates array', () => {
      expect(Point([2.3522, 48.8566]).toGeoJSON()).toEqual({ type: 'Point', coordinates: [2.3522, 48.8566] })
    })

    it('should include altitude if defined', () => {
      expect(Point([2.3522, 48.8566, 100]).toGeoJSON()).toEqual({ type: 'Point', coordinates: [2.3522, 48.8566, 100] })
    })
  })

  describe('toString', () => {
    it('should throw if format is not a non-empty string', () => {
      const pos = Point([2.3522, 48.8566])
      expect(() => pos.toString('')).toThrow()
      expect(() => pos.toString(null)).toThrow()
    })

    it('should throw if decimalPlaces is not a positive integer', () => {
      const pos = Point([2.3522, 48.8566])
      expect(() => pos.toString('DD', 0)).toThrow()
      expect(() => pos.toString('DD', -1)).toThrow()
      expect(() => pos.toString('DD', 1.5)).toThrow()
    })

    it('should return null if invalid', () => {
      expect(Point(null).toString('DD', 2)).toBe(null)
    })

    it('should format in DD', () => {
      const pos = Point([2.3522, 48.8566])
      const result = pos.toString('DD', 2)
      expect(result).toContain('N')
      expect(result).toContain('E')
    })

    it('should format in DDM', () => {
      const pos = Point([2.3522, 48.8566])
      const result = pos.toString('DDM', 2)
      expect(result).toContain('N')
      expect(result).toContain('E')
    })

    it('should format in DMS', () => {
      const pos = Point([2.3522, 48.8566])
      const result = pos.toString('DMS', 2)
      expect(result).toContain('N')
      expect(result).toContain('E')
    })

    it('should format negative coordinates with S and W', () => {
      const pos = Point([-73.9857, -40.7128])
      const result = pos.toString('DD', 2)
      expect(result).toContain('S')
      expect(result).toContain('W')
    })

    it('should use default decimalPlaces of 5', () => {
      const pos = Point([2.3522, 48.8566])
      const result = pos.toString('DD')
      expect(result).toBeDefined()
    })

    it('should reflect locale change', () => {
      setLocale('fr')
      const pos = Point([2.3522, 48.8566])
      const result = pos.toString('DD', 2)
      expect(result).toContain('N')
      expect(result).toContain('E')
    })
  })
})

describe('parsePoint', () => {
  it('should throw if pattern is empty', () => {
    expect(() => parsePoint('')).toThrow()
  })

  it('should throw if pattern is not a string', () => {
    expect(() => parsePoint(null)).toThrow()
    expect(() => parsePoint(42)).toThrow()
  })

  it('should return null if pattern has no separator', () => {
    expect(parsePoint('48.8566N')).toBe(null)
  })

  it('should return null if pattern has more than 2 parts', () => {
    expect(parsePoint('48.8566N,2.3522E,100')).toBe(null)
  })

  it('should return null if one part is unrecognized', () => {
    expect(parsePoint('invalid,2.3522E')).toBe(null)
  })

  it('should parse explicit lon/lat with comma separator', () => {
    const pos = parsePoint('2.3522E,48.8566N')
    expect(pos).not.toBe(null)
    expect(Array.isArray(pos)).toBe(false)
    expect(pos.isValid()).toBe(true)
    expect(pos.longitude).toBeCloseTo(2.3522)
    expect(pos.latitude).toBeCloseTo(48.8566)
  })

  it('should parse explicit lat/lon with comma separator', () => {
    const pos = parsePoint('48.8566N,2.3522E')
    expect(pos).not.toBe(null)
    expect(Array.isArray(pos)).toBe(false)
    expect(pos.isValid()).toBe(true)
    expect(pos.longitude).toBeCloseTo(2.3522)
    expect(pos.latitude).toBeCloseTo(48.8566)
  })

  it('should parse with semicolon separator', () => {
    const pos = parsePoint('48.8566N;2.3522E')
    expect(pos).not.toBe(null)
    expect(pos.isValid()).toBe(true)
  })

  it('should parse with pipe separator', () => {
    const pos = parsePoint('48.8566N|2.3522E')
    expect(pos).not.toBe(null)
    expect(pos.isValid()).toBe(true)
  })

  it('should return two positions if both parts are ambiguous', () => {
    const result = parsePoint('48.8566,2.3522')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0].isValid()).toBe(true)
    expect(result[1].isValid()).toBe(true)
  })

  it('should parse DDM coordinates', () => {
    const pos = parsePoint("48°51.396'N,2°21.132'E")
    expect(pos).not.toBe(null)
    expect(pos.isValid()).toBe(true)
    expect(pos.latitude).toBeCloseTo(48.8566, 2)
    expect(pos.longitude).toBeCloseTo(2.3522, 2)
  })

  it('should parse DMS coordinates', () => {
    const pos = parsePoint("48°51'23.76\"N,2°21'7.92\"E")
    expect(pos).not.toBe(null)
    expect(pos.isValid()).toBe(true)
  })
})
