# check

**check** is a minimalist conditional and assertion library for JavaScript.

**check** is organized around five focused modules:
- `is` provides a set of boolean predicates to test the type and state of a value.
- `has` checks for the presence and definition of keys in an object.
- `conforms` validates an object against a schema, supporting nested structures and any `is` predicate as a validator.
- `matches` tests strings against regular expressions.
- `asserts` builds on top of `is` to throw a `TypeError` when a value fails validation, making it suitable for guarding function inputs.

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
is.nonEmptyString('hello')
// true
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

### conforms

```javascript
conforms.schema(
  { name: 'Alice', age: 25, tags: [] },
  { name: is.string, age: is.number, tags: is.array }
)
// true
conforms.schema(
  { name: 'Alice', age: '25' },
  { name: is.string, age: is.number }
)
// false
conforms.schema(
  { address: { city: 'Paris' } },
  { address: { city: is.nonEmptyString } }
)
// true
```

### matches

```javascript
matches.pattern('hello@example.com', /^[\w.-]+@[\w.-]+\.\w+$/)
// true
matches.pattern('not-an-email', /^[\w.-]+@[\w.-]+\.\w+$/)
// false
matches.pattern('abc123', /^\w+$/)
// true
matches.pattern('abc 123', /^\w+$/)
// false
matches.pattern('HELLO', /^[A-Z]+$/)
// true
```

### asserts

```javascript
asserts.that('hello', is.nonEmptyString, 'name must be a non-empty string')
asserts.that(42, is.positive, 'age must be positive')
asserts.that(true, is.boolean, 'flag must be a boolean')
asserts.that([1, 2], is.nonEmptyArray, 'items must be a non-empty array')
asserts.all([
  { value: 'Alice', validator: is.nonEmptyString, message: 'name must be a non-empty string' },
  { value: 25, validator: is.positive, message: 'age must be positive' }
])
```















