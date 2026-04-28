import { describe, it, expect } from 'vitest'
import { is } from '../../src/predicates'

describe('is.defined', () => {
  it('returns true for 0', () => {
    expect(is.defined(0)).toBe(true)
  })
  it('returns true for an empty string', () => {
    expect(is.defined('')).toBe(true)
  })
  it('returns true for false', () => {
    expect(is.defined(false)).toBe(true)
  })
  it('returns true for an empty array', () => {
    expect(is.defined([])).toBe(true)
  })
  it('returns true for an empty object', () => {
    expect(is.defined({})).toBe(true)
  })
  it('returns true for NaN', () => {
    expect(is.defined(NaN)).toBe(true)
  })
  it('returns false for null', () => {
    expect(is.defined(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.defined(undefined)).toBe(false)
  })
})

describe('is.nil', () => {
  it('returns true for null', () => {
    expect(is.nil(null)).toBe(true)
  })
  it('returns true for undefined', () => {
    expect(is.nil(undefined)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.nil(0)).toBe(false)
  })
  it('returns false for false', () => {
    expect(is.nil(false)).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.nil('')).toBe(false)
  })
  it('returns false for an empty array', () => {
    expect(is.nil([])).toBe(false)
  })
  it('returns false for an empty object', () => {
    expect(is.nil({})).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.nil(NaN)).toBe(false)
  })
})

describe('is.plainObject', () => {
  it('returns true for {}', () => {
    expect(is.plainObject({})).toBe(true)
  })
  it('returns true for { a: 1 }', () => {
    expect(is.plainObject({ a: 1 })).toBe(true)
  })
  it('returns true for a nested object', () => {
    expect(is.plainObject({ a: { b: 2 } })).toBe(true)
  })
  it('returns false for an empty array', () => {
    expect(is.plainObject([])).toBe(false)
  })
  it('returns false for a non-empty array', () => {
    expect(is.plainObject([1, 2])).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.plainObject(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.plainObject(undefined)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.plainObject('string')).toBe(false)
  })
  it('returns false for a number', () => {
    expect(is.plainObject(1)).toBe(false)
  })
  it('returns false for a boolean', () => {
    expect(is.plainObject(true)).toBe(false)
  })
  it('returns false for a function', () => {
    expect(is.plainObject(() => {})).toBe(false)
  })
  it('returns false for a Date instance', () => {
    expect(is.plainObject(new Date())).toBe(false)
  })
  it('returns false for a Map', () => {
    expect(is.plainObject(new Map())).toBe(false)
  })
  it('returns false for a Set', () => {
    expect(is.plainObject(new Set())).toBe(false)
  })
  it('returns false for Object.create(null)', () => {
    expect(is.plainObject(Object.create(null))).toBe(false)
  })
})

describe('is.emptyObject', () => {
  it('returns true for {}', () => {
    expect(is.emptyObject({})).toBe(true)
  })
  it('returns false for { a: 1 }', () => {
    expect(is.emptyObject({ a: 1 })).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.emptyObject(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.emptyObject(undefined)).toBe(false)
  })
  it('returns false for an empty array', () => {
    expect(is.emptyObject([])).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.emptyObject('')).toBe(false)
  })
  it('returns false for a Date instance', () => {
    expect(is.emptyObject(new Date())).toBe(false)
  })
  it('returns false for Object.create(null)', () => {
    expect(is.emptyObject(Object.create(null))).toBe(false)
  })
})

describe('is.nonEmptyObject', () => {
  it('returns true for { a: 1 }', () => {
    expect(is.nonEmptyObject({ a: 1 })).toBe(true)
  })
  it('returns true for a deeply nested object', () => {
    expect(is.nonEmptyObject({ a: { b: 2 } })).toBe(true)
  })
  it('returns false for {}', () => {
    expect(is.nonEmptyObject({})).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonEmptyObject(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.nonEmptyObject(undefined)).toBe(false)
  })
  it('returns false for a non-empty array', () => {
    expect(is.nonEmptyObject([1])).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.nonEmptyObject('hello')).toBe(false)
  })
  it('returns false for a Date instance', () => {
    expect(is.nonEmptyObject(new Date())).toBe(false)
  })
  it('returns false for Object.create(null)', () => {
    expect(is.nonEmptyObject(Object.create(null))).toBe(false)
  })
})

