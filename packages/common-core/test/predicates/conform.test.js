import { describe, it, expect } from 'vitest'
import { conform, is, optional, AssertionError } from '../../src/predicates/index.js'

describe('conform.schema', () => {
  describe('arguments validation', () => {
    it('should throw if obj is null', () => {
      expect(() => conform.schema(null, {})).toThrow()
    })

    it('should throw if obj is undefined', () => {
      expect(() => conform.schema(undefined, {})).toThrow()
    })

    it('should throw if obj is a string', () => {
      expect(() => conform.schema('string', {})).toThrow()
    })

    it('should throw if obj is a number', () => {
      expect(() => conform.schema(42, {})).toThrow()
    })

    it('should throw if obj is an array', () => {
      expect(() => conform.schema([], {})).toThrow()
    })

    it('should throw if schema is null', () => {
      expect(() => conform.schema({}, null)).toThrow()
    })

    it('should throw if schema is undefined', () => {
      expect(() => conform.schema({}, undefined)).toThrow()
    })

    it('should throw if schema is a string', () => {
      expect(() => conform.schema({}, 'string')).toThrow()
    })

    it('should throw if schema is an array', () => {
      expect(() => conform.schema({}, [])).toThrow()
    })

    it('should throw if a validator is a number', () => {
      const schema = { name: 42 }
      const obj = { name: 'Alice' }
      expect(() => conform.schema(obj, schema)).toThrow(AssertionError)
    })

    it('should throw if a validator is a string', () => {
      const schema = { name: 'string' }
      const obj = { name: 'Alice' }
      expect(() => conform.schema(obj, schema)).toThrow(AssertionError)
    })

    it('should throw if a validator is null', () => {
      const schema = { name: null }
      const obj = { name: 'Alice' }
      expect(() => conform.schema(obj, schema)).toThrow(AssertionError)
    })
  })

  describe('empty schema', () => {
    it('should return true for an empty object against an empty schema', () => {
      const schema = {}
      const obj = {}
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return true for an object with extra keys against an empty schema', () => {
      const schema = {}
      const obj = { name: 'Alice' }
      expect(conform.schema(obj, schema)).toBe(true)
    })
  })

  describe('required keys', () => {
    it('should return true if all required keys are present and valid', () => {
      const schema = { name: is.string, age: is.number }
      const obj = { name: 'Alice', age: 30 }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false if a required key is missing', () => {
      const schema = { name: is.string, age: is.number }
      const obj = { name: 'Alice' }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if all required keys are missing', () => {
      const schema = { name: is.string, age: is.number }
      const obj = {}
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if a required key fails its validator', () => {
      const schema = { name: is.string, age: is.number }
      const obj = { name: 'Alice', age: 'thirty' }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if a required key is explicitly undefined', () => {
      const schema = { name: is.string }
      const obj = { name: undefined }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if a required key is explicitly null', () => {
      const schema = { name: is.string }
      const obj = { name: null }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should ignore extra keys not in the schema', () => {
      const schema = { name: is.string }
      const obj = { name: 'Alice', extra: 42 }
      expect(conform.schema(obj, schema)).toBe(true)
    })
  })

  describe('optional keys', () => {
    it('should return true if an optional key is absent', () => {
      const schema = { name: is.string, nickname: optional(is.string) }
      const obj = { name: 'Alice' }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return true if an optional key is present and valid', () => {
      const schema = { name: is.string, nickname: optional(is.string) }
      const obj = { name: 'Alice', nickname: 'Ali' }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false if an optional key is present but invalid', () => {
      const schema = { name: is.string, nickname: optional(is.string) }
      const obj = { name: 'Alice', nickname: 42 }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if an optional key is present but null', () => {
      const schema = { name: is.string, nickname: optional(is.string) }
      const obj = { name: 'Alice', nickname: null }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false if an optional key is present but undefined', () => {
      const schema = { name: is.string, nickname: optional(is.string) }
      const obj = { name: 'Alice', nickname: undefined }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return true if all keys are optional and obj is empty', () => {
      const schema = { name: optional(is.string), age: optional(is.number) }
      const obj = {}
      expect(conform.schema(obj, schema)).toBe(true)
    })
  })

  describe('nested schemas', () => {
    it('should return true if a nested schema match', () => {
      const schema = { address: { city: is.string, zip: is.string } }
      const obj = { address: { city: 'Paris', zip: '75001' } }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false if a required nested key is missing', () => {
      const schema = { address: { city: is.string, zip: is.string } }
      const obj = { address: { city: 'Paris' } }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if the nested value is a string', () => {
      const schema = { address: { city: is.string } }
      const obj = { address: 'Paris' }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if the nested value is null', () => {
      const schema = { address: { city: is.string } }
      const obj = { address: null }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false if the nested value is a number', () => {
      const schema = { address: { city: is.string } }
      const obj = { address: 42 }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return true if an optional nested key is absent', () => {
      const schema = { address: { city: is.string, zip: optional(is.string) } }
      const obj = { address: { city: 'Paris' } }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return true if an optional nested key is present and valid', () => {
      const schema = { address: { city: is.string, zip: optional(is.string) } }
      const obj = { address: { city: 'Paris', zip: '75001' } }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false if an optional nested key is present but invalid', () => {
      const schema = { address: { city: is.string, zip: optional(is.string) } }
      const obj = { address: { city: 'Paris', zip: 75001 } }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return true for a deeply nested schema that match', () => {
      const schema = { a: { b: { c: is.string } } }
      const obj = { a: { b: { c: 'deep' } } }
      expect(conform.schema(obj, schema)).toBe(true)
    })

    it('should return false for a deeply nested schema with invalid value', () => {
      const schema = { a: { b: { c: is.string } } }
      const obj = { a: { b: { c: 42 } } }
      expect(conform.schema(obj, schema)).toBe(false)
    })

    it('should return false for a deeply nested schema with missing key', () => {
      const schema = { a: { b: { c: is.string } } }
      const obj = { a: { b: {} } }
      expect(conform.schema(obj, schema)).toBe(false)
    })
  })
})
