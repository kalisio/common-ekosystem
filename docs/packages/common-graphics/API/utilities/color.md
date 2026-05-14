---
title: color
description: Utility functions for working with colors.
---

# color

Utility functions for working with colors.

## is

### Signature

```js
color.is (value)
```

### Description

Returns `true` if `value` is a valid color recognized by chroma.js. Accepts hex strings, CSS color names, RGB/HSL notation, and other formats supported by chroma.js.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `any` | yes | The value to test |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid color, `false` otherwise |

### Examples

```js
color.is('#ff0000')
// true

color.is('red')
// true

color.is('hsl(0, 100%, 50%)')
// true

color.is('not-a-color')
// false

color.is(42)
// false
```

## contrast

### Signature

```js
color.contrast (value, light = 'white', dark = 'black')
```

### Description

Returns either `light` or `dark` depending on which provides the better contrast ratio against `value`. Useful for picking a readable foreground color on a given background.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The background color to test against |
| `light` | `string` | no | The color to return when a light foreground is preferred. Defaults to `'white'` |
| `dark` | `string` | no | The color to return when a dark foreground is preferred. Defaults to `'black'` |

### Returns

| Type | Description |
|------|-------------|
| `string` | Either `light` or `dark`, whichever contrasts best with `value` |

### Examples

```js
color.contrast('#ffffff')
// 'black'

color.contrast('#000000')
// 'white'

color.contrast('#1976d2', '#e3f2fd', '#0d47a1')
// '#e3f2fd'
```

## scale

### Signature

```js
color.scale (options)
```

### Description

Creates a chroma.js color scale from a set of colors, optionally constrained by a domain and/or class boundaries. Returns a chroma scale function that maps numeric values to colors.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | yes | Scale configuration |
| `options.colors` | `string[]` | yes | Array of colors defining the scale |
| `options.domain` | `number[]` | no | The `[min, max]` range of input values |
| `options.classes` | `number \| number[]` | no | Number of discrete classes, or an array of class breakpoints |

### Returns

| Type | Description |
|------|-------------|
| `ChromaScale` | A chroma.js scale function callable with a value in the domain |

### Examples

```js
// Continuous scale between two colors
const scale = color.scale({ colors: ['white', 'red'] })
scale(0.5).hex()
// '#ff8080'

// Scale with a numeric domain
const scale = color.scale({ colors: ['blue', 'red'], domain: [0, 100] })
scale(75).hex()
// '#bf0040'

// Scale with a fixed number of discrete classes
const scale = color.scale({ colors: ['yellow', 'red'], domain: [0, 100], classes: 5 })

// Scale with explicit class breakpoints
const scale = color.scale({ colors: ['green', 'yellow', 'red'], classes: [0, 30, 70, 100] })
```