describe('is.string', () => {
  it('returns true for an empty string', () => {
    expect(is.string('')).toBe(true)
  })
  it('returns true for a non-empty string', () => {
    expect(is.string('hello')).toBe(true)
  })
  it('returns true for a whitespace-only string', () => {
    expect(is.string('   ')).toBe(true)
  })
  it('returns true for a string with special characters', () => {
    expect(is.string('hello\nworld')).toBe(true)
  })
  it('returns false for a number', () => {
    expect(is.string(1)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.string(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.string(undefined)).toBe(false)
  })
  it('returns false for a boolean', () => {
    expect(is.string(true)).toBe(false)
  })
  it('returns false for an array', () => {
    expect(is.string([])).toBe(false)
  })
})

describe('is.emptyString', () => {
  it('returns true for an empty string', () => {
    expect(is.emptyString('')).toBe(true)
  })
  it('returns true for a single space', () => {
    expect(is.emptyString(' ')).toBe(true)
  })
  it('returns true for multiple spaces', () => {
    expect(is.emptyString('   ')).toBe(true)
  })
  it('returns true for a tab character', () => {
    expect(is.emptyString('\t')).toBe(true)
  })
  it('returns true for a newline character', () => {
    expect(is.emptyString('\n')).toBe(true)
  })
  it('returns true for mixed whitespace', () => {
    expect(is.emptyString(' \t\n ')).toBe(true)
  })
  it('returns false for a non-empty string', () => {
    expect(is.emptyString('hello')).toBe(false)
  })
  it('returns false for a string with spaces around content', () => {
    expect(is.emptyString('  hello  ')).toBe(false)
  })
  it('returns false for a number', () => {
    expect(is.emptyString(0)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.emptyString(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.emptyString(undefined)).toBe(false)
  })
})

describe('is.nonEmptyString', () => {
  it('returns true for a non-empty string', () => {
    expect(is.nonEmptyString('hello')).toBe(true)
  })
  it('returns true for a string with spaces around content', () => {
    expect(is.nonEmptyString('  hello  ')).toBe(true)
  })
  it('returns true for a single character', () => {
    expect(is.nonEmptyString('a')).toBe(true)
  })
  it('returns false for an empty string', () => {
    expect(is.nonEmptyString('')).toBe(false)
  })
  it('returns false for a single space', () => {
    expect(is.nonEmptyString(' ')).toBe(false)
  })
  it('returns false for a whitespace-only string', () => {
    expect(is.nonEmptyString('   ')).toBe(false)
  })
  it('returns false for a tab character', () => {
    expect(is.nonEmptyString('\t')).toBe(false)
  })
  it('returns false for a newline character', () => {
    expect(is.nonEmptyString('\n')).toBe(false)
  })
  it('returns false for a number', () => {
    expect(is.nonEmptyString(0)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonEmptyString(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.nonEmptyString(undefined)).toBe(false)
  })
})

describe('is.regularExpression', () => {
  it('returns true for a RegExp literal', () => {
    expect(is.regularExpression(/abc/)).toBe(true)
  })
  it('returns true for a RegExp with flags', () => {
    expect(is.regularExpression(/abc/gi)).toBe(true)
  })
  it('returns false for a string', () => {
    expect(is.regularExpression('abc')).toBe(false)
  })
  it('returns false for a string that looks like a regex', () => {
    expect(is.regularExpression('/abc/')).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.regularExpression(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.regularExpression(undefined)).toBe(false)
  })
})

describe('is.number', () => {
  it('returns true for a positive integer', () => {
    expect(is.number(1)).toBe(true)
  })
  it('returns true for a negative integer', () => {
    expect(is.number(-1)).toBe(true)
  })
  it('returns true for a positive float', () => {
    expect(is.number(1.5)).toBe(true)
  })
  it('returns true for a negative float', () => {
    expect(is.number(-1.5)).toBe(true)
  })
  it('returns true for 0', () => {
    expect(is.number(0)).toBe(true)
  })
  it('returns true for -0', () => {
    expect(is.number(-0)).toBe(true)
  })
  it('returns false for NaN', () => {
    expect(is.number(NaN)).toBe(false)
  })
  it('returns false for Infinity', () => {
    expect(is.number(Infinity)).toBe(false)
  })
  it('returns false for -Infinity', () => {
    expect(is.number(-Infinity)).toBe(false)
  })
  it('returns false for a numeric string', () => {
    expect(is.number('1')).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.number(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.number(undefined)).toBe(false)
  })
  it('returns false for a boolean', () => {
    expect(is.number(true)).toBe(false)
  })
})

describe('is.integer', () => {
  it('returns true for a positive integer', () => {
    expect(is.integer(1)).toBe(true)
  })
  it('returns true for a negative integer', () => {
    expect(is.integer(-1)).toBe(true)
  })
  it('returns true for 0', () => {
    expect(is.integer(0)).toBe(true)
  })
  it('returns false for a positive float', () => {
    expect(is.integer(1.5)).toBe(false)
  })
  it('returns false for a negative float', () => {
    expect(is.integer(-1.5)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.integer(NaN)).toBe(false)
  })
  it('returns false for Infinity', () => {
    expect(is.integer(Infinity)).toBe(false)
  })
  it('returns false for a numeric string', () => {
    expect(is.integer('1')).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.integer(null)).toBe(false)
  })
})

describe('is.positiveInteger', () => {
  it('returns true for 1', () => {
    expect(is.positiveInteger(1)).toBe(true)
  })
  it('returns true for a large positive integer', () => {
    expect(is.positiveInteger(Number.MAX_SAFE_INTEGER)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.positiveInteger(0)).toBe(false)
  })
  it('returns false for a negative integer', () => {
    expect(is.positiveInteger(-1)).toBe(false)
  })
  it('returns false for a positive float', () => {
    expect(is.positiveInteger(1.5)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.positiveInteger(NaN)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.positiveInteger(null)).toBe(false)
  })
})

describe('is.nonPositiveInteger', () => {
  it('returns true for 0', () => {
    expect(is.nonPositiveInteger(0)).toBe(true)
  })
  it('returns true for a negative integer', () => {
    expect(is.nonPositiveInteger(-1)).toBe(true)
  })
  it('returns false for 1', () => {
    expect(is.nonPositiveInteger(1)).toBe(false)
  })
  it('returns false for a positive float', () => {
    expect(is.nonPositiveInteger(1.5)).toBe(false)
  })
  it('returns false for a negative float', () => {
    expect(is.nonPositiveInteger(-1.5)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.nonPositiveInteger(NaN)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonPositiveInteger(null)).toBe(false)
  })
})

describe('is.negativeInteger', () => {
  it('returns true for -1', () => {
    expect(is.negativeInteger(-1)).toBe(true)
  })
  it('returns true for a large negative integer', () => {
    expect(is.negativeInteger(-Number.MAX_SAFE_INTEGER)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.negativeInteger(0)).toBe(false)
  })
  it('returns false for a positive integer', () => {
    expect(is.negativeInteger(1)).toBe(false)
  })
  it('returns false for a negative float', () => {
    expect(is.negativeInteger(-1.5)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.negativeInteger(NaN)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.negativeInteger(null)).toBe(false)
  })
})

describe('is.nonNegativeInteger', () => {
  it('returns true for 0', () => {
    expect(is.nonNegativeInteger(0)).toBe(true)
  })
  it('returns true for a positive integer', () => {
    expect(is.nonNegativeInteger(1)).toBe(true)
  })
  it('returns false for -1', () => {
    expect(is.nonNegativeInteger(-1)).toBe(false)
  })
  it('returns false for a positive float', () => {
    expect(is.nonNegativeInteger(1.5)).toBe(false)
  })
  it('returns false for a negative float', () => {
    expect(is.nonNegativeInteger(-1.5)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.nonNegativeInteger(NaN)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonNegativeInteger(null)).toBe(false)
  })
})

describe('is.array', () => {
  it('returns true for []', () => {
    expect(is.array([])).toBe(true)
  })
  it('returns true for [1, 2]', () => {
    expect(is.array([1, 2])).toBe(true)
  })
  it('returns true for an array of mixed types', () => {
    expect(is.array([1, 'a', null, {}])).toBe(true)
  })
  it('returns true for a nested array', () => {
    expect(is.array([[1], [2]])).toBe(true)
  })
  it('returns false for an object', () => {
    expect(is.array({})).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.array('abc')).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.array(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.array(undefined)).toBe(false)
  })
  it('returns false for a Set', () => {
    expect(is.array(new Set([1, 2]))).toBe(false)
  })
})

describe('is.emptyArray', () => {
  it('returns true for []', () => {
    expect(is.emptyArray([])).toBe(true)
  })
  it('returns false for [0]', () => {
    expect(is.emptyArray([0])).toBe(false)
  })
  it('returns false for [null]', () => {
    expect(is.emptyArray([null])).toBe(false)
  })
  it('returns false for [undefined]', () => {
    expect(is.emptyArray([undefined])).toBe(false)
  })
  it('returns false for an object', () => {
    expect(is.emptyArray({})).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.emptyArray(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.emptyArray(undefined)).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.emptyArray('')).toBe(false)
  })
})

