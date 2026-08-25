---

title: ShapeFactory
description: Factory class for registering, building, and rendering shapes.
---

# ShapeFactory

Factory class for registering shape builders and producing shape objects that can be rendered as SVG or PNG.

The shape factory provides a collection of predefined built-in shapes that can be used directly without defining custom shape builders. You can browse and preview the available built-in shapes in the [Shape Studio](../../../playground/shape-studio).

Some built-in shapes such as `donut`, `pie`, and `wind-barb` are parameterized and accept additional properties described below.

## constructor

### Signature

```js
new ShapeFactory(options)
```

### Description

Creates a new `ShapeFactory` instance with three internal LRU caches: one for the shape builder registry, one for SVG output, and one for PNG output.

Built-in shape builders are automatically registered when the factory is created.

### Parameters

| Name                   | Type     | Required | Description                                                        |
| ---------------------- | -------- | -------- | ------------------------------------------------------------------ |
| `options`              | `object` | no       | Configuration options                                              |
| `options.registrySize` | `number` | no       | Maximum number of entries in the shape registry. Defaults to `100` |
| `options.svgCacheSize` | `number` | no       | Maximum number of entries in the SVG cache. Defaults to `100`      |
| `options.pngCacheSize` | `number` | no       | Maximum number of entries in the PNG cache. Defaults to `100`      |

### Examples

```js
// Default cache sizes
const factory = new ShapeFactory()

// Custom cache sizes
const factory = new ShapeFactory({
  registrySize: 50,
  svgCacheSize: 200,
  pngCacheSize: 200
})
```

## Built-in shapes

Built-in shapes can be used directly with `build()` without explicit registration.

```js
const shape = factory.build({
  shape: 'flag',
  color: 'red'
})
```

The complete collection can be browsed and previewed in the [Shape Studio](../../../playground/shape-studio).

