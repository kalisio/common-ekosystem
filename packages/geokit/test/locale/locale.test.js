import { describe, it, beforeEach, expect } from 'vitest'
import {
  registerLocale,
  setLocale,
  getLocale
} from '../../src/locale/index.js'

describe('locale module', () => {
  beforeEach(() => {
    // Always reset to default locale before each test
    setLocale('en')
  })

  describe('getLocale', () => {
    it('should return the default locale (en)', () => {
      const locale = getLocale()
      expect(locale).toBeDefined()
      expect(locale.DIRECTIONS).toBeDefined()
      expect(locale.DIRECTIONS.NORTH.label).toBe('North')
      expect(locale.DIRECTIONS.WEST.symbol).toBe('W')
    })

    it('should return french locale after switching', () => {
      setLocale('fr')
      const locale = getLocale()
      expect(locale.DIRECTIONS.NORTH.label).toBe('Nord')
      expect(locale.DIRECTIONS.WEST.symbol).toBe('O')
    })
  })

  describe('setLocale', () => {
    it('should switch locale correctly', () => {
      setLocale('fr')
      expect(getLocale().DIRECTIONS.SOUTH.label).toBe('Sud')
      setLocale('en')
      expect(getLocale().DIRECTIONS.SOUTH.label).toBe('South')
    })

    it('should throw if code is not a string', () => {
      expect(() => setLocale(null)).toThrow('code must be a string')
      expect(() => setLocale(123)).toThrow('code must be a string')
      expect(() => setLocale({})).toThrow('code must be a string')
    })

    it('should throw if locale is not registered', () => {
      expect(() => setLocale('unknown'))
        .toThrow('code must be a well-known locale')
    })
  })

  describe('registerLocale', () => {
    it('should register a valid spanish locale', () => {
      const spanishLocale = {
        DIRECTIONS: {
          NORTH: { label: 'Norte', symbol: 'N' },
          SOUTH: { label: 'Sur', symbol: 'S' },
          EAST: { label: 'Este', symbol: 'E' },
          WEST: { label: 'Oeste', symbol: 'O' }
        }
      }
      registerLocale('es', spanishLocale)
      setLocale('es')
      const locale = getLocale()
      expect(locale.DIRECTIONS.NORTH.label).toBe('Norte')
      expect(locale.DIRECTIONS.SOUTH.label).toBe('Sur')
      expect(locale.DIRECTIONS.WEST.symbol).toBe('O')
    })

    it('should override an existing locale', () => {
      const customEn = {
        DIRECTIONS: {
          NORTH: { label: 'Up', symbol: 'U' },
          SOUTH: { label: 'Down', symbol: 'D' },
          EAST: { label: 'Right', symbol: 'R' },
          WEST: { label: 'Left', symbol: 'L' }
        }
      }
      registerLocale('en', customEn)
      setLocale('en')
      expect(getLocale().DIRECTIONS.NORTH.label).toBe('Up')
    })

    it('should throw if code is not a string', () => {
      const validLocale = {
        DIRECTIONS: {
          NORTH: { label: 'X', symbol: 'X' },
          SOUTH: { label: 'X', symbol: 'X' },
          EAST: { label: 'X', symbol: 'X' },
          WEST: { label: 'X', symbol: 'X' }
        }
      }
      expect(() =>
        registerLocale(123, validLocale)
      ).toThrow('code must be a string')
    })

    it('should throw if locale is not an object', () => {
      expect(() =>
        registerLocale('bad', null)
      ).toThrow('locale must be an object')
    })

    it('should throw if locale does not match schema (missing DIRECTIONS)', () => {
      const invalidLocale = {}
      expect(() =>
        registerLocale('bad', invalidLocale)
      ).toThrow('locale is not conforms with the required schema')
    })

    it('should throw if a direction is missing', () => {
      const invalidLocale = {
        DIRECTIONS: {
          NORTH: { label: 'X', symbol: 'X' }
          // Missing SOUTH, EAST, WEST
        }
      }
      expect(() =>
        registerLocale('bad', invalidLocale)
      ).toThrow('locale is not conforms with the required schema')
    })

    it('should throw if label is not a string', () => {
      const invalidLocale = {
        DIRECTIONS: {
          NORTH: { label: 123, symbol: 'N' },
          SOUTH: { label: 'X', symbol: 'S' },
          EAST: { label: 'X', symbol: 'E' },
          WEST: { label: 'X', symbol: 'W' }
        }
      }
      expect(() =>
        registerLocale('bad', invalidLocale)
      ).toThrow('locale is not conforms with the required schema')
    })

    it('should throw if symbol is not a string', () => {
      const invalidLocale = {
        DIRECTIONS: {
          NORTH: { label: 'X', symbol: null },
          SOUTH: { label: 'X', symbol: 'S' },
          EAST: { label: 'X', symbol: 'E' },
          WEST: { label: 'X', symbol: 'W' }
        }
      }
      expect(() =>
        registerLocale('bad', invalidLocale)
      ).toThrow('locale is not conforms with the required schema')
    })
  })
})
