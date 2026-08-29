import { afterEach, describe, expect, it, vi } from 'vitest'
import { random } from '../../src/utilities/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('random.integer', () => {
  it('maps Math.random 0 to min and near-1 to max (inclusive bounds)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.integer(1, 6)).toBe(1)
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(random.integer(1, 6)).toBe(6)
  })
  it('always returns an integer within [min, max]', () => {
    for (let i = 0; i < 1000; i++) {
      const value = random.integer(-3, 7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(-3)
      expect(value).toBeLessThanOrEqual(7)
    }
  })
  it('supports min === max', () => {
    expect(random.integer(5, 5)).toBe(5)
  })
  it('throws on non-integer bounds', () => {
    expect(() => random.integer(1.5, 6)).toThrow()
    expect(() => random.integer(1, 6.2)).toThrow()
  })
})

describe('random.number', () => {
  it('maps Math.random 0 to min', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.number(2, 10)).toBe(2)
  })
  it('always returns a value within [min, max)', () => {
    for (let i = 0; i < 1000; i++) {
      const value = random.number(0, 1)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
  it('throws on non-number bounds', () => {
    expect(() => random.number('a', 10)).toThrow()
  })
})

describe('random.choice', () => {
  it('returns the element at the computed index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.choice(['a', 'b', 'c'])).toBe('a')
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(random.choice(['a', 'b', 'c'])).toBe('c')
  })
  it('only ever returns an element of the array', () => {
    const array = [10, 20, 30, 40]
    for (let i = 0; i < 1000; i++) {
      expect(array).toContain(random.choice(array))
    }
  })
  it('throws on an empty array', () => {
    expect(() => random.choice([])).toThrow()
  })
})

describe('random.sample', () => {
  it('calls the generator exactly count times', () => {
    const generator = vi.fn(() => 1)
    random.sample(generator, 5)
    expect(generator).toHaveBeenCalledTimes(5)
  })
  it('returns an array of the requested length', () => {
    const result = random.sample(() => random.integer(1, 6), 10)
    expect(result).toHaveLength(10)
  })
  it('returns an empty array for count 0', () => {
    expect(random.sample(() => 1, 0)).toEqual([])
  })
  it('composes with choice', () => {
    const result = random.sample(() => random.choice(['x', 'y']), 20)
    expect(result.every((v) => v === 'x' || v === 'y')).toBe(true)
  })
  it('throws on a non-function generator', () => {
    expect(() => random.sample(42, 3)).toThrow()
  })
  it('throws on a negative count', () => {
    expect(() => random.sample(() => 1, -1)).toThrow()
  })
})

describe('random.shuffle', () => {
  it('returns a permutation with the same elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = random.shuffle(input)
    expect([...result].sort((a, b) => a - b)).toEqual(input)
  })
  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    random.shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
  it('handles an empty array', () => {
    expect(random.shuffle([])).toEqual([])
  })
  it('produces a deterministic order for a fixed Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.shuffle([1, 2, 3])).toEqual([2, 3, 1])
  })
  it('throws on a non-array', () => {
    expect(() => random.shuffle('abc')).toThrow()
  })
})
