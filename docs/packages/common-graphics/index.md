---
title: common-graphics
description: Graphics utilities for the Kalisio ekosystem
---

# common-graphics

_Graphics utilities for the Kalisio ekosystem_

## Overview

**common-graphics** is a lightweight library that provides graphics utilities that work in both **browsers** and **Node.js**.

It is organized around two modules:
- [utilities](./utilities/color.md) — general purpose utility functions
- [shapes](./shapes/shape-factory.md) — build marker shapes and render them as SVG or PNG

## Installation

Install with your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-graphics
```

```bash [npm]
npm install @kalisio/common-graphics
```

```bash [yarn]
yarn add @kalisio/common-graphics
```

:::

Or use it directly from a CDN:

```html
<script type="module">
  import { shapes } from 'https://unpkg.com/@kalisio/common-graphics/dist/index.mjs'
</script>
```

## Usage

### Imports

The package can be imported from its root entry point:

```js
import { image, ShapeFactory } from '@kalisio/common-graphics'
```

For more explicit imports, each module is also exposed as a dedicated subpath:

```js
import { image } from '@kalisio/common-graphics/utilities'
import { ShapeFactory } from '@kalisio/common-graphics/shapes'
```

### Examples

See the module documentation for detailed usage examples of all available functions.

#### Rendering shapes

```js
import { ShapeFactory } from '@kalisio/common-graphics/shapes'

const factory = new ShapeFactory()

const shape = factory.build({
  shape: 'circle',
  size: [50, 50],
  color: 'red',
  stroke: {
    color: 'black',
    width: 2
  }
})

const svg = await shape.toSVG()
```

Built-in shapes can be used directly without explicit registration.
Custom shapes can also be registered with `factory.register()`.