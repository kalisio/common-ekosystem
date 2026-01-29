# graphiks

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/graphiks?sort=semver&label=latest)](https://github.com/kalisio/graphiks/releases)
[![Quality Gate Status](https://sonar.portal.kalisio.com/api/project_badges/measure?project=kalisio-graphiks&metric=alert_status&token=sqb_f2e2b7a8f69e5f0dee3d4521759e51fbe9e4e38f)](https://sonar.portal.kalisio.com/dashboard?id=kalisio-graphiks)
[![Maintainability Issues](https://sonar.portal.kalisio.com/api/project_badges/measure?project=kalisio-graphiks&metric=software_quality_maintainability_issues&token=sqb_f2e2b7a8f69e5f0dee3d4521759e51fbe9e4e38f)](https://sonar.portal.kalisio.com/dashboard?id=kalisio-graphiks)
[![Coverage](https://sonar.portal.kalisio.com/api/project_badges/measure?project=kalisio-graphiks&metric=coverage&token=sqb_f2e2b7a8f69e5f0dee3d4521759e51fbe9e4e38f)](https://sonar.portal.kalisio.com/dashboard?id=kalisio-graphiks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A minimal parametric shape factory for SVG graphics — built in pure JavaScript.

**Graphiks** is a lightweight and extensible library for creating, composing, and rendering parametric shapes using **SVG**. It provides a simple factory pattern that lets you register your own shape generators and render them as SVG elements.

---

## Principle

**Graphics** provides a simple factory pattern that lets you register your own shape generators and render them as SVG elements. By default, **Graphiks** comes with a set of predefined marker shapes: `circle`, `rect`, `rounded-rect`, `diamond` and so on... The complete list of shapes is available [here](https://kalisio.github.io/graphiks/example/index.html).

Any shapes can be customized with the following specifications:

| Property | Description | Default |
|---|---|---|
| **shape** | specifies the shape identifier to create |
| **size** | specifies the size of the shape. It must be an array of positive numbers. | `[24, 24]`|
| **radius** | specifies an alternate way to define the size of the shape. Each shape implements a function that converts a radius into a size. | `undefined' |
| **color** | specifies the color used to render the shape. It must be any HTML color. | `black`|
| **opacity** | specifies the opacity used to render the shape. It must ranges from 0.0 (transparent) to 1.0 (opaque) | `1.0` |
| **stroke** | specifies the stroke parameters to render the shape. Refer to the [description above](#stroke-sub-object). | `undefined` |
| **icon** | specifies an icon element to be grouped with the shape. Refer to the [description above](#icon-sub-object). | `undefined` |
| **text** | specifies an text element to be grouped with the shape. Refer to the [description above](#text-sub-object). | `undefined` |
| **style** | specifies a [style](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/style) element to be assigned to the shape | `undefined` |
| **zoom** | specifies the overall zoom used to render the shape. It must be a positive number. | `1` |

 #### **stroke** sub-object

| Property | Description | Default |
|---|---|---|
| **width** | specifies the width used to render the stroke.
| **color** | specifies the color used to render the stroke. It must be any HTML color. | `black`|
| **opacity** | specifies the opacity used to render the stroke. It must ranges from 0.0 (transparent) to 1.0 (opaque). | `1.0` |
| **cap** | specifies the [style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap) to be used at the end of open subpaths. | `round` |
| **join** | specifies the [style](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin) to be used at the corners of paths. | `round` |
| **dashArray** | specifies  the [pattern](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray) of dashes and gaps used to render the stroke. | `none` |
| **dashOffset** | specifies an [offset](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset) on the rendering of the associated dash array. | `0` |
| **miterLimit** | specifies a  [limit](ttps://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-miterlimit) on the ratio of the miter length to the stroke width used to draw a miter join. | `4` |

> [!NOTE]
> If the **color** is set to `transparent`, the stroke properties are ignored.

#### **icon** sub-object

| Property | Description | Default |
|---|---|---|
| **classes** | specifies the text to be displayed | `undefined` |
| **color** | specifies the color used to render the icon. It must be any HTML color. | `black`|
| **opacity** | specifies the opacity used to render the icon. It must ranges from 0.0 (transparent) to 1.0 (opaque) | `1.0` |
| **size** | specifies the [font size](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-size) used to render the icon | `1em` |
| **transform** | specifies the [transformation]( https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) used to render the icon | `undefined` |

> [!NOTE]
> If the **classes** property is `undefined` or empty, the icon properties are ignored.

 #### **text** sub-object

| Property | Description | Default |
|---|---|---|
| **label** | specifies the text to be displayed | `undefined` |
| **color** | specifies the color used to render the text. It must be any HTML color. | `black`|
| **opacity** | specifies the opacity used to render the text. It must ranges from 0.0 (transparent) to 1.0 (opaque) | `1.0` |
| **size** | specifies the [font size](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-size) used to render the text | `1em` |
| **font** | specifies the [font family](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-family) used to render the text |  depends on user agent |
| **face** | specifies the [font face](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-style) used to render the text | `normal` |
| **weight** | specifies the [font weight](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-weight) used to render the text | `normal` |
| **variant** | specifies the [font variant](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/font-weight) used to render the text | `normal` |
| **transform** | specifies the [transformation]( https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform) used to render the text | `undefined` |

> [!NOTE]
> If the **label** property is `undefined` or empty, the text properties are ignored.

For instance, to create an orange four-pointed star with a red stroke, it’s as simple as this:

```js
import { Graphiks } from '@kalisio/graphiks'
// create a factory instance
const graphiks = Graphiks()
// create the shape with the required paramaters
const star4 = graphiks('star4', { fill: 'orange', stroke: { red } })
// add the shape to the dom
const container = document.getElementById('#star4-container')
container.appendChild(star4.toSVG())
```
> [!IMPORTANT]
> Some shapes expose additional properties that allow further customization.

## Usage

### Installation

Install from **pnpm**:

```bash
pnpm install @kalisio/graphiks
```

Or use **npm** or **yarn**.

```bash
yarn add @kalisio/graphiks
```

Or use it directly from a CDN:

```html
<script type="module">
  import { Graphiks } from 'https://unpkg.com/@kalisio/graphiks/dist/graphiks.es.js'
</script>
```

### Examples

Open the [live example page](https://kalisio.github.io/graphiks/example/index.html) in your browser

## API Reference

### graphiks (options)

The main function to manage and manipulate graphical shapes in your application. It returns a object containing the following methods:

| Method | Description |
|---|---|
| **listShapeTypes** | Returns a list of all shape types currently registered. |
| **hasShapeType (type)** | Checks whether a specific shape type is registered. |
| **registerShapeType (type, generatorFn)** | Registers a new shape. |
| **renderShape (params)** | Generates and returns a shape based on the specified type and parameters. |

The function takes the following parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | `Object` (optional) | Configuration object |
| `options.loglevel` | `string` | Logging level. Possible values are `debug`, `info`, `warn`, `error`. Default value is `warn`. |

## License

Licensed under the [MIT license](LICENSE).

Copyright (c) 2017-20xx [Kalisio](https://kalisio.com)

[![Kalisio](https://kalisio.github.io/kalisioscope/kalisio/kalisio-logo-black-256x84.png)](https://kalisio.com)