---
title: assert
description: Functions that throw an AssertionError if validation fails. Used to guard function inputs.
---

# assert

Functions that throw an `AssertionError` if validation fails. Used to guard function inputs against violated preconditions.

Assertions are **disabled in production**: when `process.env.NODE_ENV === 'production'`, every function returns immediately without running its validators. They are meant to catch programming errors during development and testing, not to validate untrusted runtime data.

## AssertionError

The error class thrown by all `assert` functions. Extends `Error` with `name` set to `'AssertionError'`, so it can be caught and distinguished from operational errors or engine-thrown `TypeError`s.

```js
import { assert, AssertionError } from './assert.js'

try {
  assert.that(-1, is.positive, 'must be positive')
} catch (error) {
  error instanceof AssertionError // true
}
```

## that

### Signature

```js
assert.that (value, validator, message)
```

### Description

Assert that a value passes a validator function. Throws an `AssertionError` with the given message if the validator returns `false`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to validate |
| `validator` | `function` | yes | A function that returns true if the value is valid |
| `message` | `string` | yes | The error message thrown if validation fails |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
assert.that(5, (v) => v > 0, 'Value must be positive')  // passes
assert.that(-1, (v) => v > 0, 'Value must be positive') // throws AssertionError: 'Value must be positive'
assert.that('hello', is.string, 'Must be a string')     // passes
```

## all

### Signature

```js
assert.all (validations)
```

### Description

Assert multiple validations at once. Iterates through the array and throws an `AssertionError` at the first failing validation. An empty array passes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `validations` | `Array` | yes | Array of validation objects |
| `validations[].value` | * | yes | The value to validate |
| `validations[].validator` | `function` | yes | The validator function |
| `validations[].message` | `string` | yes | The error message if validation fails |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
// passes
assert.all([
  { value: 'Alice', validator: (v) => is.nonEmptyString(v), message: 'name must be a non-empty string' },
  { value: 25, validator: is.positive, message: 'age must be positive' }
])
```

```js
// throws AssertionError: 'age must be positive'
assert.all([
  { value: 'Alice', validator: (v) => is.nonEmptyString(v), message: 'name must be a non-empty string' },
  { value: -1, validator: is.positive, message: 'age must be positive' }
])
```

## any

### Signature

```js
assert.any (validations)
```

### Description

Assert that at least one validation passes. Iterates through the array and throws an `AssertionError` if none of the validators return `true`. The error message is built by joining all validation messages with ` or `. An empty array passes (no validation to satisfy).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `validations` | `Array` | yes | Array of validation objects |
| `validations[].value` | * | yes | The value to validate |
| `validations[].validator` | `function` | yes | The validator function |
| `validations[].message` | `string` | yes | The error message if this validation fails |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
// passes — value is a string
assert.any([
  { value: 'hello', validator: is.string, message: 'must be a string' },
  { value: 'hello', validator: is.array, message: 'must be an array' }
])
```

```js
// throws AssertionError: 'must be a string or must be an array'
assert.any([
  { value: 42, validator: is.string, message: 'must be a string' },
  { value: 42, validator: is.array, message: 'must be an array' }
])
```