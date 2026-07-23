import { describe, it, expect } from 'vitest'
import { math } from '../../src/utilities'

describe('math', () => {
  describe('clamp', () => {
    it('returns value when within range', () => expect(math.clamp(5, 0, 10)).toBe(5))
    it('returns min when value is below range', () => expect(math.clamp(-5, 0, 10)).toBe(0))
    it('returns max when value is above range', () => expect(math.clamp(15, 0, 10)).toBe(10))
    it('throws if value is not a number', () => expect(() => math.clamp('a', 0, 10)).toThrow('value must be a number'))
    it('throws if min is not a number', () => expect(() => math.clamp(5, 'a', 10)).toThrow('min must be a number'))
    it('throws if max is not a number', () => expect(() => math.clamp(5, 0, 'a')).toThrow('max must be a number'))
  })

  describe('round', () => {
    it('rounds to 2 decimals by default', () => expect(math.round(1.23456)).toBe(1.23))
    it('rounds to given precision', () => expect(math.round(1.23456789, 4)).toBe(1.2346))
    it('rounds to 7 decimals', () => expect(math.round(1.23456789, 7)).toBe(1.2345679))
    it('rounds to 0 decimals', () => expect(math.round(1.7, 0)).toBe(2))
    it('throws if value is not a number', () => expect(() => math.round('a')).toThrow('value must be a number'))
    it('throws if precision is not a non-negative integer', () => expect(() => math.round(1.234, -1)).toThrow('precision must be a non-negative integer'))
  })

  describe('sign', () => {
    it('returns 1 for a positive value', () => expect(math.sign(3)).toBe(1))
    it('returns -1 for a negative value', () => expect(math.sign(-3)).toBe(-1))
    it('returns 0 for zero', () => expect(math.sign(0)).toBe(0))
    it('returns 0 for negative zero', () => expect(math.sign(-0)).toBe(0))
    it('returns 0 within the tolerance', () => expect(math.sign(1e-15, 1e-12)).toBe(0))
    it('returns 0 within the tolerance for a negative value', () => expect(math.sign(-1e-15, 1e-12)).toBe(0))
    it('returns 1 above the tolerance', () => expect(math.sign(1e-9, 1e-12)).toBe(1))
    it('returns -1 below the tolerance', () => expect(math.sign(-1e-9, 1e-12)).toBe(-1))
    it('treats a value equal to the tolerance as zero', () => expect(math.sign(1e-12, 1e-12)).toBe(0))
    it('treats a value equal to the negated tolerance as zero', () => expect(math.sign(-1e-12, 1e-12)).toBe(0))
    it('applies no tolerance by default', () => expect(math.sign(1e-300)).toBe(1))
    it('matches Math.sign by default', () => {
      for (const value of [42, -42, 0.5, -0.5, 1e-300]) {
        expect(math.sign(value)).toBe(Math.sign(value))
      }
    })
    it('throws if value is not a number', () => expect(() => math.sign('a')).toThrow('value must be a number'))
    it('throws if epsilon is not a number', () => expect(() => math.sign(1, 'a')).toThrow('epsilon must be a non-negative number'))
    it('throws if epsilon is negative', () => expect(() => math.sign(1, -1)).toThrow('epsilon must be a non-negative number'))
  })

  describe('percentage', () => {
    it('returns the percentage', () => expect(math.percentage(1, 4)).toBe(25))
    it('rounds to 2 decimals', () => expect(math.percentage(1, 3)).toBe(33.33))
    it('throws if value is not a number', () => expect(() => math.percentage('a', 100)).toThrow('value must be a number'))
    it('throws if total is not a number', () => expect(() => math.percentage(1, 'a')).toThrow('total must be a number'))
  })

  describe('exponential', () => {
    it('formats a positive number', () => expect(math.exponential(1000, 2)).toBe('1.00e+3'))
    it('formats a decimal number', () => expect(math.exponential(0.005, 2)).toBe('5.00e-3'))
    it('formats a negative number', () => expect(math.exponential(-1000, 2)).toBe('-1.00e+3'))
    it('formats zero', () => expect(math.exponential(0, 2)).toBe('0.00e+0'))
    it('formats with 0 decimals', () => expect(math.exponential(1000, 0)).toBe('1e+3'))
    it('uses 2 decimals by default', () => expect(math.exponential(1000)).toBe('1.00e+3'))
    it('throws if value is not a number', () => expect(() => math.exponential('1', 2)).toThrow('value must be a number'))
    it('throws if decimals is not a non-negative integer', () => expect(() => math.exponential(1000, -1)).toThrow('decimals must be a non-negative integer'))
    it('throws if decimals is a float', () => expect(() => math.exponential(1000, 2.5)).toThrow('decimals must be a non-negative integer'))
  })

  describe('linear', () => {
    it('returns initial at t=0', () => expect(math.linear(0, 100, 200)).toBe(100))
    it('returns final at t=1', () => expect(math.linear(1, 100, 200)).toBe(200))
    it('interpolates correctly at t=0.5', () => expect(math.linear(0.5, 100, 200)).toBe(150))
    it('uses default initial=0 and final=1', () => expect(math.linear(0.5)).toBe(0.5))
    it('works with negative range', () => expect(math.linear(0.5, -100, 100)).toBe(0))
    it('throws if t is out of range', () => expect(() => math.linear(1.5)).toThrow('t must be in range [0, 1]'))
    it('throws if initial is not a number', () => expect(() => math.linear(0.5, 'a', 1)).toThrow('initial must be a number'))
    it('throws if final is not a number', () => expect(() => math.linear(0.5, 0, 'a')).toThrow('final must be a number'))
  })

  describe('to.radians', () => {
    it('converts common angles', () => {
      expect(math.to.radians(0)).toBe(0)
      expect(math.to.radians(180)).toBeCloseTo(Math.PI, 10)
      expect(math.to.radians(90)).toBeCloseTo(Math.PI / 2, 10)
      expect(math.to.radians(360)).toBeCloseTo(2 * Math.PI, 10)
    })

    it('handles negative angles', () => {
      expect(math.to.radians(-90)).toBeCloseTo(-Math.PI / 2, 10)
    })

    it('throws for a non-number', () => {
      expect(() => math.to.radians('90')).toThrow('degrees must be a number')
      expect(() => math.to.radians(null)).toThrow('degrees must be a number')
    })
  })

  describe('to.degrees', () => {
    it('converts common angles', () => {
      expect(math.to.degrees(0)).toBe(0)
      expect(math.to.degrees(Math.PI)).toBeCloseTo(180, 10)
      expect(math.to.degrees(Math.PI / 2)).toBeCloseTo(90, 10)
      expect(math.to.degrees(2 * Math.PI)).toBeCloseTo(360, 10)
    })

    it('handles negative angles', () => {
      expect(math.to.degrees(-Math.PI / 2)).toBeCloseTo(-90, 10)
    })

    it('throws for a non-number', () => {
      expect(() => math.to.degrees('3.14')).toThrow('radians must be a number')
      expect(() => math.to.degrees(null)).toThrow('radians must be a number')
    })
  })

  describe('to.radians / to.degrees', () => {
    it('are inverse of each other', () => {
      for (const deg of [0, 30, 45, 90, 137, -60, 360]) {
        expect(math.to.degrees(math.to.radians(deg))).toBeCloseTo(deg, 10)
      }
    })
  })

  describe('pow.square', () => {
    it('squares a positive number', () => expect(math.pow.square(3)).toBe(9))
    it('squares a negative number', () => expect(math.pow.square(-4)).toBe(16))
    it('squares zero', () => expect(math.pow.square(0)).toBe(0))
    it('throws if value is not a number', () => expect(() => math.pow.square('a')).toThrow('value must be a number'))
  })

  describe('pow.cube', () => {
    it('cubes a positive number', () => expect(math.pow.cube(3)).toBe(27))
    it('cubes a negative number', () => expect(math.pow.cube(-2)).toBe(-8))
    it('cubes zero', () => expect(math.pow.cube(0)).toBe(0))
    it('throws if value is not a number', () => expect(() => math.pow.cube('a')).toThrow('value must be a number'))
  })

  describe('ease.in', () => {
    it('returns 0 at t=0', () => expect(math.ease.in(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.ease.in(1)).toBe(1))
    it('returns a value less than t for default linearity', () => expect(math.ease.in(0.5)).toBeLessThan(0.5))
    it('throws if t is out of range', () => expect(() => math.ease.in(1.5)).toThrow('t must be in range [0, 1]'))
    it('throws if linearity is not a number', () => expect(() => math.ease.in(0.5, 'a')).toThrow('linearity must be a number'))
  })

  describe('ease.out', () => {
    it('returns 0 at t=0', () => expect(math.ease.out(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.ease.out(1)).toBe(1))
    it('returns a value greater than t for default linearity', () => expect(math.ease.out(0.5)).toBeGreaterThan(0.5))
    it('throws if t is out of range', () => expect(() => math.ease.out(1.5)).toThrow('t must be in range [0, 1]'))
    it('throws if linearity is not a number', () => expect(() => math.ease.out(0.5, 'a')).toThrow('linearity must be a number'))
  })

  describe('ease.cubicBezier', () => {
    it('returns 0 at t=0', () => expect(math.ease.cubicBezier(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.ease.cubicBezier(1)).toBe(1))
    it('returns ~0.5 at t=0.5 for symmetric curve', () => expect(math.ease.cubicBezier(0.5)).toBeCloseTo(0.5, 1))
    it('throws if t is out of range', () => expect(() => math.ease.cubicBezier(1.5)).toThrow('t must be in range [0, 1]'))
  })

  describe('stats.sum', () => {
    it('sums an array of numbers', () => expect(math.stats.sum([1, 2, 3, 4])).toBe(10))
    it('returns 0 for an empty array', () => expect(math.stats.sum([])).toBe(0))
    it('throws if values is not an array', () => expect(() => math.stats.sum('a')).toThrow('values must be an array'))
  })

  describe('stats.average', () => {
    it('returns the average of an array', () => expect(math.stats.average([1, 2, 3, 4])).toBe(2.5))
    it('returns the value for a single element array', () => expect(math.stats.average([5])).toBe(5))
    it('throws if values is empty', () => expect(() => math.stats.average([])).toThrow('values must be a non-empty array'))
    it('throws if values is not an array', () => expect(() => math.stats.average('a')).toThrow('values must be a non-empty array'))
  })

  describe('stats.median', () => {
    it('returns the median of an odd array', () => expect(math.stats.median([1, 2, 3, 4, 5])).toBe(3))
    it('returns the median of an even array', () => expect(math.stats.median([1, 2, 3, 4])).toBe(2.5))
    it('returns the value for a single element array', () => expect(math.stats.median([5])).toBe(5))
    it('handles unsorted arrays', () => expect(math.stats.median([5, 1, 3])).toBe(3))
    it('throws if values is empty', () => expect(() => math.stats.median([])).toThrow('values must be a non-empty array'))
  })
})
