import { ObjectId } from 'mongodb'
import { ITSELF } from '@ucast/mongo2js'
import { conditionsMatcher, ensureConditions } from '../../src/utilities/conditions-matcher.js'

const matches = (conditions, document) => conditionsMatcher(conditions)(document)

const id = new ObjectId()
const day = new Date('2026-01-01T00:00:00Z')
const symbol = Symbol('kind')

const validConditions = [
  ['no conditions', undefined],
  ['null conditions', null],
  ['empty conditions', {}],
  ['scalar values', { flag: true, count: 1, name: 'a', missing: null, date: day, ownerId: id }],
  ['the string of an ObjectId', { ownerId: id.toHexString() }],
  ['an array and a subdocument', { tags: ['a', 'b'], nested: { value: 1, items: [{ kind: 'x' }] } }],
  ['a regular expression as value', { name: /^ab/ }],
  ['a case-insensitive regular expression', { name: /^ab/i }],
  ['a multiline regular expression', { name: /^ab/m }],
  ['comparisons', { count: { $gte: 1, $lt: 5 }, date: { $lt: day } }],
  ['list operators', { count: { $in: [1, null], $nin: [2] }, tags: { $all: ['a', /^b/] } }],
  ['empty $in', { tags: { $in: [] } }],
  ['empty $nin', { tags: { $nin: [] } }],
  ['empty $all', { tags: { $all: [] } }],
  ['a regular expression in $in', { name: { $in: [/^ab/] } }],
  ['a regular expression in $nin', { name: { $nin: [/^ab/] } }],
  ['$regex and $options', { name: { $regex: '^ab', $options: 'i' } }],
  ['$regex without options', { name: { $regex: '^ab' } }],
  ['$regex with a regular expression', { name: { $regex: /^ab/i } }],
  ['$regex with empty options', { name: { $regex: '^ab', $options: '' } }],
  ['$regex with dotAll', { name: { $regex: '^a.b$', $options: 's' } }],
  ['$regex with multiple options', { name: { $regex: '^ab', $options: 'ims' } }],
  ['$size and $exists', { tags: { $size: 1 }, missing: { $exists: false } }],
  ['$size zero', { tags: { $size: 0 } }],
  ['$size with the largest supported integer', { tags: { $size: 2147483647 } }],
  ['$elemMatch with a query', { items: { $elemMatch: { value: { $gte: 1 }, kind: 'x' } } }],
  ['$elemMatch with comparisons', { scores: { $elemMatch: { $gte: 80, $lt: 85 } } }],
  ['$elemMatch with equality', { tags: { $elemMatch: { $eq: 'a' } } }],
  ['$elemMatch with inequality', { tags: { $elemMatch: { $ne: 'a' } } }],
  ['$elemMatch with $in', { tags: { $elemMatch: { $in: ['a', 'b'] } } }],
  ['$elemMatch with $nin', { tags: { $elemMatch: { $nin: ['a', 'b'] } } }],
  ['$elemMatch with $regex', { tags: { $elemMatch: { $regex: '^a', $options: 'i' } } }],
  ['logical operators', { $and: [{ $or: [{ a: 1 }] }, { $nor: [{ b: { $ne: 2 } }] }] }]
]

