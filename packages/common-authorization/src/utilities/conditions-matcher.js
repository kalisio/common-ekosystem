import { buildMongoQueryMatcher } from '@casl/ability'
import {
  $and, and, $nor, nor, $or, or,
  ITSELF, eq, lt, lte, gt, gte, regex
} from '@ucast/mongo2js'
import { ensure, is } from '@kalisio/common-core/predicates'

const LOGICAL_OPERATORS = new Set(['$and', '$or', '$nor'])

const FIELD_OPERATORS = new Set([
  '$eq', '$ne', '$lt', '$lte', '$gt', '$gte',
  '$in', '$nin', '$all', '$size',
  '$regex', '$options', '$elemMatch', '$exists'
])

const LIST_OPERATORS = new Set(['$in', '$nin', '$all'])

const ELEMENT_OPERATORS = new Set([
  '$eq', '$ne', '$lt', '$lte', '$gt', '$gte',
  '$in', '$nin', '$regex', '$options'
])

const isObjectId = value => !is.plainObject(value) &&
  value?._bsontype === 'ObjectId' && is.function(value.toHexString)

const isOperator = key => key.startsWith('$')

function getType (value) {
  if (is.nil(value)) return 'null'
  if (typeof value === 'number' || typeof value === 'bigint') return 'number'
  if (typeof value === 'string' || typeof value === 'boolean') return typeof value
  if (is.instanceOf(value, Date)) return 'date'
  if (isObjectId(value)) return 'objectId'
  if (is.array(value)) return 'array'
  if (is.plainObject(value)) return 'object'
  return 'other'
}

const order = (left, right) => {
  if (left === right) return 0
  return left > right ? 1 : -1
}

function orderNumbers (left, right) {
  if (left < right) return -1
  if (left > right) return 1
  const leftNaN = Number.isNaN(left)
  const rightNaN = Number.isNaN(right)
  if (!leftNaN && !rightNaN) return 0
  return leftNaN && rightNaN ? 0 : NaN
}

// MongoDB uses UTF-8 ordering, rather than JavaScript's UTF-16 ordering
function orderStrings (left, right) {
  if (left === right) return 0
  const leftPoints = Array.from(left, character => character.codePointAt(0))
  const rightPoints = Array.from(right, character => character.codePointAt(0))
  const index = leftPoints.findIndex((point, index) => point !== rightPoints[index])
  if (index === -1) return -1
  return index >= rightPoints.length ? 1 : order(leftPoints[index], rightPoints[index])
}

function equalArrays (left, right) {
  return left.length === right.length &&
    left.every((item, index) => compare(item, right[index]) === 0)
}

function equalObjects (left, right) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) =>
      key === rightKeys[index] && compare(left[key], right[key]) === 0)
}

// Values of different types are incomparable
function compare (left, right) {
  const type = getType(left)
  if (type !== getType(right)) return NaN
  switch (type) {
    case 'null':
      return 0
    case 'number':
      return orderNumbers(left, right)
    case 'string':
      return orderStrings(left, right)
    case 'boolean':
      return order(left, right)
    case 'date':
      return orderNumbers(left.getTime(), right.getTime())
    case 'objectId':
      return order(left.toHexString(), right.toHexString())
    case 'array':
      return equalArrays(left, right) ? 0 : NaN
    case 'object':
      return equalObjects(left, right) ? 0 : NaN
    default:
      return left === right ? 0 : NaN
  }
}

// MongoDB evaluates regular expressions in UTF mode
function toUnicodeRegExp (expression) {
  return new RegExp(
    expression.source,
    expression.unicode ? expression.flags : `${expression.flags}u`
  )
}

// Operators inside $elemMatch must evaluate the element itself,
// without implicitly traversing an array element
function matchRegex (condition, object, context) {
  const expression = toUnicodeRegExp(condition.value)
  if (condition.field === ITSELF) {
    return is.string(object) && expression.test(object)
  }
  return regex({ ...condition, value: expression }, object, context)
}

function matchEqual (condition, object, context) {
  if (is.regularExpression(condition.value)) {
    return matchRegex(condition, object, context)
  }
  if (condition.field === ITSELF) {
    return compare(object, condition.value) === 0
  }
  return eq(condition, object, context)
}

const matchNotEqual = (condition, object, context) =>
  !matchEqual(condition, object, context)

function comparisonInterpreter (interpreter, predicate) {
  return (condition, object, context) => {
    if (condition.field === ITSELF) {
      return predicate(compare(object, condition.value))
    }
    return interpreter(condition, object, context)
  }
}

const matchLessThan = comparisonInterpreter(lt, result => result === -1)
const matchLessThanOrEqual = comparisonInterpreter(lte, result => result === -1 || result === 0)
const matchGreaterThan = comparisonInterpreter(gt, result => result === 1)
const matchGreaterThanOrEqual = comparisonInterpreter(gte, result => result === 1 || result === 0)

const all = (condition, object, context) =>
  condition.value.length > 0 &&
  condition.value.every(value =>
    matchEqual({ ...condition, value }, object, context))

const within = (condition, object, context) =>
  condition.value.some(value =>
    matchEqual({ ...condition, value }, object, context))

const notWithin = (condition, object, context) =>
  !within(condition, object, context)

