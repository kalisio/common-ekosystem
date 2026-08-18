import { describe, it, expect } from 'vitest'
import { color } from '#utilities'

// ─── is ─────────────────────────────────────────────────────────────────────

describe('color.is', () => {
  it('returns true for a valid hex color', () => {
    expect(color.is('#ff0000')).toBe(true)
  })

  it('returns true for a valid color name', () => {
    expect(color.is('red')).toBe(true)
  })

  it('returns true for a valid rgb color', () => {
    expect(color.is('rgb(255, 0, 0)')).toBe(true)
  })

  it('returns true for a valid hsl color', () => {
    expect(color.is('hsl(0, 100%, 50%)')).toBe(true)
  })

  it('returns false for an invalid color', () => {
    expect(color.is('notacolor')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(color.is('')).toBe(false)
  })
})

// ─── contrast ────────────────────────────────────────────────────────────────

describe('color.contrast', () => {
  it('returns dark for a light color', () => {
    expect(color.contrast('#ffffff')).toBe('black')
  })

  it('returns light for a dark color', () => {
    expect(color.contrast('#000000')).toBe('white')
  })

  it('accepts custom light and dark values', () => {
    expect(color.contrast('#000000', '#f5f5f5', '#333333')).toBe('#f5f5f5')
    expect(color.contrast('#ffffff', '#f5f5f5', '#333333')).toBe('#333333')
  })
})

// ─── scale ───────────────────────────────────────────────────────────────────

describe('color.scale', () => {
  it('returns a chroma scale from a list of colors', () => {
    const scale = color.scale({ colors: ['white', 'red'] })
    expect(typeof scale).toBe('function')
  })

  it('returns a color at position 0', () => {
    const scale = color.scale({ colors: ['white', 'red'] })
    expect(scale(0).hex()).toBe('#ffffff')
  })

  it('returns a color at position 1', () => {
    const scale = color.scale({ colors: ['white', 'red'] })
    expect(scale(1).hex()).toBe('#ff0000')
  })

  it('applies a domain', () => {
    const scale = color.scale({ colors: ['white', 'red'], domain: [0, 100] })
    expect(scale(0).hex()).toBe('#ffffff')
    expect(scale(100).hex()).toBe('#ff0000')
  })

  it('applies a numeric number of classes', () => {
    const scale = color.scale({ colors: ['white', 'red'], classes: 5 })
    expect(typeof scale).toBe('function')
  })

  it('applies an array of classes', () => {
    const scale = color.scale({ colors: ['white', 'red'], classes: [0, 25, 50, 75, 100] })
    expect(typeof scale).toBe('function')
  })

  it('applies domain and numeric classes together', () => {
    const scale = color.scale({ colors: ['white', 'red'], domain: [0, 100], classes: 5 })
    expect(typeof scale).toBe('function')
  })

  it('ignores domain when classes is an array', () => {
    const withDomain = color.scale({ colors: ['white', 'red'], domain: [0, 200], classes: [0, 50, 100] })
    const withoutDomain = color.scale({ colors: ['white', 'red'], classes: [0, 50, 100] })
    expect(withDomain(50).hex()).toBe(withoutDomain(50).hex())
  })
})

// ─── nearest ─────────────────────────────────────────────────────────────────

describe('color.nearest', () => {
  it('returns the nearest color from a list', () => {
    expect(color.nearest('#ff0000', ['red', 'green', 'blue'])).toBe('red')
  })

  it('returns the nearest color from a list of hex colors', () => {
    expect(color.nearest('#ff0000', ['#ff0001', '#00ff00', '#0000ff'])).toBe('#ff0001')
  })

  it('defaults to the HTML color palette', () => {
    const result = color.nearest('#ff0000')
    expect(color.is(result)).toBe(true)
  })

  it('throws for an invalid color', () => {
    expect(() => color.nearest('notacolor', ['red', 'blue'])).toThrow()
  })

  it('throws for an empty array', () => {
    expect(() => color.nearest('#ff0000', [])).toThrow()
  })
})

// ─── farthest ────────────────────────────────────────────────────────────────

describe('color.farthest', () => {
  it('returns the most contrasting color from a list', () => {
    expect(color.farthest('#ffffff', ['white', 'black', 'gray'])).toBe('black')
    expect(color.farthest('#000000', ['white', 'black', 'gray'])).toBe('white')
  })

  it('returns the most contrasting color from a list of hex colors', () => {
    expect(color.farthest('#ffffff', ['#ffffff', '#000000', '#888888'])).toBe('#000000')
  })

  it('defaults to the HTML color palette', () => {
    const result = color.farthest('#ff0000')
    expect(color.is(result)).toBe(true)
  })

  it('throws for an invalid color', () => {
    expect(() => color.farthest('notacolor', ['red', 'blue'])).toThrow()
  })

  it('throws for an empty array', () => {
    expect(() => color.farthest('#ff0000', [])).toThrow()
  })
})
