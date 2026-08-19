---
title: ShapeFactory
description: Factory class for registering, building, and rendering shapes.
---

# ShapeFactory

Factory class for registering shape builders and producing shape objects that can be rendered as SVG or PNG.

## constructor

### Signature

```js
new ShapeFactory (options)
```

### Description

Creates a new `ShapeFactory` instance with three internal LRU caches: one for the shape builder registry, one for SVG output, and one for PNG output.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | no | Configuration options |
| `options.registrySize` | `number` | no | Maximum number of entries in the shape registry. Defaults to `100` |
| `options.svgCacheSize` | `number` | no | Maximum number of entries in the SVG cache. Defaults to `100` |
| `options.pngCacheSize` | `number` | no | Maximum number of entries in the PNG cache. Defaults to `100` |

### Examples

```js
// Default cache sizes
const factory = new ShapeFactory()

// Custom cache sizes
const factory = new ShapeFactory({ registrySize: 50, svgCacheSize: 200, pngCacheSize: 200 })
```

## list

### Signature

```js
factory.list()
```

### Description

Returns an array of all registered shape type keys.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | The list of registered shape type identifiers |

### Examples

```js
factory.register('circle', buildCircle)
factory.register('rect', buildRect)

factory.list()
// ['circle', 'rect']
```

## has

### Signature

```js
factory.has (type)
```

### Description

Returns `true` if a shape builder is registered under the given type key.

Throws if `type` is not a string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `string` | yes | The shape type identifier to look up |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the type is registered, `false` otherwise |

### Examples

```js
factory.has('circle')
// false

factory.register('circle', buildCircle)
factory.has('circle')
// true
```

## register

### Signature

```js
factory.register (type, buildFn)
```

### Description

Registers a builder function under the given shape type key. If a builder is already registered for that type, it is replaced.

Throws if `type` is not a string or if `buildFn` is not a function.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `string` | yes | A unique identifier for the shape type (e.g. `'circle'`, `'rect'`) |
| `buildFn` | `function` | yes | A function that receives build params and returns shape geometry (`width`, `height`, `margin`) |

### Examples

```js
factory.register('circle', (params) => ({
  width: params.size ?? 32,
  height: params.size ?? 32,
  margin: 4
}))
```

## build

### Signature

```js
factory.build (params)
```

### Description

Builds a shape object from the given params. Looks up the registered builder for `params.shape`, calls it, and merges the result with the original params. The returned object exposes `toSVG()` and `toPNG()` render methods.

Throws if:
- `params` does not have a `shape` property
- `params.shape` is not a registered type
- The builder function does not return positive integer values for `width`, `height`, and `margin`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params` | `object` | yes | Build parameters |
| `params.shape` | `string` | yes | The registered shape type to build |
| `params.size` | `number[]` | no | Size of the shape as `[width, height]`. Defaults to `[24, 24]` |
| `params.radius` | `number` | no | Alternate way to define size. Each shape converts a radius into a size |
| `params.color` | `string` | no | Fill color. Any valid HTML color. Defaults to `'black'` |
| `params.opacity` | `number` | no | Fill opacity, from `0.0` (transparent) to `1.0` (opaque). Defaults to `1.0` |
| `params.stroke` | `object` | no | Stroke properties. See [stroke sub-object](#stroke-sub-object) below |
| `params.icon` | `object` | no | Icon element to group with the shape. See [icon sub-object](#icon-sub-object) below |
| `params.text` | `object` | no | Text element to group with the shape. See [text sub-object](#text-sub-object) below |
| `params.style` | `string` | no | A SVG `style` element to assign to the shape |

#### stroke sub-object

| Property | Description | Default |
|----------|-------------|---------|
| **width** | Width of the stroke | |
| **color** | Stroke color. Any valid HTML color. If set to `transparent`, all stroke properties are ignored | `'black'` |
| **opacity** | Stroke opacity, from `0.0` to `1.0` | `1.0` |
| **cap** | [Line cap style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap) at the end of open subpaths | `'round'` |
| **join** | [Line join style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin) at path corners | `'round'` |
| **dashArray** | [Dash pattern](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray) of dashes and gaps | `none` |
| **dashOffset** | [Offset](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset) on the dash array rendering | `0` |
| **miterLimit** | [Miter limit](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-miterlimit) on the miter length to stroke width ratio | `4` |

#### icon sub-object

| Property | Description | Default |
|----------|-------------|---------|
| **classes** | Icon classes to display | `undefined` |
| **url** | URL of the image to display as the icon | `undefined` |
| **color** | Icon color. Any valid HTML color | `'black'` |
| **opacity** | Icon opacity, from `0.0` to `1.0` | `1.0` |
| **size** | [Font size](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-size) used to render the icon | `'1em'` |
| **transform** | [SVG transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) applied to the icon | `undefined` |

::: info
An icon can be defined using either `classes` or `url`. When both are provided, `classes` takes precedence. The `color` property is ignored for icons defined using `url`.
:::

#### text sub-object

| Property | Description | Default |
|----------|-------------|---------|
| **label** | Text to display. If `undefined` or empty, all text properties are ignored | `undefined` |
| **color** | Text color. Any valid HTML color | `'black'` |
| **opacity** | Text opacity, from `0.0` to `1.0` | `1.0` |
| **size** | [Font size](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-size) | `'1em'` |
| **font** | [Font family](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-family) | depends on user agent |
| **face** | [Font style](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-style) | `'normal'` |
| **weight** | [Font weight](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-weight) | `'normal'` |
| **variant** | [Font variant](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-variant) | `'normal'` |
| **transform** | [SVG transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) applied to the text | `undefined` |

### Returns

A shape object with the following properties:

| Name | Type | Description |
|------|------|-------------|
| `shape` | `string` | The shape type identifier |
| `width` | `number` | Positive integer width returned by the builder |
| `height` | `number` | Positive integer height returned by the builder |
| `margin` | `number` | Positive integer margin returned by the builder |
| `toSVG` | `function` | Renders the shape as SVG. Returns a string |
| `toPNG` | `function` | Renders the shape as PNG. Returns a Buffer |

### Examples

```js
factory.register('circle', (params) => ({
  width: 32,
  height: 32,
  margin: 4
}))

const shape = factory.build({ shape: 'circle', color: 'red' })
// { shape: 'circle', color: 'red', width: 32, height: 32, margin: 4, toSVG: fn, toPNG: fn }

const svg = shape.toSVG()
const png = shape.toPNG()
```