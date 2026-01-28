import { describe, it, expect } from 'vitest'
import { is } from '../src/is.js'

describe('is.defined', () => {
  it('should return true for defined values', () => {
    expect(is.defined(0)).toBe(true)
    expect(is.defined('')).toBe(true)
    expect(is.defined(false)).toBe(true)
    expect(is.defined([])).toBe(true)
    expect(is.defined({})).toBe(true)
    expect(is.defined(NaN)).toBe(true)
  })

  it('should return false for null or undefined', () => {
    expect(is.defined(null)).toBe(false)
    expect(is.defined(undefined)).toBe(false)
  })
})

describe('is.nil', () => {
  it('should return true for null or undefined', () => {
    expect(is.nil(null)).toBe(true)
    expect(is.nil(undefined)).toBe(true)
  })

  it('should return false for defined values', () => {
    expect(is.nil(0)).toBe(false)
    expect(is.nil('')).toBe(false)
    expect(is.nil(false)).toBe(false)
    expect(is.nil([])).toBe(false)
    expect(is.nil({})).toBe(false)
  })
})

describe('is.plainObject', () => {
  it('should return true for plain objects', () => {
    expect(is.plainObject({})).toBe(true)
    expect(is.plainObject({ key: 'value' })).toBe(true)
    expect(is.plainObject({ a: 1, b: 2 })).toBe(true)
  })

  it('should return false for non-plain objects', () => {
    expect(is.plainObject(null)).toBe(false)
    expect(is.plainObject(undefined)).toBe(false)
    expect(is.plainObject([])).toBe(false)
    expect(is.plainObject(new Date())).toBe(false)
    expect(is.plainObject(new Map())).toBe(false)
    expect(is.plainObject(new Set())).toBe(false)
    expect(is.plainObject('string')).toBe(false)
    expect(is.plainObject(123)).toBe(false)
  })

  it('should return false for class instances', () => {
    class MyClass {}
    expect(is.plainObject(new MyClass())).toBe(false)
  })
})

describe('is.emptyObject', () => {
  it('should return true for empty objects', () => {
    expect(is.emptyObject({})).toBe(true)
  })

  it('should return false for non-empty objects', () => {
    expect(is.emptyObject({ key: 'value' })).toBe(false)
    expect(is.emptyObject({ a: 1 })).toBe(false)
  })

  it('should return false for non-objects', () => {
    expect(is.emptyObject(null)).toBe(false)
    expect(is.emptyObject([])).toBe(false)
    expect(is.emptyObject('string')).toBe(false)
  })
})

describe('is.string', () => {
  it('should return true for strings', () => {
    expect(is.string('')).toBe(true)
    expect(is.string('hello')).toBe(true)
    expect(is.string('  ')).toBe(true)
    expect(is.string('123')).toBe(true)
  })

  it('should return false for non-strings', () => {
    expect(is.string(123)).toBe(false)
    expect(is.string(null)).toBe(false)
    expect(is.string(undefined)).toBe(false)
    expect(is.string([])).toBe(false)
    expect(is.string({})).toBe(false)
  })
})

describe('is.emptyString', () => {
  it('should return true for empty or whitespace strings', () => {
    expect(is.emptyString('')).toBe(true)
    expect(is.emptyString('   ')).toBe(true)
    expect(is.emptyString('\t\n')).toBe(true)
    expect(is.emptyString('  \t  \n  ')).toBe(true)
  })

  it('should return false for non-empty strings', () => {
    expect(is.emptyString('hello')).toBe(false)
    expect(is.emptyString('a')).toBe(false)
    expect(is.emptyString(' a ')).toBe(false)
  })

  it('should return false for non-strings', () => {
    expect(is.emptyString(123)).toBe(false)
    expect(is.emptyString(null)).toBe(false)
  })
})

describe('is.number', () => {
  it('should return true for valid numbers', () => {
    expect(is.number(0)).toBe(true)
    expect(is.number(123)).toBe(true)
    expect(is.number(-456)).toBe(true)
    expect(is.number(3.14)).toBe(true)
    expect(is.number(-0.5)).toBe(true)
  })

  it('should return false for NaN and Infinity', () => {
    expect(is.number(NaN)).toBe(false)
    expect(is.number(Infinity)).toBe(false)
    expect(is.number(-Infinity)).toBe(false)
  })

  it('should return false for non-numbers', () => {
    expect(is.number('123')).toBe(false)
    expect(is.number(null)).toBe(false)
    expect(is.number(undefined)).toBe(false)
  })
})

describe('is.integer', () => {
  it('should return true for integers', () => {
    expect(is.integer(0)).toBe(true)
    expect(is.integer(123)).toBe(true)
    expect(is.integer(-456)).toBe(true)
  })

  it('should return false for floats', () => {
    expect(is.integer(3.14)).toBe(false)
    expect(is.integer(0.1)).toBe(false)
    expect(is.integer(-0.5)).toBe(false)
  })

  it('should return false for invalid numbers', () => {
    expect(is.integer(NaN)).toBe(false)
    expect(is.integer(Infinity)).toBe(false)
  })
})

describe('is.array', () => {
  it('should return true for arrays', () => {
    expect(is.array([])).toBe(true)
    expect(is.array([1, 2, 3])).toBe(true)
    expect(is.array(['a', 'b'])).toBe(true)
  })

  it('should return false for non-arrays', () => {
    expect(is.array({})).toBe(false)
    expect(is.array('array')).toBe(false)
    expect(is.array(null)).toBe(false)
    expect(is.array(undefined)).toBe(false)
  })
})