describe('is.nonEmptyArray', () => {
  it('returns true for [1]', () => {
    expect(is.nonEmptyArray([1])).toBe(true)
  })
  it('returns true for [null]', () => {
    expect(is.nonEmptyArray([null])).toBe(true)
  })
  it('returns true for [undefined]', () => {
    expect(is.nonEmptyArray([undefined])).toBe(true)
  })
  it('returns true for [0]', () => {
    expect(is.nonEmptyArray([0])).toBe(true)
  })
  it('returns false for []', () => {
    expect(is.nonEmptyArray([])).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonEmptyArray(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.nonEmptyArray(undefined)).toBe(false)
  })
})

describe('is.arrayOfLength', () => {
  it('returns true for [] with length 0', () => {
    expect(is.arrayOfLength([], 0)).toBe(true)
  })
  it('returns true when length match', () => {
    expect(is.arrayOfLength([1, 2], 2)).toBe(true)
  })
  it('returns true for [null] with length 1', () => {
    expect(is.arrayOfLength([null], 1)).toBe(true)
  })
  it('returns false when length is less than actual', () => {
    expect(is.arrayOfLength([1, 2], 1)).toBe(false)
  })
  it('returns false when length is greater than actual', () => {
    expect(is.arrayOfLength([1, 2], 3)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.arrayOfLength(null, 0)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.arrayOfLength(undefined, 0)).toBe(false)
  })
  it('throws when length is negative', () => {
    expect(() => is.arrayOfLength([1], -1)).toThrow()
  })
  it('throws when length is a float', () => {
    expect(() => is.arrayOfLength([1], 1.5)).toThrow()
  })
  it('throws when length is not a number', () => {
    expect(() => is.arrayOfLength([1], '1')).toThrow()
  })
})

