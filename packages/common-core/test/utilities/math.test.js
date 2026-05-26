import { describe, it, expect } from 'vitest'
import { math } from '../../src/utilities'

describe('math', () => {
  describe('square', () => {
    it('squares a positive number', () => expect(math.square(3)).toBe(9))
    it('squares a negative number', () => expect(math.square(-4)).toBe(16))
    it('squares zero', () => expect(math.square(0)).toBe(0))
    it('throws if value is not a number', () => expect(() => math.square('a')).toThrow('value must be a number'))
  })

  describe('cube', () => {
    it('cubes a positive number', () => expect(math.cube(3)).toBe(27))
    it('cubes a negative number', () => expect(math.cube(-2)).toBe(-8))
    it('cubes zero', () => expect(math.cube(0)).toBe(0))
    it('throws if value is not a number', () => expect(() => math.cube('a')).toThrow('value must be a number'))
  })

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
    it('throws if value is not a number', () => expect(() => math.round('a')).toThrow('value must be a number'))
    it('throws if precision is not a positive integer', () => expect(() => math.round(1.234, -1)).toThrow('precision must be a positive integer'))
  })

  describe('exponential', () => {
    it('formats a positive number', () => expect(math.exponential(1000, 2)).toBe('1.00e+3'))
    it('formats a decimal number', () => expect(math.exponential(0.005, 2)).toBe('5.00e-3'))
    it('formats a negative number', () => expect(math.exponential(-1000, 2)).toBe('-1.00e+3'))
    it('formats zero', () => expect(math.exponential(0, 2)).toBe('0.00e+0'))
    it('formats with 0 decimals', () => expect(math.exponential(1000, 0)).toBe('1e+3'))
    it('throws if value is not a number', () => expect(() => math.exponential('1', 2)).toThrow('value must be a number'))
    it('throws if decimals is not a positive integer', () => expect(() => math.exponential(1000, -1)).toThrow('decimals must be a positive integer'))
    it('throws if decimals is a float', () => expect(() => math.exponential(1000, 2.5)).toThrow('decimals must be a positive integer'))
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

  describe('easeIn', () => {
    it('returns 0 at t=0', () => expect(math.easeIn(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.easeIn(1)).toBe(1))
    it('returns a value less than t for default linearity', () => expect(math.easeIn(0.5)).toBeLessThan(0.5))
    it('throws if t is out of range', () => expect(() => math.easeIn(1.5)).toThrow('t must be in range [0, 1]'))
    it('throws if linearity is not a number', () => expect(() => math.easeIn(0.5, 'a')).toThrow('linearity must be a number'))
  })

  describe('easeOut', () => {
    it('returns 0 at t=0', () => expect(math.easeOut(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.easeOut(1)).toBe(1))
    it('returns a value greater than t for default linearity', () => expect(math.easeOut(0.5)).toBeGreaterThan(0.5))
    it('throws if t is out of range', () => expect(() => math.easeOut(1.5)).toThrow('t must be in range [0, 1]'))
    it('throws if linearity is not a number', () => expect(() => math.easeOut(0.5, 'a')).toThrow('linearity must be a number'))
  })

  describe('cubicBezier', () => {
    it('returns 0 at t=0', () => expect(math.cubicBezier(0)).toBe(0))
    it('returns 1 at t=1', () => expect(math.cubicBezier(1)).toBe(1))
    it('returns ~0.5 at t=0.5 for symmetric curve', () => expect(math.cubicBezier(0.5)).toBeCloseTo(0.5, 1))
  })

  describe('sum', () => {
    it('sums an array of numbers', () => expect(math.sum([1, 2, 3, 4])).toBe(10))
    it('returns 0 for an empty array', () => expect(math.sum([])).toBe(0))
    it('throws if values is not an array', () => expect(() => math.sum('a')).toThrow('values must be an array'))
  })

  describe('average', () => {
    it('returns the average of an array', () => expect(math.average([1, 2, 3, 4])).toBe(2.5))
    it('returns the value for a single element array', () => expect(math.average([5])).toBe(5))
    it('throws if values is empty', () => expect(() => math.average([])).toThrow('values must be a non-empty array'))
    it('throws if values is not an array', () => expect(() => math.average('a')).toThrow('values must be a non-empty array'))
  })

  describe('median', () => {
    it('returns the median of an odd array', () => expect(math.median([1, 2, 3, 4, 5])).toBe(3))
    it('returns the median of an even array', () => expect(math.median([1, 2, 3, 4])).toBe(2.5))
    it('returns the value for a single element array', () => expect(math.median([5])).toBe(5))
    it('handles unsorted arrays', () => expect(math.median([5, 1, 3])).toBe(3))
    it('throws if values is empty', () => expect(() => math.median([])).toThrow('values must be a non-empty array'))
  })

  describe('percentage', () => {
    it('returns the percentage', () => expect(math.percentage(1, 4)).toBe(25))
    it('rounds to 2 decimals', () => expect(math.percentage(1, 3)).toBe(33.33))
    it('throws if value is not a number', () => expect(() => math.percentage('a', 100)).toThrow('value must be a number'))
    it('throws if total is not a number', () => expect(() => math.percentage(1, 'a')).toThrow('total must be a number'))
  })
})