Most built-in shapes only use the common build parameters described in the [`build`](#build) section. Parameterized built-in shapes accept additional properties.

### donut

Creates a donut chart from a collection of slices.

#### Additional parameters

| Name               | Type       | Required | Description                                                                                             |
| ------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `slices`           | `object[]` | yes      | Slices composing the donut                                                                              |
| `slices[].value`   | `number`   | yes      | Value of the slice. Slice angles are computed relative to the sum of all values                         |
| `slices[].color`   | `string`   | no       | Fill color of the slice                                                                                 |
| `slices[].opacity` | `number`   | no       | Opacity of the slice                                                                                    |
| `innerRadius`      | `number`   | no       | Radius of the inner hole in the normalized `0..100` shape coordinate system. Defaults to `20`           |
| `center`           | `object`   | no       | Center properties                                                                                       |
| `center.color`     | `string`   | no       | Color used to fill the center of the donut. If omitted or `transparent`, the center remains transparent |

The stroke defined on the shape is applied to each slice.

The sum of the slice values must be greater than zero.

#### Example

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

### pie

Creates a pie chart from a collection of slices.

`pie` accepts the same parameters as [`donut`](#donut), except that the inner radius is forced to `0`.

#### Example

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

### wind-barb

Creates a meteorological wind barb representing wind speed.

#### Additional parameters

| Name    | Type     | Required | Description                          |
| ------- | -------- | -------- | ------------------------------------ |
| `speed` | `number` | no       | Wind speed in knots. Defaults to `0` |

The speed is clamped to zero for negative values and rounded to the nearest multiple of `5` knots.

Wind speed is represented according to the usual wind-barb convention:

| Representation |   Speed |
| -------------- | ------: |
| Calm circle    |  `0 kt` |
| Half barb      |  `5 kt` |
| Full barb      | `10 kt` |
| Pennant        | `50 kt` |

These elements are combined to represent higher speeds. For example, `65 kt` is represented by one pennant, one full barb, and one half barb.

The generic `transform` parameter can be used to orient the wind barb.

#### Examples

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

## list

### Signature

```js
factory.list()
```

### Description

Returns an array of all registered shape type keys.

### Returns

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| `string[]` | The list of registered shape type identifiers |

### Examples

```js
factory.list()
// ['circle', 'cross', 'diamond', ...]
```

## has

### Signature

```js
factory.has(type)
```

### Description

Returns `true` if a shape builder is registered under the given type key.

Throws if `type` is not a string.

### Parameters

| Name   | Type     | Required | Description                          |
| ------ | -------- | -------- | ------------------------------------ |
| `type` | `string` | yes      | The shape type identifier to look up |

### Returns

| Type      | Description                                         |
| --------- | --------------------------------------------------- |
| `boolean` | `true` if the type is registered, `false` otherwise |

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

Registers a builder function under the given shape type key. If a builder is already registered for that type, it is replaced.

Throws if `type` is not a string or if `buildFn` is not a function.

### Parameters

| Name      | Type       | Required | Description                                                            |
| --------- | ---------- | -------- | ---------------------------------------------------------------------- |
| `type`    | `string`   | yes      | A unique identifier for the shape type                                 |
| `buildFn` | `function` | yes      | Function receiving build parameters and returning the shape definition |

A builder must return at least the following properties:

| Name     | Type     | Description                                  |
| -------- | -------- | -------------------------------------------- |
| `width`  | `number` | Positive integer width of the shape          |
| `height` | `number` | Positive integer height of the shape         |
| `margin` | `number` | Non-negative integer margin around the shape |
| `shape`  | `string` | SVG markup representing the shape            |

### Examples

```js
factory.register('custom-shape', (params) => ({
  width: 50,
  height: 50,
  margin: 0,
  shape: '<circle cx="50" cy="50" r="50" />'
}))
```

## build

### Signature

```js
factory.build(params)
```

### Description

Builds a shape object from the given parameters.

The factory looks up the builder registered for `params.shape`, invokes it, and merges the generated shape definition with the provided parameters.

The returned object exposes `toSVG()` and `toPNG()` rendering methods.

Throws if:

* `params` does not have a `shape` property
* `params.shape` is not a registered shape type
* The generated `width` or `height` is not a positive integer
* The generated `margin` is not a non-negative integer

### Parameters

| Name               | Type       | Required | Description                                                                                                               |
| ------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `params`           | `object`   | yes      | Build parameters                                                                                                          |
| `params.shape`     | `string`   | yes      | Registered shape type to build                                                                                            |
| `params.size`      | `number[]` | no       | Size of the shape as `[width, height]`. Standard shapes default to `50 × 50` when neither `size` nor `radius` is provided |
| `params.radius`    | `number`   | no       | Alternate way to define the shape size. Conversion from radius to width and height depends on the shape                   |
| `params.color`     | `string`   | no       | Fill color. Any valid HTML color. Defaults to `'black'`                                                                   |
| `params.opacity`   | `number`   | no       | Fill opacity, from `0.0` to `1.0`. Defaults to `1.0`                                                                      |
| `params.stroke`    | `object`   | no       | Stroke properties. See [stroke sub-object](#stroke-sub-object) below                                                      |
| `params.icon`      | `object`   | no       | Icon element to group with the shape. See [icon sub-object](#icon-sub-object) below                                       |
| `params.text`      | `object`   | no       | Text element to group with the shape. See [text sub-object](#text-sub-object) below                                       |
| `params.transform` | `object`   | no       | SVG transform applied to the shape                                                                                        |
| `params.style`     | `string`   | no       | SVG style element associated with the shape                                                                               |

#### stroke sub-object

| Property       | Description                                                                                                                                     | Default   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **width**      | Width of the stroke                                                                                                                             |           |
| **color**      | Stroke color. Any valid HTML color. If set to `transparent`, all stroke properties are ignored                                                  | `'black'` |
| **opacity**    | Stroke opacity, from `0.0` to `1.0`                                                                                                             | `1.0`     |
| **cap**        | [Line cap style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap) at the end of open subpaths                         | `'round'` |
| **join**       | [Line join style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin) at path corners                                   | `'round'` |
| **dashArray**  | [Dash pattern](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray) of dashes and gaps                                  | `none`    |
| **dashOffset** | [Offset](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset) on the dash array rendering                              | `0`       |
| **miterLimit** | [Miter limit](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-miterlimit) on the miter length to stroke width ratio | `4`       |

#### icon sub-object

| Property      | Description                                                                                                         | Default     |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| **classes**   | Icon classes to display                                                                                             | `undefined` |
| **url**       | URL of the image to display as the icon                                                                             | `undefined` |
| **color**     | Icon color. Any valid HTML color                                                                                    | `'black'`   |
| **opacity**   | Icon opacity, from `0.0` to `1.0`                                                                                   | `1.0`       |
| **size**      | [Font size](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-size) used to render the icon | `'1em'`     |
| **transform** | [SVG transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) applied to the icon | `undefined` |
