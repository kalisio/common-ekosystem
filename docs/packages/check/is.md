---
title: is
---

# is

## defined

### Signature

```js
defined(value)
```

### Description

Check if value is defined (not null or undefined)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is not null and not undefined |

### Examples

```js
is.defined(0) // true
is.defined('') // true
is.defined(null) // false
is.defined(undefined) // false
```

## nil

### Signature

```js
nil(value)
```

### Description

Check if value is null or undefined

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is null or undefined |

### Examples

```js
is.nil(null) // true
is.nil(undefined) // true
is.nil(0) // false
is.nil('') // false
```

## plainObject

### Signature

```js
plainObject(value)
```

### Description

Check if value is a plain object (not array, not null, not a class instance)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a plain object literal |

### Examples

```js
is.plainObject({}) // true
is.plainObject({ name: 'John' }) // true
is.plainObject([]) // false
is.plainObject(null) // false
is.plainObject(new Date()) // false
```

## emptyObject

### Signature

```js
emptyObject(value)
```

### Description

Check if value is an empty object

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a plain object with no keys |

### Examples

```js
is.emptyObject({}) // true
is.emptyObject({ name: 'John' }) // false
is.emptyObject([]) // false
```

## string

### Signature

```js
string(value)
```

### Description

Check if value is a string

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a string |

### Examples

```js
is.string('hello') // true
is.string('') // true
is.string(123) // false
```

## emptyString

### Signature

```js
emptyString(value)
```

### Description

Check if value is an empty string (whitespace only)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a string with only whitespace |

### Examples

```js
is.emptyString('') // true
is.emptyString('   ') // true
is.emptyString('hello') // false
is.emptyString(null) // false
```

## number

### Signature

```js
number(value)
```

### Description

Check if value is a valid number (not NaN, not Infinity)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a finite number |

### Examples

```js
is.number(42) // true
is.number(3.14) // true
is.number(NaN) // false
is.number(Infinity) // false
is.number('42') // false
```

## integer

### Signature

```js
integer(value)
```

### Description

Check if value is an integer

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is an integer |

### Examples

```js
is.integer(42) // true
is.integer(0) // true
is.integer(3.14) // false
is.integer('42') // false
```

## array

### Signature

```js
array(value)
```

### Description

Check if value is an array

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is an array |

### Examples

```js
is.array([]) // true
is.array([1, 2, 3]) // true
is.array({}) // false
is.array('hello') // false
```

## emptyArray

### Signature

```js
emptyArray(value)
```

### Description

Check if value is an empty array

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is an array with no elements |

### Examples

```js
is.emptyArray([]) // true
is.emptyArray([1, 2]) // false
is.emptyArray({}) // false
```

## arrayOfLength

### Signature

```js
arrayOfLength(value, length)
```

### Description

Check if value is an array of specific length

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |
| length | number | yes | The expected length |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is an array with the specified length |

### Examples

```js
is.arrayOfLength([1, 2, 3], 3) // true
is.arrayOfLength([1, 2], 3) // false
is.arrayOfLength([], 0) // true
```

## function

### Signature

```js
function(value)
```

### Description

Check if value is a function

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a function |

### Examples

```js
is.function(() => {}) // true
is.function(function() {}) // true
is.function(Array.isArray) // true
is.function({}) // false
```

## boolean

### Signature

```js
boolean(value)
```

### Description

Check if value is a boolean

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a boolean |

### Examples

```js
is.boolean(true) // true
is.boolean(false) // true
is.boolean(1) // false
is.boolean('true') // false
```

## oneOf

### Signature

```js
oneOf(value, allowedValues)
```

### Description

Check if value is one of the allowed values

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |
| allowedValues | Array | yes | Array of allowed values |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is included in allowedValues |

### Examples

```js
is.oneOf('red', ['red', 'green', 'blue']) // true
is.oneOf('yellow', ['red', 'green', 'blue']) // false
is.oneOf(2, [1, 2, 3]) // true
```

## positive

### Signature

```js
positive(value)
```

### Description

Check if value is a positive number

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a number greater than 0 |

### Examples

```js
is.positive(5) // true
is.positive(0.1) // true
is.positive(0) // false
is.positive(-5) // false
```

## negative

### Signature

```js
negative(value)
```

### Description

Check if value is a negative number

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a number less than 0 |

### Examples

```js
is.negative(-5) // true
is.negative(-0.1) // true
is.negative(0) // false
is.negative(5) // false
```

## inRange

### Signature

```js
inRange(value, min, max)
```

### Description

Check if value is within a numeric range (inclusive)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |
| min | number | yes | Minimum value (inclusive) |
| max | number | yes | Maximum value (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a number between min and max (inclusive) |

### Examples

```js
is.inRange(5, 1, 10) // true
is.inRange(1, 1, 10) // true
is.inRange(10, 1, 10) // true
is.inRange(0, 1, 10) // false
is.inRange(11, 1, 10) // false
```

## empty

### Signature

```js
empty(value)
```

### Description

Check if value is empty (null, undefined, empty string, empty array, or empty object)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is considered empty |

### Examples

```js
is.empty(null) // true
is.empty(undefined) // true
is.empty('') // true
is.empty('   ') // true
is.empty([]) // true
is.empty({}) // true
is.empty(0) // false
is.empty(false) // false
is.empty('hello') // false
```