describe('is.map', () => {
  it('returns true for an empty Map', () => {
    expect(is.map(new Map())).toBe(true)
  })
  it('returns true for a non-empty Map', () => {
    expect(is.map(new Map([['a', 1]]))).toBe(true)
  })
  it('returns false for an object', () => {
    expect(is.map({})).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.map(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.map(undefined)).toBe(false)
  })
  it('returns false for a Set', () => {
    expect(is.map(new Set())).toBe(false)
  })
})

describe('is.emptyMap', () => {
  it('returns true for an empty Map', () => {
    expect(is.emptyMap(new Map())).toBe(true)
  })
  it('returns false for a non-empty Map', () => {
    expect(is.emptyMap(new Map([['a', 1]]))).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.emptyMap(null)).toBe(false)
  })
  it('returns false for an empty object', () => {
    expect(is.emptyMap({})).toBe(false)
  })
  it('returns false for an empty array', () => {
    expect(is.emptyMap([])).toBe(false)
  })
})

describe('is.nonEmptyMap', () => {
  it('returns true for a non-empty Map', () => {
    expect(is.nonEmptyMap(new Map([['a', 1]]))).toBe(true)
  })
  it('returns false for an empty Map', () => {
    expect(is.nonEmptyMap(new Map())).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonEmptyMap(null)).toBe(false)
  })
  it('returns false for a non-empty object', () => {
    expect(is.nonEmptyMap({ a: 1 })).toBe(false)
  })
  it('returns false for a non-empty array', () => {
    expect(is.nonEmptyMap([1])).toBe(false)
  })
})

describe('is.set', () => {
  it('returns true for an empty Set', () => {
    expect(is.set(new Set())).toBe(true)
  })
  it('returns true for a non-empty Set', () => {
    expect(is.set(new Set([1, 2]))).toBe(true)
  })
  it('returns false for an array', () => {
    expect(is.set([])).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.set(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.set(undefined)).toBe(false)
  })
  it('returns false for a Map', () => {
    expect(is.set(new Map())).toBe(false)
  })
})

describe('is.emptySet', () => {
  it('returns true for an empty Set', () => {
    expect(is.emptySet(new Set())).toBe(true)
  })
  it('returns false for a non-empty Set', () => {
    expect(is.emptySet(new Set([1]))).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.emptySet(null)).toBe(false)
  })
  it('returns false for an empty array', () => {
    expect(is.emptySet([])).toBe(false)
  })
  it('returns false for an empty Map', () => {
    expect(is.emptySet(new Map())).toBe(false)
  })
})

describe('is.nonEmptySet', () => {
  it('returns true for a non-empty Set', () => {
    expect(is.nonEmptySet(new Set([1]))).toBe(true)
  })
  it('returns false for an empty Set', () => {
    expect(is.nonEmptySet(new Set())).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.nonEmptySet(null)).toBe(false)
  })
  it('returns false for a non-empty array', () => {
    expect(is.nonEmptySet([1])).toBe(false)
  })
  it('returns false for a non-empty Map', () => {
    expect(is.nonEmptySet(new Map([['a', 1]]))).toBe(false)
  })
})

describe('is.function', () => {
  it('returns true for an arrow function', () => {
    expect(is.function(() => {})).toBe(true)
  })
  it('returns true for a named function', () => {
    expect(is.function(function foo () {})).toBe(true)
  })
  it('returns true for an anonymous function', () => {
    expect(is.function(function () {})).toBe(true)
  })
  it('returns true for an async function', () => {
    expect(is.function(async () => {})).toBe(true)
  })
  it('returns true for a generator function', () => {
    expect(is.function(function * () {})).toBe(true)
  })
  it('returns true for a class constructor', () => {
    expect(is.function(class Foo {})).toBe(true)
  })
  it('returns false for an object', () => {
    expect(is.function({})).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.function(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.function(undefined)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.function('() => {}')).toBe(false)
  })
})

describe('is.boolean', () => {
  it('returns true for true', () => {
    expect(is.boolean(true)).toBe(true)
  })
  it('returns true for false', () => {
    expect(is.boolean(false)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.boolean(0)).toBe(false)
  })
  it('returns false for 1', () => {
    expect(is.boolean(1)).toBe(false)
  })
  it('returns false for "true"', () => {
    expect(is.boolean('true')).toBe(false)
  })
  it('returns false for "false"', () => {
    expect(is.boolean('false')).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.boolean(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.boolean(undefined)).toBe(false)
  })
})