const invalidConditions = [
  ['conditions that are not an object', 'locked', 'conditions must be an object'],
  ['conditions that are an array', [], 'conditions must be an object'],
  ['invalid operands', { $or: 'invalid' }, 'invalid conditions: '],
  ['$where', { $where: 'this.count > 1' }, 'unsupported operator: $where'],
  ['$expr', { $expr: { $gt: ['$count', 1] } }],
  ['$mod', { count: { $mod: [2, 0] } }, 'unsupported operator: $mod'],
  ['$not', { count: { $not: { $eq: 1 } } }, 'unsupported operator: $not'],
  ['an operator in a nested query', { $or: [{ locked: true }, { count: { $mod: [2, 0] } }] }, 'unsupported operator: $mod'],
  ['a field among operators', { count: { $gt: 1, value: 2 } }],
  ['a logical operator in $elemMatch', { items: { $elemMatch: { $or: [{ kind: 'x' }] } } }],
  ['an empty $elemMatch', { items: { $elemMatch: {} } }],
  ['$elemMatch in $all', { members: { $all: [{ $elemMatch: { role: 'owner' } }] } }, 'unsupported operator in a value: $elemMatch'],
  ['$size in an element query', { items: { $elemMatch: { $size: 1 } } }],
  ['$all in an element query', { items: { $elemMatch: { $all: ['a'] } } }],
  ['$exists in an element query', { items: { $elemMatch: { $exists: true } } }],
  ['an operator in $in', { count: { $in: [{ $gt: 1 }] } }, 'unsupported operator in a value: $gt'],
  ['an operator in $nin', { count: { $nin: [{ $gt: 1 }] } }, 'unsupported operator in a value: $gt'],
  ['an operator in a subdocument', { nested: { value: { $gt: 1 } } }, 'unsupported operator in a value: $gt'],
  ['an invalid $in operand', { count: { $in: 1 } }],
  ['an invalid $nin operand', { count: { $nin: 1 } }],
  ['an invalid $all operand', { tags: { $all: 'a' } }],
  ['a regular expression in $eq', { name: { $eq: /^a/ } }, 'unsupported value: /^a/'],
  ['a regular expression in $ne', { name: { $ne: /^a/ } }, 'unsupported value: /^a/'],
  ['a regular expression in an array', { tags: [/^a/] }, 'unsupported value: /^a/'],
  ['a regular expression in a subdocument', { nested: { pattern: /^a/ } }, 'unsupported value: /^a/'],
  ['a global regular expression', { name: /^a/g }, 'unsupported regular expression flags'],
  ['a sticky regular expression', { name: /^a/y }, 'unsupported regular expression flags'],
  ['a dotAll regular expression', { name: /^a/s }, 'unsupported regular expression flags'],
  ['a Unicode regular expression', { name: /^a/u }, 'unsupported regular expression flags'],
  ['a regular expression with indices', { name: /^a/d }, 'unsupported regular expression flags'],
  ['a global regular expression in $in', { name: { $in: [/^a/g] } }, 'unsupported regular expression flags'],
  ['a global regular expression in $all', { tags: { $all: [/^a/g] } }, 'unsupported regular expression flags'],
  ['$options without $regex', { name: { $options: 'i' } }],
  ['$options with a regular expression', { name: { $regex: /^a/, $options: 'i' } }],
  ['global regex options', { name: { $regex: '^a', $options: 'g' } }],
  ['sticky regex options', { name: { $regex: '^a', $options: 'y' } }],
  ['unsupported regex options', { name: { $regex: '^a', $options: 'x' } }],
  ['duplicate regex options', { name: { $regex: '^a', $options: 'ii' } }],
  ['invalid regex options', { name: { $regex: '^a', $options: 1 } }],
  ['an invalid regex operand', { name: { $regex: 1 } }],
  ['an invalid regex pattern', { name: { $regex: '[' } }],
  ['a negative $size', { tags: { $size: -1 } }],
  ['a fractional $size', { tags: { $size: 1.5 } }],
  ['a $size exceeding a 32-bit integer', { tags: { $size: 2147483648 } }],
  ['a string $size', { tags: { $size: '1' } }],
  ['an invalid $size', { tags: { $size: NaN } }],
  ['a reserved field name', { [ITSELF]: 1 }, 'reserved field name'],
  ['a reserved nested field name', { [`nested.${ITSELF}`]: 1 }, 'reserved field name'],
  ['NaN', { count: NaN }, 'unsupported value: NaN'],
  ['NaN in $in', { count: { $in: [NaN] } }, 'unsupported value: NaN'],
  ['an infinite bound', { count: { $lt: Infinity } }, 'unsupported value: Infinity'],
  ['negative infinity', { count: -Infinity }, 'unsupported value: -Infinity'],
  ['undefined', { count: undefined }, 'unsupported value: undefined'],
  ['undefined in an array', { tags: ['a', undefined] }, 'unsupported value: undefined'],
  ['a bigint', { count: 5n }, 'unsupported value: 5'],
  ['an invalid date', { date: new Date('invalid') }, 'unsupported value: Invalid Date'],
  ['a symbol', { kind: Symbol('kind') }, 'unsupported value: Symbol(kind)'],
  ['a class instance', { tags: new Set(['a']) }, 'unsupported value: [object Set]']
]

