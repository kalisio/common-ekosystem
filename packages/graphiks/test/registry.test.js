import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { registry } from '../src/utils/registry'

describe('Registry', () => {
  beforeEach(() => {
    registry.clear()
  })

  afterEach(() => {
    registry.clear()
  })

  describe('register and get', () => {
    it('should register and get values', () => {
      registry.register('circle', { data: 'value1' })
      expect(registry.get('circle')).toEqual({ data: 'value1' })
    })

    it('should return undefined for non-existent key', () => {
      expect(registry.get('nonexistent')).toBeUndefined()
    })

    it('should update existing key', () => {
      registry.register('rectangle', 'value1')
      registry.register('rectangle', 'value2')
      expect(registry.get('rectangle')).toBe('value2')
      expect(registry.size).toBe(1)
    })
  })

  describe('has', () => {
    it('should return true for registered key', () => {
      registry.register('triangle', 'value1')
      expect(registry.has('triangle')).toBe(true)
    })

    it('should return false for non-existent key', () => {
      expect(registry.has('pentagon')).toBe(false)
    })
  })

  describe('list', () => {
    it('should return array of registered keys', () => {
      registry.register('circle', 'value1')
      registry.register('square', 'value2')
      expect(registry.list()).toEqual(['circle', 'square'])
    })

    it('should return empty array when registry is empty', () => {
      expect(registry.list()).toEqual([])
    })
  })

  describe('unregister', () => {
    it('should unregister existing key', () => {
      registry.register('hexagon', 'value1')
      expect(registry.unregister('hexagon')).toBe(true)
      expect(registry.has('hexagon')).toBe(false)
    })

    it('should return false for non-existent key', () => {
      expect(registry.unregister('octagon')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      registry.register('circle', 'value1')
      registry.register('triangle', 'value2')
      registry.clear()
      expect(registry.size).toBe(0)
      expect(registry.list()).toEqual([])
    })
  })

  describe('size', () => {
    it('should return current registry size', () => {
      expect(registry.size).toBe(0)
      registry.register('polygon', 'value1')
      expect(registry.size).toBe(1)
      registry.register('ellipse', 'value2')
      expect(registry.size).toBe(2)
    })
  })
})
