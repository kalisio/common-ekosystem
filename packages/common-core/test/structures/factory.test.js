import { Registry, Factory } from '../../src/structures/index.js'

describe('Factory', () => {
  let factory
  beforeEach(() => {
    factory = new Factory()
  })
  it('is a registry named factory by default', () => {
    expect(factory).toBeInstanceOf(Registry)
    expect(factory.name).toBe('factory')
  })
  it('registers a creator and returns it', () => {
    const creator = () => ({})
    expect(factory.register('osm', creator)).toBe(creator)
    expect(factory.get('osm')).toBe(creator)
  })
  it('rejects a creator that is not a function', () => {
    for (const creator of [undefined, null]) {
      expect(() => factory.register('osm', creator)).toThrow('value must be defined')
    }
    for (const creator of [{}, 'osm', 1]) {
      expect(() => factory.register('osm', creator)).toThrow('creator must be a function')
    }
    expect(factory.size).toBe(0)
  })
  it('validates the key before the creator', () => {
    expect(() => factory.register('', {})).toThrow('key must be a non-empty string')
  })
  it('rejects a creator that is not a function in replace() and keeps the previous one', () => {
    const creator = () => ({})
    factory.register('osm', creator)
    for (const replacement of [undefined, null]) {
      expect(() => factory.replace('osm', replacement)).toThrow('value must be defined')
    }
    for (const replacement of [{}, 'osm', 1]) {
      expect(() => factory.replace('osm', replacement)).toThrow('creator must be a function')
    }
    expect(factory.get('osm')).toBe(creator)
  })
  it('replaces a creator to change a default behavior', () => {
    factory.register('layer', () => 'default')
    factory.replace('layer', () => 'custom')
    expect(factory.create('layer')).toBe('custom')
  })
  it('throws when replacing an unknown key', () => {
    expect(() => factory.replace('osm', () => {})).toThrow('[factory] entry not registered: osm')
  })
  it('keeps the registry checks on keys and duplicates', () => {
    expect(() => factory.register('', () => {})).toThrow('key must be a non-empty string')
    factory.register('osm', () => {})
    expect(() => factory.register('osm', () => {})).toThrow('[factory] entry already registered: osm')
  })
  it('creates a new instance on each call with the given arguments', () => {
    factory.register('layer', (name, options) => ({ name, options }))
    const first = factory.create('layer', 'osm', { opacity: 1 })
    const second = factory.create('layer', 'osm', { opacity: 1 })
    expect(first).toEqual({ name: 'osm', options: { opacity: 1 } })
    expect(first).not.toBe(second)
  })
  it('throws when creating from an unknown key', () => {
    expect(() => new Factory('layers').create('osm')).toThrow('[layers] unknown key: osm')
  })
  it('rejects an invalid key when creating', () => {
    expect(() => factory.create('')).toThrow('key must be a non-empty string')
  })
})
