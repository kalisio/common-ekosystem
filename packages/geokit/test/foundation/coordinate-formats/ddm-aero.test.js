import { describe, it, expect } from 'vitest'
import { DDMAero } from '../../../src/foundation/coordinate-formats/ddm-aero.js'

describe('DDMAero', () => {
  describe('from object', () => {
    it('should be valid with degrees, minutes and a latitude direction', () => {
      const ddm = DDMAero({ degrees: 48, minutes: 51.3, direction: 'N' })
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51.3)
      expect(ddm.direction).toBe('N')
    })

    it('should be valid with a longitude direction', () => {
      const ddm = DDMAero({ degrees: 2, minutes: 20.9, direction: 'E' })
      expect(ddm.isValid()).toBe(true)
      expect(ddm.direction).toBe('E')
    })

    it('should be valid with all zeros', () => {
      const ddm = DDMAero({ degrees: 0, minutes: 0, direction: 'N' })
      expect(ddm.isValid()).toBe(true)
    })

    it('should be valid with minutes close to 60', () => {
      expect(DDMAero({ degrees: 48, minutes: 59.999, direction: 'N' }).isValid()).toBe(true)
    })

    it('should be invalid if minutes is 60', () => {
      expect(DDMAero({ degrees: 48, minutes: 60, direction: 'N' }).isValid()).toBe(false)
    })

    it('should be invalid if minutes is negative', () => {
      expect(DDMAero({ degrees: 48, minutes: -1, direction: 'N' }).isValid()).toBe(false)
    })

    it('should be invalid if degrees is negative', () => {
      expect(DDMAero({ degrees: -1, minutes: 30, direction: 'N' }).isValid()).toBe(false)
    })

    it('should be invalid if degrees is a float', () => {
      expect(DDMAero({ degrees: 48.5, minutes: 30, direction: 'N' }).isValid()).toBe(false)
    })

    it('should be invalid without a direction', () => {
      expect(DDMAero({ degrees: 48, minutes: 30 }).isValid()).toBe(false)
    })

    it('should be invalid with an unknown direction', () => {
      expect(DDMAero({ degrees: 48, minutes: 30, direction: 'X' }).isValid()).toBe(false)
    })

    it('should be invalid if coord is null', () => {
      expect(DDMAero(null).isValid()).toBe(false)
    })

    it('should be invalid if coord is a number', () => {
      expect(DDMAero(42).isValid()).toBe(false)
    })

    it('should be invalid if coord is an array', () => {
      expect(DDMAero([]).isValid()).toBe(false)
    })
  })

  describe('from string', () => {
    it('should parse a latitude string', () => {
      const ddm = DDMAero('48510N')
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBe(51)
      expect(ddm.direction).toBe('N')
    })

    it('should parse a latitude string with decimal minutes', () => {
      const ddm = DDMAero('48513N')
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBeCloseTo(51.3)
      expect(ddm.direction).toBe('N')
    })

    it('should parse a S direction', () => {
      expect(DDMAero('48510S').direction).toBe('S')
    })

    it('should parse a longitude string', () => {
      const ddm = DDMAero('002209E')
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(2)
      expect(ddm.minutes).toBeCloseTo(20.9)
      expect(ddm.direction).toBe('E')
    })

    it('should parse a W direction', () => {
      expect(DDMAero('002209W').direction).toBe('W')
    })

    it('should be invalid if string contains whitespace', () => {
      expect(DDMAero('48510 N').isValid()).toBe(false)
    })

    it('should parse ignoring leading and trailing whitespace', () => {
      expect(DDMAero('  48510N  ').isValid()).toBe(true)
    })

    it('should be invalid for an empty string', () => {
      expect(DDMAero('').isValid()).toBe(false)
    })

    it('should be invalid for an unrecognized string', () => {
      expect(DDMAero('invalid').isValid()).toBe(false)
    })

    it('should be invalid for a string without direction', () => {
      expect(DDMAero('4851').isValid()).toBe(false)
    })
  })

  describe('isValid', () => {
    it('should return true for valid coord', () => {
      expect(DDMAero({ degrees: 0, minutes: 0, direction: 'N' }).isValid()).toBe(true)
    })

    it('should return false if direction is null', () => {
      expect(DDMAero('invalid').isValid()).toBe(false)
    })
  })

  describe('format', () => {
    it('should format a latitude coordinate', () => {
      expect(DDMAero({ degrees: 48, minutes: 51.3, direction: 'N' }).toString()).toBe('48513N')
    })

    it('should format a longitude coordinate with 3 degree digits', () => {
      expect(DDMAero({ degrees: 2, minutes: 20.9, direction: 'E' }).toString()).toBe('002209E')
    })

    it('should format S direction', () => {
      expect(DDMAero({ degrees: 48, minutes: 51.3, direction: 'S' }).toString()).toBe('48513S')
    })

    it('should format W direction', () => {
      expect(DDMAero({ degrees: 2, minutes: 20.9, direction: 'W' }).toString()).toBe('002209W')
    })

    it('should return empty string if invalid', () => {
      expect(DDMAero('invalid').toString()).toBe('')
    })
  })

  describe('toDecimal', () => {
    it('should return null if invalid', () => {
      expect(DDMAero('invalid').toDecimal()).toBe(null)
    })

    it('should return value and direction', () => {
      const result = DDMAero({ degrees: 48, minutes: 30, direction: 'N' }).toDecimal()
      expect(result.degrees).toBe(48.5)
      expect(result.direction).toBe('N')
    })

    it('should correctly compute decimal from degrees and minutes', () => {
      const result = DDMAero({ degrees: 48, minutes: 51, direction: 'N' }).toDecimal()
      expect(result.degrees).toBeCloseTo(48.85, 4)
    })

    it('should return value 0 for all zeros', () => {
      const result = DDMAero({ degrees: 0, minutes: 0, direction: 'S' }).toDecimal()
      expect(result.degrees).toBe(0)
      expect(result.direction).toBe('S')
    })
  })
})