function expectInvalidConditions (validate, conditions, message) {
  expect(() => validate(conditions)).toThrow(TypeError)
  if (message) expect(() => validate(conditions)).toThrow(message)
}

describe('conditions matcher', () => {
  describe('matches conditions', () => {
    it.each([
      ['empty conditions', {}, {}, true],
      ['no missing date lower than another one', { date: { $lt: day } }, {}, false],
      ['no string compared with a number', { count: { $gt: 1 } }, { count: '5' }, false],
      ['no number equal to a string', { count: 5 }, { count: '5' }, false],
      ['a bigint equal to a number', { count: 5 }, { count: 5n }, true],
      ['a number equal to a bigint', { count: 5n }, { count: 5 }, true],
      ['a bigint compared with a number', { count: { $gt: 1 } }, { count: 5n }, true],
      ['a bigint lower than a number', { count: { $lt: 5 } }, { count: 4n }, true],
      ['a bigint greater than or equal to a number', { count: { $gte: 5 } }, { count: 5n }, true],
      ['a bigint lower than or equal to a number', { count: { $lte: 5 } }, { count: 5n }, true],
      ['NaN equal to NaN', { count: NaN }, { count: NaN }, true],
      ['no NaN equal to a number', { count: 5 }, { count: NaN }, false],
      ['no NaN lower than a number', { count: { $lt: 5 } }, { count: NaN }, false],
      ['no NaN greater than a number', { count: { $gt: 1 } }, { count: NaN }, false],
      ['no NaN lower than or equal to a number', { count: { $lte: 5 } }, { count: NaN }, false],
      ['no NaN greater than or equal to a number', { count: { $gte: 1 } }, { count: NaN }, false],
      ['strings by code point', { name: { $gt: '\uFF61' } }, { name: '\u{1F600}' }, true],
      ['strings by code point in reverse order', { name: { $lt: '\u{1F600}' } }, { name: '\uFF61' }, true],
      ['a string lower than a longer one', { name: { $lt: 'abc' } }, { name: 'ab' }, true],
      ['a string greater than a shorter one', { name: { $gt: 'ab' } }, { name: 'abc' }, true],
      ['identical strings', { name: 'abc' }, { name: 'abc' }, true],
      ['no ObjectId equal to its string', { ownerId: id }, { ownerId: id.toHexString() }, false],
      ['no string equal to an ObjectId', { ownerId: id.toHexString() }, { ownerId: id }, false],
      ['an ObjectId equal to another instance', { ownerId: id }, { ownerId: new ObjectId(id.toHexString()) }, true],
      ['a date equal to another instance', { date: day }, { date: new Date(day) }, true],
      ['no date equal to its string', { date: day }, { date: day.toISOString() }, false],
      ['no date equal to its timestamp', { date: day }, { date: day.getTime() }, false],
      ['a missing field equal to null', { count: null }, {}, true],
      ['a null field equal to null', { count: null }, { count: null }, true],
      ['no missing field matching $ne null', { count: { $ne: null } }, {}, false],
      ['no null field matching $ne null', { count: { $ne: null } }, { count: null }, false],
      ['$exists on a null field', { count: { $exists: true } }, { count: null }, true],
      ['$exists on a missing field', { count: { $exists: false } }, {}, true],
      ['an array equal to another one', { tags: ['a', 'b'] }, { tags: ['a', 'b'] }, true],
      ['no array equal to another order', { tags: ['a', 'b'] }, { tags: ['b', 'a'] }, false],
      ['an array item equal to an array', { tags: ['a'] }, { tags: [['a']] }, true],
      ['an array holding null equal to another one', { tags: ['a', null] }, { tags: ['a', null] }, true],
      ['an empty array equal to another one', { tags: [] }, { tags: [] }, true],
      ['no arrays of different lengths equal', { tags: ['a'] }, { tags: ['a', 'b'] }, false],
      ['an array containing a scalar value', { tags: 'a' }, { tags: ['a', 'b'] }, true],
      ['a subdocument equal to another one', { nested: { value: 1, other: 2 } }, { nested: { value: 1, other: 2 } }, true],
      ['no subdocument equal to another key order', { nested: { value: 1, other: 2 } }, { nested: { other: 2, value: 1 } }, false],
      ['no subdocument equal to another value', { nested: { value: 1 } }, { nested: { value: 2 } }, false],
      ['no subdocument equal to a larger one', { nested: { value: 1 } }, { nested: { value: 1, other: 2 } }, false],
      ['no regular expression equal to another one', { nested: { pattern: /^a/ } }, { nested: { pattern: /^b/ } }, false],
      ['other values by identity only', { kind: symbol }, { kind: symbol }, true],
      ['no other value equal to another one', { kind: symbol }, { kind: Symbol('kind') }, false]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
  })

  describe('list operators', () => {
    it.each([
      ['no document with an empty $all', { tags: { $all: [] } }, { tags: ['a'] }, false],
      ['no missing field with an empty $all', { tags: { $all: [] } }, {}, false],
      ['a scalar field with $all', { tags: { $all: ['a'] } }, { tags: 'a' }, true],
      ['all required values', { tags: { $all: ['a', 'b'] } }, { tags: ['a', 'b', 'c'] }, true],
      ['no array missing a required value', { tags: { $all: ['a', 'b'] } }, { tags: ['a'] }, false],
      ['a regular expression in $all', { tags: { $all: [/^a/] } }, { tags: ['abc'] }, true],
      ['an array in $all', { tags: { $all: [['a']] } }, { tags: [['a']] }, true],
      ['a missing field in $in with null', { count: { $in: [null] } }, {}, true],
      ['a null field in $in with null', { count: { $in: [null] } }, { count: null }, true],
      ['a whole array in $in', { tags: { $in: [['a', 'b']] } }, { tags: ['a', 'b'] }, true],
      ['an array item in $in', { tags: { $in: ['a'] } }, { tags: ['a', 'b'] }, true],
      ['a subdocument in $in', { items: { $in: [{ value: 1 }] } }, { items: [{ value: 1 }, { value: 2 }] }, true],
      ['an ObjectId in $in', { ownerId: { $in: [id] } }, { ownerId: new ObjectId(id.toHexString()) }, true],
      ['no string of an ObjectId in $in', { ownerId: { $in: [id] } }, { ownerId: id.toHexString() }, false],
      ['no value in an empty $in', { tags: { $in: [] } }, { tags: ['a'] }, false],
      ['no missing field in an empty $in', { tags: { $in: [] } }, {}, false],
      ['no whole array in $nin', { tags: { $nin: [['a', 'b']] } }, { tags: ['a', 'b'] }, false],
      ['no array item in $nin', { tags: { $nin: ['a'] } }, { tags: ['a', 'b'] }, false],
      ['a value with an empty $nin', { tags: { $nin: [] } }, { tags: ['a'] }, true],
      ['a missing field with an empty $nin', { tags: { $nin: [] } }, {}, true],
      ['no missing field in $nin with null', { count: { $nin: [null] } }, {}, false],
      ['no null field in $nin with null', { count: { $nin: [null] } }, { count: null }, false],
      ['a regular expression in $in', { name: { $in: [/^ab/] } }, { name: 'abc' }, true],
      ['no matching regular expression in $nin', { name: { $nin: [/^ab/] } }, { name: 'abc' }, false]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
  })

  describe('$size', () => {
    it.each([
      ['an empty array', { tags: { $size: 0 } }, { tags: [] }, true],
      ['an array of the expected size', { tags: { $size: 2 } }, { tags: ['a', 'b'] }, true],
      ['an array of another size', { tags: { $size: 1 } }, { tags: ['a', 'b'] }, false],
      ['a scalar value', { tags: { $size: 1 } }, { tags: 'a' }, false],
      ['a missing field', { tags: { $size: 0 } }, {}, false],
      ['a null field', { tags: { $size: 0 } }, { tags: null }, false],
      ['a nested array', { tags: { $size: 1 } }, { tags: [['a', 'b']] }, true]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
  })

  describe('$elemMatch', () => {
    it.each([
      ['a matching subdocument', { items: { $elemMatch: { value: 1, kind: 'x' } } }, { items: [{ value: 1, kind: 'x' }] }, true],
      ['conditions on different subdocuments', { items: { $elemMatch: { value: 1, kind: 'x' } } }, { items: [{ value: 1, kind: 'y' }, { value: 2, kind: 'x' }] }, false],
      ['a non-array field', { items: { $elemMatch: { value: 1 } } }, { items: { value: 1 } }, false],
      ['an empty array', { items: { $elemMatch: { value: 1 } } }, { items: [] }, false],
      ['a missing field', { items: { $elemMatch: { value: 1 } } }, {}, false],
      ['a null field', { items: { $elemMatch: { value: 1 } } }, { items: null }, false],
      ['an element equal to a scalar', { tags: { $elemMatch: { $eq: 'a' } } }, { tags: ['a'] }, true],
      ['no nested array equal to a scalar element', { tags: { $elemMatch: { $eq: 'a' } } }, { tags: [['a']] }, false],
      ['a nested array equal to an array element', { tags: { $elemMatch: { $eq: ['a'] } } }, { tags: [['a']] }, true],
      ['an element different from a scalar', { tags: { $elemMatch: { $ne: 'a' } } }, { tags: ['b'] }, true],
      ['a nested array different from a scalar', { tags: { $elemMatch: { $ne: 'a' } } }, { tags: [['a']] }, true],
      ['an element in $in', { tags: { $elemMatch: { $in: ['a'] } } }, { tags: ['a'] }, true],
      ['no nested array element in $in', { tags: { $elemMatch: { $in: ['a'] } } }, { tags: [['a']] }, false],
      ['a nested array in $in', { tags: { $elemMatch: { $in: [['a']] } } }, { tags: [['a']] }, true],
      ['an element in $nin', { tags: { $elemMatch: { $nin: ['a'] } } }, { tags: ['b'] }, true],
      ['a nested array element in $nin', { tags: { $elemMatch: { $nin: ['a'] } } }, { tags: [['a']] }, true],
      ['no matching element in $nin', { tags: { $elemMatch: { $nin: ['a'] } } }, { tags: ['a'] }, false],
      ['an element greater than a number', { count: { $elemMatch: { $gt: 1 } } }, { count: [5] }, true],
      ['no comparison through a nested array', { count: { $elemMatch: { $gt: 1 } } }, { count: [[5]] }, false],
      ['no lower comparison through a nested array', { count: { $elemMatch: { $lt: 5 } } }, { count: [[1]] }, false],
      ['no greater or equal comparison through a nested array', { count: { $elemMatch: { $gte: 5 } } }, { count: [[5]] }, false],
      ['no lower or equal comparison through a nested array', { count: { $elemMatch: { $lte: 5 } } }, { count: [[5]] }, false],
      ['comparisons on the same matching element', { count: { $elemMatch: { $gt: 1, $lt: 5 } } }, { count: [0, 3, 6] }, true],
      ['comparisons on different elements', { count: { $elemMatch: { $gt: 1, $lt: 5 } } }, { count: [0, 6] }, false],
      ['a regular expression on an element', { tags: { $elemMatch: { $regex: '^a' } } }, { tags: ['abc'] }, true],
      ['no regular expression through a nested array', { tags: { $elemMatch: { $regex: '^a' } } }, { tags: [['abc']] }, false],
      ['a case-insensitive regular expression on an element', { tags: { $elemMatch: { $regex: '^a', $options: 'i' } } }, { tags: ['ABC'] }, true],
      ['a regular expression in $in on an element', { tags: { $elemMatch: { $in: [/^a/] } } }, { tags: ['abc'] }, true],
      ['no regular expression in $in through a nested array', { tags: { $elemMatch: { $in: [/^a/] } } }, { tags: [['abc']] }, false]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
  })

  describe('regular expressions', () => {
    it.each([
      ['a matching string', { name: /^ab/ }, { name: 'abc' }, true],
      ['a non-matching string', { name: /^ab/ }, { name: 'xyz' }, false],
      ['a case-insensitive string', { name: /^ab/i }, { name: 'ABC' }, true],
      ['a regular expression on an array field', { name: /^ab/ }, { name: ['abc', 'xyz'] }, true],
      ['a regular expression on a number', { name: /^12/ }, { name: 123 }, false],
      ['a regular expression on a null field', { name: /^null/ }, { name: null }, false],
      ['a regular expression on a missing field', { name: /^undefined/ }, {}, false],
      ['a Unicode regular expression', { name: /^.$/ }, { name: '\u{1F600}' }, true],
      ['a Unicode regular expression with $regex', { name: { $regex: '^.$' } }, { name: '\u{1F600}' }, true],
      ['a Unicode regular expression in $in', { name: { $in: [/^.$/] } }, { name: '\u{1F600}' }, true],
      ['a Unicode regular expression in $all', { tags: { $all: [/^.$/] } }, { tags: ['\u{1F600}'] }, true],
      ['a regular expression with dotAll', { name: { $regex: '^a.b$', $options: 's' } }, { name: 'a\nb' }, true],
      ['a regular expression without dotAll', { name: { $regex: '^a.b$' } }, { name: 'a\nb' }, false],
      ['a regular expression with multiline', { name: { $regex: '^abc$', $options: 'm' } }, { name: 'first\nabc\nlast' }, true],
      ['a regular expression without multiline', { name: { $regex: '^abc$' } }, { name: 'first\nabc\nlast' }, false]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
    it('returns consistent results on repeated evaluations', () => {
      const matcher = conditionsMatcher({ name: /^abc/i })
      const document = { name: 'ABC' }
      expect(matcher(document)).toBe(true)
      expect(matcher(document)).toBe(true)
      expect(matcher(document)).toBe(true)
    })
  })

  describe('logical operators', () => {
    it.each([
      ['$and matching', { $and: [{ a: 1 }, { b: 2 }] }, { a: 1, b: 2 }, true],
      ['$and not matching', { $and: [{ a: 1 }, { b: 2 }] }, { a: 1, b: 3 }, false],
      ['$or matching', { $or: [{ a: 1 }, { b: 2 }] }, { b: 2 }, true],
      ['$or not matching', { $or: [{ a: 1 }, { b: 2 }] }, { b: 3 }, false],
      ['$nor matching', { $nor: [{ a: 1 }, { b: 2 }] }, { a: 3, b: 3 }, true],
      ['$nor not matching', { $nor: [{ a: 1 }, { b: 2 }] }, { b: 2 }, false],
      ['$nor on a missing field', { $nor: [{ a: 1 }] }, {}, true],
      ['nested logical operators matching', { $and: [{ $or: [{ a: 1 }, { b: 1 }] }, { $nor: [{ c: 1 }] }] }, { b: 1 }, true],
      ['nested logical operators not matching', { $and: [{ $or: [{ a: 1 }, { b: 1 }] }, { $nor: [{ c: 1 }] }] }, { b: 1, c: 1 }, false],
      ['logical operators and field conditions', { published: true, $or: [{ owner: 'a' }, { owner: 'b' }] }, { published: true, owner: 'b' }, true],
      ['a rejected field condition', { published: true, $or: [{ owner: 'a' }, { owner: 'b' }] }, { published: false, owner: 'b' }, false]
    ])('with %s', (name, conditions, document, expected) => {
      expect(matches(conditions, document)).toBe(expected)
    })
  })

  describe('ensureConditions', () => {
    it.each(validConditions)('accepts %s', (name, conditions) => {
      expect(() => ensureConditions(conditions)).not.toThrow()
    })
    it.each(invalidConditions)('rejects %s', (name, conditions, message) => {
      expectInvalidConditions(ensureConditions, conditions, message)
    })
  })

  describe('in production', () => {
    let validate

    beforeAll(async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const module = await import('../../src/utilities/conditions-matcher.js')
      validate = module.ensureConditions
    })

    afterAll(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })

    it.each(validConditions)('accepts %s', (name, conditions) => {
      expect(() => validate(conditions)).not.toThrow()
    })
    it.each(invalidConditions)('rejects %s', (name, conditions, message) => {
      expectInvalidConditions(validate, conditions, message)
    })
  })
})
