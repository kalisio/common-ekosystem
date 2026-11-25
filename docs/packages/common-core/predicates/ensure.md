---
title: ensure
description: Functions that throw an error if validation fails, in production too. Used to guard inputs that must always be checked.
---

# ensure

Functions that throw an error if validation fails. Used to guard inputs that must be checked at runtime, such as data coming from outside the program or misuses that would otherwise fail silently or later.

Unlike [`assert`](./assert.md), `ensure` is **always active**: its validators run whatever the value of `process.env.NODE_ENV`, so keep them cheap on hot paths.

Every function throws a `TypeError` by default. Pass an error type as last parameter to throw another one, such as `RangeError`, [`AssertionError`](./assert.md#assertionerror) or a custom `Error` subclass: it is instantiated with the failure message.

## that

### Signature

```js
ensure.that (value, validator, message, ErrorType = TypeError)
```

### Description

Ensure that a value passes a validator function. Throws an `ErrorType` with the given message if the validator returns `false`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to validate |
| `validator` | `function` | yes | A function that returns true if the value is valid |
| `message` | `string` | yes | The error message thrown if validation fails |
| `ErrorType` | `function` | no | The error class to throw. Defaults to `TypeError` |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
ensure.that('hello', is.string, 'must be a string') // passes
ensure.that(42, is.string, 'must be a string')      // throws TypeError: 'must be a string'
```

```js
function parsePort (text) {
  const port = Number(text)
  ensure.that(port, (v) => is.integer(v) && is.inRange(v, 1, 65535), 'port must be an integer between 1 and 65535', RangeError)
  return port
}

parsePort('8080') // 8080
parsePort('http') // throws RangeError: 'port must be an integer between 1 and 65535', even in production
```

## all

### Signature

```js
ensure.all (validations, ErrorType = TypeError)
```

### Description

Ensure multiple validations at once. Iterates through the array and throws an `ErrorType` at the first failing validation. An empty array passes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `validations` | `Array` | yes | Array of validation objects |
| `validations[].value` | * | yes | The value to validate |
| `validations[].validator` | `function` | yes | The validator function |
| `validations[].message` | `string` | yes | The error message if validation fails |
| `ErrorType` | `function` | no | The error class to throw for any failing validation. Defaults to `TypeError` |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
// passes
ensure.all([
  { value: 'Alice', validator: is.nonEmptyString, message: 'name is required' },
  { value: 25, validator: is.positive, message: 'age must be positive' }
])
```

```js
// throws RangeError: 'age must be positive'
ensure.all([
  { value: 'Alice', validator: is.nonEmptyString, message: 'name is required' },
  { value: -1, validator: is.positive, message: 'age must be positive' }
], RangeError)
```

## any

### Signature

```js
ensure.any (validations, ErrorType = TypeError)
```

### Description

Ensure that at least one validation passes. Iterates through the array and throws an `ErrorType` if none of the validators return `true`. The error message is built by joining all validation messages with ` or `. An empty array passes (no validation to satisfy).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `validations` | `Array` | yes | Array of validation objects |
| `validations[].value` | * | yes | The value to validate |
| `validations[].validator` | `function` | yes | The validator function |
| `validations[].message` | `string` | yes | The error message if this validation fails |
| `ErrorType` | `function` | no | The error class to throw. Defaults to `TypeError` |

### Returns

| Type | Description |
|------|-------------|
| `void` | |

### Examples

```js
// passes — value is a string
ensure.any([
  { value: 'hello', validator: is.string, message: 'must be a string' },
  { value: 'hello', validator: is.array, message: 'must be an array' }
])
```

```js
// throws TypeError: 'must be a string or must be an array'
ensure.any([
  { value: 42, validator: is.string, message: 'must be a string' },
  { value: 42, validator: is.array, message: 'must be an array' }
])
```