export const conditionsMatcher = buildMongoQueryMatcher(
  { $and, $or, $nor },
  {
    and,
    or,
    nor,
    eq: matchEqual,
    ne: matchNotEqual,
    lt: matchLessThan,
    lte: matchLessThanOrEqual,
    gt: matchGreaterThan,
    gte: matchGreaterThanOrEqual,
    regex: matchRegex,
    all,
    in: within,
    nin: notWithin
  },
  { compare }
)

// Supported literal values
const isValue = value =>
  value === null ||
  is.boolean(value) ||
  (is.number(value) && Number.isFinite(value)) ||
  is.string(value) ||
  (is.date(value) && Number.isFinite(value.getTime())) ||
  isObjectId(value)

// Native RegExp instances only support flags preserved by BSON serialization.
// Additional flags such as s must be supplied through $regex and $options.
function ensureRegExp (expression) {
  ensure.that(
    expression.flags,
    value => /^[im]*$/.test(value),
    `unsupported regular expression flags: ${expression.flags}`
  )
  ensureRegExpPattern(expression)
}

function ensureRegExpPattern (expression) {
  ensure.that(
    expression.source,
    value => !value.includes('\0'),
    'regular expression must not contain null bytes'
  )
  try {
    toUnicodeRegExp(expression)
  } catch (error) {
    throw new TypeError(`invalid regular expression: ${error.message}`, { cause: error })
  }
}

function ensureRegexOperators (operators) {
  const hasRegex = Object.hasOwn(operators, '$regex')
  const hasOptions = Object.hasOwn(operators, '$options')

  ensure.that(
    hasOptions,
    value => !value || hasRegex,
    '$options requires $regex'
  )

  if (!hasRegex) return

  const expression = operators.$regex

  if (is.regularExpression(expression)) {
    ensure.that(
      hasOptions,
      value => !value,
      '$options requires a string $regex operand'
    )
    ensureRegExp(expression)
    return
  }

  ensure.that(expression, is.string, '$regex must be a string or regular expression')

  const options = hasOptions ? operators.$options : ''

  ensure.that(
    options,
    value => is.string(value) &&
      /^[ims]*$/.test(value) &&
      new Set(value).size === value.length,
    `unsupported regular expression options: ${String(options)}`
  )

  try {
    ensureRegExpPattern(new RegExp(expression, options))
  } catch (error) {
    throw new TypeError(`invalid conditions: ${error.message}`, { cause: error })
  }
}

function ensureLiteral (value, { regularExpression = false } = {}) {
  if (is.array(value)) {
    value.forEach(item => ensureLiteral(item))
  } else if (is.plainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      ensure.that(key, key => !isOperator(key), `unsupported operator in a value: ${key}`)
      ensureLiteral(item)
    }
  } else if (regularExpression && is.regularExpression(value)) {
    ensureRegExp(value)
  } else {
    ensure.that(value, isValue, `unsupported value: ${String(value)}`)
  }
}

function ensureElementMatch (operand) {
  const keys = Object.keys(operand)

  ensure.that(
    keys,
    value => value.length > 0,
    '$elemMatch must not be empty'
  )

  if (keys.some(key => FIELD_OPERATORS.has(key))) {
    for (const key of keys) {
      ensure.that(
        key,
        key => ELEMENT_OPERATORS.has(key),
        `unsupported element operator: ${key}`
      )
    }
    ensureFieldOperators(operand)
  } else {
    ensureQuery(operand)
  }
}

function ensureFieldOperators (operators) {
  ensureRegexOperators(operators)

  for (const [operator, operand] of Object.entries(operators)) {
    ensure.that(
      operator,
      operator => FIELD_OPERATORS.has(operator),
      `unsupported operator: ${operator}`
    )

    if (operator === '$elemMatch') {
      ensureElementMatch(operand)
    } else if (LIST_OPERATORS.has(operator)) {
      operand.forEach(item => ensureLiteral(item, { regularExpression: true }))
    } else if (operator === '$size') {
      ensureLiteral(operand)
      ensure.that(
        operand,
        value => Number.isInteger(value) && value >= 0 && value <= 2147483647,
        '$size must be a non-negative 32-bit integer'
      )
    } else if (operator !== '$regex' && operator !== '$options') {
      ensureLiteral(operand)
    }
  }
}

function ensureQuery (query) {
  for (const [key, value] of Object.entries(query)) {
    if (isOperator(key)) {
      ensure.that(key, key => LOGICAL_OPERATORS.has(key), `unsupported operator: ${key}`)
      value.forEach(ensureQuery)
    } else {
      ensure.that(
        key,
        key => !key.split('.').includes(ITSELF),
        `reserved field name: ${key}`
      )
      if (is.plainObject(value) && Object.keys(value).some(isOperator)) {
        ensureFieldOperators(value)
      } else {
        ensureLiteral(value, { regularExpression: true })
      }
    }
  }
}

// Validation remains enabled in production
export function ensureConditions (conditions) {
  ensure.that(
    conditions,
    value => is.nil(value) || is.plainObject(value),
    'conditions must be an object'
  )
  if (is.nil(conditions)) return
  try {
    conditionsMatcher(conditions)
  } catch (error) {
    throw new TypeError(`invalid conditions: ${error.message}`, { cause: error })
  }
  ensureQuery(conditions)
}
