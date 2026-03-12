import { describe, it, expect, beforeEach } from 'vitest'
import { locale, directions } from '../../src/core'

describe('directions', () => {
  beforeEach(() => {
    locale.set('en')
  })

  describe('frozen', () => {
    it('cannot be mutated', () => {
      expect(() => { directions.get = null }).toThrow()
    })
  })

  describe('get', () => {
    it('returns the directions object from the current locale', () => {
      const d = directions.get()
      expect(d).toHaveProperty('NORTH')
      expect(d).toHaveProperty('SOUTH')
      expect(d).toHaveProperty('EAST')
      expect(d).toHaveProperty('WEST')
    })

    it('content is frozen — mutations throw', () => {
      const d = directions.get()
      expect(() => { d.NORTH.label = 'oops' }).toThrow()
    })

    it('reflects the active locale', () => {
      const en = directions.get()
      locale.set('fr')
      const fr = directions.get()
      // structure is the same but content may differ
      expect(fr).toHaveProperty('NORTH')
      expect(fr).not.toBe(en)
    })
  })

  describe('getNorth / getSouth / getEast / getWest', () => {
    it('returns NORTH with label and symbol', () => {
      const n = directions.getNorth()
      expect(n).toHaveProperty('label')
      expect(n).toHaveProperty('symbol')
    })

    it('returns SOUTH with label and symbol', () => {
      const s = directions.getSouth()
      expect(s).toHaveProperty('label')
      expect(s).toHaveProperty('symbol')
    })

    it('returns EAST with label and symbol', () => {
      const e = directions.getEast()
      expect(e).toHaveProperty('label')
      expect(e).toHaveProperty('symbol')
    })

    it('returns WEST with label and symbol', () => {
      const w = directions.getWest()
      expect(w).toHaveProperty('label')
      expect(w).toHaveProperty('symbol')
    })
  })

  describe('isNorth', () => {
    it('recognizes N and North (case insensitive)', () => {
      expect(directions.isNorth('N')).toBe(true)
      expect(directions.isNorth('n')).toBe(true)
      expect(directions.isNorth('North')).toBe(true)
      expect(directions.isNorth('NORTH')).toBe(true)
    })

    it('rejects other directions', () => {
      expect(directions.isNorth('S')).toBe(false)
      expect(directions.isNorth('E')).toBe(false)
      expect(directions.isNorth('W')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => directions.isNorth(42)).toThrow()
      expect(() => directions.isNorth(null)).toThrow()
    })
  })

  describe('isSouth', () => {
    it('recognizes S and South (case insensitive)', () => {
      expect(directions.isSouth('S')).toBe(true)
      expect(directions.isSouth('s')).toBe(true)
      expect(directions.isSouth('South')).toBe(true)
      expect(directions.isSouth('SOUTH')).toBe(true)
    })

    it('rejects other directions', () => {
      expect(directions.isSouth('N')).toBe(false)
      expect(directions.isSouth('E')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => directions.isSouth(null)).toThrow()
    })
  })

  describe('isEast', () => {
    it('recognizes E and East (case insensitive)', () => {
      expect(directions.isEast('E')).toBe(true)
      expect(directions.isEast('e')).toBe(true)
      expect(directions.isEast('East')).toBe(true)
      expect(directions.isEast('EAST')).toBe(true)
    })

    it('rejects other directions', () => {
      expect(directions.isEast('W')).toBe(false)
      expect(directions.isEast('N')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => directions.isEast(null)).toThrow()
    })
  })

  describe('isWest', () => {
    it('recognizes W and West (case insensitive)', () => {
      expect(directions.isWest('W')).toBe(true)
      expect(directions.isWest('w')).toBe(true)
      expect(directions.isWest('West')).toBe(true)
      expect(directions.isWest('WEST')).toBe(true)
    })

    it('rejects other directions', () => {
      expect(directions.isWest('E')).toBe(false)
      expect(directions.isWest('S')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => directions.isWest(null)).toThrow()
    })
  })

  describe('isDirection', () => {
    it('returns true for any valid direction', () => {
      expect(directions.isDirection('N')).toBe(true)
      expect(directions.isDirection('S')).toBe(true)
      expect(directions.isDirection('E')).toBe(true)
      expect(directions.isDirection('W')).toBe(true)
      expect(directions.isDirection('North')).toBe(true)
      expect(directions.isDirection('south')).toBe(true)
    })

    it('returns false for unknown values', () => {
      expect(directions.isDirection('foo')).toBe(false)
      expect(directions.isDirection('X')).toBe(false)
    })
  })

  describe('locale switch', () => {
    it('reflects direction labels from the active locale', () => {
      locale.set('fr')
      const d = directions.get()
      expect(d).toHaveProperty('NORTH')
      expect(d.NORTH).toHaveProperty('label')
      expect(d.NORTH).toHaveProperty('symbol')
    })
  })
})
