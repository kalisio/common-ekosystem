import { cast } from '../../src/utilities/cast.js'

describe('cast.number', () => {
  it('preserves valid numbers', () => {
    expect(cast.number(42)).toBe(42)
    expect(cast.number(0)).toBe(0)
    expect(cast.number(-1.5)).toBe(-1.5)
  })
  it('converts decimal strings', () => {
    expect(cast.number('42')).toBe(42)
    expect(cast.number('  -1.5  ')).toBe(-1.5)
    expect(cast.number('+2.')).toBe(2)
    expect(cast.number('.5')).toBe(0.5)
    expect(cast.number('1e3')).toBe(1000)
    expect(cast.number('-2.5E-2')).toBe(-0.025)
  })
  it('rejects unsupported formats', () => {
    for (const value of ['', ' ', '0x10', '0b10', '0o10', 'Infinity', 'NaN', '1_000', '42px', '1,5', '.', '1e']) {
      expect(cast.number(value)).toBeUndefined()
    }
  })
  it('rejects invalid types and non-finite numbers', () => {
    for (const value of [null, undefined, true, false, {}, [], 42n, NaN, Infinity, -Infinity]) {
      expect(cast.number(value)).toBeUndefined()
    }
  })
  it('rejects overflow and allows underflow', () => {
    expect(cast.number('1e999')).toBeUndefined()
    expect(cast.number('1e-999')).toBe(0)
  })
  it('round-trips with cast.string, exponent notation included', () => {
    for (const value of [1e21, 1e-7, -0.5]) {
      expect(cast.number(cast.string(value))).toBe(value)
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = { invalid: true }
    expect(cast.number('invalid', fallback)).toBe(fallback)
    expect(cast.number(null, 10)).toBe(10)
  })
})

describe('cast.integer', () => {
  it('preserves safe integers', () => {
    expect(cast.integer(42)).toBe(42)
    expect(cast.integer(-42)).toBe(-42)
    expect(cast.integer(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
  })
  it('converts integer-valued decimal strings', () => {
    expect(cast.integer('42')).toBe(42)
    expect(cast.integer('42.0')).toBe(42)
    expect(cast.integer('1e3')).toBe(1000)
  })
  it('rejects fractions and unsafe integers', () => {
    expect(cast.integer(1.5)).toBeUndefined()
    expect(cast.integer('1.5')).toBeUndefined()
    expect(cast.integer(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined()
    expect(cast.integer('9007199254740992')).toBeUndefined()
  })
  it('is limited by float precision', () => {
    expect(cast.integer('1.0000000000000001')).toBe(1)
  })
  it('returns the fallback for unsupported values', () => {
    expect(cast.integer('invalid', 7)).toBe(7)
    expect(cast.integer(null, 7)).toBe(7)
    expect(cast.integer(true)).toBeUndefined()
  })
})

describe('cast.boolean', () => {
  it('preserves booleans', () => {
    expect(cast.boolean(true)).toBe(true)
    expect(cast.boolean(false)).toBe(false)
  })
  it('converts numeric zero and one', () => {
    expect(cast.boolean(1)).toBe(true)
    expect(cast.boolean(0)).toBe(false)
    expect(cast.boolean(-0)).toBe(false)
  })
  it('converts supported strings case-insensitively', () => {
    for (const value of ['true', 'TRUE', ' True ', '1']) {
      expect(cast.boolean(value)).toBe(true)
    }
    for (const value of ['false', 'FALSE', ' False ', '0']) {
      expect(cast.boolean(value)).toBe(false)
    }
  })
  it('rejects ambiguous values', () => {
    for (const value of [2, -1, NaN, null, undefined, '', 'maybe', 'yes', 'no', 'on', 'off', 'oui', {}, []]) {
      expect(cast.boolean(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = { invalid: true }
    expect(cast.boolean('maybe', fallback)).toBe(fallback)
  })
})

describe('cast.string', () => {
  it('preserves strings', () => {
    expect(cast.string('hello')).toBe('hello')
    expect(cast.string('')).toBe('')
  })
  it('converts finite numbers and booleans', () => {
    expect(cast.string(42)).toBe('42')
    expect(cast.string(-1.5)).toBe('-1.5')
    expect(cast.string(true)).toBe('true')
    expect(cast.string(false)).toBe('false')
  })
  it('rejects unsupported values', () => {
    for (const value of [null, undefined, NaN, Infinity, -Infinity, 42n, Symbol('x'), {}, [], new Date()]) {
      expect(cast.string(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = { invalid: true }
    expect(cast.string(null, fallback)).toBe(fallback)
  })
})

describe('cast.date', () => {
  it('preserves valid Date instances', () => {
    const date = new Date('2026-11-01T14:30:00Z')
    expect(cast.date(date)).toBe(date)
  })
  it('converts ISO date-only strings as UTC', () => {
    expect(cast.date('2026-11-01')?.toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(cast.date(' 2024-02-29 ')?.toISOString()).toBe('2024-02-29T00:00:00.000Z')
  })
  it('converts ISO date-time strings with explicit offsets', () => {
    expect(cast.date('2026-11-01T14:30Z')?.toISOString()).toBe('2026-11-01T14:30:00.000Z')
    expect(cast.date('2026-11-01T14:30:00Z')?.toISOString()).toBe('2026-11-01T14:30:00.000Z')
    expect(cast.date('2026-11-01T14:30:00.123Z')?.toISOString()).toBe('2026-11-01T14:30:00.123Z')
    expect(cast.date('2026-11-01T14:30:00+01:00')?.toISOString()).toBe('2026-11-01T13:30:00.000Z')
  })
  it('converts integer timestamps in milliseconds', () => {
    const timestamp = Date.parse('2026-11-01T14:30:00Z')
    expect(cast.date(timestamp)?.getTime()).toBe(timestamp)
    expect(cast.date(0)?.toISOString()).toBe('1970-01-01T00:00:00.000Z')
  })
  it('rejects timestamps outside the Date range', () => {
    expect(cast.date(8.64e15)?.toISOString()).toBe('+275760-09-13T00:00:00.000Z')
    expect(cast.date(8.64e15 + 1)).toBeUndefined()
  })
  it('rejects invalid calendar dates', () => {
    for (const value of ['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '2026-02-30T10:00Z']) {
      expect(cast.date(value)).toBeUndefined()
    }
  })
  it('rejects unsupported date formats', () => {
    for (const value of [
      '', ' ', '2026/11/01', '11/01/2026', '1', '42', '1730419200000',
      '2026-11-01T14:30:00',
      '2026-11-01T14:30:00.1Z',
      '2026-11-01T14:30:00.1234Z',
      '2026-11-01T14:30:00z',
      '2026-11-01T14:30:00+0100',
      '2026-11-01T14:30:00+24:00', // rejected by the engine, not by the regex
      'invalid'
    ]) {
      expect(cast.date(value)).toBeUndefined()
    }
  })
  it('rejects invalid Date instances and unsupported types', () => {
    for (const value of [new Date(NaN), null, undefined, true, 1.5, NaN, Infinity, {}, []]) {
      expect(cast.date(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = new Date(0)
    expect(cast.date('invalid', fallback)).toBe(fallback)
    expect(cast.date(new Date(NaN), fallback)).toBe(fallback)
  })
})

describe('cast.array', () => {
  it('preserves arrays', () => {
    const array = [1, 2, 3]
    expect(cast.array(array)).toBe(array)
  })
  it('converts sets to arrays', () => {
    expect(cast.array(new Set([1, 2, 3]))).toEqual([1, 2, 3])
  })
  it('converts maps to arrays of entries', () => {
    expect(cast.array(new Map([['a', 1], ['b', 2]]))).toEqual([['a', 1], ['b', 2]])
  })
  it('rejects unsupported values', () => {
    for (const value of [null, undefined, 'abc', 42, {}, true]) {
      expect(cast.array(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = []
    expect(cast.array('invalid', fallback)).toBe(fallback)
  })
})

describe('cast.object', () => {
  it('preserves plain objects', () => {
    const object = { a: 1 }
    expect(cast.object(object)).toBe(object)
  })
  it('converts maps with string keys to plain objects', () => {
    expect(cast.object(new Map([['a', 1], ['b', 2]]))).toEqual({ a: 1, b: 2 })
  })
  it('preserves __proto__ as an own property', () => {
    const object = cast.object(new Map([['__proto__', 42]]))
    expect(Object.entries(object)).toEqual([['__proto__', 42]])
    expect(Object.getPrototypeOf(object)).toBe(Object.prototype)
  })
  it('returns plain objects with an own __proto__ as-is', () => {
    const object = JSON.parse('{"__proto__": 42}')
    expect(cast.object(object)).toBe(object)
  })
  it('rejects maps with non-string keys', () => {
    expect(cast.object(new Map([[1, 'one']]))).toBeUndefined()
    expect(cast.object(new Map([[Symbol('a'), 1]]))).toBeUndefined()
  })
  it('rejects unsupported values', () => {
    for (const value of [null, undefined, [], new Date(), new Set(), 'abc', 42]) {
      expect(cast.object(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = {}
    expect(cast.object(new Map([[1, 'one']]), fallback)).toBe(fallback)
  })
})

describe('cast.map', () => {
  it('preserves maps', () => {
    const map = new Map([['a', 1]])
    expect(cast.map(map)).toBe(map)
  })
  it('converts plain objects to maps', () => {
    expect([...cast.map({ a: 1, b: 2 })]).toEqual([['a', 1], ['b', 2]])
  })
  it('converts arrays of key-value pairs to maps', () => {
    expect([...cast.map([['a', 1], ['b', 2]])]).toEqual([['a', 1], ['b', 2]])
  })
  it('rejects duplicate keys in arrays', () => {
    expect(cast.map([['a', 1], ['a', 2]])).toBeUndefined()
  })
  it('rejects malformed entries', () => {
    for (const value of [[['a']], [['a', 1, 2]], ['a', 'b'], [[1, 2], null]]) {
      expect(cast.map(value)).toBeUndefined()
    }
  })
  it('rejects objects with symbol keys', () => {
    const symbol = Symbol('key')
    expect(cast.map({ [symbol]: 1, a: 2 })).toBeUndefined()
  })
  it('converts only own enumerable string properties', () => {
    const object = { a: 1 }
    Object.defineProperty(object, 'hidden', { value: 2, enumerable: false })
    expect([...cast.map(object)]).toEqual([['a', 1]])
  })
  it('rejects unsupported values', () => {
    for (const value of [null, undefined, 'abc', 42, new Set(), new Date()]) {
      expect(cast.map(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = new Map()
    expect(cast.map('invalid', fallback)).toBe(fallback)
  })
})

describe('cast.set', () => {
  it('preserves sets', () => {
    const set = new Set([1, 2])
    expect(cast.set(set)).toBe(set)
  })
  it('converts arrays to sets', () => {
    expect([...cast.set([1, 2, 2, 3])]).toEqual([1, 2, 3])
  })
  it('preserves object references inside sets', () => {
    const object = { a: 1 }
    const set = cast.set([object])
    expect([...set][0]).toBe(object)
  })
  it('rejects unsupported values', () => {
    for (const value of [null, undefined, 'abc', 42, {}, new Map()]) {
      expect(cast.set(value)).toBeUndefined()
    }
  })
  it('returns the fallback unchanged', () => {
    const fallback = new Set()
    expect(cast.set('invalid', fallback)).toBe(fallback)
  })
})
