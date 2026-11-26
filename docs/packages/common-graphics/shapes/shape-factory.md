---
title: ShapeFactory
description: Factory class for registering, building, and rendering shapes.
---

# ShapeFactory

Factory class for managing shape builders and creating shapes that can be rendered as SVG or PNG.

The factory automatically registers built-in shapes. See [Built-in shapes](./builtin-shapes.md) for the available types and their parameters.

::: tip

Shapes can also be explored and previewed in the [Shape Studio](../../../playground/shape-studio).

:::

## constructor

### Signature

```js
new ShapeFactory(options)
```

### Description

Creates a `ShapeFactory` with a shape builder registry and two rendering caches.

The registry uses `Factory` from `@kalisio/common-core/structures` and does not impose a size limit.

The SVG and PNG rendering caches use `Cache` from the same package, with LRU eviction and configurable maximum sizes.

Built-in shape builders are registered automatically.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | no | Factory configuration |
| `options.svgCacheSize` | `number` | no | Maximum SVG cache entries. Defaults to `100` |
| `options.pngCacheSize` | `number` | no | Maximum PNG cache entries. Defaults to `100` |

### Examples

```js
const factory = new ShapeFactory()

const customFactory = new ShapeFactory({
  svgCacheSize: 200,
  pngCacheSize: 200
})
```

## list

### Signature

```js
factory.list()
```

### Description

Returns the identifiers of all registered shape builders, including built-in and custom shapes.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of registered shape type identifiers |

### Examples

```js
factory.list()
// ['circle', 'compass', 'cross', ...]
```

## has

### Signature

```js
factory.has(type)
```

### Description

Checks whether a builder exists for the specified shape type.

Throws if `type` is not a string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `string` | yes | Shape type identifier |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether the requested type is registered |

### Examples

```js
factory.has('circle')
// true

factory.has('custom-shape')
// false
```

## register

### Signature

```js
factory.register(type, buildFn)
```

### Description

Associates a shape type with a builder function.

When the type is already registered, its builder is replaced. Otherwise, a new entry is created.

The builder receives the shape parameters and must return a definition containing the dimensions, margin and SVG markup.

Throws if `type` is not a string or `buildFn` is not a function.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `string` | yes | Identifier of the shape builder |
| `buildFn` | `function` | yes | Function receiving shape parameters and returning a shape definition |

The resulting shape definition must provide:

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Positive integer width |
| `height` | `number` | Positive integer height |
| `margin` | `number` | Non-negative integer margin |
| `shape` | `string` | SVG markup for the geometry |

The builder may return additional properties that will be included in the resulting shape object.

### Examples

```js
factory.register('custom-circle', (params) => ({
  width: 50,
  height: 50,
  margin: 0,
  shape: '<circle cx="50" cy="50" r="50" />'
}))

factory.has('custom-circle')
// true
```

## build

### Signature

```js
factory.build(params)
```

### Description

Creates a shape using the builder registered for `params.shape`.

The builder receives the parameters and returns a definition that is merged with them. Properties returned by the builder take precedence over the original parameters.

The result includes two rendering methods:

- `toSVG()` returns the generated SVG markup as a string.
- `toPNG()` asynchronously returns a PNG data URL.

Rendering results are cached when a `key` is provided.

Throws if:

- `params` is not an object containing `shape`.

- The requested shape type is unknown.

- The resulting `width` or `height` is not a positive integer.

- The resulting `margin` is not a non-negative integer.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params` | `object` | yes | Shape configuration |
| `params.shape` | `string` | yes | Registered shape type |
| `params.key` | `string` | no | Cache key for reusing SVG and PNG rendering results |
| `params.size` | `number[]` | no | Dimensions as `[width, height]`. Standard shapes default to `[50, 50]` |
| `params.radius` | `number` | no | Alternative sizing parameter. Its interpretation depends on the builder |
| `params.color` | `string` | no | Fill color. SVG defaults to black |
| `params.opacity` | `number` | no | Fill opacity between `0` and `1`. Defaults to `1` |
| `params.stroke` | `object` | no | Outline configuration. See [stroke sub-object](#stroke-sub-object) |
| `params.icon` | `object` | no | Optional embedded icon. See [icon sub-object](#icon-sub-object) |
| `params.text` | `object` | no | Optional text element. See [text sub-object](#text-sub-object) |
| `params.transform` | `object` | no | SVG transformation for the geometry |
| `params.style` | `string` | no | CSS rules embedded in the SVG |

### Returns

| Type | Description |
|------|-------------|
| `object` | Generated shape definition with `toSVG()` and `toPNG()` methods |

### Examples

```js
const shape = factory.build({
  shape: 'circle',
  size: [64, 64],
  color: '#1976d2',
  stroke: {
    width: 2,
    color: '#ffffff'
  }
})

const svg = shape.toSVG()

const png = await shape.toPNG()
```

With rendering cache:

```js
const shape = factory.build({
  shape: 'circle',
  key: 'blue-circle-64',
  size: [64, 64],
  color: '#1976d2'
})

