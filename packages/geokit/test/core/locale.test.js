import { describe, it, expect, beforeEach } from 'vitest'
import { locale } from '../../src/core/locale.js'

describe('locale', () => {
  beforeEach(() => {
    locale.set('en')
  })

  describe('frozen', () => {
    it('cannot be mutated', () => {
      expect(() => { locale.get = null }).toThrow()
    })
  })

  describe('list', () => {
    it('returns available locale codes', () => {
      const codes = locale.list()
      expect(codes).toContain('en')
      expect(codes).toContain('fr')
    })

    it('returns an array of strings', () => {
      expect(locale.list().every(c => typeof c === 'string')).toBe(true)
    })
  })

  describe('get', () => {
    it('returns { code, content } for the current locale', () => {
      const l = locale.get()
      expect(l).toHaveProperty('code')
      expect(l).toHaveProperty('content')
    })

    it('returns en as default code', () => {
      expect(locale.get().code).toBe('en')
    })

    it('content has DIRECTIONS with NORTH, SOUTH, EAST, WEST', () => {
      const { content } = locale.get()
      expect(content).toHaveProperty('DIRECTIONS')
      for (const key of ['NORTH', 'SOUTH', 'EAST', 'WEST']) {
        expect(content.DIRECTIONS[key]).toHaveProperty('label')
        expect(content.DIRECTIONS[key]).toHaveProperty('symbol')
        expect(typeof content.DIRECTIONS[key].label).toBe('string')
        expect(typeof content.DIRECTIONS[key].symbol).toBe('string')
      }
    })

    it('content is frozen — mutations throw', () => {
      const { content } = locale.get()
      expect(() => { content.DIRECTIONS.NORTH.label = 'oops' }).toThrow()
    })

    it('returns fr after set', () => {
      locale.set('fr')
      expect(locale.get().code).toBe('fr')
      expect(locale.get().content).toHaveProperty('DIRECTIONS')
    })
  })

  describe('set', () => {
    it('switches to fr locale', () => {
      locale.set('fr')
      expect(locale.get().code).toBe('fr')
    })

    it('switches back to en locale', () => {
      locale.set('fr')
      locale.set('en')
      expect(locale.get().code).toBe('en')
    })

    it('throws if code is not a string', () => {
      expect(() => locale.set(42)).toThrow()
      expect(() => locale.set(null)).toThrow()
    })

    it('throws if code is unknown', () => {
      expect(() => locale.set('de')).toThrow()
      expect(() => locale.set('')).toThrow()
    })
  })

  describe('register', () => {
    it('registers a new valid locale', () => {
      const de = {
        DIRECTIONS: {
          NORTH: { label: 'Nord', symbol: 'N' },
          SOUTH: { label: 'Süd', symbol: 'S' },
          EAST: { label: 'Ost', symbol: 'E' },
          WEST: { label: 'West', symbol: 'W' }
        }
      }
      locale.register('de', de)
      expect(locale.list()).toContain('de')
      locale.set('de')
      expect(locale.get().code).toBe('de')
      expect(locale.get().content.DIRECTIONS.NORTH.label).toBe('Nord')
    })

    it('registered content is frozen', () => {
      const de = {
        DIRECTIONS: {
          NORTH: { label: 'Nord', symbol: 'N' },
          SOUTH: { label: 'Süd', symbol: 'S' },
          EAST: { label: 'Ost', symbol: 'E' },
          WEST: { label: 'West', symbol: 'W' }
        }
      }
      locale.register('de2', de)
      locale.set('de2')
      expect(() => { locale.get().content.DIRECTIONS.NORTH.label = 'oops' }).toThrow()
    })

    it('throws if code is not a string', () => {
      expect(() => locale.register(42, {})).toThrow()
    })

    it('throws if locale is already registered', () => {
      expect(() => locale.register('en', { DIRECTIONS: { NORTH: { label: 'North', symbol: 'N' }, SOUTH: { label: 'South', symbol: 'S' }, EAST: { label: 'East', symbol: 'E' }, WEST: { label: 'West', symbol: 'W' } } })).toThrow()
    })

    it('throws if content is not a plain object', () => {
      expect(() => locale.register('xx', 'not an object')).toThrow()
      expect(() => locale.register('xx', null)).toThrow()
    })

    it('throws if content does not conform to the schema', () => {
      expect(() => locale.register('xx', {})).toThrow()
      expect(() => locale.register('xx', { DIRECTIONS: { NORTH: { label: 42, symbol: 'N' } } })).toThrow()
    })
  })
})