describe('is.oneOf', () => {
  it('returns true when value is in the list', () => {
    expect(is.oneOf('b', ['a', 'b', 'c'])).toBe(true)
  })
  it('returns true for a number in the list', () => {
    expect(is.oneOf(2, [1, 2, 3])).toBe(true)
  })
  it('returns true for null in the list', () => {
    expect(is.oneOf(null, [null, undefined])).toBe(true)
  })
  it('returns true for false in the list', () => {
    expect(is.oneOf(false, [true, false])).toBe(true)
  })
  it('returns false when value is not in the list', () => {
    expect(is.oneOf('d', ['a', 'b', 'c'])).toBe(false)
  })
  it('uses strict equality — string vs number', () => {
    expect(is.oneOf('1', [1, 2, 3])).toBe(false)
  })
  it('uses strict equality — number vs string', () => {
    expect(is.oneOf(1, ['1', '2', '3'])).toBe(false)
  })
  it('throws when allowedValues is an empty array', () => {
    expect(() => is.oneOf('a', [])).toThrow()
  })
  it('throws when allowedValues is null', () => {
    expect(() => is.oneOf('a', null)).toThrow()
  })
  it('throws when allowedValues is not an array', () => {
    expect(() => is.oneOf('a', 'abc')).toThrow()
  })
})

describe('is.positive', () => {
  it('returns true for 1', () => {
    expect(is.positive(1)).toBe(true)
  })
  it('returns true for a positive float', () => {
    expect(is.positive(0.1)).toBe(true)
  })
  it('returns true for a large number', () => {
    expect(is.positive(Number.MAX_SAFE_INTEGER)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.positive(0)).toBe(false)
  })
  it('returns false for -1', () => {
    expect(is.positive(-1)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.positive(NaN)).toBe(false)
  })
  it('returns false for Infinity', () => {
    expect(is.positive(Infinity)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.positive('1')).toBe(false)
  })
})

describe('is.nonPositive', () => {
  it('returns true for 0', () => {
    expect(is.nonPositive(0)).toBe(true)
  })
  it('returns true for -1', () => {
    expect(is.nonPositive(-1)).toBe(true)
  })
  it('returns true for a negative float', () => {
    expect(is.nonPositive(-0.1)).toBe(true)
  })
  it('returns false for 1', () => {
    expect(is.nonPositive(1)).toBe(false)
  })
  it('returns false for a positive float', () => {
    expect(is.nonPositive(0.1)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.nonPositive(NaN)).toBe(false)
  })
  it('returns false for -Infinity', () => {
    expect(is.nonPositive(-Infinity)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.nonPositive('-1')).toBe(false)
  })
})

describe('is.negative', () => {
  it('returns true for -1', () => {
    expect(is.negative(-1)).toBe(true)
  })
  it('returns true for a negative float', () => {
    expect(is.negative(-0.1)).toBe(true)
  })
  it('returns true for a large negative number', () => {
    expect(is.negative(-Number.MAX_SAFE_INTEGER)).toBe(true)
  })
  it('returns false for 0', () => {
    expect(is.negative(0)).toBe(false)
  })
  it('returns false for 1', () => {
    expect(is.negative(1)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.negative(NaN)).toBe(false)
  })
  it('returns false for -Infinity', () => {
    expect(is.negative(-Infinity)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.negative('-1')).toBe(false)
  })
})

describe('is.nonNegative', () => {
  it('returns true for 0', () => {
    expect(is.nonNegative(0)).toBe(true)
  })
  it('returns true for 1', () => {
    expect(is.nonNegative(1)).toBe(true)
  })
  it('returns true for a positive float', () => {
    expect(is.nonNegative(0.1)).toBe(true)
  })
  it('returns false for -1', () => {
    expect(is.nonNegative(-1)).toBe(false)
  })
  it('returns false for a negative float', () => {
    expect(is.nonNegative(-0.1)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.nonNegative(NaN)).toBe(false)
  })
  it('returns false for Infinity', () => {
    expect(is.nonNegative(Infinity)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.nonNegative('1')).toBe(false)
  })
})

describe('is.inRange', () => {
  it('returns true when value is within range', () => {
    expect(is.inRange(5, 1, 10)).toBe(true)
  })
  it('returns true for the min boundary', () => {
    expect(is.inRange(1, 1, 10)).toBe(true)
  })
  it('returns true for the max boundary', () => {
    expect(is.inRange(10, 1, 10)).toBe(true)
  })
  it('returns true for a float within range', () => {
    expect(is.inRange(1.5, 1, 2)).toBe(true)
  })
  it('returns true for a negative range', () => {
    expect(is.inRange(-5, -10, -1)).toBe(true)
  })
  it('returns true when min equals max and value match', () => {
    expect(is.inRange(5, 5, 5)).toBe(true)
  })
  it('returns false when below range', () => {
    expect(is.inRange(0, 1, 10)).toBe(false)
  })
  it('returns false when above range', () => {
    expect(is.inRange(11, 1, 10)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.inRange(NaN, 1, 10)).toBe(false)
  })
  it('returns false for a string value', () => {
    expect(is.inRange('5', 1, 10)).toBe(false)
  })
  it('throws when min is not a number', () => {
    expect(() => is.inRange(5, 'a', 10)).toThrow()
  })
  it('throws when max is not a number', () => {
    expect(() => is.inRange(5, 1, 'b')).toThrow()
  })
  it('throws when max is less than min', () => {
    expect(() => is.inRange(5, 10, 1)).toThrow()
  })
})

