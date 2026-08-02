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

Shorthand for `color.farthest(value, [light, dark])`.

Throws if any of `value`, `light`, or `dark` is not a valid color.

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

## nearest

### Signature

```js
color.nearest (value, colors = Object.keys(chroma.colors))
```

### Description

Returns the color from `colors` that is perceptually closest to `value`, using the Delta-E distance in Lab color space.

When `colors` is omitted, the search is performed across the full HTML/CSS named color palette.

Throws if `value` is not a valid color or if `colors` is empty.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The reference color |
| `colors` | `string[]` | no | The pool of colors to search. Defaults to all HTML named colors |

### Returns

| Type | Description |
|------|-------------|
| `string` | The color from `colors` closest to `value` |

### Examples

```js
color.nearest('#ff0000', ['red', 'green', 'blue'])
// 'red'

color.nearest('#ff0001', ['#ff0000', '#00ff00', '#0000ff'])
// '#ff0000'

// Without a list, searches the full HTML palette
color.nearest('#ff0000')
// 'red'
```

## farthest

### Signature

```js
color.farthest (value, colors = Object.keys(chroma.colors))
```

### Description

Returns the color from `colors` that has the highest contrast ratio against `value`, as defined by the WCAG contrast formula.

When `colors` is omitted, the search is performed across the full HTML/CSS named color palette.

Throws if `value` is not a valid color or if `colors` is empty.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The reference color |
| `colors` | `string[]` | no | The pool of colors to search. Defaults to all HTML named colors |

### Returns

| Type | Description |
|------|-------------|
| `string` | The color from `colors` with the highest contrast against `value` |

### Examples

```js
color.farthest('#ffffff', ['white', 'gray', 'black'])
// 'black'

color.farthest('#000000', ['white', 'gray', 'black'])
// 'white'

// Without a list, searches the full HTML palette
color.farthest('#1976d2')
// 'white' (or similar high-contrast result)
```

## scale

### Signature

```js
color.scale (options)
```

### Description

Creates a chroma.js color scale from a set of colors, optionally constrained by a domain and/or class boundaries. Returns a chroma scale function that maps numeric values to colors.

Throws if `options.colors` is not provided.

When `options.classes` is an array of breakpoints, `options.domain` is ignored — the breakpoints already define the domain boundaries explicitly. When `options.classes` is a number, `options.domain` is used to set the range over which the classes are distributed.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | yes | Scale configuration |
| `options.colors` | `string[]` | yes | Array of colors defining the scale |
| `options.domain` | `number[]` | no | The `[min, max]` range of input values. Ignored when `options.classes` is an array |
| `options.classes` | `number \| number[]` | no | Number of discrete classes, or an array of explicit class breakpoints. When an array, also defines the domain |

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

// Scale with a fixed number of discrete classes over a domain
const scale = color.scale({ colors: ['yellow', 'red'], domain: [0, 100], classes: 5 })

// Scale with explicit class breakpoints (domain is inferred from the breakpoints)
const scale = color.scale({ colors: ['green', 'yellow', 'red'], classes: [0, 30, 70, 100] })
```