import { describe, it, expect } from 'vitest'
import { string } from '../../src/utilities/index.js'

describe('string.normalize', () => {
  it('returns the string unchanged by default', () => {
    expect(string.normalize('Héllo  World')).toBe('Héllo  World')
  })
  it('collapses and trims spaces when ignoreSpaces is true', () => {
    expect(string.normalize('  hello   world  ', { ignoreSpaces: true })).toBe('hello world')
  })
  it('removes diacritics when ignoreDiacritics is true', () => {
    expect(string.normalize('Héllo Wörld', { ignoreDiacritics: true })).toBe('Hello World')
  })
  it('lowercases when ignoreCase is true', () => {
    expect(string.normalize('Hello World', { ignoreCase: true })).toBe('hello world')
  })
  it('combines all options', () => {
    expect(string.normalize('  Héllo   Wörld  ', {
      ignoreSpaces: true,
      ignoreDiacritics: true,
      ignoreCase: true
    })).toBe('hello world')
  })
  it('respects locale for case conversion (Turkish dotted/dotless i)', () => {
    expect(string.normalize('İstanbul', { ignoreCase: true, locale: 'tr-TR' })).toBe('istanbul')
  })
  it('throws if str is not a string', () => {
    expect(() => string.normalize(123)).toThrow('str must be a string')
  })
  it('throws if options do not conform to schema', () => {
    expect(() => string.normalize('hello', { ignoreCase: 'yes' })).toThrow()
    expect(() => string.normalize('hello', { locale: 42 })).toThrow()
  })
})

describe('string.compare', () => {
  it('sorts diacritics-insensitively by default', () => {
    expect(string.compare('été', 'zoo')).toBeLessThan(0)
  })
  it('treats accented and unaccented equivalents as equal by default', () => {
    expect(string.compare('été', 'ete')).toBe(0)
  })
  it('ignores case by default', () => {
    expect(string.compare('Hello', 'hello')).toBe(0)
  })
  it('distinguishes diacritics when ignoreDiacritics is false', () => {
    expect(string.compare('été', 'ete', { ignoreDiacritics: false })).not.toBe(0)
  })
  it('distinguishes case when ignoreCase is false', () => {
    expect(string.compare('Hello', 'hello', { ignoreCase: false })).not.toBe(0)
  })
  it('ignores leading/trailing/multiple spaces when ignoreSpaces is true', () => {
    expect(string.compare('  hello   world', 'hello world', { ignoreSpaces: true })).toBe(0)
  })
  it('distinguishes spaces by default (ignoreSpaces off)', () => {
    expect(string.compare('  hello world', 'hello world')).not.toBe(0)
  })
  it('sorts an array of accented strings correctly', () => {
    const words = ['zèbre', 'étoile', 'abricot']
    expect([...words].sort(string.compare)).toEqual(['abricot', 'étoile', 'zèbre'])
  })
  it('throws if str1 is not a string', () => {
    expect(() => string.compare(123, 'abc')).toThrow('str1 must be a string')
  })
  it('throws if str2 is not a string', () => {
    expect(() => string.compare('abc', 123)).toThrow('str2 must be a string')
  })
  it('throws if options do not conform to schema', () => {
    expect(() => string.compare('a', 'b', { locale: 42 })).toThrow()
  })
})

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

describe('string.words', () => {
  it('splits on spaces', () => {
    expect(string.words('hello world')).toEqual(['hello', 'world'])
  })
  it('splits on case transitions (camelCase)', () => {
    expect(string.words('helloWorld')).toEqual(['hello', 'World'])
  })
  it('keeps acronyms whole and splits at the acronym boundary', () => {
    expect(string.words('getHTTPResponse')).toEqual(['get', 'HTTP', 'Response'])
  })
  it('splits on mixed separators and case', () => {
    expect(string.words('__FOO_barBaz__')).toEqual(['FOO', 'bar', 'Baz'])
  })
  it('treats digit runs as their own words', () => {
    expect(string.words('foo123bar')).toEqual(['foo', '123', 'bar'])
    expect(string.words('version2Point0')).toEqual(['version', '2', 'Point', '0'])
  })
  it('treats accented letters as letters, not separators', () => {
    expect(string.words('café déjà')).toEqual(['café', 'déjà'])
  })
  it('returns an empty array for an empty string', () => {
    expect(string.words('')).toEqual([])
  })
  it('returns an empty array when there is nothing to match', () => {
    expect(string.words('___')).toEqual([])
  })
  it('throws if str is not a string', () => {
    expect(() => string.words(123)).toThrow('str must be a string')
  })
})

