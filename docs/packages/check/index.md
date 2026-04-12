---
title: check
description: A minimalist conditional and assertion library for JavaScript
---

# check

**check** is a minimalist conditional and assertion library for JavaScript.

**check** is organized around five focused modules:
- `is` provides a set of boolean predicates to test the type and state of a value.
- `has` checks for the presence and definition of keys in an object.
- `conform` validates an object against a schema, supporting nested structures and any `is` predicate as a validator.
- `match` tests strings against regular expressions.
- `assert` builds on top of `is` to throw a `TypeError` when a value fails validation, making it suitable for guarding function inputs.

## Installation

Install with your preferred package manager:

```shell
pnpm add @kalisio/check
```

```shell
npm install @kalisio/check
```

```shell
yarn add @kalisio/check
```

## Examples

### is

```javascript
is.positive(42)
// true
is.inRange(5, 1, 10)
// true
is.plainObject({ name: 'Alice' })
// true
is.empty([])
// true
```

### has

```javascript
has.key({ name: 'Alice' }, 'name')
// true
has.key({ name: 'Alice' }, 'age')
// false
has.keys({ name: 'Alice', age: 25 }, ['name', 'age'])
// true
has.keyWithValue({ name: 'Alice' }, 'name')
// true
has.keyWithValue({ name: null }, 'name')
// false
```

### conform

```javascript
conform.schema(
  { name: 'Alice', age: 25, tags: [] },
  { name: is.string, age: is.number, tags: is.array }
)
// true
conform.schema(
  { name: 'Alice', age: '25' },
  { name: is.string, age: is.number }
)
// false
conform.schema(
  { address: { city: 'Paris' } },
  { address: { city: (v) => is.nonEmptyString(v) } }
)
// true
```

### match

```javascript
match.pattern('hello@example.com', /^[\w.-]+@[\w.-]+\.\w+$/)
// true
match.pattern('not-an-email', /^[\w.-]+@[\w.-]+\.\w+$/)
// false
match.pattern('abc123', /^\w+$/)
// true
match.pattern('abc 123', /^\w+$/)
// false
match.pattern('HELLO', /^[A-Z]+$/)
// true
```

### assert

```javascript
assert.that('hello', (v) => is.nonEmptyString(v), 'name must be a non-empty string')
assert.that(42, is.positive, 'age must be positive')
assert.that(true, is.boolean, 'flag must be a boolean')
assert.that([1, 2], is.nonEmptyArray, 'items must be a non-empty array')
assert.all([
  { value: 'Alice', validator: (v) => is.nonEmptyString(v), message: 'name must be a non-empty string' },
  { value: 25, validator: is.positive, message: 'age must be positive' }
])
```















