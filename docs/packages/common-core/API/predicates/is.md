---
title: is
description: Functions that return a boolean for checking the type or state of a value.
---

# is

Functions that return a boolean for checking the type or state of a value.

## defined

### Signature

```js
is.defined (value)
```

### Description

Check if a value is defined (not `null` or `undefined`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is not null and not undefined |

### Examples

```js
is.defined(0)         // true
is.defined('')        // true
is.defined(null)      // false
is.defined(undefined) // false
```

## nil

### Signature

```js
is.nil (value)
```

### Description

Check if a value is `null` or `undefined`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is null or undefined |

### Examples

```js
is.nil(null)      // true
is.nil(undefined) // true
is.nil(0)         // false
is.nil('')        // false
```

## plainObject

### Signature

```js
is.plainObject (value)
```

### Description

Check if a value is a plain object literal (not an array, not `null`, not a class instance).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a plain object literal |

### Examples

```js
is.plainObject({})                // true
is.plainObject({ name: 'Alice' }) // true
is.plainObject([])                // false
is.plainObject(null)              // false
is.plainObject(new Date())        // false
```

## emptyObject

### Signature

```js
is.emptyObject (value)
```

### Description

Check if a value is a plain object with no keys.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a plain object with no keys |

### Examples

```js
is.emptyObject({})                // true
is.emptyObject({ name: 'Alice' }) // false
is.emptyObject([])                // false
```

## nonEmptyObject

### Signature

```js
is.nonEmptyObject (value)
```

### Description

Check if a value is a plain object with at least one key.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a plain object with at least one key |

### Examples

```js
is.nonEmptyObject({ name: 'Alice' }) // true
is.nonEmptyObject({})                // false
is.nonEmptyObject([])                // false
```

## boolean

### Signature

```js
is.boolean(value)
```

### Description

Check if a value is a boolean.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a boolean |

### Examples

```js
is.boolean(true)   // true
is.boolean(false)  // true
is.boolean(1)      // false
is.boolean('true') // false
```
## booleanTrue

### Signature

```js
is.booleanTrue(value)
```

### Description

Check if a value is strictly `true`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is strictly `true` |

### Examples

```js
is.booleanTrue(true)  // true
is.booleanTrue(false) // false
is.booleanTrue(1)     // false
```

## booleanFalse

### Signature

```js
is.booleanFalse(value)
```

### Description

Check if a value is strictly `false`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is strictly `false` |

### Examples

```js
is.booleanFalse(false) // true
is.booleanFalse(true)  // false
is.booleanFalse(0)     // false
```

## string

### Signature

```js
is.string (value)
```

### Description

Check if a value is a string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a string |

### Examples

```js
is.string('hello') // true
is.string('')      // true
is.string(123)     // false
```

## emptyString

### Signature

```js
is.emptyString (value)
```

### Description

Check if a value is a string containing only whitespace.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a string with only whitespace |

### Examples

```js
is.emptyString('')      // true
is.emptyString('   ')   // true
is.emptyString('hello') // false
is.emptyString(null)    // false
```

## nonEmptyString

### Signature

```js
is.nonEmptyString (value)
```

### Description

Check if a value is a string containing at least one non-whitespace character.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a string with at least one non-whitespace character |

### Examples

```js
is.nonEmptyString('hello') // true
is.nonEmptyString('')      // false
is.nonEmptyString('   ')   // false
is.nonEmptyString(null)    // false
```

## regularExpression

### Signature

```js
is.regularExpression (value)
```

### Description

Check if a value is a regular expression (instance of `RegExp`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a RegExp instance |

### Examples

```js
is.regularExpression(/abc/)             // true
is.regularExpression(new RegExp('abc')) // true
is.regularExpression('abc')             // false
is.regularExpression(null)              // false
```
## hex

### Signature

```js
is.hex (value)
```

### Description

Check if a value is a valid hexadecimal string (even length, only characters `0-9` and `a-f`/`A-F`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a non-empty string of even length containing only hex characters |

### Examples

```js
is.hex('deadbeef') // true
is.hex('DEADBEEF') // true
is.hex('ff')       // true
is.hex('abc')      // false — odd length
is.hex('0xff')     // false — 0x prefix not allowed
is.hex('')         // false — must be a non-empty string
is.hex(null)       // false — value must be a string
```

## dataUri

### Signature

```js
is.dataUri value)
```

### Description

Returns `true` if `value` is a valid base64 data URI, i.e. a string starting with `data:` and containing `;base64,`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `*` | yes | The value to test |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if `value` is a valid base64 data URI, `false` otherwise |

### Examples

```js
is.dataUri('data:image/png;base64,iVBORw0KGgo=') // true
is.dataUri('data:text/plain;base64,aGVsbG8=')    // true
is.dataUri('data:text/plain,hello')               // false
is.dataUri('https://example.com/image.png')       // false
is.dataUri('')                                    // false
is.dataUri(null)                                  // false
```

## url

### Signature

```js
is.url (value, baseUrl)
```

### Description

Check if a value is a valid URL. Optionally accepts a base URL to resolve relative URLs against.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | yes | The value to check |
| `baseUrl` | string | no | Optional base URL for resolving relative URLs |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a valid URL |

### Examples

```js
is.url('https://example.com')              // true
is.url('https://example.com/foo?bar=1')    // true
is.url('/foo/bar', 'https://example.com')  // true
is.url('example.com')                      // false — missing protocol
is.url('/foo/bar')                         // false — relative URL without base
is.url(null)                               // false — value must be a string
```

## email

### Signature

```js
is.email(value)
```

### Description

Check if a value is a valid email address.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a valid email address |

### Examples

```js
is.email('user@example.com')       // true
is.email('first.last@example.com') // true
is.email('user+tag@example.com')   // true
is.email('userexample.com')        // false — missing @
is.email('user@')                  // false — missing domain
is.email('@example.com')           // false — missing local part
is.email(null)                     // false — must be a string
```

## number

### Signature

```js
number(value)
```

### Description

Check if a value is a valid finite number (not `NaN`, not `Infinity`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a finite number |

### Examples

```js
is.number(42)       // true
is.number(3.14)     // true
is.number(NaN)      // false
is.number(Infinity) // false
is.number('42')     // false
```

## positive

### Signature

```js
is.positive (value)
```

### Description

Check if a value is a positive number (strictly greater than 0).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number greater than 0 |

### Examples

```js
is.positive(5)   // true
is.positive(0.1) // true
is.positive(0)   // false
is.positive(-5)  // false
```

## nonPositive

### Signature

```js
is.nonPositive (value)
```

### Description

Check if a value is a number less than or equal to 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number ≤ 0 |

### Examples

```js
is.nonPositive(0)  // true
is.nonPositive(-5) // true
is.nonPositive(1)  // false
```

## negative

### Signature

```js
is.negative (value)
```

### Description

Check if a value is a negative number (strictly less than 0).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number less than 0 |

### Examples

```js
is.negative(-5)   // true
is.negative(-0.1) // true
is.negative(0)    // false
is.negative(5)    // false
```

## nonNegative

### Signature

```js
is.nonNegative (value)
```

### Description

Check if a value is a number greater than or equal to 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number ≥ 0 |

### Examples

```js
is.nonNegative(0)  // true
is.nonNegative(5)  // true
is.nonNegative(-1) // false
```

## inRange

### Signature

```js
is.inRange (value, min, max)
```

### Description

Check if a value is within a numeric range (inclusive on both ends).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| min | number | yes | Minimum value (inclusive) |
| max | number | yes | Maximum value (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number between min and max (inclusive) |

### Examples

```js
is.inRange(5, 1, 10)  // true
is.inRange(1, 1, 10)  // true
is.inRange(10, 1, 10) // true
is.inRange(0, 1, 10)  // false
is.inRange(11, 1, 10) // false
```

## inRangeExclusive

### Signature

```js
is.inRangeExclusive (value, min, max)
```

### Description

Check if a value is strictly within a numeric range (exclusive on both ends).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| min | number | yes | Minimum value (exclusive) |
| max | number | yes | Maximum value (exclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a number strictly between min and max |

### Examples

```js
is.inRangeExclusive(5, 1, 10)  // true
is.inRangeExclusive(1, 1, 10)  // false
is.inRangeExclusive(10, 1, 10) // false
```

## inRangeExclusiveMin

### Signature

```js
is.inRangeExclusiveMin (value, min, max)
```

### Description

Check if a value is within a numeric range, exclusive on the lower bound and inclusive on the upper bound.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| min | number | yes | Minimum value (exclusive) |
| max | number | yes | Maximum value (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if `min < value <= max` |

### Examples

```js
is.inRangeExclusiveMin(10, 1, 10) // true
is.inRangeExclusiveMin(1, 1, 10)  // false
is.inRangeExclusiveMin(5, 1, 10)  // true
```

## inRangeExclusiveMax

### Signature

```js
is.inRangeExclusiveMax (value, min, max)
```

### Description

Check if a value is within a numeric range, inclusive on the lower bound and exclusive on the upper bound.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| min | number | yes | Minimum value (inclusive) |
| max | number | yes | Maximum value (exclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if `min <= value < max` |

### Examples

```js
is.inRangeExclusiveMax(1, 1, 10)  // true
is.inRangeExclusiveMax(10, 1, 10) // false
is.inRangeExclusiveMax(5, 1, 10)  // true
```

## integer

### Signature

```js
is.integer (value)
```

### Description

Check if a value is an integer.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an integer |

### Examples

```js
is.integer(42)   // true
is.integer(0)    // true
is.integer(3.14) // false
is.integer('42') // false
```

## positiveInteger

### Signature

```js
is.positiveInteger (value)
```

### Description

Check if a value is an integer strictly greater than 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an integer > 0 |

### Examples

```js
is.positiveInteger(1)    // true
is.positiveInteger(42)   // true
is.positiveInteger(0)    // false
is.positiveInteger(-1)   // false
is.positiveInteger(3.14) // false
```

## nonPositiveInteger

### Signature

```js
is.nonPositiveInteger (value)
```

### Description

Check if a value is an integer less than or equal to 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an integer ≤ 0 |

### Examples

```js
is.nonPositiveInteger(0)  // true
is.nonPositiveInteger(-3) // true
is.nonPositiveInteger(1)  // false
```

## negativeInteger

### Signature

```js
is.negativeInteger (value)
```

### Description

Check if a value is an integer strictly less than 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an integer < 0 |

### Examples

```js
is.negativeInteger(-1)  // true
is.negativeInteger(-42) // true
is.negativeInteger(0)   // false
is.negativeInteger(1)   // false
```

## nonNegativeInteger

### Signature

```js
is.nonNegativeInteger (value)
```

### Description

Check if a value is an integer greater than or equal to 0.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an integer ≥ 0 |

### Examples

```js
is.nonNegativeInteger(0)  // true
is.nonNegativeInteger(5)  // true
is.nonNegativeInteger(-1) // false
```

## array

### Signature

```js
is.array (value)
```

### Description

Check if a value is an array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array |

### Examples

```js
is.array([])        // true
is.array([1, 2, 3]) // true
is.array({})        // false
is.array('hello')   // false
```

## emptyArray

### Signature

```js
is.emptyArray (value)
```

### Description

Check if a value is an empty array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with no elements |

### Examples

```js
is.emptyArray([])     // true
is.emptyArray([1, 2]) // false
is.emptyArray({})     // false
```

## nonEmptyArray

### Signature

```js
is.nonEmptyArray (value)
```

### Description

Check if a value is an array with at least one element.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with at least one element |

### Examples

```js
is.nonEmptyArray([1, 2]) // true
is.nonEmptyArray([])     // false
```

## arrayOfLength

### Signature

```js
is.arrayOfLength (value, length)
```

### Description

Check if a value is an array of a specific length.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| length | number | yes | The expected length |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with the specified length |

### Examples

```js
is.arrayOfLength([1, 2, 3], 3) // true
is.arrayOfLength([1, 2], 3)    // false
is.arrayOfLength([], 0)        // true
```

## arrayOfLengthAtLeast

### Signature

```js
is.arrayOfLengthAtLeast (value, minLength)
```

### Description

Check if a value is an array with at least a given number of elements.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| minLength | number | yes | Minimum number of elements (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with `length >= minLength` |

### Examples

```js
is.arrayOfLengthAtLeast([1, 2, 3], 3) // true
is.arrayOfLengthAtLeast([1, 2, 3], 2) // true
is.arrayOfLengthAtLeast([1], 2)        // false
```

## arrayOfLengthAtMost

### Signature

```js
is.arrayOfLengthAtMost (value, maxLength)
```

### Description

Check if a value is an array with at most a given number of elements.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| maxLength | number | yes | Maximum number of elements (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with `length <= maxLength` |

### Examples

```js
is.arrayOfLengthAtMost([1, 2], 3)    // true
is.arrayOfLengthAtMost([1, 2], 2)    // true
is.arrayOfLengthAtMost([1, 2, 3], 2) // false
```

## arrayOfLengthBetween

### Signature

```js
is.arrayOfLengthBetween (value, minLength, maxLength)
```

### Description

Check if a value is an array whose length falls within a given range (inclusive on both ends).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| minLength | number | yes | Minimum number of elements (inclusive) |
| maxLength | number | yes | Maximum number of elements (inclusive) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is an array with `minLength <= length <= maxLength` |

### Examples

```js
is.arrayOfLengthBetween([1, 2], 1, 3)       // true
is.arrayOfLengthBetween([1, 2, 3], 1, 3)    // true
is.arrayOfLengthBetween([], 1, 3)            // false
is.arrayOfLengthBetween([1, 2, 3, 4], 1, 3) // false
```

## map

### Signature

```js
is.map (value)
```

### Description

Check if a value is a `Map` instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Map instance |

### Examples

```js
is.map(new Map())           // true
is.map(new Map([['a', 1]])) // true
is.map({})                  // false
is.map(null)                // false
```

## emptyMap

### Signature

```js
is.emptyMap (value)
```

### Description

Check if a value is a `Map` instance with no entries.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Map with no entries |

### Examples

```js
is.emptyMap(new Map())           // true
is.emptyMap(new Map([['a', 1]])) // false
```

## nonEmptyMap

### Signature

```js
is.nonEmptyMap (value)
```

### Description

Check if a value is a `Map` instance with at least one entry.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Map with at least one entry |

### Examples

```js
is.nonEmptyMap(new Map([['a', 1]])) // true
is.nonEmptyMap(new Map())           // false
```

## set

### Signature

```js
is.set (value)
```

### Description

Check if a value is a `Set` instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Set instance |

### Examples

```js
is.set(new Set())       // true
is.set(new Set([1, 2])) // true
is.set([])              // false
is.set(null)            // false
```

## emptySet

### Signature

```js
is.emptySet (value)
```

### Description

Check if a value is a `Set` instance with no elements.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Set with no elements |

### Examples

```js
is.emptySet(new Set())       // true
is.emptySet(new Set([1, 2])) // false
```

## nonEmptySet

### Signature

```js
is.nonEmptySet (value)
```

### Description

Check if a value is a `Set` instance with at least one element.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a Set with at least one element |

### Examples

```js
is.nonEmptySet(new Set([1, 2])) // true
is.nonEmptySet(new Set())       // false
```

## function

### Signature

```js
is.function (value)
```

### Description

Check if a value is a function.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is a function |

### Examples

```js
is.function(() => {})      // true
is.function(function() {}) // true
is.function(Array.isArray) // true
is.function({})            // false
```

## oneOf

### Signature

```js
is.oneOf(value, allowedValues)
```

### Description

Check if a value is one of the allowed values.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |
| allowedValues | Array | yes | Array of allowed values |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is included in allowedValues |

### Examples

```js
is.oneOf('red', ['red', 'green', 'blue'])    // true
is.oneOf('yellow', ['red', 'green', 'blue']) // false
is.oneOf(2, [1, 2, 3])                       // true
```

## empty

### Signature

```js
is.empty (value)
```

### Description

Check if a value is empty. A value is considered empty if it is `null`, `undefined`, a whitespace-only string, an empty array, an empty object, an empty Map, or an empty Set.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | * | yes | The value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the value is considered empty |

### Examples

```js
is.empty(null)      // true
is.empty(undefined) // true
is.empty('')        // true
is.empty('   ')     // true
is.empty([])        // true
is.empty({})        // true
is.empty(new Map()) // true
is.empty(new Set()) // true
is.empty(0)         // false
is.empty(false)     // false
is.empty('hello')   // false
```