describe('string.capitalize', () => {
  it('uppercases the first letter and lowercases the rest', () => {
    expect(string.capitalize('hello')).toBe('Hello')
    expect(string.capitalize('HELLO')).toBe('Hello')
    expect(string.capitalize('hELLO')).toBe('Hello')
  })
  it('handles a single character', () => {
    expect(string.capitalize('a')).toBe('A')
  })
  it('returns an empty string for an empty string (no crash)', () => {
    expect(string.capitalize('')).toBe('')
  })
  it('leaves a leading digit untouched', () => {
    expect(string.capitalize('123abc')).toBe('123abc')
  })
  it('throws if str is not a string', () => {
    expect(() => string.capitalize(123)).toThrow('str must be a string')
  })
})

describe('string.camelCase', () => {
  it('camelCases a space separated string', () => {
    expect(string.camelCase('hello world')).toBe('helloWorld')
  })
  it('normalizes mixed separators', () => {
    expect(string.camelCase('foo-bar_baz')).toBe('fooBarBaz')
    expect(string.camelCase('__FOO_barBaz__')).toBe('fooBarBaz')
  })
  it('flattens acronyms', () => {
    expect(string.camelCase('getHTTPResponse')).toBe('getHttpResponse')
  })
  it('removes diacritics', () => {
    expect(string.camelCase('déjà-vu')).toBe('dejaVu')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.camelCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.camelCase(123)).toThrow('str must be a string')
  })
})

describe('string.pascalCase', () => {
  it('pascalCases a space separated string', () => {
    expect(string.pascalCase('hello world')).toBe('HelloWorld')
  })
  it('flattens acronyms', () => {
    expect(string.pascalCase('getHTTPResponse')).toBe('GetHttpResponse')
  })
  it('removes diacritics', () => {
    expect(string.pascalCase('déjà-vu')).toBe('DejaVu')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.pascalCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.pascalCase(123)).toThrow('str must be a string')
  })
})

describe('string.kebabCase', () => {
  it('kebabCases from camelCase input', () => {
    expect(string.kebabCase('helloWorld')).toBe('hello-world')
  })
  it('splits acronyms', () => {
    expect(string.kebabCase('getHTTPResponse')).toBe('get-http-response')
  })
  it('normalizes mixed separators', () => {
    expect(string.kebabCase('__FOO_barBaz__')).toBe('foo-bar-baz')
  })
  it('removes diacritics', () => {
    expect(string.kebabCase('Héllo Wörld')).toBe('hello-world')
  })
  it('separates digit runs', () => {
    expect(string.kebabCase('version2Point0')).toBe('version-2-point-0')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.kebabCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.kebabCase(123)).toThrow('str must be a string')
  })
})

describe('string.snakeCase', () => {
  it('snakeCases from camelCase input', () => {
    expect(string.snakeCase('helloWorld')).toBe('hello_world')
  })
  it('splits acronyms', () => {
    expect(string.snakeCase('getHTTPResponse')).toBe('get_http_response')
  })
  it('separates digit runs', () => {
    expect(string.snakeCase('version2Point0')).toBe('version_2_point_0')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.snakeCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.snakeCase(123)).toThrow('str must be a string')
  })
})

describe('string.constantCase', () => {
  it('constantCases from camelCase input', () => {
    expect(string.constantCase('maxRetryCount')).toBe('MAX_RETRY_COUNT')
  })
  it('splits acronyms', () => {
    expect(string.constantCase('getHTTPResponse')).toBe('GET_HTTP_RESPONSE')
  })
  it('normalizes mixed separators', () => {
    expect(string.constantCase('hello-world foo')).toBe('HELLO_WORLD_FOO')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.constantCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.constantCase(123)).toThrow('str must be a string')
  })
})

describe('string.dotCase', () => {
  it('dotCases from camelCase input', () => {
    expect(string.dotCase('getUserProfile')).toBe('get.user.profile')
  })
  it('dotCases a space separated string', () => {
    expect(string.dotCase('user profile title')).toBe('user.profile.title')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.dotCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.dotCase(123)).toThrow('str must be a string')
  })
})

describe('string.titleCase', () => {
  it('titleCases a mixed-separator string', () => {
    expect(string.titleCase('hello-world_foo')).toBe('Hello World Foo')
  })
  it('titleCases from camelCase input', () => {
    expect(string.titleCase('getUserProfile')).toBe('Get User Profile')
  })
  it('removes diacritics (current deburring behavior)', () => {
    expect(string.titleCase('café crème')).toBe('Café Crème')
  })
  it('returns an empty string for an empty string', () => {
    expect(string.titleCase('')).toBe('')
  })
  it('throws if str is not a string', () => {
    expect(() => string.titleCase(123)).toThrow('str must be a string')
  })
})
