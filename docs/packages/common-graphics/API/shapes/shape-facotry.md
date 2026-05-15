---
title: ShapeFactory
description: Factory class for registering, building, and rendering shapes.
---

# ShapeFactory

Factory class for registering shape builders and producing shape objects that can be rendered as SVG or PNG.

## constructor

### Signature

```js
new ShapeFactory(options)
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
factory.register('my-shape', buildMyShape)

factory.list()
// [ ... built-in shapes..., 'my-shape']
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

factory.register ('my-shape', buildMyShape)
factory.has ('my-shape')
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
factory.register ('my-shape', buildMyShape)
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
- `params.zoom` is provided but is not a positive number
- The builder function does not return positive integer values for `width`, `height`, and `margin`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params` | `object` | yes | Build parameters |
| `params.shape` | `string` | yes | The registered shape type to build |
| `params.zoom` | `number` | no | Zoom factor. Must be a positive number. Defaults to `1` |
| `...rest` | `any` | no | Any additional properties are passed through to the builder function and merged into the returned shape |

### Returns

A shape object with the following properties:

| Name | Type | Description |
|------|------|-------------|
| `shape` | `string` | The shape type identifier |
| `zoom` | `number` | The zoom factor used |
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
// { shape: 'circle', zoom: 1, color: 'red', width: 32, height: 32, margin: 4, toSVG: fn, toPNG: fn }

const svg = shape.toSVG()
const png = shape.toPNG()

// With zoom
const shape = factory.build({ shape: 'circle', zoom: 2 })
// { shape: 'circle', zoom: 2, width: 32, height: 32, margin: 4, toSVG: fn, toPNG: fn }
```