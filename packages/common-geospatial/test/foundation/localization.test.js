import { describe, it, expect, beforeEach } from 'vitest'
import { listLocales, registerLocale, setLocale, getLocale, getLocaleByCode, getAllDirectionSymbols } from '../../src/foundation/localization.js'

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

  it('should throw if a symbol is not a single character', () => {
    expect(() => registerLocale('xx', {
      DIRECTIONS: {
        NORTH: { label: 'North', symbol: 'NN' },
        SOUTH: { label: 'South', symbol: 'S' },
        EAST: { label: 'East', symbol: 'E' },
        WEST: { label: 'West', symbol: 'W' }
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
    expect(getLocale()).toBe('fr')
  })
})

describe('getLocale', () => {
  it('should return the current locale code', () => {
    expect(getLocale()).toBe('en')
  })

  it('should return the current locale content via getLocaleByCode', () => {
    const content = getLocaleByCode(getLocale())
    expect(content.DIRECTIONS.NORTH.symbol).toBe('N')
    expect(content.DIRECTIONS.SOUTH.symbol).toBe('S')
    expect(content.DIRECTIONS.EAST.symbol).toBe('E')
    expect(content.DIRECTIONS.WEST.symbol).toBe('W')
  })

  it('should reflect locale change', () => {
    setLocale('fr')
    const content = getLocaleByCode(getLocale())
    expect(content.DIRECTIONS.WEST.symbol).toBe('O')
    expect(content.DIRECTIONS.NORTH.label).toBe('Nord')
  })
})

describe('getLocaleByCode', () => {
  it('should return the content of a known locale', () => {
    expect(getLocaleByCode('fr').DIRECTIONS.WEST.symbol).toBe('O')
    expect(getLocaleByCode('en').DIRECTIONS.WEST.symbol).toBe('W')
  })

  it('should throw if code is not a string', () => {
    expect(() => getLocaleByCode(42)).toThrow()
    expect(() => getLocaleByCode(null)).toThrow()
  })

  it('should throw if code is unknown', () => {
    expect(() => getLocaleByCode('unknown')).toThrow()
  })

  it('should not depend on the current locale', () => {
    setLocale('fr')
    expect(getLocaleByCode('en').DIRECTIONS.WEST.symbol).toBe('W')
  })
})

describe('getAllDirectionSymbols', () => {
  it('should include the current locale and fallback (en) symbols', () => {
    // Current locale is 'en' (set by beforeEach), fallback is also 'en'.
    const symbols = getAllDirectionSymbols()
    expect(symbols).toContain('N')
    expect(symbols).toContain('S')
    expect(symbols).toContain('E')
    expect(symbols).toContain('W')
    expect(symbols).not.toContain('O') // fr West is not in scope under en
  })

  it('should merge the current locale with the fallback', () => {
    setLocale('fr')
    const symbols = getAllDirectionSymbols()
    expect(symbols).toContain('O') // fr West
    expect(symbols).toContain('W') // en West, from the fallback
    expect(symbols).toContain('N') // shared
  })

  it('should not contain duplicates', () => {
    setLocale('fr')
    const symbols = getAllDirectionSymbols()
    expect(symbols.length).toBe(new Set(symbols).size)
  })

  it('should depend on the current locale', () => {
    setLocale('en')
    const fromEn = getAllDirectionSymbols()
    setLocale('fr')
    const fromFr = getAllDirectionSymbols()
    expect(fromFr).not.toEqual(fromEn)
    expect(fromFr.length).toBeGreaterThan(fromEn.length) // fr adds 'O'
  })

  it('should return a copy, leaving internal state untouched when mutated', () => {
    const first = getAllDirectionSymbols()
    first.push('ZZZ')
    expect(getAllDirectionSymbols()).not.toContain('ZZZ')
  })

  it('should reflect a registered locale once it becomes current', () => {
    registerLocale('zz', {
      DIRECTIONS: {
        NORTH: { label: 'North', symbol: 'Z' },
        SOUTH: { label: 'South', symbol: 'S' },
        EAST: { label: 'East', symbol: 'E' },
        WEST: { label: 'West', symbol: 'W' }
      }
    })
    expect(getAllDirectionSymbols()).not.toContain('Z') // not current yet
    setLocale('zz')
    expect(getAllDirectionSymbols()).toContain('Z') // now in scope
  })
})