const svg = shape.toSVG()
```

The cache key is managed by the caller. Shapes using the same key share cached output, so different rendering configurations should use different keys.

### stroke sub-object

Defines the outline of the shape.

| Property | Description | Default |
|----------|-------------|---------|
| `width` | Stroke width | `'1px'` |
| `color` | Stroke color. `transparent` disables stroke attributes | `'black'` |
| `opacity` | Stroke opacity between `0` and `1` | `1` |
| `lineCap` | SVG line cap (`butt`, `round`, `square`) | `'butt'` (SVG default) |
| `lineJoin` | SVG line join (`miter`, `round`, `bevel`) | `'miter'` (SVG default) |
| `dashArray` | Pattern of dashes and gaps | `none` |
| `dashOffset` | Offset of the dash pattern | `0` |
| `miterLimit` | Maximum miter length ratio | `4` |

When `stroke` is omitted, no stroke attributes are generated.

The renderer applies `vector-effect="non-scaling-stroke"` when stroke properties are enabled.

Example:

```js
stroke: {
  width: 2,
  color: '#ff0000',
  opacity: 0.8,
  lineCap: 'round',
  lineJoin: 'round',
  dashArray: '5 3'
}
```

### icon sub-object

Adds an icon to the rendered shape.

Icons can be provided through CSS classes, an image URL, or an SVG sprite symbol.

| Property | Description | Default |
|----------|-------------|---------|
| `classes` | CSS classes for rendering a font or CSS-based icon. String or array of strings | `undefined` |
| `url` | Image URL | `undefined` |
| `symbol` | SVG sprite reference, for example `/assets/icons.svg#aircraft` | `undefined` |
| `color` | Icon color, used for CSS icons or SVG symbols | inherited or black for SVG symbols |
| `opacity` | SVG symbol opacity | `1` |
| `size` | Icon size, interpreted according to the rendering mode | mode-dependent |
| `origin` | Icon anchor point as `[x, y]` in SVG viewBox units | `[50, 50]` |
| `transform` | SVG transformation in the local coordinate space of the icon. See [transform sub-object](#transform-sub-object) | `undefined` |

For CSS-based icons, the renderer creates a `foreignObject` containing an HTML icon element.

For SVG symbols, it creates an SVG `use` element. Image URLs produce an SVG `image` element.

The default CSS icon font size is `12` before scaling to the shape height. SVG symbols and images occupy the normalized viewBox when no size is supplied.

All icon types are centered on their `origin`. Transformations are applied relative to this point. See [overlay positioning](#overlay-positioning).

Example:

```js
icon: {
  symbol: '/assets/icons.svg#aircraft',
  color: '#ffffff',
  size: 24
}
```

### text sub-object

Adds text to the shape.

If `text.label` is absent or empty, the text element is omitted. Numeric labels, including `0`, are supported.

| Property | Description | Default |
|----------|-------------|---------|
| `label` | Text to display | `undefined` |
| `size` | Font size before scaling | `12` |
| `color` | Text fill color | inherited |
| `font` | Font family | inherited |
| `style` | Font style, such as `normal` or `italic` | inherited |
| `weight` | Font weight, such as `normal` or `bold` | inherited |
| `variant` | Font variant | inherited |
| `cursor` | CSS cursor style | inherited |
| `classes` | CSS class name or array of class names | `undefined` |
| `origin` | Text anchor point as `[x, y]` in SVG viewBox units | `[50, 50]` |
| `transform` | SVG transformation in the local coordinate space of the text. See [transform sub-object](#transform-sub-object) | `undefined` |

Text is centered on its `origin`. The generated text uses:

```svg
text-anchor="middle"

alignment-baseline="central"
```

Font size is scaled relative to the shape height.

Transformations are applied relative to the text origin. See [overlay positioning](#overlay-positioning).

CSS classes can be styled through the shape-level `style` property or through external stylesheets when the SVG is embedded directly in the DOM.

Embedded CSS is useful when the SVG is used as a standalone image.

Example:

```js
text: {
  label: 'A',
  size: 16,
  color: '#ffffff',
  weight: 'bold',
  classes: ['shape-label']
}
```

### overlay positioning

Icons and text use the same positioning model. Standard shape geometry uses a normalized coordinate space from `0` to `100` on both axes.

- `origin` specifies the overlay anchor point in this coordinate space. It defaults to `[50, 50]`, the center of the normalized shape geometry, unless the builder supplies another origin.
- `transform` specifies an optional transformation in the overlay's local coordinate space, where `[0, 0]` corresponds to its origin.

Translation values are expressed in SVG viewBox units, not output pixels. Positive values move the overlay to the right and down. Rotation and scaling use the local origin unless an explicit rotation pivot is provided.

For example, move a text overlay 20 units above the default center:

```js
text: {
  label: 'A',
  transform: {
    translate: [0, -20]
  }
}
```

To position an icon at a different anchor point and rotate it around that point:

```js
icon: {
  symbol: '/assets/icons.svg#aircraft',
  size: 24,
  origin: [50, 30],
  transform: {
    rotate: [45]
  }
}
```

### transform sub-object

Defines geometric SVG transformations.

| Property | Description |
|----------|-------------|
| `rotate` | Rotation arguments, such as `[45]` or `[45, 50, 50]` |
| `translate` | Translation arguments, such as `[10, 20]` |
| `scale` | Scaling arguments, such as `[0.8]` or `[0.8, 0.8]` |
| `skewX` | Horizontal skew angle in degrees |
| `skewY` | Vertical skew angle in degrees |

Transformations are emitted in this order: `rotate`, `translate`, `scale`, `skewX`, `skewY`. When multiple transformations are combined, their order follows SVG transform composition rules.

For geometry, transformation coordinates refer to the shape coordinate space. For icon and text overlays, they refer to the local coordinate space defined by `origin`. For example, `rotate: [45]` rotates an overlay around its origin, whereas `rotate: [45, 50, 50]` specifies a pivot offset by `[50, 50]` in that local coordinate space.

Example:

```js
transform: {
  rotate: [45, 50, 50],
  translate: [10, 20],
  scale: [0.8, 0.8]
}
```

### style

The `style` property specifies CSS rules inserted into a `style` element in the generated SVG.

These rules can target SVG elements and text classes. They are retained when the SVG is exported as an image.

CSS declarations may override presentation attributes such as fill color and font properties.

Example:

```js
style: `

  .shape-label {
    font-family: sans-serif;

    font-weight: bold;

    pointer-events: none;
  }

`
```
