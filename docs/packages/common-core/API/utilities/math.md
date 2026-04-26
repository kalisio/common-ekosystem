---
title: math
description: Mathematical utility functions for common numeric operations and interpolation.
---

# math

## square

### Signature

```js
math.square(value)
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

---

## cube

### Signature

```js
math.cube(value)
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

---

## clamp

### Signature

```js
math.clamp(value, min, max)
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

---

## easeIn

### Signature

```js
math.easeIn(t, linearity = 0.5)
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

---

## easeOut

### Signature

```js
math.easeOut(t, linearity = 0.5)
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

---

## linear

### Signature

```js
math.linear(t, initial = 0, final = 1)
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

---

## cubicBezier

### Signature

```js
math.cubicBezier(t, x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1)
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