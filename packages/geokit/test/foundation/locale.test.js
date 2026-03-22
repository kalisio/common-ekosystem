import { describe, it, expect, beforeEach } from 'vitest'
import { listLocales, registerLocale, setLocale, getLocale } from '../../src/foundation/locale.js'

beforeEach(() => {
  setLocale('en')
})

describe('listLocales', () => {
  it('should return at least en and fr', () => {
    const list = listLocales()
    expect(list).toContain('en')
    expect(list).toContain('fr')
  })

  it('should return an array of strings', () => {
    listLocales().forEach(code => expect(typeof code).toBe('string'))
  })
})

describe('registerLocale', () => {
  it('should throw if code is not a string', () => {
    expect(() => registerLocale(42, {})).toThrow()
    expect(() => registerLocale(null, {})).toThrow()
  })

  it('should throw if code is already registered', () => {
    expect(() => registerLocale('en', {})).toThrow()
    expect(() => registerLocale('fr', {})).toThrow()
  })

  it('should throw if content is not a plain object', () => {
    expect(() => registerLocale('xx', null)).toThrow()
    expect(() => registerLocale('xx', 'string')).toThrow()
    expect(() => registerLocale('xx', 42)).toThrow()
  })

  it('should throw if content does not conform to schema', () => {
    expect(() => registerLocale('xx', {})).toThrow()
    expect(() => registerLocale('xx', { DIRECTIONS: {} })).toThrow()
    expect(() => registerLocale('xx', {
      DIRECTIONS: {
        NORTH: { label: 'North' } // missing symbol
      }
    })).toThrow()
  })

  it('should register a valid locale', () => {
    const content = {
      DIRECTIONS: {
        NORTH: { label: 'North', symbol: 'N' },
        SOUTH: { label: 'South', symbol: 'S' },
        EAST: { label: 'East', symbol: 'E' },
        WEST: { label: 'West', symbol: 'W' }
      }
    }
    registerLocale('test', content)
    expect(listLocales()).toContain('test')
  })
})

describe('setLocale', () => {
  it('should throw if code is not a string', () => {
    expect(() => setLocale(42)).toThrow()
    expect(() => setLocale(null)).toThrow()
  })

  it('should throw if code is unknown', () => {
    expect(() => setLocale('unknown')).toThrow()
  })

  it('should set the current locale', () => {
    setLocale('fr')
    expect(getLocale().code).toBe('fr')
  })
})

describe('getLocale', () => {
  it('should return the current locale code', () => {
    expect(getLocale().code).toBe('en')
  })

  it('should return the current locale content', () => {
    const { content } = getLocale()
    expect(content.DIRECTIONS.NORTH.symbol).toBe('N')
    expect(content.DIRECTIONS.SOUTH.symbol).toBe('S')
    expect(content.DIRECTIONS.EAST.symbol).toBe('E')
    expect(content.DIRECTIONS.WEST.symbol).toBe('W')
  })

  it('should reflect locale change', () => {
    setLocale('fr')
    const { content } = getLocale()
    expect(content.DIRECTIONS.WEST.symbol).toBe('O')
    expect(content.DIRECTIONS.NORTH.label).toBe('Nord')
  })
})
