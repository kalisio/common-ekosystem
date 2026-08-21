import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShapeFactory } from '../../src/shapes'

// --- helpers ---

const makeCircleFn = () => vi.fn((params) => ({
  width: 32,
  height: 32,
  margin: 4
}))

const makeRectFn = () => vi.fn((params) => ({
  width: params.size ?? 64,
  height: params.size ?? 64,
  margin: 2
}))

// --- suite ---

describe('ShapeFactory', () => {
  let factory

  beforeEach(() => {
    factory = new ShapeFactory()
  })

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('uses default cache sizes when no options are provided', () => {
      const f = new ShapeFactory()
      expect(f.registry.max).toBe(100)
      expect(f.svgCache.max).toBe(100)
      expect(f.pngCache.max).toBe(100)
    })
    it('respects custom cache sizes', () => {
      const f = new ShapeFactory({ registrySize: 10, svgCacheSize: 20, pngCacheSize: 30 })
      expect(f.registry.max).toBe(10)
      expect(f.svgCache.max).toBe(20)
      expect(f.pngCache.max).toBe(30)
    })
  })

  // ── register / has / list ────────────────────────────────────────────────

  describe('register', () => {
    it('registers a shape type', () => {
      factory.register('circle', makeCircleFn())
      expect(factory.has('circle')).toBe(true)
    })
    it('throws when type is not a string', () => {
      expect(() => factory.register(42, makeCircleFn())).toThrow()
    })
    it('throws when buildFn is not a function', () => {
      expect(() => factory.register('circle', 'not-a-fn')).toThrow()
    })
  })

  describe('has', () => {
    it('returns false for an unknown type', () => {
      expect(factory.has('__unknown_shape__')).toBe(false)
    })
    it('returns true after registration', () => {
      factory.register('circle', makeCircleFn())
      expect(factory.has('circle')).toBe(true)
    })
    it('throws when type is not a string', () => {
      expect(() => factory.has(null)).toThrow()
    })
  })

  describe('list', () => {
    it('returns an empty array when nothing is registered', () => {
      expect(factory.list()).toContain('circle')
      expect(factory.list().length).toBeGreaterThan(0)
    })
    it('returns all registered type keys', () => {
      factory.register('circle', makeCircleFn())
      factory.register('rect', makeRectFn())
      expect(factory.list()).toEqual(expect.arrayContaining(['circle', 'rect']))
    })
  })

  // ── build ────────────────────────────────────────────────────────────────

  describe('build', () => {
    beforeEach(() => {
      factory.register('circle', makeCircleFn())
      factory.register('rect', makeRectFn())
    })
    it('returns a shape with toSVG and toPNG methods', () => {
      const shape = factory.build({ shape: 'circle' })
      expect(typeof shape.toSVG).toBe('function')
      expect(typeof shape.toPNG).toBe('function')
    })
    it('merges params into the returned shape', () => {
      const shape = factory.build({ shape: 'circle', color: 'red' })
      expect(shape.color).toBe('red')
      expect(shape.shape).toBe('circle')
    })
    it('passes the provided zoom through', () => {
      const shape = factory.build({ shape: 'circle', zoom: 2 })
      expect(shape.zoom).toBe(2)
    })
    it('calls the registered buildFn with the original params', () => {
      const circleFn = makeCircleFn()
      factory.register('circle', circleFn)
      const params = { shape: 'circle', color: 'blue' }
      factory.build(params)
      expect(circleFn).toHaveBeenCalledWith(params)
    })
    it('throws when params has no shape property', () => {
      expect(() => factory.build({ color: 'red' })).toThrow()
    })
    it('throws when shape type is not registered', () => {
      expect(() => factory.build({ shape: 'mesh' })).toThrow()
    })
    it('throws when buildFn returns a non-positive-integer width', () => {
      factory.register('bad', vi.fn(() => ({ width: -1, height: 32, margin: 4 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow()
    })
    it('throws when buildFn returns a non-positive-integer height', () => {
      factory.register('bad', vi.fn(() => ({ width: 32, height: 0, margin: 4 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow()
    })
    it('throws when buildFn returns a non-positive-integer margin', () => {
      factory.register('bad', vi.fn(() => ({ width: 32, height: 32, margin: -2 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow()
    })
    it('buildFn output can override params fields', () => {
      // buildFn returns width: 99, which should win over any width in params
      factory.register('override', vi.fn(() => ({ width: 99, height: 10, margin: 1 })))
      const shape = factory.build({ shape: 'override', width: 1 })
      expect(shape.width).toBe(99)
    })
  })
})
