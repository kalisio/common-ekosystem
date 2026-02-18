---
title: assert
---

# assert


## that

### Signature
```javascript
that(value, validator, errorMessage)
```

### Description

Assert that a value passes validation

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to validate |
| validator | function | yes | A function that returns true if the value is valid |
| errorMessage | string | yes | The error message to throw if validation fails |

### Returns

| Type | Description |
|------|-------------|
| void |  |

### Examples

```javascript
assert.that(5, (v) => v > 0, 'Value must be positive') // passes
assert.that(-1, (v) => v > 0, 'Value must be positive') // throws TypeError
assert.that('hello', (v) => typeof v === 'string', 'Must be a string') // passes
```


---

## all

### Signature
```javascript
all(validations, validations[].value, validations[].validator, validations[].message)
```

### Description

Assert multiple validations at once

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| validations | Array.&lt;{value: *, validator: function(), message: string}&gt; | yes | Array of validation objects |
| validations[].value | * | yes | The value to validate |
| validations[].validator | function | yes | The validator function |
| validations[].message | string | yes | The error message if validation fails |

### Returns

| Type | Description |
|------|-------------|
| void |  |

### Examples

```javascript
assert.all([
  { value: 5, validator: (v) => v > 0, message: 'Must be positive' },
  { value: 'test', validator: (v) => v.length > 0, message: 'Must not be empty' }
]) // passes
```

```javascript
assert.all([
  { value: 5, validator: (v) => v > 0, message: 'Must be positive' },
  { value: -1, validator: (v) => v > 0, message: 'Must be positive' }
]) // throws TypeError: 'Must be positive'
```


---


