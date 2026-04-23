import { describe, it, expect } from 'vitest'
import { math } from '../../src/utilities'

describe('math.square', () => {
  it('squares a positive number', () => {
    expect(math.square(4)).toBe(16)
  })

  it('squares a negative number', () => {
    expect(math.square(-3)).toBe(9)
  })

  it('squares zero', () => {
    expect(math.square(0)).toBe(0)
  })

  it('squares a float', () => {
    expect(math.square(0.5)).toBe(0.25)
  })

  it('throws if value is not a number', () => {
    expect(() => math.square('4')).toThrow('value must be a number')
  })
})

describe('math.cube', () => {
  it('cubes a positive number', () => {
    expect(math.cube(3)).toBe(27)
  })

  it('cubes a negative number', () => {
    expect(math.cube(-2)).toBe(-8)
  })

  it('cubes zero', () => {
    expect(math.cube(0)).toBe(0)
  })

  it('cubes a float', () => {
    expect(math.cube(0.5)).toBe(0.125)
  })

  it('throws if value is not a number', () => {
    expect(() => math.cube('3')).toThrow('value must be a number')
  })
})

describe('math.clamp', () => {
  it('returns the value if within range', () => {
    expect(math.clamp(5, 0, 10)).toBe(5)
  })

  it('returns min if value is below range', () => {
    expect(math.clamp(-5, 0, 10)).toBe(0)
  })

  it('returns max if value is above range', () => {
    expect(math.clamp(15, 0, 10)).toBe(10)
  })

  it('returns min if value equals min', () => {
    expect(math.clamp(0, 0, 10)).toBe(0)
  })

  it('returns max if value equals max', () => {
    expect(math.clamp(10, 0, 10)).toBe(10)
  })

  it('throws if value is not a number', () => {
    expect(() => math.clamp('5', 0, 10)).toThrow('value must be a number')
  })

  it('throws if min is not a number', () => {
    expect(() => math.clamp(5, '0', 10)).toThrow('min must be a number')
  })

  it('throws if max is not a number', () => {
    expect(() => math.clamp(5, 0, '10')).toThrow('max must be a number')
  })
})
