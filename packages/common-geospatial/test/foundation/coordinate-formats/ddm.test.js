import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale } from '../../../src/foundation/index.js'
import { DDM } from '../../../src/foundation/coordinate-formats/ddm.js'

describe('DDM', () => {
  describe('from object', () => {
    it('should be valid with degrees and minutes and no direction', () => {
      const ddm = DDM({ degrees: 48, minutes: 51.396 })
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.396)
      expect(ddm.direction).toBe(null)
    })

    it('should be valid with degrees and minutes and a direction', () => {
      const ddm = DDM({ degrees: 48, minutes: 51.396, direction: 'N' })
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.396)
      expect(ddm.direction).toBe('N')
    })

    it('should be valid with degrees 0 and minutes 0', () => {
      const ddm = DDM({ degrees: 0, minutes: 0 })
      expect(ddm.isValid()).toBe(true)
    })

    it('should be valid with minutes close to 60', () => {
      const ddm = DDM({ degrees: 48, minutes: 59.999 })
      expect(ddm.isValid()).toBe(true)
    })

    it('should be invalid if minutes is 60', () => {
      const ddm = DDM({ degrees: 48, minutes: 60 })
      expect(ddm.isValid()).toBe(false)
    })

    it('should be invalid if minutes is negative', () => {
      const ddm = DDM({ degrees: 48, minutes: -1 })
      expect(ddm.isValid()).toBe(false)
    })

    it('should be valid if degrees is negative and no direction', () => {
      const ddm = DDM({ degrees: -1, minutes: 30 })
      expect(ddm.isValid()).toBe(true)
    })

    it('should be invalid if degrees is negative and a direction is provided', () => {
      const ddm = DDM({ degrees: -1, minutes: 30, direction: 'N' })
      expect(ddm.isValid()).toBe(false)
    })

    it('should be invalid if degrees is a float', () => {
      const ddm = DDM({ degrees: 48.5, minutes: 30 })
      expect(ddm.isValid()).toBe(false)
    })

    it('should be invalid if coord is null', () => {
      expect(DDM(null).isValid()).toBe(false)
    })

    it('should be invalid if coord is a number', () => {
      expect(DDM(42).isValid()).toBe(false)
    })

    it('should be invalid if coord is an array', () => {
      expect(DDM([]).isValid()).toBe(false)
    })
  })

  describe('from string', () => {
    beforeEach(() => {
      setLocale('fr')
    })

    it('should parse a signed value', () => {
      const ddm = DDM("-48°51.396'")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(-48)
      expect(ddm.minutes).toBe(51.396)
      expect(ddm.direction).toBe(null)
    })

    it('should parse a value with N direction', () => {
      const ddm = DDM("48°51.396'N")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.396)
      expect(ddm.direction).toBe('N')
    })

    it('should parse a value with S direction', () => {
      const ddm = DDM("48°51.396'S")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.direction).toBe('S')
    })

    it('should parse a value with E direction', () => {
      const ddm = DDM("48°51.396'E")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.direction).toBe('E')
    })

    it('should parse a value with W direction', () => {
      const ddm = DDM("48°51.396'W")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.direction).toBe('W')
    })

    it('should parse a value with O direction', () => {
      const ddm = DDM("48°51.396'O")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.direction).toBe('O')
    })

    it('should parse without the minute symbol', () => {
      const ddm = DDM('48°51.396')
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.396)
    })

    it('should parse ignoring whitespace', () => {
      const ddm = DDM("48° 51.396' N")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.396)
      expect(ddm.direction).toBe('N')
    })

    it('should parse integer minutes', () => {
      const ddm = DDM("48°30'N")
      expect(ddm.isValid()).toBe(true)
      expect(ddm.minutes).toBe(30)
    })

    it('should be invalid for an empty string', () => {
      expect(DDM('').isValid()).toBe(false)
    })

    it('should be invalid for an unrecognized string', () => {
      expect(DDM('invalid').isValid()).toBe(false)
    })
  })

  describe('isValid', () => {
    it('should return true for degrees 0 minutes 0', () => {
      expect(DDM({ degrees: 0, minutes: 0 }).isValid()).toBe(true)
    })

    it('should return false if degrees is null', () => {
      expect(DDM('invalid').isValid()).toBe(false)
    })
  })

  describe('format', () => {
    it('should format a value without direction', () => {
      expect(DDM({ degrees: 48, minutes: 51.396 }).toString(2)).toBe("48° 51.40'")
    })

    it('should format a value with direction', () => {
      expect(DDM({ degrees: 48, minutes: 51.396, direction: 'N' }).toString(2)).toBe("48° 51.40' N")
    })

    it('should respect decimalPlaces', () => {
      const ddm = DDM({ degrees: 48, minutes: 51.396 })
      expect(ddm.toString(3)).toBe("48° 51.396'")
      expect(ddm.toString(1)).toBe("48° 51.4'")
    })

    it('should return empty string if invalid', () => {
      expect(DDM('invalid').toString(2)).toBe('')
    })

    it('should throw if decimalPlaces is 0', () => {
      expect(() => DDM({ degrees: 48, minutes: 51.396 }).toString(0)).toThrow()
    })

    it('should throw if decimalPlaces is negative', () => {
      expect(() => DDM({ degrees: 48, minutes: 51.396 }).toString(-1)).toThrow()
    })

    it('should throw if decimalPlaces is a float', () => {
      expect(() => DDM({ degrees: 48, minutes: 51.396 }).toString(1.5)).toThrow()
    })

    it('should throw if decimalPlaces is a string', () => {
      expect(() => DDM({ degrees: 48, minutes: 51.396 }).toString('2')).toThrow()
    })
  })

  describe('toDecimal', () => {
    it('should return null if invalid', () => {
      expect(DDM('invalid').toDecimal()).toBe(null)
    })

    it('should return value and null direction', () => {
      const result = DDM({ degrees: 48, minutes: 30 }).toDecimal()
      expect(result.degrees).toBe(48.5)
      expect(result.direction).toBe(null)
    })

    it('should return value and direction', () => {
      const result = DDM({ degrees: 48, minutes: 30, direction: 'O' }).toDecimal()
      expect(result.degrees).toBe(48.5)
      expect(result.direction).toBe('O')
    })

    it('should return value 0 for degrees 0 minutes 0', () => {
      const result = DDM({ degrees: 0, minutes: 0 }).toDecimal()
      expect(result.degrees).toBe(0)
      expect(result.direction).toBe(null)
    })
  })
})
