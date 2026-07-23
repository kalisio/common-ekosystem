---
title: math
description: Mathematical utility functions for common numeric operations and interpolation.
---

# math

Mathematical utility functions for common numeric operations and interpolation.

Functions are grouped into families when several share a purpose: `to` (unit
conversions), `pow` (powers), `ease` (transition curves), and `stats`
(aggregates over arrays). Standalone helpers remain flat on `math`.

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
| `value` | `number` | yes | The number to round |
| `precision` | `number` | no | Number of decimal places. Must be zero or a positive integer. Defaults to `2` |

### Returns

| Type | Description |
|------|-------------|
| `number` | The rounded number |

### Examples

```js
math.round(1.23456)       // 1.23
math.round(1.23456789, 4) // 1.2346
math.round(1.7, 0)        // 2
```

## sign

### Signature

```js
math.sign (value, epsilon = 0)
```

### Description

Returns the sign of a number, with an optional tolerance below which the value is considered zero. Unlike `Math.sign`, which has no tolerance and returns a sign for values that are only non-zero through floating-point noise. The tolerance is a domain-level threshold chosen by the caller, not a machine epsilon: `Number.EPSILON` is the mantissa step near 1 and is not a valid general-purpose comparison tolerance. The tolerance is compared strictly: a value equal to `epsilon` is considered zero.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to take the sign of |
| `epsilon` | `number` | no | Tolerance below which `value` is considered zero. Must be zero or positive. Defaults to `0`, which applies no tolerance |

### Returns

| Type | Description |
|------|-------------|
| `number` | `1` if `value > epsilon`, `-1` if `value < -epsilon`, `0` otherwise |

### Throws

Throws if `value` is not a number, or if `epsilon` is not a non-negative number.

### Examples

```js
math.sign(3)     // 1
math.sign(-3)    // -1
math.sign(0)     // 0

math.sign(1e-15, 1e-12)  // 0 (within tolerance)
math.sign(1e-9, 1e-12)   // 1
math.sign(1e-12, 1e-12)  // 0 (equal to tolerance)
```

## percentage

### Signature

```js
math.percentage (value, total)
```

### Description

Returns the percentage of `value` relative to `total`, rounded to 2 decimal places.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The partial value |
| `total` | `number` | yes | The total value |

### Returns

| Type | Description |
|------|-------------|
| `number` | The percentage, rounded to 2 decimal places |

### Examples

```js
math.percentage(1, 4) // 25
math.percentage(1, 3) // 33.33
```

## exponential

### Signature

```js
math.exponential (value, decimals = 2)
```

### Description

Formats a number in exponential notation with a given number of decimal places in the mantissa.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The number to format |
| `decimals` | `number` | no | Number of decimal places in the mantissa. Must be zero or a positive integer. Defaults to `2` |

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
math.linear(0)             // 0
math.linear(0.5)           // 0.5
math.linear(1)             // 1
math.linear(0.5, 0, 100)   // 50
math.linear(0.5, 100, 200) // 150
```

## to.radians

### Signature

```js
math.to.radians (degrees)
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
math.to.radians(180) // 3.141592653589793
math.to.radians(90)  // 1.5707963267948966
math.to.radians(0)   // 0
```

## to.degrees

### Signature

```js
math.to.degrees (radians)
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
math.to.degrees(Math.PI)     // 180
math.to.degrees(Math.PI / 2) // 90
math.to.degrees(0)           // 0
```

## pow.square

### Signature

```js
math.pow.square (value)
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
math.pow.square(3)  // 9
math.pow.square(-4) // 16
```

## pow.cube

### Signature

```js
math.pow.cube (value)
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
math.pow.cube(3)  // 27
math.pow.cube(-2) // -8
```

## ease.in

### Signature

```js
math.ease.in (t, linearity = 0.5)
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
math.ease.in(0)        // 0
math.ease.in(0.5)      // 0.25
math.ease.in(1)        // 1
math.ease.in(0.5, 0.25) // sharper curve
```

## ease.out

### Signature

```js
math.ease.out (t, linearity = 0.5)
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
math.ease.out(0)   // 0
math.ease.out(0.5) // 0.75
math.ease.out(1)   // 1
```

## ease.cubicBezier

### Signature

```js
math.ease.cubicBezier (t, x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1)
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
math.ease.cubicBezier(0)   // 0
math.ease.cubicBezier(0.5) // ~0.5 (symmetric curve)
math.ease.cubicBezier(1)   // 1

// CSS ease equivalent
math.ease.cubicBezier(0.5, 0.25, 0.1, 0.25, 1)
```

## stats.sum

### Signature

```js
math.stats.sum (values)
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
math.stats.sum([1, 2, 3, 4]) // 10
math.stats.sum([])            // 0
```

## stats.average

### Signature

```js
math.stats.average (values)
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
math.stats.average([1, 2, 3, 4]) // 2.5
math.stats.average([5])           // 5
```

## stats.median

### Signature

```js
math.stats.median (values)
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
math.stats.median([1, 2, 3, 4, 5]) // 3
math.stats.median([1, 2, 3, 4])    // 2.5
math.stats.median([5, 1, 3])       // 3
```