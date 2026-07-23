import { describe, it, expect, beforeEach } from 'vitest'
import {
  listLocales,
  registerMessages,
  setLocale,
  getLocale,
  getMessages,
  getActiveLocales
} from '../../src/foundation/localization.js'

beforeEach(() => {
  setLocale('en')
})

const validMessages = {
  DIRECTIONS: {
    NORTH: { label: 'North', symbol: 'N' },
    SOUTH: { label: 'South', symbol: 'S' },
    EAST: { label: 'East', symbol: 'E' },
    WEST: { label: 'West', symbol: 'W' }
  }
}

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

describe('registerMessages', () => {
  it('should throw if code is not a string', () => {
    expect(() => registerMessages(42, {})).toThrow()
    expect(() => registerMessages(null, {})).toThrow()
  })
  it('should throw if code is already registered', () => {
    expect(() => registerMessages('en', {})).toThrow()
    expect(() => registerMessages('fr', {})).toThrow()
  })
  it('should throw if messages is not a plain object', () => {
    expect(() => registerMessages('xx', null)).toThrow()
    expect(() => registerMessages('xx', 'string')).toThrow()
    expect(() => registerMessages('xx', 42)).toThrow()
  })
  it('should throw if messages do not conform to schema', () => {
    expect(() => registerMessages('xx', {})).toThrow()
    expect(() => registerMessages('xx', { DIRECTIONS: {} })).toThrow()
    expect(() => registerMessages('xx', {
      DIRECTIONS: {
        NORTH: { label: 'North' }
      }
    })).toThrow()
  })
  it('should throw if a symbol is not a single character', () => {
    expect(() => registerMessages('xx', {
      DIRECTIONS: {
        NORTH: { label: 'North', symbol: 'NN' },
        SOUTH: { label: 'South', symbol: 'S' },
        EAST: { label: 'East', symbol: 'E' },
        WEST: { label: 'West', symbol: 'W' }
      }
    })).toThrow()
  })
  it('should register valid messages', () => {
    // No unregister exists; use a code unlikely to collide with other tests.
    if (!listLocales().includes('test')) {
      registerMessages('test', validMessages)
    }
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
  it('should return the current messages via getMessages', () => {
    const messages = getMessages(getLocale())
    expect(messages.DIRECTIONS.NORTH.symbol).toBe('N')
    expect(messages.DIRECTIONS.SOUTH.symbol).toBe('S')
    expect(messages.DIRECTIONS.EAST.symbol).toBe('E')
    expect(messages.DIRECTIONS.WEST.symbol).toBe('W')
  })
  it('should reflect locale change', () => {
    setLocale('fr')
    const messages = getMessages(getLocale())
    expect(messages.DIRECTIONS.WEST.symbol).toBe('O')
    expect(messages.DIRECTIONS.NORTH.label).toBe('Nord')
  })
})

describe('getMessages', () => {
  it('should return the messages of a known locale', () => {
    expect(getMessages('fr').DIRECTIONS.WEST.symbol).toBe('O')
    expect(getMessages('en').DIRECTIONS.WEST.symbol).toBe('W')
  })
  it('should throw if code is not a string', () => {
    expect(() => getMessages(42)).toThrow()
    expect(() => getMessages(null)).toThrow()
  })
  it('should throw if code is unknown', () => {
    expect(() => getMessages('unknown')).toThrow()
  })
  it('should not depend on the current locale', () => {
    setLocale('fr')
    expect(getMessages('en').DIRECTIONS.WEST.symbol).toBe('W')
  })
})

describe('getActiveLocales', () => {
  it('returns only the current locale when it is the fallback', () => {
    setLocale('en')
    expect(getActiveLocales()).toEqual(['en'])
  })
  it('returns current then fallback when they differ', () => {
    setLocale('fr')
    expect(getActiveLocales()).toEqual(['fr', 'en'])
  })
})
