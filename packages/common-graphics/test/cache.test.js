import { describe, it, expect, beforeEach } from 'vitest'
import { Cache } from '../src/utils/cache'

describe('Cache', () => {
  let cache

  beforeEach(() => {
    cache = new Cache()
  })

  describe('Constructor', () => {
    it('should create cache with default maxSize of 100', () => {
      expect(cache.max).toBe(100)
      expect(cache.size).toBe(0)
    })

    it('should accept custom maxSize', () => {
      const customCache = new Cache(50)
      expect(customCache.max).toBe(50)
    })
  })

  describe('get and set', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('should update existing key', () => {
      cache.set('key1', 'value1')
      cache.set('key1', 'value2')
      expect(cache.get('key1')).toBe('value2')
      expect(cache.size).toBe(1)
    })
  })

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
    })

    it('should return false for non-existent key', () => {
      expect(cache.has('key1')).toBe(false)
    })
  })

  describe('keys', () => {
    it('should return array of keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      expect(cache.keys()).toEqual(['key1', 'key2'])
    })

    it('should return empty array when cache is empty', () => {
      expect(cache.keys()).toEqual([])
    })
  })

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
    })

    it('should return false for non-existent key', () => {
      expect(cache.delete('key1')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.size).toBe(0)
      expect(cache.keys()).toEqual([])
    })
  })

  describe('size', () => {
    it('should return current cache size', () => {
      expect(cache.size).toBe(0)
      cache.set('key1', 'value1')
      expect(cache.size).toBe(1)
      cache.set('key2', 'value2')
      expect(cache.size).toBe(2)
    })
  })

  describe('maxSize eviction', () => {
    it('should remove oldest entry when maxSize is reached', () => {
      const smallCache = new Cache(3)
      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      smallCache.set('key4', 'value4')

      expect(smallCache.size).toBe(3)
      expect(smallCache.has('key1')).toBe(false)
      expect(smallCache.has('key4')).toBe(true)
    })

    it('should not evict when updating existing key', () => {
      const smallCache = new Cache(2)
      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key1', 'updated')

      expect(smallCache.size).toBe(2)
      expect(smallCache.get('key1')).toBe('updated')
    })
  })

  describe('setMaxSize', () => {
    it('should update maxSize', () => {
      cache.setMaxSize(50)
      expect(cache.max).toBe(50)
    })

    it('should evict oldest entry if new maxSize is smaller than current size', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.setMaxSize(2)

      expect(cache.size).toBe(2)
      expect(cache.has('key1')).toBe(false)
    })

    it('should not evict if new maxSize is larger than current size', () => {
      cache.set('key1', 'value1')
      cache.setMaxSize(200)

      expect(cache.size).toBe(1)
      expect(cache.has('key1')).toBe(true)
    })
  })
})
