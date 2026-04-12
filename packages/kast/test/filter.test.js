import { describe, it, expect } from 'vitest'
import { filter } from '../src/filter.js'

describe('filter', () => {
  describe('basic filtering', () => {
    it('filter by exact value', () => {
      const json = [{ type: 'a' }, { type: 'b' }, { type: 'a' }]
      const result = filter(json, { type: 'a' })
      expect(result).toHaveLength(2)
      expect(result.every(o => o.type === 'a')).toBe(true)
    })

    it('returns an empty array when no objects match', () => {
      const result = filter([{ type: 'a' }], { type: 'z' })
      expect(result).toEqual([])
    })

    it('returns all objects when all match', () => {
      const json = [{ v: 1 }, { v: 1 }]
      expect(filter(json, { v: 1 })).toHaveLength(2)
    })

    it('returns a new array, not the original reference', () => {
      const json = [{ type: 'a' }]
      const result = filter(json, { type: 'a' })
      expect(result).not.toBe(json)
    })
  })

  describe('sift operators', () => {
    it('supports $gt', () => {
      const json = [{ age: 10 }, { age: 20 }, { age: 30 }]
      expect(filter(json, { age: { $gt: 15 } })).toHaveLength(2)
    })

    it('supports $gte', () => {
      const json = [{ age: 10 }, { age: 20 }, { age: 30 }]
      expect(filter(json, { age: { $gte: 20 } })).toHaveLength(2)
    })

    it('supports $lt', () => {
      const json = [{ age: 10 }, { age: 20 }, { age: 30 }]
      const result = filter(json, { age: { $lt: 20 } })
      expect(result).toHaveLength(1)
      expect(result[0].age).toBe(10)
    })

    it('supports $lte', () => {
      const json = [{ age: 10 }, { age: 20 }, { age: 30 }]
      expect(filter(json, { age: { $lte: 20 } })).toHaveLength(2)
    })

    it('supports $ne', () => {
      const json = [{ type: 'a' }, { type: 'b' }]
      expect(filter(json, { type: { $ne: 'a' } })).toEqual([{ type: 'b' }])
    })

    it('supports $in', () => {
      const json = [{ status: 'active' }, { status: 'pending' }, { status: 'deleted' }]
      expect(filter(json, { status: { $in: ['active', 'pending'] } })).toHaveLength(2)
    })

    it('supports $nin', () => {
      const json = [{ status: 'active' }, { status: 'deleted' }]
      expect(filter(json, { status: { $nin: ['deleted'] } })).toEqual([{ status: 'active' }])
    })

    it('supports $exists: true', () => {
      const json = [{ a: 1 }, { b: 2 }]
      expect(filter(json, { a: { $exists: true } })).toEqual([{ a: 1 }])
    })

    it('supports $exists: false', () => {
      const json = [{ a: 1 }, { b: 2 }]
      expect(filter(json, { a: { $exists: false } })).toEqual([{ b: 2 }])
    })

    it('supports implicit AND with multiple fields', () => {
      const json = [{ type: 'a', v: 1 }, { type: 'a', v: 2 }, { type: 'b', v: 1 }]
      expect(filter(json, { type: 'a', v: 1 })).toEqual([{ type: 'a', v: 1 }])
    })
  })

  describe('assertions', () => {
    it('throws when json is not an array', () => {
      expect(() => filter({ a: 1 }, { a: 1 })).toThrow()
    })

    it('throws when json is null', () => {
      expect(() => filter(null, { a: 1 })).toThrow()
    })

    it('throws when query is not a plain object', () => {
      expect(() => filter([{ a: 1 }], 'invalid')).toThrow()
    })

    it('throws when query is null', () => {
      expect(() => filter([{ a: 1 }], null)).toThrow()
    })
  })
})
