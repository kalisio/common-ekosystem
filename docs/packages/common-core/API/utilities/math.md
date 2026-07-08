---
title: math
description: Mathematical utility functions for common numeric operations and interpolation.
---

# math

Mathematical utility functions for common numeric operations and interpolation.

## square

### Signature

```js
math.square (value)
```

### Description

Returns the square of a number.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to square |

### Returns

| Type | Description |
|------|-------------|
| `number` | `value²` |

### Examples

```js
math.square(3)  // 9
math.square(-4) // 16
```

## cube

### Signature

```js
math.cube (value)
```

### Description

Returns the cube of a number.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to cube |

### Returns

| Type | Description |
|------|-------------|
| `number` | `value³` |

### Examples

```js
math.cube(3)  // 27
math.cube(-2) // -8
```

## clamp

### Signature

```js
math.clamp (value, min, max)
```

### Description

Clamps a number between a minimum and maximum value.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to clamp |
| `min` | `number` | yes | The lower bound |
| `max` | `number` | yes | The upper bound |

### Returns

| Type | Description |
|------|-------------|
| `number` | `value` clamped between `min` and `max` |

### Examples

```js
math.clamp(5, 0, 10)  // 5
math.clamp(-5, 0, 10) // 0
math.clamp(15, 0, 10) // 10
```

## round

### Signature

```js
math.round (value, precision = 2)
```
### Description

Rounds a number to a given number of decimal places.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to truncate |
| `precision` | `number` | no | Number of decimal places. Defaults to `2` |

### Returns

| Type | Description |
|------|-------------|
| `number` | The rounded number |

### Examples

```js
math.round(1.23456)       // 1.23
math.round(1.23456789, 4) // 1.2346
math.round(1.23456789, 7) // 1.2345679
```

## percentage

### Signature

```js
math.percentage (value, total)
```
### Description

Returns the percentage of `value` relative to `total`, truncated to 2 decimal places.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The partial value |
| `total` | `number` | yes | The total value |

### Returns

| Type | Description |
|------|-------------|
| `number` | The percentage, truncated to 2 decimal places |

### Examples

```js
math.percentage(1, 4) // 25
math.percentage(1, 3) // 33.33
```

## exponential

### Signature

```js
math.exponential(value, decimals = 2)
```

### Description

Formats a number in exponential notation with a given number of decimal places in the mantissa.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to format |
| `decimals` | `number` | no | Number of decimal places in the mantissa. Defaults to `2` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The number formatted in exponential notation |

### Examples

```js
math.exponential(1000, 2)   // "1.00e+3"
math.exponential(0.005, 2)  // "5.00e-3"
math.exponential(-1000, 2)  // "-1.00e+3"
math.exponential(0, 2)      // "0.00e+0"
math.exponential(1000, 0)   // "1e+3"
```

## linear

### Signature

```js
math.linear (t, initial = 0, final = 1)
```

### Description

Linearly interpolates between `initial` and `final` based on a normalized progress value `t`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `t` | `number` | yes | Normalized progress value in `[0, 1]` |
| `initial` | `number` | no | The start value. Defaults to `0` |
| `final` | `number` | no | The end value. Defaults to `1` |

### Returns

| Type | Description |
|------|-------------|
| `number` | Interpolated value between `initial` and `final` |

### Examples

```js
math.linear(0)        // 0
math.linear(0.5)      // 0.5
math.linear(1)        // 1
math.linear(0.5, 0, 100) // 50
math.linear(0.5, 100, 200) // 150
```

## easeIn

### Signature

```js
math.easeIn (t, linearity = 0.5)
```

### Description

Applies an ease-in curve to a normalized value `t`. The curve starts slow and accelerates. `linearity` controls the sharpness of the curve — lower values produce a sharper ease-in.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `t` | `number` | yes | Normalized progress value in `[0, 1]` |
| `linearity` | `number` | no | Controls the sharpness of the curve. Defaults to `0.5` |

### Returns

| Type | Description |
|------|-------------|
| `number` | Eased value in `[0, 1]` |

### Examples

