import { describe, it, expect } from 'vitest'
import {
  convertCoordinateFromSexagesimal,
  convertCoordinateToSexagesimal
} from '../../src/coordinates/convert.js'

describe('convertCoordinateFromSexagesimal', () => {
  it('should convert simple degrees without min/sec', () => {
    expect(convertCoordinateFromSexagesimal(10)).toBe(10)
    expect(convertCoordinateFromSexagesimal(-10)).toBe(-10)
  })

  it('should convert degrees, minutes and seconds', () => {
    const result = convertCoordinateFromSexagesimal(10, 30, 0)
    expect(result).toBeCloseTo(10.5)

    const result2 = convertCoordinateFromSexagesimal(10, 30, 30)
    expect(result2).toBeCloseTo(10.508333, 6)
  })

  it('should handle south direction', () => {
    const result = convertCoordinateFromSexagesimal(10, 0, 0, 'S')
    expect(result).toBe(-10)
  })

  it('should handle west direction', () => {
    const result = convertCoordinateFromSexagesimal(10, 0, 0, 'W')
    expect(result).toBe(-10)
  })

  it('should keep positive sign for north and east', () => {
    expect(convertCoordinateFromSexagesimal(10, 0, 0, 'N')).toBe(10)
    expect(convertCoordinateFromSexagesimal(10, 0, 0, 'E')).toBe(10)
  })

  it('should throw if deg is not a number', () => {
    expect(() => convertCoordinateFromSexagesimal('10'))
      .toThrow('deg must be a number')
  })

  it('should throw if minutes out of range', () => {
    expect(() => convertCoordinateFromSexagesimal(10, 61))
      .toThrow('min must be in range [0, 60]')
  })

  it('should throw if seconds out of range', () => {
    expect(() => convertCoordinateFromSexagesimal(10, 0, 61))
      .toThrow('sec must be in range [0, 60]')
  })

  it('should throw if direction invalid', () => {
    expect(() => convertCoordinateFromSexagesimal(10, 0, 0, 'X'))
      .toThrow('dir must be a direction')
  })

  it('should throw if deg is negative and direction provided', () => {
    expect(() => convertCoordinateFromSexagesimal(-10, 0, 0, 'N'))
      .toThrow('deg sign must be positive')
  })
})

describe('convertCoordinateToSexagesimal', () => {
  it('should convert positive decimal to sexagesimal without type', () => {
    const result = convertCoordinateToSexagesimal(10.5)
    expect(result).toEqual({
      deg: 10,
      min: 30,
      sec: 0
    })
  })

  it('should convert negative decimal without type', () => {
    const result = convertCoordinateToSexagesimal(-10.5)
    expect(result).toEqual({
      deg: -10,
      min: 30,
      sec: 0
    })
  })

  it('should convert latitude with direction', () => {
    const result = convertCoordinateToSexagesimal(-10.5, 'LAT')
    expect(result.deg).toBe(10)
    expect(result.min).toBe(30)
    expect(result.dir).toBe('S')

    const result2 = convertCoordinateToSexagesimal(10.5, 'LAT')
    expect(result2.dir).toBe('N')
  })

  it('should convert longitude with direction', () => {
    const result = convertCoordinateToSexagesimal(-10.5, 'LON')
    expect(result.dir).toBe('W')

    const result2 = convertCoordinateToSexagesimal(10.5, 'LON')
    expect(result2.dir).toBe('E')
  })

  it('should throw if coord is not a number', () => {
    expect(() => convertCoordinateToSexagesimal('10'))
      .toThrow('coord must be a number')
  })

  it('should throw if type invalid', () => {
    expect(() => convertCoordinateToSexagesimal(10, 'FOO'))
      .toThrow('type must be either "LAT" or "LON"')
  })
})
