import { color } from '#utilities'

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
  it('uses luminance contrast, not perceptual distance', () => {
    expect(color.contrast('red', 'white', 'blue')).toBe('white')
  })
  it('throws for an invalid color', () => {
    expect(() => color.contrast('notacolor')).toThrow()
  })
  it('throws for an invalid light or dark color', () => {
    expect(() => color.contrast('red', 'notacolor', 'black')).toThrow()
    expect(() => color.contrast('red', 'white', 'notacolor')).toThrow()
  })
})

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
  it('throws without colors', () => {
    expect(() => color.scale({})).toThrow()
  })
  it('applies a domain', () => {
    const scale = color.scale({ colors: ['white', 'red'], domain: [0, 100] })
    expect(scale(0).hex()).toBe('#ffffff')
    expect(scale(100).hex()).toBe('#ff0000')
  })
  it('applies a numeric number of classes', () => {
    const scale = color.scale({ colors: ['white', 'red'], classes: 5 })
    expect(scale(0.1).hex()).toBe(scale(0.19).hex())
    expect(scale(0.19).hex()).not.toBe(scale(0.21).hex())
  })
  it('applies domain and numeric classes together', () => {
    const scale = color.scale({ colors: ['white', 'red'], domain: [0, 100], classes: 5 })
    expect(scale(10).hex()).toBe(scale(19).hex())
    expect(scale(19).hex()).not.toBe(scale(21).hex())
  })
  it('applies an array of classes', () => {
    const scale = color.scale({ colors: ['white', 'red'], classes: [0, 25, 50, 75, 100] })
    expect(scale(30).hex()).toBe(scale(45).hex())
    expect(scale(45).hex()).not.toBe(scale(55).hex())
  })
  it('ignores domain when classes is an array', () => {
    const colors = ['white', 'orange', 'red']
    const classes = [0, 25, 50, 75, 100]
    const withDomain = color.scale({ colors, domain: [0, 90, 100], classes })
    const withoutDomain = color.scale({ colors, classes })
    expect(withDomain(30).hex()).toBe(withoutDomain(30).hex())
    expect(withDomain(60).hex()).toBe(withoutDomain(60).hex())
  })
  it('treats 0 classes as a continuous scale', () => {
    const continuous = color.scale({ colors: ['white', 'red'], domain: [0, 100] })
    const scale = color.scale({ colors: ['white', 'red'], domain: [0, 100], classes: 0 })
    expect(scale(25).hex()).toBe(continuous(25).hex())
  })
  it('ignores null classes', () => {
    const scale = color.scale({ colors: ['white', 'red'], classes: null })
    expect(typeof scale).toBe('function')
    expect(scale(0.5).hex()).toBe(color.scale({ colors: ['white', 'red'] })(0.5).hex())
  })
})

describe('color.nearest', () => {
  it('returns the nearest color from a list', () => {
    expect(color.nearest('#ff0000', ['red', 'green', 'blue'])).toBe('red')
  })
  it('returns the nearest color from a list of hex colors', () => {
    expect(color.nearest('#ff0000', ['#ff0001', '#00ff00', '#0000ff'])).toBe('#ff0001')
  })
  it('defaults to the HTML color palette', () => {
    expect(color.nearest('#fe0101')).toBe('red')
  })
  it('throws for an invalid color', () => {
    expect(() => color.nearest('notacolor', ['red', 'blue'])).toThrow()
  })
  it('throws for an empty array', () => {
    expect(() => color.nearest('#ff0000', [])).toThrow()
  })
})

describe('color.farthest', () => {
  it('returns the most distant color from a list', () => {
    expect(color.farthest('#ffffff', ['white', 'black', 'gray'])).toBe('black')
    expect(color.farthest('#000000', ['white', 'black', 'gray'])).toBe('white')
  })
  it('returns the most distant color from a list of hex colors', () => {
    expect(color.farthest('#ffffff', ['#ffffff', '#000000', '#888888'])).toBe('#000000')
  })
  it('uses perceptual distance, not luminance contrast', () => {
    expect(color.farthest('red', ['white', 'black', 'cyan'])).toBe('cyan')
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
