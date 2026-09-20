---
title: is
description: Predicate helpers for checking values, types, ranges, collections, and common JavaScript objects.
---

# is

Predicate helpers returning `true` when a value matches the expected condition and `false` otherwise.

## Values

### defined

Checks whether a value is neither `null` nor `undefined`.

```js
is.defined(value)
```

```js
is.defined(0)         // true
is.defined(false)     // true
is.defined(null)      // false
is.defined(undefined) // false
```

### nil

Checks whether a value is `null` or `undefined`.

```js
is.nil(value)
```

```js
is.nil(null)      // true
is.nil(undefined) // true
is.nil(0)         // false
```

## Objects

### plainObject

Checks whether a value is a plain object created with the standard `Object` constructor.

```js
is.plainObject(value)
```

### emptyObject

Checks whether a value is a plain object with no enumerable own properties.

```js
is.emptyObject(value)
```

### nonEmptyObject

Checks whether a value is a plain object with at least one enumerable own property.

```js
is.nonEmptyObject(value)
```

## Booleans

### boolean

Checks whether a value is a boolean.

```js
is.boolean(value)
```

### booleanTrue

Checks whether a value is exactly `true`.

```js
is.booleanTrue(value)
```

### booleanFalse

Checks whether a value is exactly `false`.

```js
is.booleanFalse(value)
```

## Strings

### string

Checks whether a value is a string.

```js
is.string(value)
```

### emptyString

Checks whether a value is an empty or whitespace-only string.

```js
is.emptyString(value)
```

### nonEmptyString

Checks whether a value is a string containing at least one non-whitespace character.

```js
is.nonEmptyString(value)
```

### char

Checks whether a value is a string containing exactly one Unicode code point.

```js
is.char(value)
```

```js
is.char('a')  // true
is.char('😀') // true
is.char('ab') // false
is.char('')   // false
```

### hex

Checks whether a value is a non-empty hexadecimal string with an even number of characters.

```js
is.hex(value)
```

```js
is.hex('deadbeef') // true
is.hex('ff')       // true
is.hex('abc')      // false
is.hex('0xff')     // false
```

### dataUri

Checks whether a value is a base64 data URI.

```js
is.dataUri(value)
```

### url

Checks whether a value is a valid hierarchical URL using the `scheme://authority` form.

Standard single-host URLs are validated with `URL.canParse()`. Multi-host authorities, such as MongoDB replica-set URLs, are also supported.

URLs without an authority component, such as `mailto:` URLs, are rejected.

```js
is.url(value)
```

```js
is.url('https://example.com') // true
is.url('s3://bucket/path/to/file') // true
is.url('mongodb://h1:27017,h2:27017/db') // true

is.url('mailto:user@example.com') // false
is.url('example.com') // false
is.url('/foo/bar') // false
```


### email

Checks whether a value is a valid email address according to the predicate validation rules and length limits.

```js
is.email(value)
```

## Regular expressions

### regularExpression

Checks whether a value is a `RegExp` instance.

```js
is.regularExpression(value)
```

## Numbers

### number

Checks whether a value is a finite number.

`NaN`, `Infinity`, and `-Infinity` are rejected.

```js
is.number(value)
```

```js
is.number(42)        // true
is.number(1.5)       // true
is.number(NaN)       // false
is.number(Infinity)  // false
```

### positive

Checks whether a value is a finite number strictly greater than zero.

```js
is.positive(value)
```

```js
is.positive(1) // true
is.positive(0) // false
```

### nonPositive

Checks whether a value is a finite number less than or equal to zero.

```js
is.nonPositive(value)
```

```js
is.nonPositive(-1) // true
is.nonPositive(0)  // true
is.nonPositive(1)  // false
```

### negative

Checks whether a value is a finite number strictly less than zero.

```js
is.negative(value)
```

```js
is.negative(-1) // true
is.negative(0)  // false
```

### nonNegative

Checks whether a value is a finite number greater than or equal to zero.

```js
is.nonNegative(value)
```

```js
is.nonNegative(1)  // true
is.nonNegative(0)  // true
is.nonNegative(-1) // false
```

### infinity

Checks whether a value is positive or negative infinity.

```js
is.infinity(value)
```

```js
is.infinity(Infinity)  // true
is.infinity(-Infinity) // true
is.infinity(0)         // false
```

### positiveInfinity

Checks whether a value is positive infinity.

```js
is.positiveInfinity(value)
```

```js
is.positiveInfinity(Infinity)  // true
is.positiveInfinity(-Infinity) // false
```

### negativeInfinity

Checks whether a value is negative infinity.

```js
is.negativeInfinity(value)
```

```js
is.negativeInfinity(-Infinity) // true
is.negativeInfinity(Infinity)  // false
```

## Ranges

### inRange

Checks whether a finite number belongs to the inclusive range `[min, max]`.

```js
is.inRange(value, min, max)
```

Throws when `max < min`.

### inRangeExclusive

