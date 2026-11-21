import { Factory, Cache } from '@kalisio/common-core/structures'
import { string } from '@kalisio/common-core/utilities'
import { ShapeFactory } from '../../src/shapes'
import * as BUILTIN_SHAPES from '../../src/shapes/builtin-shapes/index.js'

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

const makeDotFn = () => vi.fn(() => ({
  width: 32,
  height: 32,
  margin: 0,
  shape: '<circle cx="50" cy="50" r="40"/>'
}))

describe('ShapeFactory', () => {
  let factory

  beforeEach(() => {
    factory = new ShapeFactory()
  })

  describe('constructor', () => {
    it('uses a factory registry and default cache sizes', () => {
      expect(factory.registry).toBeInstanceOf(Factory)
      expect(factory.registry.name).toBe('shapes')
      expect(factory.svgCache).toBeInstanceOf(Cache)
      expect(factory.pngCache).toBeInstanceOf(Cache)
      expect(factory.svgCache.max).toBe(100)
      expect(factory.pngCache.max).toBe(100)
    })
    it('respects custom cache sizes', () => {
      const f = new ShapeFactory({ svgCacheSize: 20, pngCacheSize: 30 })
      expect(f.svgCache.max).toBe(20)
      expect(f.pngCache.max).toBe(30)
    })
    it('registers builtin shapes in kebab case', () => {
      for (const name of Object.keys(BUILTIN_SHAPES)) {
        expect(factory.has(string.kebabCase(name))).toBe(true)
      }
    })
    it('registers star as an alias of star5', () => {
      expect(factory.registry.get('star')).toBe(BUILTIN_SHAPES.star5)
    })
    it('creates independent registries and caches per instance', () => {
      const other = new ShapeFactory()
      other.register('custom', makeCircleFn())
      expect(factory.registry).not.toBe(other.registry)
      expect(factory.has('custom')).toBe(false)
      expect(other.svgCache).not.toBe(factory.svgCache)
      expect(other.pngCache).not.toBe(factory.pngCache)
    })
  })

  describe('register', () => {
    it('registers a shape type', () => {
      factory.register('custom', makeCircleFn())
      expect(factory.has('custom')).toBe(true)
    })
    it('overrides an existing type', () => {
      const circleFn = makeCircleFn()
      factory.register('circle', circleFn)
      factory.build({ shape: 'circle' })
      expect(circleFn).toHaveBeenCalledOnce()
    })
    it('throws when type is not a string', () => {
      expect(() => factory.register(42, makeCircleFn())).toThrow('type must be a string')
    })
    it('throws when buildFn is not a function', () => {
      expect(() => factory.register('circle', 'not-a-fn')).toThrow('buildFn must be a function')
    })
    it('does not evict registered shape types', () => {
      for (let i = 0; i < 100; i++) factory.register(`custom-${i}`, makeCircleFn())
      expect(factory.has('circle')).toBe(true)
      expect(factory.has('custom-0')).toBe(true)
      expect(factory.has('custom-99')).toBe(true)
    })
  })

  describe('has', () => {
    it('returns false for an unknown type', () => {
      expect(factory.has('__unknown_shape__')).toBe(false)
    })
    it('returns true for a builtin shape', () => {
      expect(factory.has('circle')).toBe(true)
    })
    it('returns true after registration', () => {
      factory.register('custom', makeCircleFn())
      expect(factory.has('custom')).toBe(true)
    })
    it('throws when type is not a string', () => {
      expect(() => factory.has(null)).toThrow('type must be a string')
    })
  })

  describe('list', () => {
    it('includes builtin shapes and the star alias', () => {
      expect(factory.list()).toEqual(expect.arrayContaining(['circle', 'star']))
    })
    it('returns all registered type keys', () => {
      factory.register('custom', makeCircleFn())
      factory.register('other', makeRectFn())
      expect(factory.list()).toEqual(expect.arrayContaining(['custom', 'other']))
    })
    it('lists an overridden type once', () => {
      factory.register('circle', makeCircleFn())
      expect(factory.list().filter((type) => type === 'circle')).toHaveLength(1)
    })
  })

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
    it('calls the registered buildFn once with the original params', () => {
      const circleFn = makeCircleFn()
      factory.register('circle', circleFn)
      const params = { shape: 'circle', color: 'blue' }
      factory.build(params)
      expect(circleFn).toHaveBeenCalledOnce()
      expect(circleFn).toHaveBeenCalledWith(params)
    })
    it('uses params in the buildFn output', () => {
      const shape = factory.build({ shape: 'rect', size: 48 })
      expect(shape.width).toBe(48)
      expect(shape.height).toBe(48)
    })
    it('does not mutate params', () => {
      const params = { shape: 'rect', size: 48 }
      factory.build(params)
      expect(params).toEqual({ shape: 'rect', size: 48 })
    })
    it('buildFn output can override params fields', () => {
      factory.register('override', vi.fn(() => ({ width: 99, height: 10, margin: 1 })))
      const shape = factory.build({ shape: 'override', width: 1 })
      expect(shape.width).toBe(99)
    })
    it('throws when params is not an object', () => {
      expect(() => factory.build()).toThrow('params must be an object with the property shape')
      expect(() => factory.build('circle')).toThrow('params must be an object with the property shape')
    })
    it('throws when params has no shape property', () => {
      expect(() => factory.build({ color: 'red' })).toThrow('params must be an object with the property shape')
    })
    it('throws when shape type is not registered', () => {
      expect(() => factory.build({ shape: 'mesh' })).toThrow('[shapes] unknown key: mesh')
    })
    it('throws when buildFn returns a non positive width', () => {
      factory.register('bad', vi.fn(() => ({ width: -1, height: 32, margin: 4 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow('shape.width must be a positive integer')
    })
    it('throws when buildFn returns a non integer width', () => {
      factory.register('bad', vi.fn(() => ({ width: 32.5, height: 32, margin: 4 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow('shape.width must be a positive integer')
    })
    it('throws when buildFn returns a non positive height', () => {
      factory.register('bad', vi.fn(() => ({ width: 32, height: 0, margin: 4 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow('shape.height must be a positive integer')
    })
    it('throws when buildFn returns a negative margin', () => {
      factory.register('bad', vi.fn(() => ({ width: 32, height: 32, margin: -2 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow('shape.margin must be a non negative integer')
    })
    it('throws when buildFn returns no margin', () => {
      factory.register('bad', vi.fn(() => ({ width: 32, height: 32 })))
      expect(() => factory.build({ shape: 'bad' })).toThrow('shape.margin must be a non negative integer')
    })
    it('accepts a margin of 0', () => {
      factory.register('flat', vi.fn(() => ({ width: 32, height: 32, margin: 0 })))
      expect(() => factory.build({ shape: 'flat' })).not.toThrow()
    })
  })

  describe('rendering', () => {
    beforeEach(() => {
      factory.register('dot', makeDotFn())
    })
    it('renders the SVG with the built dimensions and markup', () => {
      const svg = factory.build({ shape: 'dot' }).toSVG()
      expect(svg).toContain('width="32" height="32"')
      expect(svg).toContain('<circle cx="50" cy="50" r="40"/>')
    })
    it('caches the SVG in the factory cache when a key is provided', () => {
      factory.build({ shape: 'dot', key: 'my-dot' }).toSVG()
      expect(factory.svgCache.has('my-dot')).toBe(true)
    })
    it('returns the cached SVG for a known key', () => {
      factory.svgCache.set('my-dot', '<svg>cached</svg>')
      expect(factory.build({ shape: 'dot', key: 'my-dot' }).toSVG()).toBe('<svg>cached</svg>')
    })
    it('returns the cached PNG for a known key', async () => {
      factory.pngCache.set('my-dot', 'data:image/png;base64,cached')
      await expect(factory.build({ shape: 'dot', key: 'my-dot' }).toPNG()).resolves.toBe('data:image/png;base64,cached')
    })
    it.each(new ShapeFactory().list())('renders the builtin shape %s', (type) => {
      expect(factory.build({ shape: type }).toSVG()).toMatch(/^<svg /)
    })
  })
})
