import { describe, it, expect } from 'vitest'
import { string } from '../../src/utilities/string'

describe('string.makeDiacriticPattern', () => {
  it('expands a base char to its diacritic family', () => {
    expect(string.makeDiacriticPattern('a')).toBe('[aáàäâã]')
  })

  it('expands multiple chars', () => {
    expect(string.makeDiacriticPattern('ae')).toBe('[aáàäâã][eéëèê]')
  })

  it('leaves non-diacritic chars unchanged', () => {
    expect(string.makeDiacriticPattern('hello')).toBe('h[eéëèê]ll[oóöòõô]')
  })

  it('reverse mode — expands a diacritic char to its family', () => {
    expect(string.makeDiacriticPattern('é', { reverse: true })).toBe('[eéëèê]')
  })

  it('reverse mode — leaves base chars unchanged if not in any family', () => {
    expect(string.makeDiacriticPattern('h', { reverse: true })).toBe('h')
  })

  it('handles uppercase input', () => {
    expect(string.makeDiacriticPattern('A')).toBe('[aáàäâã]')
  })

  it('throws if pattern is not a string', () => {
    expect(() => string.makeDiacriticPattern(123)).toThrow('pattern must be a string')
  })
})

describe('string.slugify', () => {
  it('slugifies a string', () => {
    expect(string.slugify('Hello World')).toBe('hello-world')
  })

  it('removes diacritics', () => {
    expect(string.slugify('Héllo Wörld')).toBe('hello-world')
  })

  it('trims leading and trailing spaces', () => {
    expect(string.slugify('  hello world  ')).toBe('hello-world')
  })

  it('collapses multiple spaces into a single separator', () => {
    expect(string.slugify('hello   world')).toBe('hello-world')
  })

  it('collapses multiple special chars into a single separator', () => {
    expect(string.slugify('hello, world!')).toBe('hello-world')
  })

  it('uses a custom separator', () => {
    expect(string.slugify('hello world', '_')).toBe('hello_world')
  })

  it('throws if str is not a string', () => {
    expect(() => string.slugify(123)).toThrow('str must be a string')
  })

  it('throws if separator is not a char', () => {
    expect(() => string.slugify('hello', '--')).toThrow('separator must be a char')
  })
})

describe('string.initials', () => {
  it('returns initials of a two word string', () => {
    expect(string.initials('John Doe')).toBe('JD')
  })

  it('returns initials of a three word string', () => {
    expect(string.initials('Jean Pierre Dupont')).toBe('JPD')
  })

  it('uppercases initials', () => {
    expect(string.initials('john doe')).toBe('JD')
  })

  it('trims leading and trailing spaces', () => {
    expect(string.initials('  John Doe  ')).toBe('JD')
  })

  it('handles multiple spaces between words', () => {
    expect(string.initials('John   Doe')).toBe('JD')
  })

  it('limits initials with max option', () => {
    expect(string.initials('Jean Pierre Dupont', { max: 2 })).toBe('JP')
  })

  it('returns a single initial for a single word', () => {
    expect(string.initials('John')).toBe('J')
  })

  it('throws if str is not a string', () => {
    expect(() => string.initials(null)).toThrow('str must be a string')
    expect(() => string.initials(42)).toThrow('str must be a string')
  })
})