```js
math.easeIn(0)    // 0
math.easeIn(0.5)  // 0.25
math.easeIn(1)    // 1
math.easeIn(0.5, 0.25) // sharper curve
```

## easeOut

### Signature

```js
math.easeOut (t, linearity = 0.5)
```

### Description

Applies an ease-out curve to a normalized value `t`. The curve starts fast and decelerates. `linearity` controls the sharpness of the curve — lower values produce a sharper ease-out.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `t` | `number` | yes | Normalized progress value in `[0, 1]` |
| `linearity` | `number` | no | Controls the sharpness of the curve. Defaults to `0.5` |

### Returns

| Type | Description |
|------|-------------|
| `number` | Eased value in `[0, 1]` |

### Examples

```js
math.easeOut(0)   // 0
math.easeOut(0.5) // 0.75
math.easeOut(1)   // 1
```

## cubicBezier

### Signature

```js
math.cubicBezier (t, x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1)
```

### Description

Evaluates a cubic Bézier curve at `t`. The default control points (`0.42, 0, 0.58, 1`) produce a standard ease-in-out curve, equivalent to the CSS `ease-in-out` timing function.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `t` | `number` | yes | Normalized progress value in `[0, 1]` |
| `x1` | `number` | no | X coordinate of the first control point. Defaults to `0.42` |
| `y1` | `number` | no | Y coordinate of the first control point. Defaults to `0` |
| `x2` | `number` | no | X coordinate of the second control point. Defaults to `0.58` |
| `y2` | `number` | no | Y coordinate of the second control point. Defaults to `1` |

### Returns

| Type | Description |
|------|-------------|
| `number` | The Y value of the curve at `t` |

### Examples

```js
math.cubicBezier(0)   // 0
math.cubicBezier(0.5) // ~0.5 (symmetric curve)
math.cubicBezier(1)   // 1

// CSS ease equivalent
math.cubicBezier(0.5, 0.25, 0.1, 0.25, 1)
```

## toRadians

### Signature

```js
toRadians(degrees)
```

### Description

Converts an angle from degrees to radians.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `degrees` | `number` | yes | Angle in degrees |

### Returns

| Type | Description |
|------|-------------|
| `number` | The angle in radians |

### Throws

Throws if `degrees` is not a number.

### Examples

```js
toRadians(180)   // 3.141592653589793
toRadians(90)    // 1.5707963267948966
toRadians(0)     // 0
```

## toDegrees

### Signature

```js
toDegrees(radians)
```

### Description

Converts an angle from radians to degrees.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `radians` | `number` | yes | Angle in radians |

### Returns

| Type | Description |
|------|-------------|
| `number` | The angle in degrees |

### Throws

Throws if `radians` is not a number.

### Examples

```js
toDegrees(Math.PI)       // 180
toDegrees(Math.PI / 2)   // 90
toDegrees(0)             // 0
```

## sum

### Signature

```js
math.sum (values)
```

### Description

Returns the sum of an array of numbers.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `values` | `number[]` | yes | Array of numbers |

### Returns

| Type | Description |
|------|-------------|
| `number` | The sum of all values. Returns `0` for an empty array |

### Examples

```js
math.sum([1, 2, 3, 4]) // 10
math.sum([])            // 0
```

## average

### Signature

```js
math.average (values)
```
### Description

Returns the arithmetic mean of an array of numbers.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `values` | `number[]` | yes | Non-empty array of numbers |

### Returns

| Type | Description |
|------|-------------|
| `number` | The arithmetic mean |

### Examples

```js
math.average([1, 2, 3, 4]) // 2.5
math.average([5])           // 5
```

## median

### Signature

```js
math.median (values)
```
### Description

Returns the median of an array of numbers. For even-length arrays, returns the average of the two middle values.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `values` | `number[]` | yes | Non-empty array of numbers |

### Returns

| Type | Description |
|------|-------------|
| `number` | The median value |

### Examples

```js
math.median([1, 2, 3, 4, 5]) // 3
math.median([1, 2, 3, 4])    // 2.5
math.median([5, 1, 3])       // 3
```



