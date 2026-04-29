import { describe, it, expect } from 'vitest'
import { truncatePosition } from '../../../src/operators/truncate'

describe('truncatePosition', () => {
  it('truncates a 2D position with default precision (7)', () => {
    const position = [10.123456789, 20.987654321]
    const result = truncatePosition(position)
    expect(result).toEqual([10.1234568, 20.9876543])
  })

  it('truncates a 3D position (with altitude)', () => {
    const position = [10.123456789, 20.987654321, 100.123456789]
    const result = truncatePosition(position, 5)
    expect(result).toEqual([10.12346, 20.98765, 100.12346])
  })

  it('mutates the original array', () => {
    const position = [10.123456789, 20.987654321]
    const result = truncatePosition(position)
    expect(result).toBe(position)
  })

  it('returns the position', () => {
    const position = [1.111111111, 2.222222222]
    const result = truncatePosition(position)
    expect(result).toBeDefined()
  })

  it('handles precision 0', () => {
    const position = [1.9, 2.4]
    const result = truncatePosition(position, 0)
    expect(result).toEqual([2, 2])
  })

  it('handles precision 8', () => {
    const position = [1.123456789, 2.987654321]
    const result = truncatePosition(position, 8)
    expect(result).toEqual([1.12345679, 2.98765432])
  })

  it('throws if position is invalid', () => {
    expect(() => truncatePosition('not a position')).toThrow()
    expect(() => truncatePosition([1])).toThrow()
    expect(() => truncatePosition(null)).toThrow()
  })

  it('throws if precision is out of range', () => {
    expect(() => truncatePosition([1, 2], -1)).toThrow()
    expect(() => truncatePosition([1, 2], 9)).toThrow()
  })
})
