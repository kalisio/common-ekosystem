import { describe, it, expect } from 'vitest'
import { color } from '../../src/utilities'

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
})