describe('is.empty', () => {
  it('returns true for null', () => {
    expect(is.empty(null)).toBe(true)
  })
  it('returns true for undefined', () => {
    expect(is.empty(undefined)).toBe(true)
  })
  it('returns true for an empty string', () => {
    expect(is.empty('')).toBe(true)
  })
  it('returns true for a whitespace-only string', () => {
    expect(is.empty('   ')).toBe(true)
  })
  it('returns true for a tab character', () => {
    expect(is.empty('\t')).toBe(true)
  })
  it('returns true for []', () => {
    expect(is.empty([])).toBe(true)
  })
  it('returns true for {}', () => {
    expect(is.empty({})).toBe(true)
  })
  it('returns true for an empty Map', () => {
    expect(is.empty(new Map())).toBe(true)
  })
  it('returns true for an empty Set', () => {
    expect(is.empty(new Set())).toBe(true)
  })
  it('returns false for a non-empty string', () => {
    expect(is.empty('hello')).toBe(false)
  })
  it('returns false for a non-empty array', () => {
    expect(is.empty([1])).toBe(false)
  })
  it('returns false for an array containing null', () => {
    expect(is.empty([null])).toBe(false)
  })
  it('returns false for a non-empty object', () => {
    expect(is.empty({ a: 1 })).toBe(false)
  })
  it('returns false for a non-empty Map', () => {
    expect(is.empty(new Map([['a', 1]]))).toBe(false)
  })
  it('returns false for a non-empty Set', () => {
    expect(is.empty(new Set([1]))).toBe(false)
  })
  it('returns false for 0', () => {
    expect(is.empty(0)).toBe(false)
  })
  it('returns false for false', () => {
    expect(is.empty(false)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.empty(NaN)).toBe(false)
  })
  it('returns false for a function', () => {
    expect(is.empty(() => {})).toBe(false)
  })
})

describe('is.inRangeExclusive', () => {
  it('returns true when value is strictly within range', () => {
    expect(is.inRangeExclusive(5, 1, 10)).toBe(true)
  })
  it('returns true for a float strictly within range', () => {
    expect(is.inRangeExclusive(1.5, 1, 2)).toBe(true)
  })
  it('returns true for a negative range', () => {
    expect(is.inRangeExclusive(-5, -10, -1)).toBe(true)
  })
  it('returns false for the min boundary', () => {
    expect(is.inRangeExclusive(1, 1, 10)).toBe(false)
  })
  it('returns false for the max boundary', () => {
    expect(is.inRangeExclusive(10, 1, 10)).toBe(false)
  })
  it('returns false when below range', () => {
    expect(is.inRangeExclusive(0, 1, 10)).toBe(false)
  })
  it('returns false when above range', () => {
    expect(is.inRangeExclusive(11, 1, 10)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.inRangeExclusive(NaN, 1, 10)).toBe(false)
  })
  it('returns false for a string value', () => {
    expect(is.inRangeExclusive('5', 1, 10)).toBe(false)
  })
  it('throws when max is less than or equal to min', () => {
    expect(() => is.inRangeExclusive(5, 10, 1)).toThrow()
  })
  it('throws when max equals min', () => {
    expect(() => is.inRangeExclusive(5, 5, 5)).toThrow()
  })
})

describe('is.inRangeExclusiveMin', () => {
  it('returns true when value is strictly above min and within max', () => {
    expect(is.inRangeExclusiveMin(5, 1, 10)).toBe(true)
  })
  it('returns true for the max boundary', () => {
    expect(is.inRangeExclusiveMin(10, 1, 10)).toBe(true)
  })
  it('returns true for a float strictly above min', () => {
    expect(is.inRangeExclusiveMin(1.1, 1, 2)).toBe(true)
  })
  it('returns true for a negative range', () => {
    expect(is.inRangeExclusiveMin(-1, -10, -1)).toBe(true)
  })
  it('returns false for the min boundary', () => {
    expect(is.inRangeExclusiveMin(1, 1, 10)).toBe(false)
  })
  it('returns false when below range', () => {
    expect(is.inRangeExclusiveMin(0, 1, 10)).toBe(false)
  })
  it('returns false when above range', () => {
    expect(is.inRangeExclusiveMin(11, 1, 10)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.inRangeExclusiveMin(NaN, 1, 10)).toBe(false)
  })
  it('returns false for a string value', () => {
    expect(is.inRangeExclusiveMin('5', 1, 10)).toBe(false)
  })
  it('throws when max is less than or equal to min', () => {
    expect(() => is.inRangeExclusiveMin(5, 10, 1)).toThrow()
  })
  it('throws when max equals min', () => {
    expect(() => is.inRangeExclusiveMin(5, 5, 5)).toThrow()
  })
})