Checks whether a finite number belongs to the exclusive range `(min, max)`.

```js
is.inRangeExclusive(value, min, max)
```

Throws when `max <= min`.

### inRangeExclusiveMin

Checks whether a finite number belongs to the range `(min, max]`.

```js
is.inRangeExclusiveMin(value, min, max)
```

Throws when `max <= min`.

### inRangeExclusiveMax

Checks whether a finite number belongs to the range `[min, max)`.

```js
is.inRangeExclusiveMax(value, min, max)
```

Throws when `max < min`.

## Integers

### integer

Checks whether a value is a finite integer.

```js
is.integer(value)
```

### positiveInteger

Checks whether a value is an integer strictly greater than zero.

```js
is.positiveInteger(value)
```

### nonPositiveInteger

Checks whether a value is an integer less than or equal to zero.

```js
is.nonPositiveInteger(value)
```

### negativeInteger

Checks whether a value is an integer strictly less than zero.

```js
is.negativeInteger(value)
```

### nonNegativeInteger

Checks whether a value is an integer greater than or equal to zero.

```js
is.nonNegativeInteger(value)
```

## Dates

### date

Checks whether a value is a valid `Date` instance.

```js
is.date(value)
```

```js
is.date(new Date())          // true
is.date(new Date('invalid')) // false
is.date(Date.now())          // false
```

## Arrays

### array

Checks whether a value is an array.

```js
is.array(value)
```

### emptyArray

Checks whether a value is an empty array.

```js
is.emptyArray(value)
```

### nonEmptyArray

Checks whether a value is a non-empty array.

```js
is.nonEmptyArray(value)
```

### arrayOfLength

Checks whether an array has exactly the requested length.

```js
is.arrayOfLength(value, length)
```

`length` must be a non-negative integer.

### arrayOfLengthAtLeast

Checks whether an array has at least `minLength` elements.

```js
is.arrayOfLengthAtLeast(value, minLength)
```

`minLength` must be a non-negative integer.

### arrayOfLengthAtMost

Checks whether an array has at most `maxLength` elements.

```js
is.arrayOfLengthAtMost(value, maxLength)
```

`maxLength` must be a non-negative integer.

### arrayOfLengthBetween

Checks whether an array length belongs to the inclusive range `[minLength, maxLength]`.

```js
is.arrayOfLengthBetween(value, minLength, maxLength)
```

Both bounds must be non-negative integers and `minLength` must be less than or equal to `maxLength`.

### arrayOf

Checks whether a value is an array whose items all match a validator.

An empty array is considered valid.

```js
is.arrayOf(value, validator)
```

```js
is.arrayOf([1, 2, 3], is.number) // true
is.arrayOf([1, '2', 3], is.number) // false
is.arrayOf([], is.number) // true
```

`validator` must be a function.

### nonEmptyArrayOf

Checks whether a value is a non-empty array whose items all match a validator.

```js
is.nonEmptyArrayOf(value, validator)
```

```js
is.nonEmptyArrayOf([1, 2, 3], is.number) // true
is.nonEmptyArrayOf([1, '2', 3], is.number) // false
is.nonEmptyArrayOf([], is.number) // false
```

`validator` must be a function.

## Maps

### map

Checks whether a value is a `Map`.

```js
is.map(value)
```

### emptyMap

Checks whether a value is an empty `Map`.

```js
is.emptyMap(value)
```

### nonEmptyMap

Checks whether a value is a non-empty `Map`.

```js
is.nonEmptyMap(value)
```

## Sets

### set

Checks whether a value is a `Set`.

```js
is.set(value)
```

### emptySet

Checks whether a value is an empty `Set`.

```js
is.emptySet(value)
```

### nonEmptySet

Checks whether a value is a non-empty `Set`.

```js
is.nonEmptySet(value)
```

## Functions

### function

Checks whether a value is a function.

```js
is.function(value)
```

## Abort signals

### abortSignal

Checks whether a value is an `AbortSignal`.

```js
is.abortSignal(value)
```

```js
const controller = new AbortController()

is.abortSignal(controller.signal) // true
is.abortSignal(controller)        // false
```

## Enumerations

### oneOf

Checks whether a value belongs to a non-empty list of allowed values.

```js
is.oneOf(value, allowedValues)
```

```js
is.oneOf('b', ['a', 'b', 'c']) // true
is.oneOf('d', ['a', 'b', 'c']) // false
```

`allowedValues` must be a non-empty array.

## Empty values

### empty

Checks whether a value is considered empty.

The following values are empty:

- `null` and `undefined`
- empty or whitespace-only strings
- empty arrays
- empty plain objects
- empty `Map` instances
- empty `Set` instances

```js
is.empty(value)
```

```js
is.empty(null)      // true
is.empty('   ')     // true
is.empty([])        // true
is.empty({})        // true
is.empty(new Map()) // true
is.empty(0)         // false
is.empty(false)     // false
```
