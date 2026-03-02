import { describe, it, expect } from 'vitest'
import { conforms } from '../src/conforms.js'
import { is } from '../src/is.js'

describe('conforms.schema', () => {
  it('should return true for a valid flat object', () => {
    const obj = { name: 'Alice', age: 25 }
    const schema = { name: is.string, age: is.number }
    expect(conforms.schema(obj, schema)).toBe(true)
  })

  it('should return false if a property does not match the validator', () => {
    const obj = { name: 'Alice', age: '25' }
    const schema = { name: is.string, age: is.number }
    expect(conforms.schema(obj, schema)).toBe(false)
  })

  it('should return false if a property is missing', () => {
    const obj = { name: 'Alice' }
    const schema = { name: is.string, age: is.number }
    expect(conforms.schema(obj, schema)).toBe(false)
  })

  it('should return true for a valid nested object', () => {
    const obj = {
      name: 'Alice',
      age: 25,
      address: { city: 'Paris', zip: '75001' }
    }
    const schema = {
      name: is.string,
      age: is.number,
      address: { city: is.string, zip: is.string }
    }
    expect(conforms.schema(obj, schema)).toBe(true)
  })

  it('should return false for an invalid nested object', () => {
    const obj = {
      name: 'Alice',
      age: 25,
      address: { city: 'Paris', zip: 75001 } // zip should be string
    }
    const schema = {
      name: is.string,
      age: is.number,
      address: { city: is.string, zip: is.string }
    }
    expect(conforms.schema(obj, schema)).toBe(false)
  })

  it('should return false if nested object is missing', () => {
    const obj = { name: 'Alice', age: 25 }
    const schema = {
      name: is.string,
      age: is.number,
      address: { city: is.string, zip: is.string }
    }
    expect(conforms.schema(obj, schema)).toBe(false)
  })

  it('should throw if schema contains invalid validator', () => {
    const obj = { name: 'Alice' }
    const schema = { name: 'not a function or object' }
    expect(() => conforms.schema(obj, schema)).toThrow(TypeError)
  })

  it('should throw if obj is not a plain object', () => {
    const schema = { name: is.string }
    expect(() => conforms.schema(null, schema)).toThrow()
    expect(() => conforms.schema(123, schema)).toThrow()
  })

  it('should throw if schema is not a plain object', () => {
    const obj = { name: 'Alice' }
    expect(() => conforms.schema(obj, null)).toThrow()
    expect(() => conforms.schema(obj, 123)).toThrow()
  })
})
