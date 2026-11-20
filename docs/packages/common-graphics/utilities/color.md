---
title: color
description: Utility functions for validating, comparing, and generating colors.
---

# color

Utility functions for validating, comparing, and generating colors using chroma.js.

## COLORS

An immutable array containing the names of all HTML/CSS colors supported by chroma.js.

```js
import { COLORS } from '@kalisio/common-graphics'

// ['aliceblue', 'antiquewhite', 'aqua', ...]
```

Used as the default color palette by `nearest` and `farthest`.

## is

### Signature

```js
color.is (value)
```

### Description

Returns `true` if `value` is a valid color recognized by chroma.js.

Supports hexadecimal strings, CSS color names, RGB/HSL notation, numeric color values, and other formats supported by chroma.js.

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

color.is(0xff0000)
// true

color.is('not-a-color')
// false

color.is(null)
// false
```

## contrast

### Signature

```js
color.contrast (value, light = 'white', dark = 'black')
```

### Description

Returns either `light` or `dark`, depending on which provides the highest WCAG contrast ratio against `value`.

Useful for selecting a readable foreground color for a given background.

Unlike `farthest`, which measures perceptual distance in Lab color space, `contrast` uses the WCAG contrast ratio based on relative luminance.

If both candidates have the same contrast ratio, the first candidate (`light`) is returned.

Throws if `value`, `light`, or `dark` is not a valid color.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The background color |
| `light` | `string` | no | The light foreground candidate. Defaults to `'white'` |
| `dark` | `string` | no | The dark foreground candidate. Defaults to `'black'` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The candidate with the highest contrast ratio against `value` |

### Examples

```js
color.contrast('#ffffff')
// 'black'

color.contrast('#000000')
// 'white'

color.contrast('#1976d2', '#e3f2fd', '#0d47a1')
// '#e3f2fd'
```

The selected color maximizes contrast between the supplied candidates but does not necessarily satisfy WCAG accessibility thresholds.

## nearest

### Signature

```js
color.nearest (value, colors = COLORS)
```

### Description

Returns the color from `colors` that is perceptually closest to `value`.

Uses the Euclidean distance in CIELAB color space (Delta E 1976), as implemented by `chroma.distance`.

When `colors` is omitted, the search is performed across the HTML/CSS named colors defined by `COLORS`.

If multiple candidates have the same distance, the first one is returned.

Throws if `value` is not a valid color or `colors` is not a non-empty array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The reference color |
| `colors` | `string[]` | no | The candidate colors. Defaults to `COLORS` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The closest candidate from `colors` |

### Examples

```js
color.nearest('#ff0000', ['red', 'green', 'blue'])
// 'red'

color.nearest('#ff0001', ['#ff0000', '#00ff00', '#0000ff'])
// '#ff0000'

// Search the full HTML/CSS named color palette
color.nearest('#ff0000')
// 'red'
```

## farthest

### Signature

```js
color.farthest (value, colors = COLORS)
```

### Description

Returns the color from `colors` that is perceptually farthest from `value`.

Uses the Euclidean distance in CIELAB color space (Delta E 1976), as implemented by `chroma.distance`.

This function maximizes perceptual color difference, not the WCAG contrast ratio. Use `contrast` when selecting a foreground color for readability.

When `colors` is omitted, the search is performed across the HTML/CSS named colors defined by `COLORS`.

If multiple candidates have the same distance, the first one is returned.

Throws if `value` is not a valid color or `colors` is not a non-empty array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The reference color |
| `colors` | `string[]` | no | The candidate colors. Defaults to `COLORS` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The farthest candidate from `colors` |

### Examples

```js
color.farthest('#ffffff', ['white', 'gray', 'black'])
// 'black'

color.farthest('#000000', ['white', 'gray', 'black'])
// 'white'

// Search the full HTML/CSS named color palette
color.farthest('#1976d2')
// Returns the named color with the largest Lab distance
```

## scale

### Signature

```js
color.scale (options)
```

### Description

Creates a chroma.js color scale from a set of colors or a named ColorBrewer palette.

The scale optionally supports a numeric domain and discrete classes.

Returns a chroma.js scale function that maps numeric values to colors.

When `options.classes` is an array of explicit breakpoints, `options.domain` is ignored. The breakpoints define the class boundaries directly.

When `options.classes` is a number, `options.domain` determines the range over which the classes are distributed.

Throws if the `colors` property is missing. Other invalid configurations may produce errors from chroma.js.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | yes | Scale configuration |
| `options.colors` | `string[] \| string` | yes | Array of colors or a named ColorBrewer palette |
| `options.domain` | `number[]` | no | Input domain. Defaults to `[0, 1]`. Ignored when `classes` is an array |
| `options.classes` | `number \| number[]` | no | Number of discrete classes or explicit class breakpoints |

### Returns

| Type | Description |
|------|-------------|
| `ChromaScale` | A chroma.js scale function returning chroma.js color objects |

### Examples

```js
// Continuous scale between two colors
const continuousScale = color.scale({
  colors: ['white', 'red']
})

continuousScale(0.5).hex()
// '#ff8080'

// Scale with a numeric domain
const domainScale = color.scale({
  colors: ['blue', 'red'],
  domain: [0, 100]
})

domainScale(75).hex()
// '#bf0040'

// Fixed number of discrete classes over a domain
const classesScale = color.scale({
  colors: ['yellow', 'red'],
  domain: [0, 100],
  classes: 5
})

// Explicit class breakpoints
const breakpointsScale = color.scale({
  colors: ['green', 'yellow', 'red'],
  classes: [0, 30, 70, 100]
})

// Named ColorBrewer palette
const brewerScale = color.scale({
  colors: 'OrRd',
  domain: [0, 100]
})

brewerScale(50).hex()

// Access chroma.js scale methods
brewerScale.colors(5)
brewerScale.mode('lab')
brewerScale.nodata('#cccccc')
```

The returned scale exposes the standard chroma.js scale API, including `colors`, `mode`, `padding`, `gamma`, `nodata`, and `correctLightness`.