describe('is.inRangeExclusiveMax', () => {
  it('returns true when value is within min and strictly below max', () => {
    expect(is.inRangeExclusiveMax(5, 1, 10)).toBe(true)
  })
  it('returns true for the min boundary', () => {
    expect(is.inRangeExclusiveMax(1, 1, 10)).toBe(true)
  })
  it('returns true for a float strictly below max', () => {
    expect(is.inRangeExclusiveMax(1.9, 1, 2)).toBe(true)
  })
  it('returns true for a negative range', () => {
    expect(is.inRangeExclusiveMax(-10, -10, -1)).toBe(true)
  })
  it('returns false for the max boundary', () => {
    expect(is.inRangeExclusiveMax(10, 1, 10)).toBe(false)
  })
  it('returns false when below range', () => {
    expect(is.inRangeExclusiveMax(0, 1, 10)).toBe(false)
  })
  it('returns false when above range', () => {
    expect(is.inRangeExclusiveMax(11, 1, 10)).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(is.inRangeExclusiveMax(NaN, 1, 10)).toBe(false)
  })
  it('returns false for a string value', () => {
    expect(is.inRangeExclusiveMax('5', 1, 10)).toBe(false)
  })
  it('throws when max is less than min', () => {
    expect(() => is.inRangeExclusiveMax(5, 10, 1)).toThrow()
  })
})

describe('is.arrayOfLengthAtLeast', () => {
  it('returns true when length equals minLength', () => {
    expect(is.arrayOfLengthAtLeast([1, 2], 2)).toBe(true)
  })
  it('returns true when length is greater than minLength', () => {
    expect(is.arrayOfLengthAtLeast([1, 2, 3], 2)).toBe(true)
  })
  it('returns true for an empty array with minLength 0', () => {
    expect(is.arrayOfLengthAtLeast([], 0)).toBe(true)
  })
  it('returns true for [null] with minLength 1', () => {
    expect(is.arrayOfLengthAtLeast([null], 1)).toBe(true)
  })
  it('returns false when length is less than minLength', () => {
    expect(is.arrayOfLengthAtLeast([1], 2)).toBe(false)
  })
  it('returns false for an empty array with minLength 1', () => {
    expect(is.arrayOfLengthAtLeast([], 1)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.arrayOfLengthAtLeast(null, 0)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.arrayOfLengthAtLeast(undefined, 0)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.arrayOfLengthAtLeast('abc', 1)).toBe(false)
  })
  it('throws when minLength is negative', () => {
    expect(() => is.arrayOfLengthAtLeast([1], -1)).toThrow()
  })
  it('throws when minLength is a float', () => {
    expect(() => is.arrayOfLengthAtLeast([1], 1.5)).toThrow()
  })
  it('throws when minLength is not a number', () => {
    expect(() => is.arrayOfLengthAtLeast([1], '1')).toThrow()
  })
})

describe('is.arrayOfLengthAtMost', () => {
  it('returns true when length equals maxLength', () => {
    expect(is.arrayOfLengthAtMost([1, 2], 2)).toBe(true)
  })
  it('returns true when length is less than maxLength', () => {
    expect(is.arrayOfLengthAtMost([1], 2)).toBe(true)
  })
  it('returns true for an empty array with any maxLength', () => {
    expect(is.arrayOfLengthAtMost([], 0)).toBe(true)
  })
  it('returns true for [null] with maxLength 1', () => {
    expect(is.arrayOfLengthAtMost([null], 1)).toBe(true)
  })
  it('returns false when length exceeds maxLength', () => {
    expect(is.arrayOfLengthAtMost([1, 2, 3], 2)).toBe(false)
  })
  it('returns false for a non-empty array with maxLength 0', () => {
    expect(is.arrayOfLengthAtMost([1], 0)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.arrayOfLengthAtMost(null, 1)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.arrayOfLengthAtMost(undefined, 1)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.arrayOfLengthAtMost('abc', 3)).toBe(false)
  })
  it('throws when maxLength is negative', () => {
    expect(() => is.arrayOfLengthAtMost([1], -1)).toThrow()
  })
  it('throws when maxLength is a float', () => {
    expect(() => is.arrayOfLengthAtMost([1], 1.5)).toThrow()
  })
  it('throws when maxLength is not a number', () => {
    expect(() => is.arrayOfLengthAtMost([1], '1')).toThrow()
  })
})

describe('is.arrayOfLengthBetween', () => {
  it('returns true when length is within range', () => {
    expect(is.arrayOfLengthBetween([1, 2], 1, 3)).toBe(true)
  })
  it('returns true for the minLength boundary', () => {
    expect(is.arrayOfLengthBetween([1], 1, 3)).toBe(true)
  })
  it('returns true for the maxLength boundary', () => {
    expect(is.arrayOfLengthBetween([1, 2, 3], 1, 3)).toBe(true)
  })
  it('returns true for an empty array with minLength 0', () => {
    expect(is.arrayOfLengthBetween([], 0, 2)).toBe(true)
  })
  it('returns true for [null] within range', () => {
    expect(is.arrayOfLengthBetween([null], 0, 2)).toBe(true)
  })
  it('returns false when length is below minLength', () => {
    expect(is.arrayOfLengthBetween([], 1, 3)).toBe(false)
  })
  it('returns false when length exceeds maxLength', () => {
    expect(is.arrayOfLengthBetween([1, 2, 3, 4], 1, 3)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.arrayOfLengthBetween(null, 0, 2)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.arrayOfLengthBetween(undefined, 0, 2)).toBe(false)
  })
  it('returns false for a string', () => {
    expect(is.arrayOfLengthBetween('abc', 1, 3)).toBe(false)
  })
  it('throws when minLength is negative', () => {
    expect(() => is.arrayOfLengthBetween([1], -1, 3)).toThrow()
  })
  it('throws when maxLength is a float', () => {
    expect(() => is.arrayOfLengthBetween([1], 1, 3.5)).toThrow()
  })
  it('throws when minLength is greater than maxLength', () => {
    expect(() => is.arrayOfLengthBetween([1], 3, 1)).toThrow()
  })
  it('throws when minLength is not a number', () => {
    expect(() => is.arrayOfLengthBetween([1], '1', 3)).toThrow()
  })
})

