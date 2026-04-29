import { describe, it, expect } from 'vitest'
import { truncateBBox } from '../../../src/operators/truncate'

describe('truncateBBox', () => {
  it('truncates a 2D bbox with default precision (7)', () => {
    const bbox = [-10.123456789, -20.987654321, 10.123456789, 20.987654321]
    const result = truncateBBox(bbox)
    expect(result).toEqual([-10.1234568, -20.9876543, 10.1234568, 20.9876543])
  })

  it('truncates a 3D bbox (6 values)', () => {
    const bbox = [-10.123456789, -20.987654321, 0.123456789, 10.123456789, 20.987654321, 1.987654321]
    const result = truncateBBox(bbox, 5)
    expect(result).toEqual([-10.12346, -20.98765, 0.12346, 10.12346, 20.98765, 1.98765])
  })

  it('mutates the original array', () => {
    const bbox = [-10.123456789, -20.987654321, 10.123456789, 20.987654321]
    const result = truncateBBox(bbox)
    expect(result).toBe(bbox)
  })

  it('returns the bbox', () => {
    const bbox = [1.111111111, 2.222222222, 3.333333333, 4.444444444]
    const result = truncateBBox(bbox)
    expect(result).toBeDefined()
  })

  it('handles precision 0', () => {
    const bbox = [1.9, 2.4, 3.6, 4.1]
    const result = truncateBBox(bbox, 0)
    expect(result).toEqual([2, 2, 4, 4])
  })

  it('handles precision 8', () => {
    const bbox = [1.123456789, 2.987654321, 3.111111111, 4.999999999]
    const result = truncateBBox(bbox, 8)
    expect(result).toEqual([1.12345679, 2.98765432, 3.11111111, 5])
  })

  it('throws if bbox is invalid', () => {
    expect(() => truncateBBox('not a bbox')).toThrow()
    expect(() => truncateBBox([1, 2])).toThrow()
    expect(() => truncateBBox(null)).toThrow()
  })

  it('throws if precision is out of range', () => {
    expect(() => truncateBBox([1, 2, 3, 4], -1)).toThrow()
    expect(() => truncateBBox([1, 2, 3, 4], 9)).toThrow()
  })
})
