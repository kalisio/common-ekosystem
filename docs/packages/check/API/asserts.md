---
title: asserts
description: Functions that throw a TypeError if validation fails. Used to guard function inputs.
---

# asserts

## that

### Signature

```javascript
asserts.that(value, validator, errorMessage)
```

### Description

Assert that a value passes a validator function. Throws a `TypeError` with the given message if the validator returns `false`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to validate |
| validator | function | yes | A function that returns true if the value is valid |
| errorMessage | string | yes | The error message thrown if validation fails |

### Returns

| Type | Description |
|------|-------------|
| void | |

### Examples

```javascript
asserts.that(5, (v) => v > 0, 'Value must be positive')  // passes
asserts.that(-1, (v) => v > 0, 'Value must be positive') // throws TypeError: 'Value must be positive'
asserts.that('hello', is.string, 'Must be a string')     // passes
```

## all

### Signature

```javascript
asserts.all(validations)
```

### Description

Assert multiple validations at once. Iterates through the array and throws a `TypeError` at the first failing validation.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| validations | Array | yes | Array of validation objects |
| validations[].value | * | yes | The value to validate |
| validations[].validator | function | yes | The validator function |
| validations[].message | string | yes | The error message if validation fails |

### Returns

| Type | Description |
|------|-------------|
| void | |

### Examples

```javascript
// passes
asserts.all([
  { value: 'Alice', validator: (v) => is.nonEmptyString(v), message: 'name must be a non-empty string' },
  { value: 25, validator: is.positive, message: 'age must be positive' }
])
```

```javascript
// throws TypeError: 'age must be positive'
asserts.all([
  { value: 'Alice', validator: (v) => is.nonEmptyString(v), message: 'name must be a non-empty string' },
  { value: -1, validator: is.positive, message: 'age must be positive' }
])
```