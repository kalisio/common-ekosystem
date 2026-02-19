import { describe, it, expect } from 'vitest'
import { text } from '../src/index.js'

describe('text.isEqual', () => {
  it('should return true for identical strings', () => {
    expect(text.isEqual('hello', 'hello')).toBe(true)
  })

  it('should return false for different strings', () => {
    expect(text.isEqual('hello', 'world')).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    expect(text.isEqual('Hello', 'hello', { ignoreCase: true })).toBe(true)
    expect(text.isEqual('Hello', 'hello', { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    expect(text.isEqual('  hello  ', 'hello', { ignoreSpaces: true })).toBe(true)
    expect(text.isEqual('  hello  ', 'hello', { ignoreSpaces: false })).toBe(false)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    expect(text.isEqual('école', 'ecole', { ignoreAccents: true })).toBe(true)
    expect(text.isEqual('école', 'ecole', { ignoreAccents: false })).toBe(false)
  })

  it('should combine options correctly', () => {
    const options = { ignoreCase: true, ignoreSpaces: true, ignoreAccents: true }
    expect(text.isEqual('  École  ', 'ecole', options)).toBe(true)
  })

  it('should return false if strings differ after normalization', () => {
    expect(text.isEqual('école', 'écolle', { ignoreCase: true, ignoreAccents: true })).toBe(false)
  })
})
