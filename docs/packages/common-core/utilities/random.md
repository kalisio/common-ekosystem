---

title: random
description: Utility functions for generating random numbers, selecting values, sampling generators, and shuffling arrays.
---

# random

Utility functions for generating random numbers, selecting values, sampling generators, and shuffling arrays.

::: warning Security considerations

This utility is intended for non-security-sensitive use cases such as data sampling, array shuffling,
and test fixtures.It relies on `Math.random()`, which is appropriate for this type and volume of
random generation and works consistently in both browser and Node.js environments. Do not use this module
to generate tokens, keys, secrets, session identifiers, or any other value requiring cryptographic unpredictability.

:::

## integer

Returns a random integer between `min` and `max`, both inclusive.

### Signature

```js
random.integer(min, max)
```

### Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `min`     | `number` | Minimum integer value |
| `max`     | `number` | Maximum integer value |

### Returns

A random integer between `min` and `max`, inclusive.

### Example

```js
const value = random.integer(1, 10)
// => an integer between 1 and 10
```

## number

Returns a random number between `min` and `max`.

### Signature

```js
random.number(min, max)
```

### Parameters

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| `min`     | `number` | Minimum value |
| `max`     | `number` | Maximum value |

### Returns

A random number greater than or equal to `min` and lower than `max`.

### Example

```js
const value = random.number(0, 1)
// => a number >= 0 and < 1
```

## choice

Returns a randomly selected element from a non-empty array.

### Signature

```js
random.choice(array)
```

### Parameters

| Parameter | Type    | Description                    |
| --------- | ------- | ------------------------------ |
| `array`   | `Array` | Non-empty array to select from |

### Returns

A randomly selected element from `array`.

### Example

```js
const value = random.choice(['red', 'green', 'blue'])
// => 'red', 'green', or 'blue'
```

## sample

Generates an array of random values by invoking a generator function a given number of times.

### Signature

```js
random.sample(generator, count)
```

### Parameters

| Parameter   | Type       | Description                                                  |
| ----------- | ---------- | ------------------------------------------------------------ |
| `generator` | `Function` | Function invoked to generate each value                      |
| `count`     | `number`   | Number of values to generate. Must be a non-negative integer |

### Returns

An array containing `count` generated values.

### Example

```js
const values = random.sample(() => random.integer(1, 6), 3)
// => for example [2, 6, 4]
```

When `count` is `0`, an empty array is returned.

## shuffle

Returns a randomly shuffled copy of an array using the Fisher-Yates algorithm.
The input array is not modified.

### Signature

```js
random.shuffle(array)
```

### Parameters

| Parameter | Type    | Description      |
| --------- | ------- | ---------------- |
| `array`   | `Array` | Array to shuffle |

### Returns

A new array containing the same elements in randomized order.

### Example

```js
const source = [1, 2, 3, 4]
const result = random.shuffle(source)
// source remains [1, 2, 3, 4]
// result contains the same values in a random order
```


## password

Generates a cryptographically secure random password with a configurable length and character composition.

::: tip

Unlike the other random generators, `password` uses `crypto.getRandomValues()` instead of `Math.random()`.

- Characters are selected using cryptographically secure random values.
- Rejection sampling eliminates modulo bias.
- A secure Fisher-Yates shuffle randomizes character positions.
- Characters may repeat.

The resulting password contains exactly the requested character composition, without predictable character positions.

:::

### Signature

```js
random.password(options = {})
```

### Parameters

| Option | Type | Default | Description |
|---|---|---|---|
| `length` | Integer | `12` | Total number of characters |
| `digits` | Integer | `1` | Exact number of digits |
| `specials` | Integer | `1` | Exact number of special characters |

The remaining characters are ASCII letters (`a-z`, `A-Z`).

### Returns

A randomly generated password as a string.

The password contains exactly the requested number of digits and special characters, with the remaining positions filled by letters.

All characters are selected from printable ASCII characters (codes 33 to 126), excluding spaces.

### Examples

Generate a password with default options:

```js
random.password()
// 12 characters: 10 letters, 1 digit, 1 special
```

Generate a longer password:

```js
random.password({ length: 20 })
// 20 characters: 18 letters, 1 digit, 1 special
```

Customize the character composition:

```js
random.password({ length: 16, digits: 4, specials: 3 })
// 16 characters: 9 letters, 4 digits, 3 specials
```

Generate a password containing letters only:

```js
random.password({ length: 16, digits: 0, specials: 0 })
// 16 letters
```

Generate a numeric password:

```js
random.password({ length: 8, digits: 8, specials: 0 })
// 8 digits
```

Generate a password without letters:

```js
random.password({ length: 12, digits: 6, specials: 6 })
// 6 digits and 6 special characters
```

### Validation

- `options` must be a plain object.
- `length` must be a positive integer.
- `digits` and `specials` must be non-negative integers.
- `length` must be greater than or equal to `digits + specials`.

Invalid options throw an error.

```js
random.password({ length: 0 })
// Throws: length must be a positive integer

random.password({ length: 4, digits: 3, specials: 2 })
// Throws: length must be greater than or equal to digits plus specials
```

