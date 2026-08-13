---
title: line
description: Line validation and measurement utilities
---

# line

Utilities for validating geographic lines and computing their length.

A line is represented as an array of geographic positions in `[longitude, latitude]` order.

## isValidLine

### Signature

```js
isValidLine (line)
```

### Description

Check whether a line is valid.

A valid line is an array containing at least two valid geographic positions.

### Parameters

| Name   | Type    | Required | Description          |
| ------ | ------- | -------- | -------------------- |
| `line` | `Array` | yes      | The line to validate |

### Returns

| Type      | Description                                    |
| --------- | ---------------------------------------------- |
| `boolean` | `true` if the line is valid, otherwise `false` |

### Examples

```js
isValidLine([[2.3522, 48.8566], [4.8357, 45.7640]]) // true
isValidLine([[2.3522, 48.8566]])                    // false
isValidLine([])                                     // false
```

## lineLength

### Signature

```js
lineLength (line)
```

### Description

Compute the total geodesic length of a line by summing the distances between consecutive positions.

### Parameters

| Name   | Type    | Required | Description                       |
| ------ | ------- | -------- | --------------------------------- |
| `line` | `Array` | yes      | The line whose length is computed |

### Returns

| Type     | Description                            |
| -------- | -------------------------------------- |
| `number` | The total length of the line in meters |

### Examples

```js
lineLength([
  [2.3522, 48.8566],
  [4.8357, 45.7640]
])
// approximately 392000
```
