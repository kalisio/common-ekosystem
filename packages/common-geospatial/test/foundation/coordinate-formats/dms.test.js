import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale } from '../../../src/foundation/index.js'
import { DMS } from '../../../src/foundation/coordinate-formats/dms.js'

describe('DMS', () => {
  describe('from object', () => {
    it('should be valid with degrees, minutes, seconds and no direction', () => {
      const dms = DMS({ degrees: 48, minutes: 51, seconds: 23.76 })
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(51)
      expect(dms.seconds).toBe(23.76)
      expect(dms.direction).toBe(null)
    })

    it('should be valid with a direction', () => {
      const dms = DMS({ degrees: 48, minutes: 51, seconds: 23.76, direction: 'N' })
      expect(dms.isValid()).toBe(true)
      expect(dms.direction).toBe('N')
    })

    it('should be valid with all zeros', () => {
      const dms = DMS({ degrees: 0, minutes: 0, seconds: 0 })
      expect(dms.isValid()).toBe(true)
    })

    it('should be valid with seconds close to 60', () => {
      expect(DMS({ degrees: 48, minutes: 51, seconds: 59.999 }).isValid()).toBe(true)
    })

    it('should be invalid if seconds is 60', () => {
      expect(DMS({ degrees: 48, minutes: 51, seconds: 60 }).isValid()).toBe(false)
    })

    it('should be invalid if minutes is 60', () => {
      expect(DMS({ degrees: 48, minutes: 60, seconds: 0 }).isValid()).toBe(false)
    })

    it('should be invalid if minutes is negative', () => {
      expect(DMS({ degrees: 48, minutes: -1, seconds: 0 }).isValid()).toBe(false)
    })

    it('should be invalid if minutes is a float', () => {
      expect(DMS({ degrees: 48, minutes: 30.5, seconds: 0 }).isValid()).toBe(false)
    })

    it('should be valid if degrees is negative and no direction', () => {
      expect(DMS({ degrees: -1, minutes: 0, seconds: 0 }).isValid()).toBe(true)
    })

    it('should be invalid if degrees is negative and a direction is provided', () => {
      expect(DMS({ degrees: -1, minutes: 0, seconds: 0, direction: 'N' }).isValid()).toBe(false)
    })

    it('should be invalid if degrees is a float', () => {
      expect(DMS({ degrees: 48.5, minutes: 0, seconds: 0 }).isValid()).toBe(false)
    })

    it('should be invalid if coord is null', () => {
      expect(DMS(null).isValid()).toBe(false)
    })

    it('should be invalid if coord is a number', () => {
      expect(DMS(42).isValid()).toBe(false)
    })

    it('should be invalid if coord is an array', () => {
      expect(DMS([]).isValid()).toBe(false)
    })
  })

  describe('from string', () => {
    beforeEach(() => {
      setLocale('fr')
    })

    it('should parse a signed value', () => {
      const dms = DMS("-48°51'23.76\"")
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(-48)
      expect(dms.minutes).toBe(51)
      expect(dms.seconds).toBe(23.76)
      expect(dms.direction).toBe(null)
    })

    it('should parse a value with N direction', () => {
      const dms = DMS("48°51'23.76\"N")
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(51)
      expect(dms.seconds).toBe(23.76)
      expect(dms.direction).toBe('N')
    })

    it('should parse a value with S direction', () => {
      expect(DMS("48°51'23.76\"S").direction).toBe('S')
    })

    it('should parse a value with E direction', () => {
      expect(DMS("48°51'23.76\"E").direction).toBe('E')
    })

    it('should parse a value with W direction', () => {
      expect(DMS("48°51'23.76\"W").direction).toBe('W')
    })

    it('should parse a value with O direction', () => {
      expect(DMS("48°51'23.76\"O").direction).toBe('O')
    })

    it('should parse without the second symbol', () => {
      const dms = DMS("48°51'23.76")
      expect(dms.isValid()).toBe(true)
      expect(dms.seconds).toBe(23.76)
    })

    it('should parse ignoring whitespace', () => {
      const dms = DMS("48° 51' 23.76\" N")
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(51)
      expect(dms.seconds).toBe(23.76)
      expect(dms.direction).toBe('N')
    })

    it('should parse integer seconds', () => {
      const dms = DMS("48°51'23\"N")
      expect(dms.isValid()).toBe(true)
      expect(dms.seconds).toBe(23)
    })

    it('should be invalid for an empty string', () => {
      expect(DMS('').isValid()).toBe(false)
    })

    it('should be invalid for an unrecognized string', () => {
      expect(DMS('invalid').isValid()).toBe(false)
    })
  })

  describe('isValid', () => {
    it('should return true for all zeros', () => {
      expect(DMS({ degrees: 0, minutes: 0, seconds: 0 }).isValid()).toBe(true)
    })

    it('should return false if degrees is null', () => {
      expect(DMS('invalid').isValid()).toBe(false)
    })
  })

  describe('format', () => {
    it('should format a value without direction', () => {
      expect(DMS({ degrees: 48, minutes: 51, seconds: 23.76 }).toString(2)).toBe('48° 51\' 23.76"')
    })

    it('should format a value with direction', () => {
      expect(DMS({ degrees: 48, minutes: 51, seconds: 23.76, direction: 'N' }).toString(2)).toBe('48° 51\' 23.76" N')
    })

    it('should respect decimalPlaces', () => {
      const dms = DMS({ degrees: 48, minutes: 51, seconds: 23.76 })
      expect(dms.toString(1)).toBe('48° 51\' 23.8"')
      expect(dms.toString(3)).toBe('48° 51\' 23.760"')
    })

    it('should return empty string if invalid', () => {
      expect(DMS('invalid').toString(2)).toBe('')
    })

    it('should throw if decimalPlaces is 0', () => {
      expect(() => DMS({ degrees: 48, minutes: 51, seconds: 23.76 }).toString(0)).toThrow()
    })

    it('should throw if decimalPlaces is negative', () => {
      expect(() => DMS({ degrees: 48, minutes: 51, seconds: 23.76 }).toString(-1)).toThrow()
    })

    it('should throw if decimalPlaces is a float', () => {
      expect(() => DMS({ degrees: 48, minutes: 51, seconds: 23.76 }).toString(1.5)).toThrow()
    })

    it('should throw if decimalPlaces is a string', () => {
      expect(() => DMS({ degrees: 48, minutes: 51, seconds: 23.76 }).toString('2')).toThrow()
    })
  })

  describe('toDecimal', () => {
    it('should return null if invalid', () => {
      expect(DMS('invalid').toDecimal()).toBe(null)
    })

    it('should return value and null direction', () => {
      const result = DMS({ degrees: 48, minutes: 30, seconds: 0 }).toDecimal()
      expect(result.degrees).toBe(48.5)
      expect(result.direction).toBe(null)
    })

    it('should return value and direction', () => {
      const result = DMS({ degrees: 48, minutes: 30, seconds: 0, direction: 'O' }).toDecimal()
      expect(result.degrees).toBe(48.5)
      expect(result.direction).toBe('O')
    })

    it('should correctly compute decimal from degrees minutes seconds', () => {
      const result = DMS({ degrees: 48, minutes: 51, seconds: 36 }).toDecimal()
      expect(result.degrees).toBeCloseTo(48.86, 4)
    })

    it('should return value 0 for all zeros', () => {
      const result = DMS({ degrees: 0, minutes: 0, seconds: 0 }).toDecimal()
      expect(result.degrees).toBe(0)
      expect(result.direction).toBe(null)
    })
  })
})
