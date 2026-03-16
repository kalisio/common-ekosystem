import { describe, it, expect } from 'vitest'
import { converter } from '../../../src/core/coordinate-formats/converter.js'
import { COORDINATE_MODELS } from '../../../src/core/coordinate.js'

const { DD, DDM_AERO: DDMAero } = COORDINATE_MODELS

describe('converter', () => {
  describe('DD', () => {
    it('should return the same DD instance', () => {
      const dd = DD({ degrees: 48.8566, direction: 'N' })
      expect(converter.DD(dd)).toBe(dd)
    })

    it('should throw if dd is not valid', () => {
      expect(() => converter.DD(DD('invalid'))).toThrow()
    })
  })

  describe('DDM', () => {
    it('should convert a DD to DDM', () => {
      const dd = DD({ degrees: 48.5, direction: 'N' })
      const ddm = converter.DDM(dd)
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBeCloseTo(30)
      expect(ddm.direction).toBe('N')
    })

    it('should convert a DD without direction to DDM', () => {
      const dd = DD({ degrees: 48.5 })
      const ddm = converter.DDM(dd)
      expect(ddm.isValid()).toBe(true)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBeCloseTo(30)
      expect(ddm.direction).toBe(null)
    })

    it('should correctly split degrees and minutes', () => {
      const dd = DD({ degrees: 48.75, direction: 'N' })
      const ddm = converter.DDM(dd)
      expect(ddm.degrees).toBe(48)
      expect(ddm.minutes).toBeCloseTo(45)
    })

    it('should throw if dd is not valid', () => {
      expect(() => converter.DDM(DD('invalid'))).toThrow()
    })
  })

  describe('DMS', () => {
    it('should convert a DD to DMS', () => {
      const dd = DD({ degrees: 48.5, direction: 'N' })
      const dms = converter.DMS(dd)
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(30)
      expect(dms.seconds).toBeCloseTo(0)
      expect(dms.direction).toBe('N')
    })

    it('should convert a DD without direction to DMS', () => {
      const dd = DD({ degrees: 48.5 })
      const dms = converter.DMS(dd)
      expect(dms.isValid()).toBe(true)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(30)
      expect(dms.direction).toBe(null)
    })

    it('should correctly split degrees, minutes and seconds', () => {
      const dd = DD({ degrees: 48 + 51 / 60 + 36 / 3600, direction: 'N' })
      const dms = converter.DMS(dd)
      expect(dms.degrees).toBe(48)
      expect(dms.minutes).toBe(51)
      expect(dms.seconds).toBeCloseTo(36)
    })

    it('should throw if dd is not valid', () => {
      expect(() => converter.DMS(DD('invalid'))).toThrow()
    })
  })

  describe('DDM_AERO', () => {
    it('should convert a DD to DDMAero', () => {
      const dd = DD({ degrees: 48.5, direction: 'N' })
      const aero = converter.DDM_AERO(dd)
      expect(aero.isValid()).toBe(true)
      expect(aero.degrees).toBe(48)
      expect(aero.minutes).toBeCloseTo(30)
      expect(aero.direction).toBe('N')
    })

    it('should correctly split degrees and minutes', () => {
      const dd = DD({ degrees: 48.75, direction: 'E' })
      const aero = converter.DDM_AERO(dd)
      expect(aero.degrees).toBe(48)
      expect(aero.minutes).toBeCloseTo(45)
      expect(aero.direction).toBe('E')
    })

    it('should throw if dd is not valid', () => {
      expect(() => converter.DDM_AERO(DD('invalid'))).toThrow()
    })
  })
})

describe('integration', () => {
  it('should round trip DD → DDM → DMS → DD', () => {
    const original = DD({ degrees: 48.8566, direction: 'N' })
    const ddm = converter.DDM(original)
    const dmsCoord = converter.DMS(ddm.toDecimal())
    const back = converter.DD(dmsCoord.toDecimal())
    expect(back.degrees).toBeCloseTo(48.8566, 4)
    expect(back.direction).toBe('N')
  })

  it('should round trip DDMAero → DMS → DDMAero', () => {
    const original = DDMAero('48510N')
    const dmsCoord = converter.DMS(original.toDecimal())
    const back = converter.DDM_AERO(dmsCoord.toDecimal())
    expect(back.isValid()).toBe(true)
    expect(back.degrees).toBe(48)
    expect(back.minutes).toBeCloseTo(51)
    expect(back.direction).toBe('N')
  })
})
