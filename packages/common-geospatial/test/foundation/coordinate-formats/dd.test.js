import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale } from '../../../src/foundation/index.js'
import { DD } from '../../../src/foundation/coordinate-formats/dd.js'

describe('DD', () => {
  describe('from object', () => {
    it('should be valid with a positive value and no direction', () => {
      const dd = DD({ degrees: 48.8566 })
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe(null)
    })

    it('should be valid with a negative value and no direction', () => {
      const dd = DD({ degrees: -48.8566 })
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(-48.8566)
      expect(dd.direction).toBe(null)
    })

    it('should be valid with value 0 and no direction', () => {
      const dd = DD({ degrees: 0 })
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(0)
      expect(dd.direction).toBe(null)
    })

    it('should be valid with a positive value and a direction', () => {
      const dd = DD({ degrees: 48.8566, direction: 'N' })
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('N')
    })

    it('should be valid with value 0 and a direction', () => {
      const dd = DD({ degrees: 0, direction: 'N' })
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(0)
      expect(dd.direction).toBe('N')
    })

    it('should be invalid with a negative value and a direction', () => {
      const dd = DD({ degrees: -48.8566, direction: 'N' })
      expect(dd.isValid()).toBe(false)
    })

    it('should be invalid if value is not a number', () => {
      const dd = DD({ degrees: 'abc' })
      expect(dd.isValid()).toBe(false)
    })

    it('should be invalid if coord is null', () => {
      expect(DD(null).isValid()).toBe(false)
    })

    it('should be invalid if coord is a number', () => {
      expect(DD(42).isValid()).toBe(false)
    })

    it('should be invalid if coord is an array', () => {
      expect(DD([]).isValid()).toBe(false)
    })
  })

  describe('from string', () => {
    beforeEach(() => {
      setLocale('fr')
    })

    it('should parse a signed negative value', () => {
      const dd = DD('-48.8566')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(-48.8566)
      expect(dd.direction).toBe(null)
    })

    it('should parse a signed negative value with degree symbol', () => {
      const dd = DD('-48.8566°')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(-48.8566)
      expect(dd.direction).toBe(null)
    })

    it('should parse a value with N direction', () => {
      const dd = DD('48.8566N')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('N')
    })

    it('should parse a value with S direction', () => {
      const dd = DD('48.8566S')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('S')
    })

    it('should parse a value with E direction', () => {
      const dd = DD('48.8566E')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('E')
    })

    it('should parse a value with W direction', () => {
      const dd = DD('48.8566W')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('W')
    })

    it('should parse a value with O direction', () => {
      const dd = DD('48.8566 O')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('O')
    })

    it('should parse a value with degree symbol and direction', () => {
      const dd = DD('48.8566°N')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('N')
    })

    it('should parse ignoring whitespace', () => {
      const dd = DD('48.8566 ° N')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48.8566)
      expect(dd.direction).toBe('N')
    })

    it('should parse an integer value', () => {
      const dd = DD('48N')
      expect(dd.isValid()).toBe(true)
      expect(dd.degrees).toBe(48)
      expect(dd.direction).toBe('N')
    })

    it('should be invalid for an empty string', () => {
      expect(DD('').isValid()).toBe(false)
    })

    it('should be invalid for an unrecognized string', () => {
      expect(DD('invalid').isValid()).toBe(false)
    })

    it('should be invalid for a string with no numeric value', () => {
      expect(DD('N').isValid()).toBe(false)
    })
  })

  describe('isValid', () => {
    it('should return true if value is 0', () => {
      expect(DD({ degrees: 0 }).isValid()).toBe(true)
    })

    it('should return true for negative values', () => {
      expect(DD({ degrees: -90 }).isValid()).toBe(true)
    })

    it('should return true for large values', () => {
      expect(DD({ degrees: 180 }).isValid()).toBe(true)
    })

    it('should return false if value is null', () => {
      expect(DD('invalid').isValid()).toBe(false)
    })
  })

  describe('format', () => {
    it('should format a value without direction', () => {
      expect(DD({ degrees: 48.8566 }).toString(2)).toBe('48.86°')
    })

    it('should format a value with direction', () => {
      expect(DD({ degrees: 48.8566, direction: 'N' }).toString(2)).toBe('48.86° N')
    })

    it('should format a negative value', () => {
      expect(DD({ degrees: -48.8566 }).toString(2)).toBe('-48.86°')
    })

    it('should respect decimalPlaces', () => {
      const dd = DD({ degrees: 48.8566 })
      expect(dd.toString(4)).toBe('48.8566°')
      expect(dd.toString(1)).toBe('48.9°')
    })

    it('should return empty string if invalid', () => {
      expect(DD('invalid').toString(2)).toBe('')
    })

    it('should throw if decimalPlaces is 0', () => {
      expect(() => DD({ degrees: 48.8566 }).toString(0)).toThrow()
    })

    it('should throw if decimalPlaces is negative', () => {
      expect(() => DD({ degrees: 48.8566 }).toString(-1)).toThrow()
    })

    it('should throw if decimalPlaces is a float', () => {
      expect(() => DD({ degrees: 48.8566 }).toString(1.5)).toThrow()
    })

    it('should throw if decimalPlaces is a string', () => {
      expect(() => DD({ degrees: 48.8566 }).toString('2')).toThrow()
    })
  })

  describe('toDecimal', () => {
    it('should return null if invalid', () => {
      expect(DD('invalid').toDecimal()).toBe(null)
    })

    it('should return value and null direction for a signed value', () => {
      const result = DD({ degrees: -48.8566 }).toDecimal()
      expect(result.degrees).toBe(-48.8566)
      expect(result.direction).toBe(null)
    })

    it('should return value and direction', () => {
      const result = DD({ degrees: 48.8566, direction: 'N' }).toDecimal()
      expect(result.degrees).toBe(48.8566)
      expect(result.direction).toBe('N')
    })

    it('should return value 0 with direction', () => {
      const result = DD({ degrees: 0, direction: 'S' }).toDecimal()
      expect(result.degrees).toBe(0)
      expect(result.direction).toBe('S')
    })

    it('should return value 0 without direction', () => {
      const result = DD({ degrees: 0 }).toDecimal()
      expect(result.degrees).toBe(0)
      expect(result.direction).toBe(null)
    })
  })
})