describe('is.emptyArray', () => {
  it('should return true for empty arrays', () => {
    expect(is.emptyArray([])).toBe(true)
  })

  it('should return false for non-empty arrays', () => {
    expect(is.emptyArray([1])).toBe(false)
    expect(is.emptyArray([1, 2, 3])).toBe(false)
  })

  it('should return false for non-arrays', () => {
    expect(is.emptyArray(null)).toBe(false)
    expect(is.emptyArray('array')).toBe(false)
    expect(is.emptyArray({})).toBe(false)
  })
})

describe('is.arrayOfLength', () => {
  it('should return true for arrays of specified length', () => {
    expect(is.arrayOfLength([], 0)).toBe(true)
    expect(is.arrayOfLength([1], 1)).toBe(true)
    expect(is.arrayOfLength([1, 2, 3], 3)).toBe(true)
  })

  it('should return false for arrays of different length', () => {
    expect(is.arrayOfLength([1, 2], 3)).toBe(false)
    expect(is.arrayOfLength([], 1)).toBe(false)
  })

  it('should return false for non-arrays', () => {
    expect(is.arrayOfLength('abc', 3)).toBe(false)
    expect(is.arrayOfLength(null, 0)).toBe(false)
  })
})

describe('is.function', () => {
  it('should return true for functions', () => {
    expect(is.function(() => {})).toBe(true)
    expect(is.function(function () {})).toBe(true)
    expect(is.function(class {})).toBe(true)
    expect(is.function(Math.max)).toBe(true)
  })

  it('should return false for non-functions', () => {
    expect(is.function(null)).toBe(false)
    expect(is.function({})).toBe(false)
    expect(is.function('function')).toBe(false)
  })
})

describe('is.boolean', () => {
  it('should return true for booleans', () => {
    expect(is.boolean(true)).toBe(true)
    expect(is.boolean(false)).toBe(true)
  })

  it('should return false for non-booleans', () => {
    expect(is.boolean(1)).toBe(false)
    expect(is.boolean(0)).toBe(false)
    expect(is.boolean('true')).toBe(false)
    expect(is.boolean(null)).toBe(false)
  })
})

describe('is.oneOf', () => {
  it('should return true if value is in allowed values', () => {
    expect(is.oneOf('a', ['a', 'b', 'c'])).toBe(true)
    expect(is.oneOf(1, [1, 2, 3])).toBe(true)
    expect(is.oneOf(true, [true, false])).toBe(true)
  })

  it('should return false if value is not in allowed values', () => {
    expect(is.oneOf('d', ['a', 'b', 'c'])).toBe(false)
    expect(is.oneOf(4, [1, 2, 3])).toBe(false)
  })

  it('should handle empty arrays', () => {
    expect(is.oneOf('a', [])).toBe(false)
  })
})

describe('is.positive', () => {
  it('should return true for positive values', () => {
    expect(is.positive(1)).toBe(true)
    expect(is.positive(0.1)).toBe(true)
    expect(is.positive(1000)).toBe(true)
  })

  it('should return false for zero and negative values', () => {
    expect(is.positive(0)).toBe(false)
    expect(is.positive(-1)).toBe(false)
    expect(is.positive(-0.1)).toBe(false)
  })

  it('should return false with non-numbers or Infinity', () => {
    expect(is.positive('5')).toBe(false)
    expect(is.positive(null)).toBe(false)
    expect(is.positive(-Infinity)).toBe(false)
  })
})

describe('is.negative', () => {
  it('should return true for negative values', () => {
    expect(is.negative(-1)).toBe(true)
    expect(is.negative(-0.1)).toBe(true)
    expect(is.negative(-1000)).toBe(true)
  })

  it('should return false for zero and positive values', () => {
    expect(is.negative(0)).toBe(false)
    expect(is.negative(1)).toBe(false)
    expect(is.negative(0.1)).toBe(false)
  })

  it('should return false with non-numbers or Infinity', () => {
    expect(is.negative('-5')).toBe(false)
    expect(is.negative(null)).toBe(false)
    expect(is.negative(Infinity)).toBe(false)
  })
})

describe('is.inRange', () => {
  it('should return true for values within range', () => {
    expect(is.inRange(5, 0, 10)).toBe(true)
    expect(is.inRange(0, 0, 10)).toBe(true)
    expect(is.inRange(10, 0, 10)).toBe(true)
    expect(is.inRange(-5, -10, 0)).toBe(true)
  })

  it('should return false for values outside range', () => {
    expect(is.inRange(-1, 0, 10)).toBe(false)
    expect(is.inRange(11, 0, 10)).toBe(false)
  })

  it('should work with any comparable values', () => {
    expect(is.inRange(NaN, 0, 10)).toBe(false)
    expect(is.inRange('5', '0', '10')).toBe(false)
  })
})

describe('is.empty', () => {
  it('should return true for null and undefined', () => {
    expect(is.empty(null)).toBe(true)
    expect(is.empty(undefined)).toBe(true)
  })

  it('should return true for empty strings', () => {
    expect(is.empty('')).toBe(true)
    expect(is.empty('   ')).toBe(true)
    expect(is.empty('\t\n')).toBe(true)
  })

  it('should return true for empty arrays', () => {
    expect(is.empty([])).toBe(true)
  })

  it('should return true for empty objects', () => {
    expect(is.empty({})).toBe(true)
  })

  it('should return false for non-empty strings', () => {
    expect(is.empty('hello')).toBe(false)
    expect(is.empty(' a ')).toBe(false)
  })

  it('should return false for non-empty arrays', () => {
    expect(is.empty([1])).toBe(false)
    expect(is.empty([1, 2, 3])).toBe(false)
  })

  it('should return false for non-empty objects', () => {
    expect(is.empty({ a: 1 })).toBe(false)
  })

  it('should return false for other values', () => {
    expect(is.empty(0)).toBe(false)
    expect(is.empty(false)).toBe(false)
    expect(is.empty(123)).toBe(false)
  })
})