describe('is.hex', () => {
  it('returns true for a valid lowercase hex string', () => {
    expect(is.hex('deadbeef')).toBe(true)
  })
  it('returns true for a valid uppercase hex string', () => {
    expect(is.hex('DEADBEEF')).toBe(true)
  })
  it('returns true for a mixed case hex string', () => {
    expect(is.hex('DeAdBeEf')).toBe(true)
  })
  it('returns true for a valid hex string with digits only', () => {
    expect(is.hex('12345678')).toBe(true)
  })
  it('returns true for a 2-character hex string', () => {
    expect(is.hex('ff')).toBe(true)
  })
  it('returns false for an odd-length hex string', () => {
    expect(is.hex('abc')).toBe(false)
  })
  it('returns false for a string with non-hex characters', () => {
    expect(is.hex('zzzzzzzz')).toBe(false)
  })
  it('returns false for a string with spaces', () => {
    expect(is.hex('de ad')).toBe(false)
  })
  it('returns false for a hex string with 0x prefix', () => {
    expect(is.hex('0xdeadbeef')).toBe(false)
  })
  it('returns false for a number', () => {
    expect(is.hex(123)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.hex(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.hex(undefined)).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.hex('')).toBe(false)
  })
})

describe('is.url', () => {
  it('returns true for a valid http URL', () => {
    expect(is.url('http://example.com')).toBe(true)
  })
  it('returns true for a valid https URL', () => {
    expect(is.url('https://example.com')).toBe(true)
  })
  it('returns true for a URL with a path', () => {
    expect(is.url('https://example.com/foo/bar')).toBe(true)
  })
  it('returns true for a URL with query params', () => {
    expect(is.url('https://example.com?foo=bar&baz=1')).toBe(true)
  })
  it('returns true for a URL with a hash', () => {
    expect(is.url('https://example.com#section')).toBe(true)
  })
  it('returns true for a relative URL with a valid base', () => {
    expect(is.url('/foo/bar', 'https://example.com')).toBe(true)
  })
  it('returns true for a relative URL with a path base', () => {
    expect(is.url('../bar', 'https://example.com/foo/')).toBe(true)
  })
  it('returns false for a plain string with no protocol', () => {
    expect(is.url('example.com')).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.url('')).toBe(false)
  })
  it('returns false for a relative URL without a base', () => {
    expect(is.url('/foo/bar')).toBe(false)
  })
  it('returns false for a random string', () => {
    expect(is.url('not a url')).toBe(false)
  })
  it('returns false for number', () => {
    expect(is.url(23)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.url(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.url(undefined)).toBe(false)
  })
})

describe('is.email', () => {
  it('returns true for a simple valid email', () => {
    expect(is.email('user@example.com')).toBe(true)
  })
  it('returns true for an email with subdomains', () => {
    expect(is.email('user@mail.example.com')).toBe(true)
  })
  it('returns true for an email with special characters in local part', () => {
    expect(is.email('user+tag@example.com')).toBe(true)
  })
  it('returns true for an email with dots in local part', () => {
    expect(is.email('first.last@example.com')).toBe(true)
  })
  it('returns false for a missing @', () => {
    expect(is.email('userexample.com')).toBe(false)
  })
  it('returns false for a missing domain', () => {
    expect(is.email('user@')).toBe(false)
  })
  it('returns false for a missing local part', () => {
    expect(is.email('@example.com')).toBe(false)
  })
  it('returns false for a local part exceeding 64 characters', () => {
    expect(is.email(`${'a'.repeat(65)}@example.com`)).toBe(false)
  })
  it('returns false for a domain exceeding 255 characters', () => {
    expect(is.email(`user@${'a'.repeat(250)}.com`)).toBe(false)
  })
  it('returns false for a domain label exceeding 63 characters', () => {
    expect(is.email(`user@${'a'.repeat(64)}.com`)).toBe(false)
  })
  it('returns false for an empty string', () => {
    expect(is.email('')).toBe(false)
  })
  it('returns false for number', () => {
    expect(is.url(23)).toBe(false)
  })
  it('returns false for null', () => {
    expect(is.url(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(is.url(undefined)).toBe(false)
  })
})
