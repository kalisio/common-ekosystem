---
title: Built-in shapes
description: Built-in shapes provided by ShapeFactory.
---

# Built-in shapes

`ShapeFactory` automatically registers a collection of built-in shapes that can be used directly with `build()` without explicit registration.

```js
const shape = factory.build({
  shape: 'flag',
  color: 'red'
})
```

All built-in shapes support the common build parameters documented in [`ShapeFactory.build()`](./shape-factory.md#build).

Some built-in shapes are parameterized and accept additional properties documented below.

The complete collection can be browsed and previewed in the [Shape Studio](../../../playground/shape-studio).

## donut

Creates a donut chart from a collection of slices.

### Additional parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `slices` | `object[]` | yes | Slices composing the donut |
| `slices[].value` | `number` | yes | Value of the slice. Slice angles are computed relative to the sum of all values |
| `slices[].color` | `string` | no | Fill color of the slice |
| `slices[].opacity` | `number` | no | Opacity of the slice |
| `innerRadius` | `number` | no | Radius of the inner hole in the normalized `0..100` shape coordinate system. Defaults to `20` |
| `center` | `object` | no | Center properties |
| `center.color` | `string` | no | Color used to fill the center of the donut. If omitted or `transparent`, the center remains transparent |

The stroke defined on the shape is applied to each slice.

The sum of the slice values must be greater than zero.

### Example

```js
const shape = factory.build({
  shape: 'donut',
  slices: [
    { value: 30, color: 'red' },
    { value: 70, color: 'blue' }
  ],
  innerRadius: 25,
  stroke: {
    color: 'white',
    width: 1
  }
})
```

## pie

Creates a pie chart from a collection of slices.

`pie` accepts the same parameters as [`donut`](#donut), except that the inner radius is forced to `0`.

### Example

```js
const shape = factory.build({
  shape: 'pie',
  slices: [
    { value: 25, color: 'red' },
    { value: 50, color: 'green' },
    { value: 25, color: 'blue' }
  ]
})
```

## wind-barb

Creates a meteorological wind barb representing wind speed.

### Additional parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `speed` | `number` | no | Wind speed in knots. Defaults to `0` |

The speed is clamped to zero for negative values and rounded to the nearest multiple of `5` knots.

Wind speed is represented according to the usual wind-barb convention:

| Representation | Speed |
| --- | ---: |
| Calm circle | `0 kt` |
| Half barb | `5 kt` |
| Full barb | `10 kt` |
| Pennant | `50 kt` |

These elements are combined to represent higher speeds. For example, `65 kt` is represented by one pennant, one full barb, and one half barb.

The generic `transform` parameter can be used to orient the wind barb.

### Examples

```js
const shape = factory.build({
  shape: 'wind-barb',
  speed: 25,
  stroke: {
    color: 'black',
    width: 1
  }
})
```

A wind barb can be rotated using the standard shape transform:

```js
const shape = factory.build({
  shape: 'wind-barb',
  speed: 25,
  transform: {
    rotate: [225, 50, 50]
  },
  stroke: {
    color: 'black',
    width: 1
  }
})
```
