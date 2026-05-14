import { describe, it, expect } from 'vitest'
import { LRUCache } from 'lru-cache'
import { BUILTIN_SHAPES } from '../../src/shapes/builtin-shapes'
import { ShapeRegistry } from '../../src/shapes'

describe('ShapeRegistry', () => {
  it('is an LRUCache instance', () => {
    expect(ShapeRegistry).toBeInstanceOf(LRUCache)
  })

  it('has a max size of 1024', () => {
    expect(ShapeRegistry.max).toBe(1024)
  })

  // ─── builtin shapes ────────────────────────────────────────────────────────

  const builtinShapes = [
    ['circle', 'circle'],
    ['cross', 'cross'],
    ['diamond', 'diamond'],
    ['donut', 'donut'],
    ['pie', 'pie'],
    ['heart', 'heart'],
    ['pentagon', 'pentagon'],
    ['hexagon', 'hexagon'],
    ['polygon', 'polygon'],
    ['rect', 'rect'],
    ['rounded-rect', 'roundedRect'],
    ['star4', 'star4'],
    ['star5', 'star5'],
    ['star6', 'star6'],
    ['triangle', 'triangle'],
    ['triangle-down', 'triangleDown'],
    ['triangle-right', 'triangleRight'],
    ['triangle-left', 'triangleLeft'],
    ['marker-pin', 'markerPin'],
    ['square-pin', 'squarePin']
  ]

  it.each(builtinShapes)('registers builtin shape "%s"', (key, builtinKey) => {
    expect(ShapeRegistry.has(key)).toBe(true)
    expect(ShapeRegistry.get(key)).toBe(BUILTIN_SHAPES[builtinKey])
  })

  it('registers all builtin shapes', () => {
    expect(ShapeRegistry.size).toBe(builtinShapes.length)
  })

  // ─── custom shapes ─────────────────────────────────────────────────────────

  it('accepts a custom shape', () => {
    ShapeRegistry.set('custom', () => '<circle />')
    expect(ShapeRegistry.has('custom')).toBe(true)
    expect(ShapeRegistry.get('custom')()).toBe('<circle />')
    ShapeRegistry.delete('custom')
  })

  it('overwrites an existing shape', () => {
    const original = ShapeRegistry.get('circle')
    const override = () => '<circle override />'
    ShapeRegistry.set('circle', override)
    expect(ShapeRegistry.get('circle')).toBe(override)
    ShapeRegistry.set('circle', original)
  })

  it('deletes a shape', () => {
    ShapeRegistry.set('temp', () => '')
    ShapeRegistry.delete('temp')
    expect(ShapeRegistry.has('temp')).toBe(false)
  })

  it('returns undefined for an unknown shape', () => {
    expect(ShapeRegistry.get('unknown-shape')).toBeUndefined()
  })
})
