import { Registry } from '../../src/structures/index.js'

const invalidKeys = [undefined, null, '', '   ', 0, 1, true, {}, [], () => {}, Symbol('osm')]

describe('Registry', () => {
  let registry
  beforeEach(() => {
    registry = new Registry('layers')
  })
  it('is empty when created', () => {
    expect(registry.size).toBe(0)
    expect(registry.keys()).toEqual([])
    expect(registry.values()).toEqual([])
    expect(registry.entries()).toEqual([])
  })
  it('exposes its name', () => {
    expect(registry.name).toBe('layers')
    expect(new Registry().name).toBe('registry')
  })
  it('rejects a name that is not a non-empty string', () => {
    for (const name of [null, '', '   ', 1, {}, Symbol('layers')]) {
      expect(() => new Registry(name)).toThrow('name must be a non-empty string')
    }
  })
  it('registers an entry and returns its value', () => {
    const value = { type: 'tile' }
    expect(registry.register('osm', value)).toBe(value)
    expect(registry.get('osm')).toBe(value)
    expect(registry.has('osm')).toBe(true)
    expect(registry.size).toBe(1)
  })
  it('throws when a key is registered twice and keeps the first value', () => {
    const first = { id: 1 }
    registry.register('osm', first)
    expect(() => registry.register('osm', { id: 2 })).toThrow('[layers] entry already registered: osm')
    expect(registry.get('osm')).toBe(first)
    expect(registry.size).toBe(1)
  })
  it('uses a default name in error messages', () => {
    const unnamed = new Registry()
    unnamed.register('osm', {})
    expect(() => unnamed.register('osm', {})).toThrow('[registry] entry already registered: osm')
    expect(() => unnamed.replace('unknown', {})).toThrow('[registry] entry not registered: unknown')
  })
  it('rejects invalid keys in register, replace, get, has and unregister', () => {
    for (const key of invalidKeys) {
      expect(() => registry.register(key, 1)).toThrow('key must be a non-empty string')
      expect(() => registry.replace(key, 1)).toThrow('key must be a non-empty string')
      expect(() => registry.get(key)).toThrow('key must be a non-empty string')
      expect(() => registry.has(key)).toThrow('key must be a non-empty string')
      expect(() => registry.unregister(key)).toThrow('key must be a non-empty string')
    }
    expect(registry.size).toBe(0)
  })
  it('rejects nil values and registers nothing', () => {
    expect(() => registry.register('osm', undefined)).toThrow('value must be defined')
    expect(() => registry.register('osm', null)).toThrow('value must be defined')
    expect(registry.has('osm')).toBe(false)
  })
  it('accepts defined falsy values', () => {
    registry.register('zero', 0)
    registry.register('false', false)
    registry.register('empty', '')
    expect(registry.values()).toEqual([0, false, ''])
  })
  it('returns undefined for an unknown key', () => {
    expect(registry.get('unknown')).toBeUndefined()
    expect(registry.has('unknown')).toBe(false)
  })
  it('lists keys, values and entries in insertion order', () => {
    registry.register('b', 2)
    registry.register('a', 1)
    registry.register('c', 3)
    expect(registry.keys()).toEqual(['b', 'a', 'c'])
    expect(registry.values()).toEqual([2, 1, 3])
    expect(registry.entries()).toEqual([['b', 2], ['a', 1], ['c', 3]])
  })
  it('returns copies from keys(), values() and entries()', () => {
    registry.register('osm', 1)
    registry.keys().push('fake')
    registry.values().length = 0
    registry.entries().push(['fake', 2])
    registry.entries()[0][1] = 2
    expect(registry.keys()).toEqual(['osm'])
    expect(registry.values()).toEqual([1])
    expect(registry.entries()).toEqual([['osm', 1]])
  })
  it('shares values by reference', () => {
    const value = { type: 'tile' }
    registry.register('osm', value)
    expect(registry.values()[0]).toBe(value)
    expect(registry.entries()[0][1]).toBe(value)
  })
  describe('replace', () => {
    it('replaces an existing entry and returns the new value', () => {
      const first = { id: 1 }
      const second = { id: 2 }
      registry.register('osm', first)
      expect(registry.replace('osm', second)).toBe(second)
      expect(registry.get('osm')).toBe(second)
      expect(registry.size).toBe(1)
    })
    it('throws when replacing an unknown key', () => {
      expect(() => registry.replace('unknown', 1)).toThrow('[layers] entry not registered: unknown')
      expect(registry.size).toBe(0)
    })
    it('rejects nil values and preserves the previous value', () => {
      registry.register('osm', 1)
      expect(() => registry.replace('osm', undefined)).toThrow('value must be defined')
      expect(() => registry.replace('osm', null)).toThrow('value must be defined')
      expect(registry.get('osm')).toBe(1)
      expect(registry.size).toBe(1)
    })
    it('accepts defined falsy values', () => {
      registry.register('osm', 1)
      expect(registry.replace('osm', 0)).toBe(0)
      expect(registry.replace('osm', false)).toBe(false)
      expect(registry.replace('osm', '')).toBe('')
      expect(registry.get('osm')).toBe('')
    })
    it('preserves insertion order when replacing an entry', () => {
      registry.register('a', 1)
      registry.register('b', 2)
      registry.register('c', 3)
      registry.replace('a', 4)
      expect(registry.keys()).toEqual(['a', 'b', 'c'])
      expect(registry.values()).toEqual([4, 2, 3])
      expect(registry.entries()).toEqual([['a', 4], ['b', 2], ['c', 3]])
    })
    it('allows replacing the same entry multiple times', () => {
      registry.register('osm', 1)
      registry.replace('osm', 2)
      registry.replace('osm', 3)
      expect(registry.get('osm')).toBe(3)
      expect(registry.size).toBe(1)
    })
    it('rejects replacement after unregistering an entry', () => {
      registry.register('osm', 1)
      registry.unregister('osm')
      expect(() => registry.replace('osm', 2)).toThrow('[layers] entry not registered: osm')
    })
  })
  it('unregisters an entry', () => {
    registry.register('osm', 1)
    expect(registry.unregister('osm')).toBe(true)
    expect(registry.has('osm')).toBe(false)
    expect(registry.size).toBe(0)
  })
  it('returns false when unregistering an unknown key', () => {
    expect(registry.unregister('unknown')).toBe(false)
  })
  it('allows registering a key again after unregistering it', () => {
    registry.register('osm', 1)
    registry.unregister('osm')
    expect(() => registry.register('osm', 2)).not.toThrow()
    expect(registry.get('osm')).toBe(2)
  })
  it('clears all entries', () => {
    registry.register('a', 1)
    registry.register('b', 2)
    registry.clear()
    expect(registry.size).toBe(0)
    expect(registry.entries()).toEqual([])
    expect(() => registry.register('a', 3)).not.toThrow()
  })
  it('keeps entries isolated between instances', () => {
    const other = new Registry('sources')
    registry.register('osm', 1)
    expect(other.has('osm')).toBe(false)
    expect(() => other.register('osm', 2)).not.toThrow()
  })
  it('routes register() and replace() through the extension points', () => {
    const calls = []
    class Spy extends Registry {
      _validateEntry (key, value) {
        calls.push(['validate', key, value])
        super._validateEntry(key, value)
      }

      _set (key, value) {
        calls.push(['set', key, value])
        return super._set(key, value)
      }
    }
    const spy = new Spy()
    spy.register('osm', 1)
    spy.replace('osm', 2)
    expect(calls).toEqual([
      ['validate', 'osm', 1],
      ['set', 'osm', 1],
      ['validate', 'osm', 2],
      ['set', 'osm', 2]
    ])
    expect(() => spy.register('osm', 3)).toThrow('entry already registered')
    expect(() => spy.replace('unknown', 4)).toThrow('entry not registered')
    expect(calls).toEqual([
      ['validate', 'osm', 1],
      ['set', 'osm', 1],
      ['validate', 'osm', 2],
      ['set', 'osm', 2],
      ['validate', 'osm', 3],
      ['validate', 'unknown', 4]
    ])
  })
  it('uses the subclass has() implementation for register() and replace()', () => {
    class FilteredRegistry extends Registry {
      has (key) {
        if (key === 'hidden') return false
        return super.has(key)
      }
    }
    const filtered = new FilteredRegistry()
    filtered.register('hidden', 1)
    expect(() => filtered.replace('hidden', 2)).toThrow('entry not registered')
    expect(() => filtered.register('hidden', 3)).not.toThrow()
    expect(filtered.get('hidden')).toBe(3)
    expect(filtered.size).toBe(1)
  })
  it('enforces registration invariants when assertions are disabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    let ProductionRegistry
    try {
      ;({ Registry: ProductionRegistry } = await import('../../src/structures/registry.js'))
    } finally {
      vi.unstubAllEnvs()
    }
    const production = new ProductionRegistry('layers')
    expect(() => production.get('')).not.toThrow()
    production.register('osm', 1)
    expect(() => production.register('osm', 2)).toThrow('[layers] entry already registered: osm')
    expect(() => production.replace('unknown', 2)).toThrow('[layers] entry not registered: unknown')
    expect(production.replace('osm', 3)).toBe(3)
    expect(production.get('osm')).toBe(3)
  })
})
