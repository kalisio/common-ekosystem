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
